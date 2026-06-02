import { Router } from "express";
import { logoutUser, registerUser } from "../conrollers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { loginUser } from "../conrollers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {otpRateLimiter } from "../middlewares/rateLimit.middlewares.js";


const router = Router()

router.route("/login").post(otpRateLimiter,loginUser)
router.route("/register").post(registerUser)

router.route("/logout").post(verifyJWT, logoutUser)


export default router

