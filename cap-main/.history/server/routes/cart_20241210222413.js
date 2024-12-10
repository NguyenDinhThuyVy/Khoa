const { Cart } = require("../models/cart");
const { Products } = require("../models/products");
const express = require("express");
const router = express.Router();

router.get(`/`, async (req, res) => {
  try {
    const cartList = await Cart.find(req.query);

    if (!cartList) {
      res.status(500).json({ success: false });
    }

    return res.status(200).json(cartList);
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

router.post("/add", async (req, res) => {
  const cartItem = await Cart.find({
    productId: req.body.productId,
    userId: req.body.userId,
  });

  if (cartItem.length === 0) {
    let cartList = new Cart({
      productTitle: req.body.productTitle,
      image: req.body.image,
      rating: req.body.rating,
      price: req.body.price,
      quantity: req.body.quantity,
      subTotal: req.body.subTotal,
      productId: req.body.productId,
      userId: req.body.userId,
      countInStock: req.body.countInStock,
    });

    if (!cartList) {
      res.status(500).json({
        error: err,
        success: false,
      });
    }

    cartList = await cartList.save();

    res.status(201).json(cartList);
  } else {
    res
      .status(401)
      .json({ status: false, msg: "Sản phẩm đã được thêm vào giỏ hàng." });
  }
});
router.post("/buyProducts", async (req, res) => {
  try {
    const { order, ...rest } = req.body; // Giả sử bạn gửi danh sách các sản phẩm trong giỏ hàng qua body
    const purchase = [];

    // Duyệt qua từng sản phẩm trong giỏ hàng
    for (const item of order) {
      const product = await Products.findById(item.productId); // Tìm sản phẩm trong DB
      if (product) {
        // Kiểm tra số lượng sản phẩm
        // if (item.buy_count > product.quantity) {
        //   return res
        //     .status(406)
        //     .json({ message: "Số lượng mua vượt quá số lượng sản phẩm" });
        // } else {
        // Cập nhật số lượng sản phẩm trong kho
        await Products.findByIdAndUpdate(item.productId, {
          $inc: { quantity: -item.quantity },
        });

        // Tạo thông tin thanh toán cho sản phẩm
        const paymentProduct = {
          product: {
            name: product.productTitle,
            image: product.image,
            price: product.price,
          },
          buy_count: item.quantity,
          price: product.subTotal,
        };
        purchase.push(paymentProduct);
      }
      //   } else {
      //     return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
      //   }
    }

    // Tính tổng tiền thanh toán
    const totalMoney = purchase.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );

    // Giả sử bạn có một mô hình thanh toán (Payment) để tạo thông tin thanh toán
    const paymentData = {
      purchases: purchase,
      totalMoney: totalMoney,
      user: item.userId, // Giả sử bạn có JWT cho người dùng
    };

    // Tạo thông tin thanh toán
    // const newPayment = await PaymentModel.create(paymentData);

    return res.status(200).json({
      message: "Mua hàng thành công",
      data: paymentData,
    });
  } catch (error) {
    // Xử lý lỗi
    return res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  const cartItem = await Cart.findById(req.params.id);

  if (!cartItem) {
    res.status(404).json({ msg: "Không tìm thấy sản phẩm với ID đã cho." });
  }

  const deletedItem = await Cart.findByIdAndDelete(req.params.id);

  if (!deletedItem) {
    res.status(404).json({
      message: "Không tìm thấy sản phẩm trong giỏ hàng",
      success: false,
    });
  }

  res.status(200).json({
    success: true,
    message: "Sản phẩm trong giỏ hàng đã được xóa",
  });
});

router.get("/:id", async (req, res) => {
  const catrItem = await Cart.findById(req.params.id);

  if (!catrItem) {
    res.status(500).json({
      message: "Không tìm thấy sản phẩm trong giỏ hàng với ID đã cho!",
    });
  }
  return res.status(200).send(catrItem);
});

router.put("/:id", async (req, res) => {
  const cartList = await Cart.findByIdAndUpdate(
    req.params.id,
    {
      productTitle: req.body.productTitle,
      image: req.body.image,
      rating: req.body.rating,
      price: req.body.price,
      quantity: req.body.quantity,
      subTotal: req.body.subTotal,
      productId: req.body.productId,
      userId: req.body.userId,
    },
    { new: true }
  );

  if (!cartList) {
    return res.status(500).json({
      message: "Không thể cập nhật giỏ hàng!",
      success: false,
    });
  }

  res.send(cartList);
});

module.exports = router;
