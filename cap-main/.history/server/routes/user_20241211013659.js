const { User } = require("../models/user");
const { ImageUpload } = require("../models/imageUpload");

const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const multer = require("multer");
const fs = require("fs");

const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.cloudinary_Config_Cloud_Name,
  api_key: process.env.cloudinary_Config_api_key,
  api_secret: process.env.cloudinary_Config_api_secret,
  secure: true,
});

var imagesArr = [];

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads");
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}_${file.originalname}`);
    //imagesArr.push(`${Date.now()}_${file.originalname}`)
  },
});

const upload = multer({ storage: storage });

router.post(`/upload`, upload.array("images"), async (req, res) => {
  imagesArr = [];

  try {
    for (let i = 0; i < req?.files?.length; i++) {
      const options = {
        use_filename: true,
        unique_filename: false,
        overwrite: false,
      };

      const img = await cloudinary.uploader.upload(
        req.files[i].path,
        options,
        function (error, result) {
          imagesArr.push(result.secure_url);
          fs.unlinkSync(`uploads/${req.files[i].filename}`);
        }
      );
    }

    let imagesUploaded = new ImageUpload({
      images: imagesArr,
    });

    imagesUploaded = await imagesUploaded.save();
    return res.status(200).json(imagesArr);
  } catch (error) {
    console.log(error);
  }
});

router.post(`/signup`, async (req, res) => {
  const { name, phone, email, password, isAdmin } = req.body;

  try {
    const existingUser = await User.findOne({ email: email });
    const existingUserByPh = await User.findOne({ phone: phone });

    if (existingUser) {
      res.json({ status: "FAILED", msg: "Email này đã được sử dụng!" });
      return;
    }

    if (existingUserByPh) {
      res.json({ status: "FAILED", msg: "Số điện thoại này đã được sử dụng!" });
      return;
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const result = await User.create({
      name: name,
      phone: phone,
      email: email,
      password: hashPassword,
      isAdmin: isAdmin,
    });

    const token = jwt.sign(
      { email: result.email, id: result._id },
      process.env.JSON_WEB_TOKEN_SECRET_KEY
    );

    res.status(200).json({
      user: result,
      token: token,
      msg: "Đăng ký tài khoản thành công!",
    });
  } catch (error) {
    console.log(error);
    res.json({ status: "FAILED", msg: "Lỗi" });
    return;
  }
});

router.post(`/signin`, async (req, res) => {
  const { email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email: email });
    if (!existingUser) {
      res.status(404).json({ error: true, msg: "Không tìm thấy người dùng!" });
      return;
    }

    const matchPassword = await bcrypt.compare(password, existingUser.password);

    if (!matchPassword) {
      return res
        .status(400)
        .json({ error: true, msg: "Thông tin đăng nhập không hợp lệ" });
    }

    const token = jwt.sign(
      { email: existingUser.email, id: existingUser._id },
      process.env.JSON_WEB_TOKEN_SECRET_KEY
    );

    return res.status(200).send({
      user: existingUser,
      token: token,
      msg: "Người dùng đã được xác thực",
    });
  } catch (error) {
    res.status(500).json({ error: true, msg: "Lỗi" });
    return;
  }
});

const forgottenPassword = async (email) => {
  let data = { status: 404, message: "User not found!" };

  try {
    const user = await User.findOne({ email });
    if (!existingUser) {
      res.status(404).json({ error: true, msg: "Không tìm thấy người dùng!" });
    } else {
      const numbers = "0123456789";
      const characters = "qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM";
      const special = "!@$%&*";
      const lowercaseCharacters = "qwertyuiopasdfghjklzxcvbnm";
      const uppercaseCharacters = "QWERTYUIOPASDFGHJKLZXCVBNM";

      const passwordLength = 8; // Độ dài mật khẩu mong muốn
      let newPasswordProgress = "";

      // Tạo mật khẩu với các ký tự ngẫu nhiên
      newPasswordProgress += numbers.charAt(
        Math.floor(Math.random() * numbers.length)
      );
      newPasswordProgress += lowercaseCharacters.charAt(
        Math.floor(Math.random() * lowercaseCharacters.length)
      );
      newPasswordProgress += uppercaseCharacters.charAt(
        Math.floor(Math.random() * uppercaseCharacters.length)
      );
      newPasswordProgress += special.charAt(
        Math.floor(Math.random() * special.length)
      );

      const remainingChars = passwordLength - newPasswordProgress.length;
      const allCharacters = characters + numbers + special;

      for (let i = 0; i < remainingChars; i++) {
        const randomIndex = Math.floor(Math.random() * allCharacters.length);
        newPasswordProgress += allCharacters.charAt(randomIndex);
      }

      const newPassword = newPasswordProgress;

      // Cấu hình và gửi email thông báo mật khẩu mới
      const transporter = nodemailer.createTransport({
        tls: { rejectUnauthorized: false },
        host: MailConfig.HOST,
        port: MailConfig.PORT,
        secure: false,
        auth: {
          user: MailConfig.USERNAME,
          pass: MailConfig.PASSWORD,
        },
      });

      const mailOptions = {
        from: MailConfig.FROM_ADDRESS,
        to: user.email,
        subject: "ZYMY COSMETIC - Xác thực tài khoản",
        text: `ZYMY COSMETIC\n\nCảm ơn bạn đã sử dụng dịch vụ của chúng tôi,\n\nChúng tôi xin gửi mật khẩu của bạn là: ${newPassword}`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Error sending verification email", error);
        } else {
          console.log("Verification email sent", info.response);
        }
      });

      // Hash mật khẩu mới và lưu vào cơ sở dữ liệu
      const hashPassword = hashValue(newPassword);
      user.password = hashPassword;
      await user.save();

      data.status = 200;
      data.message = "Reset password successfully";
    }
  } catch (error) {
    console.log(error);
    res.json({ status: "FAILED", msg: "Lỗi" });
    return;
  }
};
router.post(`/forgotpassword`, async (req, res) => {
  const email = req.body.email?.trim(); // Optional chaining và trim email

  if (!email) {
    throw new ErrorHandler(400, "Không tìm thấy email");
  }

  try {
    const data = await forgottenPassword(email);

    if (!data) {
      throw new ErrorHandler(
        500,
        "An error occurred while processing the request."
      );
    }

    return res.status(data.status || 500).json(data);
  } catch (error) {
    console.error("Error handling forgotten password request:", error);
    throw new ErrorHandler(500, "An unexpected error occurred.");
  }
});

router.put(`/changePassword/:id`, async (req, res) => {
  const { name, phone, email, password, newPass, images } = req.body;

  // console.log(req.body)

  const existingUser = await User.findOne({ email: email });
  if (!existingUser) {
    res.status(404).json({ error: true, msg: "Không tìm thấy người dùng!" });
  }

  const matchPassword = await bcrypt.compare(password, existingUser.password);

  if (!matchPassword) {
    res.status(404).json({ error: true, msg: "Mật khẩu hiện tại không đúng!" });
  } else {
    let newPassword;

    if (newPass) {
      newPassword = bcrypt.hashSync(newPass, 10);
    } else {
      newPassword = existingUser.passwordHash;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        name: name,
        phone: phone,
        email: email,
        password: newPassword,
        images: images,
      },
      { new: true }
    );

    if (!user)
      return res
        .status(400)
        .json({ error: true, msg: "Không thể cập nhật thông tin người dùng!" });

    res.send(user);
  }
});

router.get(`/`, async (req, res) => {
  const userList = await User.find();

  if (!userList) {
    res.status(500).json({ success: false });
  }
  res.send(userList);
});

router.get("/:id", async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res
      .status(500)
      .json({ message: "Không tìm thấy người dùng với ID đã cho" });
  } else {
    res.status(200).send(user);
  }
});

router.delete("/:id", (req, res) => {
  User.findByIdAndDelete(req.params.id)
    .then((user) => {
      if (user) {
        return res
          .status(200)
          .json({ success: true, message: "Người dùng đã được xóa!" });
      } else {
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy người dùng!" });
      }
    })
    .catch((err) => {
      return res.status(500).json({ success: false, error: err });
    });
});

router.get(`/get/count`, async (req, res) => {
  const userCount = await User.countDocuments();

  if (!userCount) {
    res.status(500).json({ success: false });
  }
  res.send({
    userCount: userCount,
  });
});

router.post(`/authWithGoogle`, async (req, res) => {
  const { name, phone, email, password, images, isAdmin } = req.body;

  try {
    const existingUser = await User.findOne({ email: email });

    if (!existingUser) {
      const result = await User.create({
        name: name,
        phone: phone,
        email: email,
        password: password,
        images: images,
        isAdmin: isAdmin,
      });

      const token = jwt.sign(
        { email: result.email, id: result._id },
        process.env.JSON_WEB_TOKEN_SECRET_KEY
      );

      return res.status(200).send({
        user: result,
        token: token,
        msg: "Đăng nhập thành công!",
      });
    } else {
      const existingUser = await User.findOne({ email: email });
      const token = jwt.sign(
        { email: existingUser.email, id: existingUser._id },
        process.env.JSON_WEB_TOKEN_SECRET_KEY
      );

      return res.status(200).send({
        user: existingUser,
        token: token,
        msg: "Đăng nhập thành công!",
      });
    }
  } catch (error) {
    console.log(error);
  }
});

router.put("/:id", async (req, res) => {
  const { name, phone, email } = req.body;

  const userExist = await User.findById(req.params.id);

  if (req.body.password) {
    newPassword = bcrypt.hashSync(req.body.password, 10);
  } else {
    newPassword = userExist.passwordHash;
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    {
      name: name,
      phone: phone,
      email: email,
      password: newPassword,
      images: imagesArr,
    },
    { new: true }
  );

  if (!user)
    return res.status(400).send("Không thể cập nhật thông tin người dùng!");

  res.send(user);
});

// router.put('/:id',async (req, res)=> {

//     const { name, phone, email, password } = req.body;

//     const userExist = await User.findById(req.params.id);

//     let newPassword

//     if(req.body.password) {
//         newPassword = bcrypt.hashSync(req.body.password, 10)
//     } else {
//         newPassword = userExist.passwordHash;
//     }

//     const user = await User.findByIdAndUpdate(
//         req.params.id,
//         {
//             name:name,
//             phone:phone,
//             email:email,
//             password:newPassword,
//             images: imagesArr,
//         },
//         { new: true}
//     )

//     if(!user)
//     return res.status(400).send('the user cannot be Updated!')

//     res.send(user);
// })

router.delete("/deleteImage", async (req, res) => {
  const imgUrl = req.query.img;

  // console.log(imgUrl)

  const urlArr = imgUrl.split("/");
  const image = urlArr[urlArr.length - 1];

  const imageName = image.split(".")[0];

  const response = await cloudinary.uploader.destroy(
    imageName,
    (error, result) => {
      // console.log(error, res)
    }
  );

  if (response) {
    res.status(200).send(response);
  }
});

module.exports = router;
