import mongoose from "mongoose";



const lineItemSchema = new mongoose.Schema({
    sku: { type: String, required: true },
    variant_id: { type: String },
    price: { type: Number, required: true },
    offer_price: { type: Number, required: true },
    tax_amount: { type: Number, required: true },
    quantity: { type: Number, required: true },
    name: { type: String, required: true },
    weight: { type: Number },
    dimensions: {
        length: { type: Number },
        width: { type: Number },
        height: { type: Number }
    },
    notes: { type: Map, of: String },
    image_url: { type: String },
    description: { type: String },
});

const orderSchema = new mongoose.Schema ({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    orderId: {
        type: String,
        required: true,
        unique: true
    },
    razorpay_receipt_id: {
        type: String,
        required: true,
    },
    internal_receipt_id: {
        type: String,
    },
    waybill: {
        type: String,
        unique:true,
        sparse: true
    },
    customer_details: {
        
        contact: {type: String},
        email: {type: String},
        shippingAddress: {
            name: {
                type: String,  
            },
            line1: {
                type: String,
                
            },
            line2: {
                type: String,
            },
            zipcode: {
                type:String, 
            },
            city: {
                type: String,
            },
            state: {
                type: String,
            },
            country: {
                type: String,
            }
        },
        billingAddress: {
            name: { type: String },
            line1: { type: String},
            line2: { type: String },
            zipcode: { type: String},
            city: { type: String },
            state: { type: String},
            country: { type: String},
        }
    },
    orderCreationStatus: {
        status: {
            type: String,
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    },
    shipmentStatus: {
        status: {
            type: String,
            default: "Manifested"
        },
        timestamp: {
            type: Date
        }
    },
    location: {type: String},
    lineItems: [lineItemSchema],
    amount: {
        type: Number,
        required: true
    },
    amount_due: {
        type: Number,
        required: true
    },
    amount_paid: {
        type: Number,
        default: 0
    }, 
    refund: {
        status: {
            type: String,
            default: "none"
        }
    },
    shipping_fee: {
        type: Number,
        default: 0
    },
    cod_fee: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['created', 'paid', 'ready_for_delivery', 'dispatched','cancelled'],
        default: 'created'
    },
    notes: {
        type: Map,
        of: String
    },
    confirmation: {
        type: Boolean,
        default: false // Order is not confirmed initially
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    trackingInfo: { type: Map, of: String },
});

const Order = mongoose.model('Order', orderSchema);
export default Order;