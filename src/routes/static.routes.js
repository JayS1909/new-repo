import express from "express";
import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { optionalAuth } from "../middlewares/optionalAuth.middleware.js";
import Product from "../models/products.models.js";
import mongoose from "mongoose";
import {displayStock} from "../conrollers/orders.controller.js"
import { trackShipment } from "../conrollers/payments.controller.js";


const router = Router();
router.get("/", optionalAuth, async (req,res,next) => {
    try {
        const featuredProducts = await Product.find({isFeatured: true}).limit(3);
        return res.render("homepage",{user: req.user,products: featuredProducts});
    } catch (error) {
        console.log("Something went wrong in fetching home page and the featured products",error);
        return next(error);
    }
});

router.get("/viewAll", optionalAuth, async (req, res) => {
    try {
        const products = await Product.find({});
        // Separate products based on originalPrice
        const normalProducts = products.filter(product => product.discountedPrice <= 800);
        const midRangeProducts = products.filter(product => product.discountedPrice > 800 && product.discountedPrice <= 900);
        const premiumProducts = products.filter(product => product.discountedPrice >= 1000);

        // console.log("All Products:");
        // console.table(products.map(p => ({ name: p.productName, price: p.discountedPrice })));

        
        // console.log("🟢 Normal Products (< ₹800):");
        // console.table(normalProducts);

        // console.log("🟡 Mid-Range Products (₹800 - ₹900):");
        // console.table(midRangeProducts);

        // console.log("🔴 Premium Products (> ₹1000):");
        // console.table(premiumProducts);

        // Render the view with the categorized products
        res.render("viewAll", {
            user: req.user,
            normalProducts,
            midRangeProducts,
            premiumProducts,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch products.",
            error: error.message,
        });
    }
});

router.get('/product/:id', optionalAuth, async (req, res) => {
    try {
        const productId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(500).send('Invalid Product ID');
        }
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).send("Product not found");
        }

        // Fetch related products based on the color of the current product
        let relatedProducts = await Product.find({
            _id: { $ne: productId },
            color: product.details.get('color')
        });

        // If fewer than 2 related products are found, fetch random additional products
        if (relatedProducts.length < 3) {
            const additionalProducts = await Product.find({
                _id: { $ne: productId },  // Exclude the current product
            }).limit(3);  // Fetch more products to increase the pool

            // Merge the related products and additional products, excluding duplicates
            relatedProducts = [...new Set([...relatedProducts, ...additionalProducts])];
        }

        // Shuffle the products randomly and select the first 2
        relatedProducts = shuffleArray(relatedProducts).slice(0, 3);

        res.render('productDetails', { user: req.user, product, relatedProducts });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// Utility function to shuffle an array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // Swap elements
    }
    return array;
}
router.get("/login",(req,res)=> {
    return res.render('login',{ error: null, user: req.user,otplessAppId: process.env.OTP_LESS_APP_ID });
});

router.get("/register",(req,res) => {
    const email = req.query.email;
    const phoneNumber = req.query.phoneNumber;
    return res.render('register',{email,phoneNumber,user:req.user});
});

router.get("/privacypolicy",(req,res) => {
    return res.render("privacyPolicy");
});

router.get("/refundPolicy",(req,res) => {
    return res.render("refundPolicy");
});

router.get("/shippingPolicy",(req,res)=> {
    return res.render("shippingPolicy");
});

router.get("/termsOfService",(req,res) => {
    return res.render("termsOfService");
});

router.get("/wishlist", optionalAuth, async (req, res) => {
    try {
        const { Wishlist } = await import('../models/wishlist.models.js');
        const userId = req.user ? req.user._id : null;
        let wishlist = null;
        if (userId) {
             wishlist = await Wishlist.findOne({ user: userId }).populate('products');
        }
        res.render("wishlist", { user: req.user, wishlist, title: "Your Wishlist | EXTRAALAYER" });
    } catch (err) {
        console.error(err);
        res.render("wishlist", { user: req.user, wishlist: null, title: "Your Wishlist | EXTRAALAYER" });
    }
});

router.get("/displayAuthOrders",verifyJWT,(req,res) => {
    res.render("AuthOrders",{user: req.user});
});


// router.get("/checkout",(req,res) => {
//     return res.render("checkout");
// })


export default router