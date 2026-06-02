import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import Product from "../models/products.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import path from "path";
import { fileURLToPath } from "url";
import { Cart } from "../models/cart.models.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const productData = asyncHandler(async(req,res) => {
    try {
        // console.log("Request body: ", req.body);
        const {sku, variantID, productName, originalPrice, discountedPercentage, category, isFeatured} = req.body;
        
        // const sizes = req.body.sizes || {};
        const sizes = {
            XS: parseFloat(req.body.sizes.XS) || 0,
            S: parseFloat(req.body.sizes.S) || 0,
            M: parseFloat(req.body.sizes.M) || 0,
            L: parseFloat(req.body.sizes.L) || 0,
            XL: parseFloat(req.body.sizes.XL) || 0,
            XXL: parseFloat(req.body.sizes.XXL) || 0
        };
        console.log("Parsed Sizes: ", sizes);
       
        const quantity = Object.values(sizes).reduce((acc, quantity) => acc + quantity, 0);
    
        const parsedDetails = {
            material: req.body.details.material || '',
            color: req.body.details.color || '',
            fit: req.body.details.fit || '',
            pattern: req.body.details.fit || ''
        };
        const featured = isFeatured === 'on';

        const description = {
            frontPrint: req.body.descriptionFrontPrint,
            backPrint: req.body.descriptionBackPrint,
            features: req.body.features ? req.body.features.split(','):[]
        };

        const imagePaths = [
            req.files.frontImage[0].path,
            req.files.backImage[0].path,
            req.files.rightImage[0].path,
            req.files.leftImage[0].path
        ];

        console.log('Image Paths:', imagePaths);

        const folderPath = `products/${category}/${productName}`;
        console.log('Uploading images to Cloudinary...');
        
        const cloudinaryUrls = await Promise.all(
            imagePaths.map(async(path) => {
                try {
                    const url = await uploadOnCloudinary(path, folderPath);
                    console.log(`Uploaded ${path} to cloudinary: ${url}`);
                    return url;
                } catch (error) {
                    console.error(`Failed to upload ${path} to cloudinary`, error);
                    throw new Error(`Failed to upload ${path} to cloudinary`);
                }
            })
        );

        console.log('Cloudinary URLs: ', cloudinaryUrls);

        if(cloudinaryUrls.length != 4) {
            return new ApiError(400, "There must be exactly 4 images");
        }

        const newProduct = new Product({
            sku,
            variantID,
            productName,
            originalPrice,
            discountedPercentage,
            images: cloudinaryUrls,
            sizes,
            quantity,
            details:parsedDetails || {},
            description,
            category,
            isFeatured: featured
        });
        await newProduct.save();
        return res.json(new ApiResponse(201,'Product added successfully', newProduct));
    } catch (error) {
        console.log("Failed to add new products",error);
    }
});

const updateProduct = asyncHandler(async(req,res) => {
    try {
        console.log("Running update product api");
        console.log(req.body);
        const {sku} = req.body;
        let product = await Product.findOne({sku});
        console.log(product);
        if(!product) {
            console.log("Product not found");
            return res.json(new ApiError(404,"Product do not exist in the database"));
        } else {
            res.render('updateProductForm', {product});
        }
    } catch (error) {
        console.error('Error finding product: ',error);
        return new ApiError(500, "Error finding the product from the database");
    }
});


const handleUpdate = asyncHandler(async(req,res) => {
    try {
        console.log("The update body: ",req.body);
        const {sku, variantID, productName, originalPrice, discountedPercentage, isFeatured } = req.body;
        const sizes = {
            XS: parseFloat(req.body.sizes.XS) || 0,
            S: parseFloat(req.body.sizes.S) || 0,
            M: parseFloat(req.body.sizes.M) || 0,
            L: parseFloat(req.body.sizes.L) || 0,
            XL: parseFloat(req.body.sizes.XL) || 0,
            XXL: parseFloat(req.body.sizes.XXL) || 0
        };
        console.log("Variant Id: ", variantID);
        console.log("Parsed Sizes: ", sizes);
        const featured = isFeatured === 'on';

        let product = await Product.findOne({sku});
        if(!product) {
            console.log("Product not found");
            return res.status(404).json(new ApiError(404, "Product does not exist in the database"));
        }

        product.productName = productName || product.productName;
        product.originalPrice = originalPrice || product.originalPrice;
        product.discountedPercentage = discountedPercentage || product.discountedPercentage;
        product.isFeatured = featured;
        product.sizes = sizes;
        product.quantity = Object.values(sizes).reduce((acc,quantity) => acc + quantity, 0);

        await product.save();
        return res.json(new ApiResponse(200,'Product updated successfully',product));
    } catch (error) {
        console.error('Error updating product: ',error);
        return new ApiError(500, "Error updating the product from the database");
    }
});

const deleteProduct = asyncHandler(async (req, res) => {
    try {
        console.log("Running delete product API");
        console.log(req.body);
        const { sku } = req.body;

        // Find and delete the product from the Product collection
        const product = await Product.findOneAndDelete({ sku });
        if (!product) {
            console.log("Product not found");
            return res.json(new ApiError(404, "Product does not exist in the database"));
        }

        // Remove the product from authenticated users' carts
        const cartsWithDeletedProduct = await Cart.find({ "products.productId": product._id });
        for (const cart of cartsWithDeletedProduct) {
            // Remove the deleted product from the products array
            cart.products = cart.products.filter(item => item.productId.toString() !== product._id.toString());

            // Recalculate subTotal and total
            cart.subTotal = cart.products.reduce((acc, item) => acc + item.productTotal, 0);
            cart.total = cart.subTotal;

            // Save the updated cart
            await cart.save();
        }

        // Handle the guest cart
        if (req.session.guestCart) {
            const guestCart = req.session.guestCart;

            // Remove the deleted product from the guest cart products array
            guestCart.products = guestCart.products.filter(
                item => item.productId.toString() !== product._id.toString()
            );

            // Recalculate the subTotal for the guest cart
            guestCart.subTotal = guestCart.products.reduce((acc, item) => acc + item.productTotal, 0);

            // Update session with the modified guestCart
            req.session.guestCart = guestCart;
        }

        return res.json(new ApiResponse(200, "Product deleted successfully from the database and removed from all carts"));
    } catch (error) {
        console.error("Error deleting product: ", error);
        return res.json(new ApiError(500, "Error deleting the product from the database"));
    }
});

export {productData, updateProduct,handleUpdate,deleteProduct};