import mongoose from "mongoose";
import authUser from "../middlewares/authUser.js";
import { updateCart } from "../controllers/CartController.js";

const cartRouter = mongoose.Router();

cartRouter.post("/cart", authUser, updateCart);

export default cartRouter;
