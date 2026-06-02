// paymentController.js
import Razorpay from 'razorpay';
import crypto from 'crypto';
import Product from "../models/products.models.js";
import Order from "../models/orders.models.js";
import fetch from 'node-fetch';
import { ApiError } from '../utils/ApiError.js';
import { name } from 'ejs';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Cart } from '../models/cart.models.js';
import { sendCancelOrderConfirmationEmail, sendOrderConfirmationEmail } from '../utils/emailService.js';
import { generateInternalReceiptId } from '../utils/receiptGenerator.js';

// Initialize Razorpay instance with keys from environment variables
const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create a Razorpay order
const createOrder = async (req, res) => {
    const {receipt, cartItems } = req.body;
    const isAuthenticated = !!req.user;
    const products = cartItems.products;

    try {
        const lineItems = await Promise.all(
            products.map(async(item) => {
                const product = await Product.findById(item.productId);
                if (!product) {
                    throw new Error(`Product not found: ${item.productId}`);
                }
                return {
                    sku: product.sku,
                    variant_id: '001',
                    price: product.originalPrice * 100,
                    offer_price: product.discountedPrice * 100,
                    tax_amount: 0,
                    quantity: item.quantity,
                    name: product.productName,
                    weight: 500,
                    dimensions: {
                        length: 12,
                        width: 12,
                        height: 12
                    },
                    notes: {
                        "Size": item.size,
                    },
                    image_url: product.images[0],
                    description: product.description.frontPrint,
                };
            })
        );
        var options = {
            "amount": cartItems.total * 100, // in paise.
            "currency": "INR",
            "receipt": receipt,
            "notes": {
                line_items: JSON.stringify(lineItems),
            },
            "line_items_total": lineItems.reduce((total, item) => total + (item.offer_price * item.quantity), 0), // in paise.
            "line_items": lineItems
        };
        console.log("The instance is being created");
        const order = await razorpayInstance.orders.create(options);
        console.log("Line number 62 working");
        let orderDetails ={
            orderId: order.id,
            razorpay_receipt_id: order.receipt,
            amount: order.amount,
            amount_due: order.amount_due,
            amount_paid: order.amount_paid,
            // currency: order.currency,
            // attempts: order.attempts,
            cod_fee: order.cod_fee,
            lineItems: lineItems,
            shipping_fee: order.shipping_fee,
            status: order.status,
            notes: order.notes
            
        };
        console.log("Line number 77 working");
        if(isAuthenticated) {
            orderDetails.userId = req.user._id;
        }
        console.log("Line number 81 working");
        const newOrder = new Order(orderDetails);
        console.log("Line number 83 working");
        await newOrder.save();
        console.log("85 working");
        res.status(200).json({
            success: true,
            message: 'Order created successfully',
            order,
        });
    } catch (error) {
        console.error("Error creating order:", error);
        res.status(500).json({
            success: false,
            message: 'Failed to create order',
            error: error.message || 'Internal Server Error',
        });
    }
};

// Handle payment verification
const verifyPayment = async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

    // First, check stock availability for all line items
    try {
        const orderData = await getOrderDetails(razorpay_order_id);
        console.log("The  order data: ",orderData);
        const userId = orderData.userId;
        const stockCheckResult = await checkStockAvailability(orderData);
        if (!stockCheckResult.success) { 
            // Stock is insufficient, so cancel the operation and respond with an error
            return res.status(400).json({
                success: false,
                message: 'Insufficient stock for one or more items',
            });
        } 
        // Only proceed if the stock check passed
        if (expectedSignature === razorpay_signature) {
            console.log("Payment verified");
            const stockUpdateResult = await updateStockForOrder(orderData);
            if (!stockUpdateResult.success) { 
                return res.status(400).json({ success: false, message: stockUpdateResult.message });
            }
            const delhiveryResponse = await createDelhiveryOrder(orderData);
            if (userId) {
                await Cart.findOneAndDelete({ user: userId });
            } else if(req.session.guestCart) {
                req.session.guestCart = null;
                console.log("Guest cart cleared");
            }    
            res.status(200).json({
                success: true,
                message: 'Payment verified, order created, and Delhivery shipment initiated',
                delhiveryData: delhiveryResponse
            });
        } else {
            res.status(400).json({ success: false, message: 'Payment verification failed' });
        }
    } catch (error) {
        console.error('Error verifying payment or checking stock:', error);
        res.status(500).json({ success: false, message: 'Failed to process payment verification or stock check' });
    }
};

