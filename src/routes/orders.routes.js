import { Router } from "express";
import { displayAuthOrders, displayOrders } from "../conrollers/orders.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/api/display-orders").get(displayOrders);

router.route("/api/auth-display-orders").get(verifyJWT,displayAuthOrders);

export default router;