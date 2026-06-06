import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { toggleWishlist, getWishlist } from "../conrollers/wishlist.controller.js";

const router = Router();

router.route('/api/wishlist/toggle').post(verifyJWT, toggleWishlist);
router.route('/api/wishlist').get(verifyJWT, getWishlist);

export default router;