async function checkStockAvailability(orderData) {
    try {
        for(const lineItem of orderData.lineItems) {
            const {sku, quantity, notes} = lineItem;
            const size = notes?.get("Size");

            if(!size) {
                return { success: false, message: `Size information missing for product SKU ${sku}` };
            }

            const product = await Product.findOne({sku});
            if(!product) {
                return { success: false, message: `Product with SKU ${sku} not found` };
            }

            const availableStock = product.sizes.get(size);
            if(availableStock < quantity) {
                return {success: false, message: `Insufficient stock for product SKU ${sku}, size ${size}`}
            }
        }
        return {success: true, message: 'Stock is avaiable for all items'};
    } catch (error) {
        console.error('Error checking stock availability:', error);
        return { success: false, message: 'Error checking stock availability' };
    }
}

async function updateStockForOrder(orderData) {
    try {
        for(const lineItem of orderData.lineItems) {
            const {sku, quantity,notes} = lineItem;
            const size = notes?.get("Size");

            if(!size) {
                return {success: false, message: `Size information missing for product SKU ${sku}`};
            }

            const product = await Product.findOne({sku});
            if(!product) {
                return {success: false, message: `Product with SKU ${sku} not found`};
            }

            const availableStock = product.sizes.get(size);
            if (availableStock < quantity) {
                console.log(`Insufficient stock for product SKU ${sku}, size ${size}`)
                return { success: false, message: `Insufficient stock for product SKU ${sku}, size ${size}` };
            }

            product.sizes.set(size, availableStock - quantity);
            await product.save();
        }
        return {success: true, message: 'Stock updated successfully'};
    } catch (error) {
        
    }
}

