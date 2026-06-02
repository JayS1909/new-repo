import { Router } from "express";
import { createOrder, verifyPayment ,shippingInfo,getPromotions,applyPromotions, getOrderDetails} from "../conrollers/payments.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createOrderRateLimiter } from "../middlewares/rateLimit.middlewares.js";

const router = Router();

router.route("/create-order").post(createOrderRateLimiter,verifyJWT,createOrder);

router.route('/verify-payment').post(verifyPayment);

router.route('/api/shipping-info').post(shippingInfo);

router.route('/api/get-promotions').post(getPromotions);

router.route('/api/apply-promotion').post(applyPromotions);

router.route('/getOrderDetails').post(getOrderDetails);

// router.route('/webhook').post(razorpayWebhook);
// router.route('/capturePayment').post(capturePayment);



export default router;