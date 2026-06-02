import mongoose from "mongoose";
import { type } from "os";

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    products: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true
            },
            quantity: {
                type: Number,
                required: true
            },
            size: {
                type: String,
                required: true
            },
            productTotal: {
                type: Number,
                required: true,
                default: 0
            }
        }
    ],
    subTotal: {
        type: Number,
        required: true,
        default: 0
    },
    total: {
        type: Number,
        required: true,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
      updatedAt: {
        type: Date,
        default: Date.now
    }
});

const Cart = mongoose.model('Cart',cartSchema);
export {Cart};