const shippingInfo = async(req,res) => {
    const {order_id, addresses} = req.body;
    console.log("The request");
    
    try {
        
        const serviceabilityChecks = await Promise.all(
            addresses.map(async (address) => {
                // const apiUrl = `https://staging-express.delhivery.com/c/api/pin-codes/json/?filter_codes=${address.zipcode}`;
                const apiUrl = `https://track.delhivery.com/c/api/pin-codes/json/?filter_codes=${address.zipcode}`;
                const apiResponse = await fetch(apiUrl, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Token ${process.env.delhivery_auth_token}`,
                    }
                });
                console.log("The api response: ", apiResponse);
                if (!apiResponse.ok) {
                    // Log the error message
                    // console.log(`Error: ${apiResponse.status} - ${apiResponse.statusText}`);
                    return; // Stop execution if there's an error
                }
                const data = await apiResponse.json();
                // console.log("The data of the service check: ",data);
                console.log("The data: ",data);

                const pincodeData = data.delivery_codes && data.delivery_codes.length > 0? data.delivery_codes[0] : null;
                return {
                    id: address.id,
                    zipcode: address.zipcode,
                    state: address.state,
                    state_code: address.state_code,
                    country: address.country,
                    serviceable: pincodeData? true:false,
                    cod: pincodeData?.postal_code?.cod ? true : false,
                    cod_fee: pincodeData?.postal_code?.cod ? 50 : 0,
                    shipping_fee:pincodeData?.postal_code?.prepaid ? 100 : 0,
                };
            })
        )
        res.json({addresses: serviceabilityChecks});
    } catch (error) {
        res.status(500).json({
            message: "Failed to check serviceability",
            error
        });
    }
};

const getPromotions = async(req,res) => {
    const { order_id, contact, email } = req.body;

    const promotions = [
        {
            code: 'SUMMER50',
            summary: '50% off on all items',
            description: 'Valid for one-time use',
            tnc: ['Applicable on orders above INR 500', 'Not valid on sale items']
        }
    ];
    res.json({ promotions });
};

const applyPromotions = async(req,res) => {
    const { order_id, code } = req.body;

    // Mock validation logic
    if (code === 'SUMMER50') {
        res.json({
            promotion: {
                reference_id: 'promo_123',
                type: 'coupon',
                code: code,
                value: 5000,  // 50% off in paise (₹50)
                value_type: 'fixed',
                description: '50% off on all items'
            }
        });
    } else {
        res.status(400).json({
            failure_code: 'INVALID_PROMOTION',
            failure_reason: 'Invalid promotion code'
        });
    }
};


const getOrderDetails = async (razorpay_order_id) => {
    try {
        const order = await razorpayInstance.orders.fetch(razorpay_order_id);
        const existingOrder = await Order.findOne({orderId: order.id});

        if(!existingOrder) {
            return;
        }
        existingOrder.amount_paid = order.amount_paid;
        existingOrder.amount_due = order.amount_due;
        existingOrder.status = order.status;
        existingOrder.cod_fee = order.cod_fee || 0;
        existingOrder.shipping_fee = order.shipping_fee || 0;
        existingOrder.confirmation = true;
        

        if(order.customer_details) {
            existingOrder.customer_details.contact = order.customer_details.contact;
            existingOrder.customer_details.email = order.customer_details.email;

            if(order.customer_details.shipping_address) {
                existingOrder.customer_details.shippingAddress = {
                    name: order.customer_details.shipping_address.name,
                    line1: order.customer_details.shipping_address.line1,
                    line2: order.customer_details.shipping_address.line2,
                    zipcode: order.customer_details.shipping_address.zipcode,
                    city: order.customer_details.shipping_address.city,
                    state: order.customer_details.shipping_address.state,
                    country: order.customer_details.shipping_address.country
                };
            }
            if (order.customer_details.billing_address) {
                existingOrder.customer_details.billingAddress = {
                    name: order.customer_details.billing_address.name,
                    line1: order.customer_details.billing_address.line1,
                    line2: order.customer_details.billing_address.line2,
                    zipcode: order.customer_details.billing_address.zipcode,
                    city: order.customer_details.billing_address.city,
                    state: order.customer_details.billing_address.state,
                    country: order.customer_details.billing_address.country
                };
            }
        }
        if (order.line_items_total) {
            existingOrder.line_items_total = order.line_items_total
        }

        if(order.notes && order.notes.line_items) {
            existingOrder.line_items = JSON.parse(order.notes.line_items);
        }
        // e.g., update the order in your database with customer details
        await existingOrder.save();
        // console.log("Order updted successfully in the database");
        // console.log("The existing order:" ,existingOrder);
        return existingOrder;
    } catch (error) {
        console.error("Error fetching order details: ", error);
    }
};


const createDelhiveryOrder = async (order) => {
    console.log("The order: ",order);
    try {
        if (!order?.orderId || !order?.customer_details?.shippingAddress) {
            throw new Error('Missing required order details');
        }
        const productsDesc = order.lineItems
            .map(item => `${item.quantity}x ${item.name}`)
            .join(', '); // e.g., "2x T-shirt A, 1x T-shirt B"
        const totalQuantity = order.lineItems.reduce((total, item) => total + item.quantity, 0);
        // const delhiveryApiUrl = 'https://staging-express.delhivery.com/api/cmu/create.json';
        const delhiveryApiUrl = 'https://track.delhivery.com/api/cmu/create.json';

        const shipmentData = JSON.stringify({
            shipments: [
                {
                    order: order.orderId,
                    waybill: '',
                    add: order.customer_details.shippingAddress.line1 + order.customer_details.shippingAddress.line2,
                    name: order.customer_details.shippingAddress.name,
                    phone: order.customer_details.contact,
                    pin: order.customer_details.shippingAddress.zipcode,
                    payment_mode: 'Prepaid',
                    cod_amount: '0',
                    amount: order.amount,
                    shipping_mode: 'Surface',
                    products_desc: productsDesc,
                    quantity: totalQuantity
                },
            ],
            pickup_location: {
                // name: "EXTRAALAYER SURFACE"
                name: "Warehouse 1"
            }
        });

        const bodyData = new URLSearchParams({
            format: "json",
            data: shipmentData
        });
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const response = await fetch(delhiveryApiUrl,{
            method: 'POST',
            headers: {
                'Authorization': `Token ${process.env.delhivery_auth_token}`,
                'accept': 'application/json',
                'Content-Type':'application/x-www-form-urlencoded',
                
            },
            // body: JSON.stringify(shipmentPayload)
            body: bodyData.toString(),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if(!response.ok) {
            throw new Error(`Delivery API error: ${response.status}`);
        }
        const delhiveryData = await response.json();
        console.log("The delivery data: ", delhiveryData);
        const existingOrder = await Order.findOne({orderId: order.orderId});
        if(!existingOrder) {
            throw new Error(`Order not found: ${order.orderId}`);
        }
        existingOrder.waybill = delhiveryData.packages[0]?.waybill;
        existingOrder.orderCreationStatus = {
            status: delhiveryData.packages[0]?.status || "Unknown",
            timestamp: new Date()
        };
        existingOrder.internal_receipt_id = await generateInternalReceiptId();
        await existingOrder.save();
        if (delhiveryData.packages?.[0]?.remarks) {
            const remarksArray = delhiveryData.packages[0].remarks;
            if (Array.isArray(remarksArray)) {
                remarksArray.forEach((remark, index) => {
                    console.log(`Remark ${index + 1}: ${remark}`);
                });
            }
        }
        await sendOrderConfirmationEmail(
            order.customer_details.email,
            order.customer_details.shippingAddress.name,
            order.orderId,
            order.amount/100
        );        
        return delhiveryData;
    } catch (error) {
        console.error("Error creating Delhivery order: ", error);
        throw error;
    }   
};


const trackShipment = async (req, res) => {
    const { waybill, ref_ids } = req.query;

    if (!waybill && !ref_ids) {
        return res.status(400).json({ message: "Either waybill or ref_ids must be provided." });
    }

    try {
        const apiUrl = `https://track.delhivery.com/api/v1/packages/json/?${waybill ? `waybill=${waybill}` : `ref_ids=${ref_ids}`}`;
        console.log("API URL:", apiUrl);

        const apiResponse = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${process.env.delhivery_auth_token}`,
            },
        });

        if (!apiResponse.ok) {
            return res.status(apiResponse.status).json({
                message: `Delhivery API Error: ${apiResponse.statusText}`,
            });
        }

        const trackingData = await apiResponse.json();
        console.log("Raw API Response from Delhivery:", JSON.stringify(trackingData, null, 2));

        const trackingDetails = trackingData.ShipmentData.map(data => {
            const shipment = data.Shipment;
            return {
                waybill: shipment.AWB,
                status: shipment.Status.Status,
                remarks: shipment.Status.Instructions,
                last_update_time: shipment.Status.StatusDateTime,
                consignee: {
                    name: shipment.Consignee.Name,
                    city: shipment.Consignee.City,
                    state: shipment.Consignee.State,
                    pinCode: shipment.Consignee.PinCode,
                },
                reference_no: shipment.ReferenceNo,
                order_type: shipment.OrderType,
                origin: shipment.Origin,
                destination: shipment.Destination,
                pickup_date: shipment.PickUpDate,
                expected_delivery_date: shipment.ExpectedDeliveryDate,
                scans: shipment.Scans.map(scan => ({
                    scan_type: scan.ScanDetail.Scan,
                    scan_date: scan.ScanDetail.ScanDateTime,
                    scan_location: scan.ScanDetail.ScannedLocation,
                    instructions: scan.ScanDetail.Instructions
                }))
            };
        });

        console.log("Processed Tracking Details:", JSON.stringify(trackingDetails, null, 2));
        
        res.json({ success: true, trackingDetails });
    } catch (error) {
        console.error("Error tracking shipment:", error);
        res.status(500).json({
            message: "Failed to track shipment",
            error: error.message,
        });
    }
};

const cancelDelhivery = async(req,res) => {
    const { orderId } = req.body;
    try {
        if(!orderId) {
            throw new Error("Waybill is required to cancel the order");
        }
        const order = await Order.findOne({orderId});

        if(!order) {
            return res.status(404).json(new ApiResponse(404,null,'Order not found'));
        }
        const CANCELLED_STATUSES = ['Delivered', 'Dispatched', 'LOST', 'RTO', 'DTO', 'Picked Up', 'Collected'];
        if (CANCELLED_STATUSES.includes(order.shipmentStatus.status)) {
            return res.status(406).json(new ApiResponse(406, null, 'Order cannot be cancelled'));
        }

        if (order.shipmentStatus.status === 'Cancelled' || order.shipmentStatus.status === 'Not Picked') {
            return res.status(409).json(new ApiResponse(409, null, 'Order is already cancelled'));
        }
        const delhiveryApiUrl = 'https://track.delhivery.com/api/p/edit';
        
        const cancellationPayload = JSON.stringify({
            cancellation: "true",
            waybill: orderId,
        });
        if (!process.env.delhivery_auth_token) {
            return res.status(500).json(new ApiResponse(500, null, "Server misconfiguration: Missing Delhivery Auth Token"));
        }
        let response;
        try {
            response = await fetch(delhiveryApiUrl,{
                method: "POST",
                headers: {
                    Authorization: `Token ${process.env.delhivery_auth_token}`,
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: cancellationPayload,
            });
        } catch (networkError) {
            console.error("Network Error when contacting delhivery API", networkError.message);
            return res.status(502).json(new ApiResponse(502,null,"Unable to reach delhivery API"))
        }
        
        if(!response.ok) {
            const responseText = await response.text();
            console.error("Delhivery API error: ",response.status, responseText);
            return res.status(502).json(new ApiResponse(502, null, `Delhivery API error: ${response.status}`));
        }

        const responseData = await response.json();
        if(responseData.status === 'Failure' || responseData.status === false) {
            console.warn("Cancellation failed with response: ",responseData);
            return res.status(400).json(new ApiResponse(400,null,"Failed to cancel order"));
        }
        
        if(responseData.status === 'true' || responseData.status === true) {
            try {
                order.shipmentStatus.status = 'Not Picked';
                await order.save();
                await sendCancelOrderConfirmationEmail(
                    order.customer_details.email,
                    order.customer_details.shippingAddress.name,
                    order.orderId,
                    order.amount_paid/100
                );
            } catch (error) {
                console.error("Failed to update order status in the database: ", error.message);
                return res.status(500).json(new ApiResponse(500, null, 'Failed to update order status in the database'));
            }
            return res.status(200).json(new ApiResponse(200, null, 'Order Cancelled Successfully'));
        }
        console.log("Cancellation response: ",responseData);
    } catch (error) {
        console.error("Error cancelling Delhivery order:", error.message);
        return res.status(500).json(new ApiResponse(500,null,'Internal Server Error'));
    }
};

const refundUpdate = async(req,res) => {
    try {
        const {orderId, waybill, refundStatus} = req.body;

        console.log("Data received: ", {orderId, waybill, refundStatus});

        if(!orderId || !waybill || !refundStatus) {
            return res.status(400).json({error: "orderId, waybill and refund status are required."});
        }

        const order = await Order.findOne({orderId, waybill});

        if(!order) {
            return res.status(404).json(new ApiResponse(404,null,'Order not found'));
        }

        order.refund.status = refundStatus;
        await order.save();

        return res.status(200).json(new ApiResponse(200, null, 'Refund status updated successfully.'));

    } catch (error) {
        console.error("Error updating refund status: ", error);
        return res.status(500).json(new ApiResponse(500,null,'Internal Server Error'));
    }
};

const productionWebhook = async(req, res) => {
    const payload = req.body;
    console.log("The payload of the testing webhook: ", payload);
    const authHeader = req.headers.authorization;

    if(!authHeader) {
        console.error("Missing Authorization header");
        return res.status(401).json({message: "Unauthorized"});
    }

    const expectedToken = process.env.delhivery_auth_token;
    if(authHeader != expectedToken) {
        console.error("Invalid Authorization token");
        return res.status(403).json({message: "Forbidden"});
    }
    console.log("Received payload: ",payload);

    if(!payload || !payload.Shipment || !payload.Shipment.Status) {
        console.error("Invalid payload received.");
        return res.status(400).json({message: "Invalid payload"});
    }

    const {Shipment} = payload;
    const {Status} = Shipment;
    const waybill = Shipment.AWB; // Waybill from payload
    const referenceNo = Shipment.ReferenceNo; // ReferenceNo from payload
    const status = Status.Status; // Shipment status
    const statusDateTime = Status.StatusDateTime || new Date(); // Default to now if not provided
    const statusLocation = Status.StatusLocation || "Unknown"; // Default location
    const instructions = Status.Instructions || "No instructions provided";

    console.log("AWB: ", Shipment.AWB);
    console.log("Status: ", Status.Status);
    console.log("Status location: ", Status.StatusLocation);
    console.log("Status DateTime: ", Status.StatusDateTime);

    try {
        const existingOrder = await Order.findOne({
            $or: [{waybill},{refnum: referenceNo}]
        });

        if(!existingOrder) {
            console.error("Order not found in the database");
            return res.status(404).json({message: "Order not found"});
        }

        existingOrder.shipmentStatus = {
            status: status,
            timestamp: new Date(statusDateTime),
        };
        existingOrder.location =  statusLocation;
        await existingOrder.save();
        console.log("Order updated successfully: ", existingOrder);
        return res.status(200).json({message: "Order updated successfully"});
    } catch (error) {
        console.error("Error updating order: ", error);
        return res.status(500).json({message: "Internal server error"});
    }


    // return res.status(200).json({ message: "Success" });
};

export {
    createOrder,
    verifyPayment,
    shippingInfo,
    getPromotions,
    applyPromotions,
    getOrderDetails,
    trackShipment,
    productionWebhook,
    cancelDelhivery,
    refundUpdate,
};
