import { Router } from "express";
import mongoose from "mongoose";
import { adminJWT } from "../middlewares/adminAuth.middleware.js";
import {displayStock} from "../conrollers/orders.controller.js"

const router = Router();

router.get("/admin",adminJWT,(req,res)=> {
    return res.render("adminHomePage",{user:req.user});
});

router.get("/admin/addProduct",adminJWT,(req,res) => {
    return res.render("AddProducts",{user:req.user});
});

router.get("/admin/updateProduct",adminJWT,(req,res) => {
    return res.render("updateProduct",{user:req.user});
});

router.get("/admin/deleteProduct",adminJWT,(req,res)=> {
    return res.render("deleteProduct",{user:req.user});
});

router.get("/admin/viewOrders",adminJWT, (req,res)=> {
    return res.render("displayOrders",{user:req.user})
});

router.get("/admin/pendingOrders",adminJWT,(req,res) => {
    res.render("pendingOrders",{user:req.user});
});

router.get("/admin/deliveredOrders",adminJWT,(req,res) => {
    res.render("deliveredOrders",{user:req.user});
});

router.get("/admin/dispatchedOrders",adminJWT,(req,res) => {
    res.render("dispatchedOrders",{user:req.user});
});

router.get("/admin/inventory",adminJWT,(req,res) => {
    return res.render("inventory",{user:req.user});
});

router.get("/admin/displayOrders",adminJWT,(req,res) => {
    res.render("displayOrders",{user:req.user});
});

router.get("/admin/cancelOrders",adminJWT,(req,res) => {
    res.render("adminCancelOrders",{user:req.user});
})

router.get("/admin/intransitOrders",adminJWT,(req,res) => {
    res.render("InTransit",{user:req.user});
});

router.get("/api/admin/stock",adminJWT,displayStock);
export default router