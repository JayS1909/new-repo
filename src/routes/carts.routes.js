import { Router } from "express";
import { addProductToCart, deleteItem, getCartItems, updateItem } from "../conrollers/cart.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route('/api/cart/add').post(verifyJWT, addProductToCart);
router.route('/api/cart').get(verifyJWT,getCartItems);
router.route('/api/cart/:id').patch(verifyJWT, updateItem);
router.route('/api/cart/:id').delete(verifyJWT, deleteItem);

export default router;