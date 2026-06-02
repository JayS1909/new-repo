import { Router } from "express";
import { cancelDelhivery, productionWebhook, refundUpdate,trackShipment } from "../conrollers/payments.controller.js";

const router = Router();

router.get("/tracking",(req,res) => {
    res.render('trackingOrder',{user:req.user});
});

router.get("/cancelOrder",(req,res) => {
    res.render('cancelOrder');
});

router.route('/api/getTrackingInfo').get(trackShipment);

router.route('/api/webhook').post(productionWebhook) // Handle POST requests

router.route('/api/cancelOrder').post(cancelDelhivery)

router.route('/api/initiate-refund').post(refundUpdate);

export default router;