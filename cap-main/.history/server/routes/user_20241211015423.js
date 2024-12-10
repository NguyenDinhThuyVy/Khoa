const { User } = require("../models/user");
const { ImageUpload } = require("../models/imageUpload");
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const fs = require("fs");
const cloudinary = require("cloudinary").v2;
const nodemailer = require("nodemailer");
const crypto = require("crypto");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads");
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}_${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

router.post("/upload", upload.array("images"), async (req, res) => {
  let imagesArr = [];

  try {
    for (let i = 0; i < req.files.length; i++) {
      const img = await cloudinary.uploader.upload(req.files[i].path, {
        use_filename: true,
        unique_filename: false,
        overwrite: false,
      });

      imagesArr.push(img.secure_url);
      fs.unlinkSync(`uploads/${req.files[i].filename}`);
    }

    let imagesUploaded = new ImageUpload({ images: imagesArr });
    await imagesUploaded.save();

    res.status(200).json(imagesArr);
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "FAILED", msg: "Error uploading images" });
  }
});

router.post("/signup", async (req, res) => {
  const { name, phone, email, password, isAdmin } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    const existingUserByPhone = await User.findOne({ phone });

    if (existingUser) {
      return res.json({ status: "FAILED", msg: "Email already in use!" });
    }

    if (existingUserByPhone) {
      return res.json({
        status: "FAILED",
        msg: "Phone number already in use!",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await User.create({
      name,
      phone,
      email,
      password: hashedPassword,
      isAdmin,
    });

    const token = jwt.sign(
      { email: result.email, id: result._id },
      process.env.JWT_SECRET
    );
    res
      .status(200)
      .json({ user: result, token, msg: "Account created successfully!" });
  } catch (error) {
    console.error(error);
    res.json({ status: "FAILED", msg: "Error occurred during signup" });
  }
});

router.post("/signin", async (req, res) => {
  const { email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });

    if (!existingUser) {
      return res.status(404).json({ error: true, msg: "User not found!" });
    }

    const matchPassword = await bcrypt.compare(password, existingUser.password);

    if (!matchPassword) {
      return res.status(400).json({ error: true, msg: "Invalid credentials" });
    }

    const token = jwt.sign(
      { email: existingUser.email, id: existingUser._id },
      process.env.JWT_SECRET
    );
    res
      .status(200)
      .json({ user: existingUser, token, msg: "User authenticated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: true, msg: "Error occurred during signin" });
  }
});

const sendPasswordResetEmail = (email, newPassword) => {
  const transporter = nodemailer.createTransport({
    tls: { rejectUnauthorized: false },
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: false,
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.MAIL_FROM_ADDRESS,
    to: email,
    subject: "Password Reset",
    text: `Your new password is: ${newPassword}`,
  };

  return transporter.sendMail(mailOptions);
};

const generateRandomPassword = () => {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@$%&*";
  let newPassword = "";
  for (let i = 0; i < 8; i++) {
    newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return newPassword;
};

router.post("/forgotpassword", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: true, msg: "Email is required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: true, msg: "User not found!" });
    }

    const newPassword = generateRandomPassword();
    console.log(`New password generated: ${newPassword}`); // Debug new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    // Attempt to send email
    try {
      await sendPasswordResetEmail(email, newPassword);
      console.log("Password reset email sent"); // Debug email sending
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      return res
        .status(500)
        .json({ error: true, msg: "Error sending reset email" });
    }

    res
      .status(200)
      .json({ status: 200, message: "Password reset successfully" });
  } catch (error) {
    console.error("Error in forgot password:", error);
    res
      .status(500)
      .json({ error: true, msg: "Error occurred during password reset" });
  }
});

router.put("/changePassword/:id", async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: true, msg: "User not found!" });
    }

    const matchOldPassword = await bcrypt.compare(oldPassword, user.password);
    if (!matchOldPassword) {
      return res
        .status(400)
        .json({ error: true, msg: "Old password is incorrect" });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;
    await user.save();

    res.status(200).json({ msg: "Password changed successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: true, msg: "Error occurred during password change" });
  }
});

router.get("/", async (req, res) => {
  try {
    const userList = await User.find();
    res.status(200).json(userList);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: true, msg: "Error retrieving users" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: true, msg: "Error retrieving user" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: true, msg: "User not found" });
    }
    res.status(200).json({ msg: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: true, msg: "Error deleting user" });
  }
});

router.delete("/deleteImage", async (req, res) => {
  const imgUrl = req.query.img;
  const imageName = imgUrl.split("/").pop().split(".")[0];

  try {
    const response = await cloudinary.uploader.destroy(imageName);
    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: true, msg: "Error deleting image from Cloudinary" });
  }
});

module.exports = router;
