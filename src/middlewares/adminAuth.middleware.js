import { User } from "../models/users.models.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const adminJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

      if (!token) {
        return res.status(401).render("errorPage", {
          title: "Unauthorized",
          message: "Unauthorized request. Please log in to access this page.",
        });
      }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
    const user = await User.findById(decodedToken?._id).select("-otp -refreshToken");

    if (!user) {
        res.redirect("/")
        return res.status(401).render("errorPage", {
          title: "Invalid login",
          message: "The user do not exist",
        });
      }

    // Check if the user's role is "admin"
    if (user.role !== "admin") {
        res.redirect("/")
        return res.status(403).render("errorPage", {
          title: "Access Denied",
          message: "You do not have permission to access this page.",
        });
    }
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});
