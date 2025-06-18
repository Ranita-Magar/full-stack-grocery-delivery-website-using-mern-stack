import Order from "../models/Order.js";
import Product from "../models/Product.js";

// place order COD  /api/order/cod
export const placeOrderCOD = async (req, res) => {
  try {
    const { userId, items, address, paymentType } = req.body;
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

    const newOrder = await Order.create({
      userId,
      items,
      amount,
      address,
      paymentType,
    });

    console.log("Order created:", newOrder);
    res.json({ success: true, message: "Order place successfully" });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// get orders by userId /api/order/user
export const getUserOrders = async (req, res) => {
  try {
    const { userId } = req.query;
    console.log("Fetching orders for userId:", userId);

    // First, let's check what orders exist for this user without any conditions
    const allUserOrders = await Order.find({ userId });
    console.log("All orders for user:", allUserOrders.length);
    console.log("Sample order structure:", allUserOrders[0]);

    // Now let's try the original query
    const orders = await Order.find({
      userId,
      $or: [{ paymentType: "cod" }, { isPaid: true }],
    })
      .populate("items.product address")
      .sort({ createdAt: -1 });

    console.log("Filtered orders:", orders.length);

    // If no filtered orders, let's try without the $or condition
    if (orders.length === 0 && allUserOrders.length > 0) {
      console.log("No orders match the filter, returning all user orders");
      const fallbackOrders = await Order.find({ userId })
        .populate("items.product address")
        .sort({ createdAt: -1 });
      return res.json({ success: true, orders: fallbackOrders });
    }

    res.json({ success: true, orders });
  } catch (error) {
    console.log("Error in getUserOrders:", error);
    return res.json({ success: false, message: error.message });
  }
};

// give all order data for  seller/admin /api/prder/seller
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      $or: [{ paymntType: "cod" }, { isPaid: true }],
    })
      .populate("items.product address")
      .sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};
