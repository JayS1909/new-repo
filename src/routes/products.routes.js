import { Router } from "express";
import { deleteProduct, handleUpdate, productData, updateProduct } from "../conrollers/products.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();


router.route('/api/upload').post(upload.fields([
    {name: 'frontImage', maxCount:1},
    {name: 'backImage', maxCount: 1},
    {name: 'rightImage',maxCount:1},
    {name: 'leftImage', maxCount: 1}
]),productData);

router.route('/sku').post(updateProduct);
router.route('/update').post(handleUpdate);
router.route('/delete').delete(deleteProduct);

export default router;