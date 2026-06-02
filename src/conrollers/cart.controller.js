import { Cart } from "../models/cart.models.js";
import Product from "../models/products.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
 
const addProductToCart = asyncHandler(async (req, res) => {
    const { productId, quantity, size } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json(new ApiResponse(400, "Invalid Product ID"));
    }
    if (quantity <= 0) {
        return res.status(400).json(new ApiResponse(400, "Quantity must be greater than 0"));
    }
    if (!size) {
        return res.status(400).json(new ApiResponse(400, "Size is required"));
    }

    try {
        const product = await Product.findById(productId);
        if(!product) {
            return res.status(404).json(new ApiResponse(404, "Product not found"));
        }
        const availableQuantity = product.sizes.get(size); // Access quantity from the Map
        // console.log(`Available quantity for size ${size}: ${availableQuantity}`);

        if(!availableQuantity || availableQuantity <= 0) {
            return res.status(400).json(new ApiResponse(400,`no stock available for size ${size}`));
        }
        if (req.user) {
            // Authenticated user
            const userId = req.user._id;
            const fullName = req.user.fullName;

            // console.log(`Received request to add product ${productId} to cart with size ${size} and quantity ${quantity} for ${fullName}`);

            let cart = await Cart.findOne({ user: userId });

            if (!cart) {
                cart = new Cart({ user: userId, products: [] });
            }

            const productIndex = cart.products.findIndex(p => p.productId?.toString() === productId?.toString() && p.size === size);

            let newCartQuantity;
            const productPrice = product.discountedPrice;

            // const product = await Product.findById(productId);
            // if(!product) {
            //     return res.status(404).json(new ApiResponse(404, "Product not found"));
            // }
            // if (productIndex > -1) {
            //     cart.products[productIndex].quantity += quantity;
            //     cart.products[productIndex].productTotal += productTotal;
            // } else {
            //     cart.products.push({ productId, quantity, size, productTotal });
            // }

            if(productIndex > -1) {
                newCartQuantity = cart.products[productIndex].quantity + quantity;

                if(newCartQuantity > availableQuantity) {
                    newCartQuantity = availableQuantity;
                    return res.status(200).json(new ApiResponse(200, cart, `You cannot add more than ${availableQuantity} items of ${product.productName}.`));
                    // return res.status(400).json(new ApiResponse(400, `You cannot add more than ${availableQuantity} items of this product.`));
                    
                }

                cart.products[productIndex].quantity = newCartQuantity;
                cart.products[productIndex].productTotal = newCartQuantity * productPrice;
            } else {
                newCartQuantity = quantity > availableQuantity ? availableQuantity : quantity;
                cart.products.push({productId,quantity: newCartQuantity, size, productTotal: newCartQuantity * productPrice});
            }

            cart = await cart.populate('products.productId');
            if (!cart || cart.products.length === 0) {
                return res.status(500).json(new ApiResponse(500, "Cart population failed"));
            }

            // cart.subTotal = cart.products.reduce((sum, item) => {
            //     if (!item.productId || !item.productId.discountedPrice || isNaN(item.productId.discountedPrice)) {
            //         return sum;
            //     }
            //     return sum + item.quantity * item.productId.discountedPrice;
            // }, 0);

            cart.subTotal = cart.products.reduce((sum, item) => sum + item.productTotal,0 );
            cart.total = cart.subTotal;

            await cart.save();
            return res.status(200,cart).json(new ApiResponse(200,cart));
        } else {
            // Guest user
            // console.log(`Received request to add product ${productId} to guest cart with size ${size} and quantity ${quantity}`);

            // Retrieve or initialize guest cart from session
            let guestCart = req.session.guestCart || { products: [] };

            const productIndex = guestCart.products.findIndex(p => p.productId === productId && p.size === size);
            let newCartQuantity;
            const productPrice = product.discountedPrice;

            if (productIndex > -1) {
                newCartQuantity = guestCart.products[productIndex].quantity +quantity;
                if(newCartQuantity > availableQuantity) {
                    newCartQuantity = availableQuantity;
                    return res.status(200).json(new ApiResponse(200,guestCart,`You cannot add more than ${availableQuantity} items of ${product.productName}.`))
                }
                guestCart.products[productIndex].quantity = newCartQuantity;
                guestCart.products[productIndex].productTotal = newCartQuantity * productPrice;
            } else {
                // Generate a UUID for the new cart item
                newCartQuantity = quantity > availableQuantity ? availableQuantity : quantity;
                const itemId = uuidv4();
                guestCart.products.push({ _id: itemId, productId, quantity:newCartQuantity, size, productTotal: newCartQuantity * productPrice });
            }

            req.session.guestCart = guestCart; // Save updated guest cart in session
            // console.log("Printing the guest cart 1.0", guestCart);

            // Optional: Calculate subtotal and total for guest cart
            const productDetails = await Promise.all(guestCart.products.map(async (item) => {
                const product = await Product.findById(item.productId);
                // console.log("Printing the product of the loop: ", product);
                return { ...item, price: product?.discountedPrice || 0 };
            }));
            // console.log("Printing the product details: ", productDetails);

            guestCart.subTotal = productDetails.reduce((sum, item) => sum + item.productTotal, 0);
            guestCart.total = guestCart.subTotal;
            req.session.guestCart = guestCart;

            return res.status(200).json(new ApiResponse(200, guestCart));
        }
    } catch (error) {
        console.error(`Error adding product to cart: ${error.message}`);
        return res.status(500).json({ message: 'Something went wrong', error: error.message });
    }
});


