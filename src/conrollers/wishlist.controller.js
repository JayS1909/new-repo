import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Wishlist } from "../models/wishlist.models.js";
import Product from "../models/products.models.js";

export const toggleWishlist = asyncHandler(async (req, res) => {
    const { productId } = req.body;
    const userId = req.user._id;

    if (!productId) {
        throw new ApiError(400, "Product ID is required");
    }

    let wishlist = await Wishlist.findOne({ user: userId });

    if (!wishlist) {
        wishlist = await Wishlist.create({ user: userId, products: [productId] });
        return res.json(new ApiResponse(201, "Added to wishlist", wishlist));
    }

    const index = wishlist.products.indexOf(productId);
    if (index > -1) {
        // Remove from wishlist
        wishlist.products.splice(index, 1);
        await wishlist.save();
        return res.json(new ApiResponse(200, "Removed from wishlist", wishlist));
    } else {
        // Add to wishlist
        wishlist.products.push(productId);
        await wishlist.save();
        return res.json(new ApiResponse(200, "Added to wishlist", wishlist));
    }
});

export const getWishlist = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const wishlist = await Wishlist.findOne({ user: userId }).populate('products');

    return res.json(new ApiResponse(200, "Wishlist fetched successfully", wishlist));
});