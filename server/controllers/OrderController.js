import Order from "../models/Order.js";
import Product from "../models/Product.js";
import stripe from "stripe";

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

    // console.log("Order created:", newOrder);
    res.json({ success: true, message: "Order place successfully" });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

//place order stripe : /api/order/stripe
export const placeOrderStripe = async (req, res) => {
  try {
    const { userId, items, address, paymentType } = req.body;
    const { origin } = req.headers;

    if (!address || items.length === 0) {
      return res.json({
        success: false,
        message: "Invalid data",
      });
    }

    let productData = [];

    //calculate amount using items
    let amount = await items.reduce(async (acc, item) => {
      const product = await Product.findById(item.product);

      productData.push({
        name: product.name,
        price: product.offerPrice,
        quantity: item.quantity,
      });

      return (await acc) + product.offerPrice * item.quantity;
    }, 0);

    //add tax change (2%)
    amount += Math.floor(amount * 0.2);

    const newOrder = await Order.create({
      userId,
      items,
      amount,
      address,
      paymentType: "Online",
    });

    //Stripe gateway initialize
    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

    //create line items for stripe
    const line_items = productData.map((item) => {
      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: item.name,
          },
          unit_amount: Math.floor(item.price + item.price * 0.02) * 100,
        },
        quantity: item.quantity,
      };
    });

    //create session
    const session = await stripeInstance.checkout.sessions.create({
      line_items,
      mode: "payment",
      success_url: `${origin}/loader?next=my-orders`,
      cancel_url: `${origin}/cart`,
      metadata: {
        orderId: newOrder._id.toString(),
        userId,
      },
    });

    console.log("Stripe Order created:", newOrder);
    return res.json({ success: true, url: session.url });
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
    console.log("Fetching all orders for seller/admin");

    // First, let's see all orders without any filter
    const allOrders = await Order.find({})
      .populate("items.product address")
      .sort({ createdAt: -1 });

    console.log("Total orders in database:", allOrders.length);

    // Try the filtered query
    const orders = await Order.find({
      $or: [{ paymentType: "cod" }, { isPaid: true }], // Fixed: paymentType instead of paymntType
    })
      .populate("items.product address")
      .sort({ createdAt: -1 });

    console.log("Filtered orders:", orders.length);

    // If no filtered orders but we have orders in DB, return all orders
    if (orders.length === 0 && allOrders.length > 0) {
      console.log("No orders match filter, returning all orders");
      return res.json({ success: true, orders: allOrders });
    }

    res.json({ success: true, orders });
  } catch (error) {
    console.log("Error in getAllOrders:", error);
    return res.json({ success: false, message: error.message });
  }
};