// const getCartItems = asyncHandler(async(req,res) => {
//     try {
//         const userId = req.user._id;
//         console.log("User id: ",userId);
//         // const cartItems = await Cart.find({userId}).populate('products.productId');
//         // console.log(cartItems);
//         const cart = await Cart.findOne({ user: userId });
//         const populatedCart = await cart.populate('products.productId');
//         console.log(JSON.stringify(populatedCart, null, 2));
//         console.log(populatedCart);
//         res.json(populatedCart);
//     } catch (error) {
//         console.error('Error fetching cart items: ',error);
//         res.status(500).json({message: 'Failed to retrieve cart items'});
//     }
// });

const getCartItems = asyncHandler(async (req, res) => {
    try {
        if (req.user) {
            // Authenticated user
            const userId = req.user._id;
            console.log("The userId: ",userId);
            // Find the cart for the authenticated user
            let cart = await Cart.findOne({ user: userId }).populate('products.productId');

            if (!cart) {
                return res.status(200).json({ products: [], subTotal: 0, total: 0 });
            }

            // Check and remove items with zero stock for the selected size
            let cartModified = false;
            cart.products = await Promise.all(cart.products.map(async (item) => {
                const product = item.productId;
                const selectedSize = item.size;

                // Get available stock for the selected size
                const availableQuantity = product.sizes.get(selectedSize) || 0;

                if (availableQuantity === 0) {
                    // Set flag to remove the item from cart
                    return null; // Mark item for removal if stock is 0
                } else if (item.quantity > availableQuantity) {
                    item.quantity = availableQuantity; // Adjust to available stock
                    cartModified = true;
                }

                return item;
            }));

            // Filter out items marked for removal
            cart.products = cart.products.filter(item => item !== null);

            // If any updates were made, save the cart
            if (cartModified || cart.products.length < cart.products.length) {
                await cart.save();
            }

            // Calculate the subtotal and total
            cart.subTotal = cart.products.reduce((sum, item) => sum + item.quantity * item.productId.discountedPrice, 0);
            cart.total = cart.subTotal;

            // Return the updated cart
            res.json(cart);
        } else {
            // Guest user
            // Retrieve guest cart from session
            const guestCart = req.session.guestCart || { products: [] };
            
            // Check stock levels and update/remove items in guest cart
            const productDetails = await Promise.all(guestCart.products.map(async (item) => {
                const product = await Product.findById(item.productId);
                
                if (!product) {
                    // If product no longer exists, mark for removal
                    return null;
                }
        
                const selectedSize = item.size;
                const availableQuantity = product.sizes.get(selectedSize) || 0;
        
                if (availableQuantity === 0) {
                    // If stock is zero for the selected size, mark for removal
                    return null;
                } else if (item.quantity > availableQuantity) {
                    // If requested quantity exceeds stock, adjust it
                    item.quantity = availableQuantity;
                }
        
                return { ...item, product };
            }));
        
            // Filter out items marked for removal (i.e., those with zero stock or non-existent products)
            guestCart.products = productDetails.filter(item => item !== null);
        
            // Calculate subtotal and total for the updated guest cart
            guestCart.subTotal = guestCart.products.reduce((sum, item) => {
                return sum + item.quantity * (item.product.discountedPrice || 0);
            }, 0);
            guestCart.total = guestCart.subTotal;
        
            // Update the session with the modified guest cart
            req.session.guestCart = guestCart;
            // console.log("The guest cart for checking: ", guestCart);
            // Return the updated guest cart
            res.json(guestCart);
        }        
    } catch (error) {
        console.error('Error fetching cart items: ', error);
        res.status(500).json({ message: 'Failed to retrieve cart items' });
    }
});


