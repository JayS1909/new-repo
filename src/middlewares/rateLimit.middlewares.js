import rateLimit from "express-rate-limit";

// Rate limiter for create-order requests
export const createOrderRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    keyGenerator: (req) => {
        const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.ip;
        console.log('Rate limiting for IP:', ip); // Add this for debugging
        return ip;
    },
    message: {
        success: false,
        message: "Too many create-order requests from this IP, please try again after a few minutes."
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiter for OTP requests
export const otpRateLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 10,
    keyGenerator: (req) => {
        const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.ip;
        console.log('OTP Rate limiting for IP:', ip); // Debug log
        return ip;
    },
    message: {
        success: false,
        message: "Too many OTP requests from this IP, please try again after a few minutes."
    },
    standardHeaders: true,
    legacyHeaders: false,
});




