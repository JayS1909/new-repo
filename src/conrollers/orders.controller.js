import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/users.models.js";
import Order from "../models/orders.models.js";
import Product from "../models/products.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const displayOrders = asyncHandler(async(req,res) => {    
    try {
        const confirmedOrders = await Order.find({confirmation: true});
        if(!confirmedOrders) {
            return res.status(404).json({ message: 'No orders!' });
        }
        console.log("Confirmed Orders: ", confirmedOrders);
        res.json(confirmedOrders);
    } catch (error) {
        console.error('Error fetching confirmed orders:', error);
        throw error;
    }
});

const displayAuthOrders = asyncHandler(async(req,res)=> {
    try {
       const userId = req.user?._id;
       console.log("The user id for checking: ",userId);
       
       if(!userId) {
        return res.status(401).json({
            success: false,
            message: "User not authenticated",
        });
       }

       const userOrders = await Order.find({userId, confirmation: true});
       console.log("The Authenticated users orders: ", userOrders);

       res.status(200).json({
        success: true,
        orders: userOrders,
       });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch confirmed orders",
            error,
        });
    }
});

const displayStock = asyncHandler(async (req, res) => {
    try {
        const products = await Product.find({});

        const formattedData = products.map(product => {
            const sizes = Array.from(product.sizes.entries()); // Convert Map to Array
            const totalQuantity = sizes.reduce((sum, [, qty]) => sum + qty, 0); // Calculate total stock

            return {
                productName: product.productName,
                sku: product.sku,
                sizes, // [ ['XS', qty], ['S', qty], ...]
                totalQuantity
            };
        });

        res.status(200).json(formattedData);
    } catch (error) {
        console.error("Error fetching product stock:", error);
        res.status(500).json({ message: "Failed to fetch product stock" });
    }
});

export {displayOrders, displayAuthOrders, displayStock};