// const updateItem = asyncHandler(async(req,res) => {
//     try {
//         const userId = req.user._id;
//         const cartItemId = req.params.id;
//         const newQuantity = req.body.quantity;
//         let cart = await Cart.findOne({user:userId});

//         if(!cart) {
//             return res.status(404).json({message: 'Cart not found'});
//         }

//         const index = cart.products.findIndex(item => item._id.toString() === cartItemId);
//         // console.log(index);
//         if(index === -1) {
//             return res.status(404).json({message: 'Item not found in cart' });
//         }
//         cart.products[index].quantity = newQuantity;

//         cart = await cart.populate('products.productId');
        
//         cart.subTotal = cart.products.reduce((sum, item) => {
//             if (!item.productId || !item.productId.discountedPrice || isNaN(item.productId.discountedPrice)) {
//                 console.error(`Invalid price for product: ${item.productId ? item.productId.name : 'Unknown product'}`);
//                 return sum; // Skip this product
//             }
//             return sum + item.quantity * item.productId.discountedPrice;
//         }, 0);
//         cart.total = cart.subTotal;
//         console.log(cart.total);
//         await cart.save();
//         res.json({message: 'Quantity updated'});
//     } catch (error) {
//         console.error('Error updating quantity: ', error);
//         res.status(500).json({message: 'Failed to update quantity'});
//     }
// });

