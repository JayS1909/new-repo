import { User } from "../models/users.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const optionalAuth = asyncHandler(async(req, res, next) => {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
        req.user = null;
        return next();
    }

    try {
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id).select("-otp -refreshToken");

        req.user = user || null;
    } catch (error) {
        // Token is invalid or expired, just proceed as guest
        req.user = null;
    }
    next();
});
