import express from "express";
import authUser from "../middlewares/authUser.js";
import { updateCart } from "../controllers/CartController.js";

const cartRouter = express.Router();

cartRouter.post("/cart", authUser, updateCart);

export default cartRouter;