const updateItem = asyncHandler(async (req, res) => {
    try {
        const { id: cartItemId } = req.params;
        const { quantity: newQuantity } = req.body;

        if (newQuantity <= 0) {
            return res.status(400).json({ message: 'Quantity must be greater than 0' });
        }

        if (req.user) {
            // Authenticated user logic
            const userId = req.user._id;
            let cart = await Cart.findOne({ user: userId });

            if (!cart) {
                return res.status(404).json({ message: 'Cart not found' });
            }
            const index = cart.products.findIndex(item => item._id.toString() === cartItemId);
            if (index === -1) {
                return res.status(404).json({ message: 'Item not found in cart' });
            }
            const size = cart.products[index].size;
            const productId = cart.products[index].productId;

            const product = await Product.findById(productId);
            if(!product) {
                return res.status(404).json(new ApiResponse(404, "Product not found"));
            }
            const availableQuantity = product.sizes.get(size); // Access quantity from the Map
            const productPrice = product.discountedPrice;
            // console.log(`Available quantity for size ${size}: ${availableQuantity}`);

            if(!availableQuantity || availableQuantity <= 0) {
                return res.status(400).json(new ApiResponse(400,`no stock available for size ${size}`));
            }
            let newCartQuantity;
            newCartQuantity = newQuantity;
            // console.log("The new cart quantity",newCartQuantity);

            if(newCartQuantity > availableQuantity) {
                newCartQuantity = availableQuantity;
                cart.products[index].quantity = newCartQuantity;
                cart.products[index].productTotal = newCartQuantity * productPrice;
                return res.status(200).json(new ApiResponse(200, cart, `You cannot add more than ${availableQuantity} items of ${product.productName}.`));
            } else {
                newCartQuantity = newQuantity > availableQuantity ? availableQuantity : newQuantity;
                cart.products[index].quantity = newCartQuantity;
                cart.products[index].productTotal = newCartQuantity * productPrice;
            }

            // cart.products[index].quantity = newQuantity;
            cart = await cart.populate('products.productId');

            // cart.subTotal = cart.products.reduce((sum, item) => {
            //     if (!item.productId || !item.productId.discountedPrice || isNaN(item.productId.discountedPrice)) {
            //         console.error(`Invalid price for product: ${item.productId ? item.productId.name : 'Unknown product'}`);
            //         return sum; // Skip this product
            //     }
            //     return sum + item.quantity * item.productId.discountedPrice;
            // }, 0);

            // cart.total = cart.subTotal;

            cart.subTotal = cart.products.reduce((sum, item) => sum + item.productTotal,0 );
            // console.log("The new subtotal will be: ",cart.subTotal);
            cart.total = cart.subTotal;
            await cart.save();
            res.json({ message: 'Quantity updated' });
        } else {
            // Guest user logic
            let guestCart = req.session.guestCart || { products: [] };
            const index = guestCart.products.findIndex(item => item._id.toString() === cartItemId);

            if (index === -1) {
                return res.status(404).json({ message: 'Item not found in guest cart' });
            }

            const size = guestCart.products[index].size;
            const productId = guestCart.products[index].productId;

            const product = await Product.findById(productId);
            if(!product) {
                return res.status(404).json(new ApiResponse(404, "Product not found"));
            }
            const availableQuantity = product.sizes.get(size);
            const productPrice = product.discountedPrice;
            if(!availableQuantity || availableQuantity <= 0) {
                return res.status(400).json(new ApiResponse(400,`no stock available for size ${size}`));
            }

            let newCartQuantity;
            newCartQuantity = newQuantity;

            if(newCartQuantity > availableQuantity) {
                newCartQuantity = availableQuantity;
                guestCart.products[index].quantity = newCartQuantity;
                guestCart.products[index].productTotal = newCartQuantity * productPrice;
                return res.status(200).json(new ApiResponse(200, guestCart, `You cannot add more than ${availableQuantity} items of ${product.productName}.`));
            } else {
                newCartQuantity = newQuantity > availableQuantity? availableQuantity: newQuantity;
                guestCart.products[index].quantity = newCartQuantity;
                guestCart.products[index].productTotal = newCartQuantity * productPrice;
            }
            // Async function to fetch product details
            guestCart.subTotal = guestCart.products.reduce((sum, item) => sum + item.productTotal, 0);
            guestCart.total = guestCart.subTotal;
            req.session.guestCart = guestCart; // Ensure session is updated
            await req.session.save(); // Explicitly save the session after updating
            // console.log("After updating the guest cart: ",req.session.guestCart);
            // Call the async function and await it
            // await updateGuestCartTotals();
            res.json({ message: 'Quantity updated for guest cart' });
        }
    } catch (error) {
        console.error('Error updating quantity: ', error);
        res.status(500).json({ message: 'Failed to update quantity' });
    }
});






