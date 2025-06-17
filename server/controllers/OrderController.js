import Order from "../models/Order.js";
import Product from "../models/Product.js";

// place order COD  /api/order/cod
export const placeOrderCOD = async (req, res) => {
  try {
    const { userId, items, address } = req.body;
    if (!address || items.length === 0) {
      return res.json({
        success: false,
        message: "Invalid data",
      });
    }
    //calculate amount using items
    let amount = await items.reduce(async (acc, item) => {
      const product = await Product.findById(item.product);
      return (await acc) + product.offerPrice * item.quantity;
    }, 0);

    //add tax change (2%)
    amount += Math.floor(amount * 0.2);

    await Order.create({
      userId,
      items,
      amount,
      address,
      paymentType,
    });

    res.json({ success: true, message: "Order place successfully" });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// get orders by userId /api/order/user
export const getUserOrders = async (req, res) => {
  try {
    const { userId } = req.body;
    const orders = await Order.find({
      userId,
      $or: [{ paymntType: "cod" }, [{ isPaid: true }]],
    })
      .populate("items.product address")
      .sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// give all order data for  seller/admin /api/prder/seller
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      $or: [{ paymntType: "cod" }, [{ isPaid: true }]],
    })
      .populate("items.product address")
      .sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};
