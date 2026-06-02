import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
    identifier: {
        type: String,
        required:true,
        unique: true,
    },
    otp: {
        type: String,
        required: true,
    },
    otpCreatedAt: {
        type: Date,
        required: true,
        default: Date.now,
    },
    expiresAt: {
        type: Date,
        required: true,
    }
});

otpSchema.index({expiresAt: 1}, {expireAfterSeconds: 0});

const OTP = mongoose.model('OTP', otpSchema);
export{OTP};