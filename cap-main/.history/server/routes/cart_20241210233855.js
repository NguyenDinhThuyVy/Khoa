const { Cart } = require("../models/cart");
const { Product } = require("../models/products");
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
    const { order, ...rest } = req.body; // Lấy danh sách các sản phẩm từ request
    if (!order || order.length === 0) {
      return res.status(400).json({ message: "Giỏ hàng trống" });
    }

    const purchase = [];

    // Duyệt qua từng sản phẩm trong giỏ hàng
    for (const item of order) {
      // Kiểm tra dữ liệu sản phẩm
      if (
        !item.productTitle ||
        !item.price ||
        !item.quantity ||
        !item.subTotal
      ) {
        return res.status(400).json({ message: "Thiếu thông tin sản phẩm" });
      }
      await Product.findByIdAndUpdate(
        productId,
        {
          $inc: {
            quantity: -Number(buyCount), // Giảm số lượng tồn kho
            sold: Number(buyCount),     // Tăng số lượng bán
          },
        },
        { new: true } // Trả về tài liệu đã cập nhật
      );

      // Tạo thông tin thanh toán cho sản phẩm
      const paymentProduct = {
        product: {
          name: item.productTitle,
          image: item.image,
          price: item.price,
        },
        buy_count: item.quantity,
        price: item.subTotal,
      };

      purchase.push(paymentProduct);
    }

    // Tính tổng tiền thanh toán
    const totalMoney = purchase.reduce((acc, item) => acc + item.price, 0);

    const paymentData = {
      ...rest,
      purchases: purchase,
      totalMoney: totalMoney,
    };

    return res.status(200).json({
      message: "Mua hàng thành công",
      data: paymentData,
    });
  } catch (error) {
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