// const deleteItem = asyncHandler(async(req,res) => {
//     try {
//         const userId = req.user._id;
//         const cartItemId = req.params.id;

//         let cart = await Cart.findOne({user:userId});
//         if(!cart) {
//             return new ApiResponse(404, 'Cart not found');
//         }
//         const index = cart.products.findIndex(item => item._id.toString() === cartItemId);
//         if(index === -1) {
//             return new ApiResponse(404,'Item not found in the cart');
//         }
//         cart.products.splice(index,1);
//         cart = await cart.populate('products.productId');
//         console.log("This is the testing code for the delete");
//         console.log(JSON.stringify(cart, null, 2));
//         cart.subTotal = cart.products.reduce((sum, item) => {
//             if (!item.productId || !item.productId.discountedPrice || isNaN(item.productId.discountedPrice)) {
//                 console.error(`Invalid price for product: ${item.productId ? item.productId.name : 'Unknown product'}`);
//                 return sum; // Skip this product
//             }
//             return sum + item.quantity * item.productId.discountedPrice;
//         }, 0);
//         cart.total = cart.subTotal;
//         console.log("This is the cart total after deleting the product");
//         console.log(cart.total);

//         await cart.save();
//         res.json({message: 'Item removed from cart'});
//     } catch (error) {
//         console.error('Error removing item from cart: ',error);
//         return new ApiError(500,'Failed to remove item from cart');
//     }
// });

const deleteItem = asyncHandler(async (req, res) => {
    try {
        const cartItemId = req.params.id;

        if (req.user) {
            // Authenticated user logic
            const userId = req.user._id;
            let cart = await Cart.findOne({ user: userId });
            if (!cart) {
                return res.status(404).json({ message: 'Cart not found' });
            }

            const index = cart.products.findIndex(item => item._id.toString() === cartItemId);
            if (index === -1) {
                return res.status(404).json({ message: 'Item not found in cart' });
            }

            cart.products.splice(index, 1);
            cart = await cart.populate('products.productId');

            cart.subTotal = cart.products.reduce((sum, item) => {
                if (!item.productId || !item.productId.discountedPrice || isNaN(item.productId.discountedPrice)) {
                    // console.error(`Invalid price for product: ${item.productId ? item.productId.name : 'Unknown product'}`);
                    return sum; // Skip this product
                }
                return sum + item.quantity * item.productId.discountedPrice;
            }, 0);

            cart.total = cart.subTotal;
            await cart.save();
            res.json({ message: 'Item removed from cart' });
        } else {
            // Guest user logic
            const guestCart = req.session.guestCart || { products: [] };
            const index = guestCart.products.findIndex(item => item._id.toString() === cartItemId);

            if (index === -1) {
                return res.status(404).json({ message: 'Item not found in guest cart' });
            }

            guestCart.products.splice(index, 1);

            // Async function to update guest cart totals
            const updateGuestCartTotals = async () => {
                const subTotalPromises = guestCart.products.map(async (item) => {
                    const product = await Product.findById(item.productId);
                    if (!product || isNaN(product.discountedPrice)) {
                        // console.error(`Invalid price for product: ${product ? product.name : 'Unknown product'}`);
                        return 0; // Skip this product
                    }
                    return item.quantity * product.discountedPrice;
                });

                const subTotalArray = await Promise.all(subTotalPromises);
                guestCart.subTotal = subTotalArray.reduce((sum, current) => sum + current, 0);
                guestCart.total = guestCart.subTotal;

                req.session.guestCart = guestCart; // Update session
                await req.session.save(); // Explicitly save the session
            };

            // Call the async function and wait for it
            await updateGuestCartTotals();
            res.json({ message: 'Item removed from guest cart' });
        }
    } catch (error) {
        // console.error('Error removing item from cart: ', error);
        res.status(500).json({ message: 'Failed to remove item from cart' });
    }
});





export {addProductToCart, getCartItems, updateItem, deleteItem};

