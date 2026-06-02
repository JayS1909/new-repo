import crypto from "crypto";
import nodemailer from "nodemailer";
import twilio from 'twilio';
import { User } from "../models/users.models.js";
import { ApiError } from "./ApiError.js";
import { OTP } from "../models/otp.models.js";

const OTP_EXPIRATION_TIME = 5 * 60 * 1000;
// const RATE_LIMIT_TIME_WINDOW = 15 * 60 * 1000; // 15 minutes
// const MAX_OTP_REQUESTS = 5; // Max 5 OTP requests per time window

const generateOTP = () => {
    return crypto.randomInt(100000, 999999).toString();
};

// const checkRateLimit = (identifier) => {
//     const currentTime = Date.now();
//     if(!rateLimitMap.has(identifier)) {
//         rateLimitMap.set(identifier, {requests: 1, startTime: currentTime});
//         return true;
//     }
//     const {requests, startTime} = rateLimitMap.get(identifier);
//     if(currentTime - startTime > RATE_LIMIT_TIME_WINDOW) {
//         rateLimitMap.set(identifier, {requests: 1, startTime: currentTime});
//         return true;
//     }
//     if(requests >= MAX_OTP_REQUESTS) {
//         return false;
//     }
//     rateLimitMap.set(identifier, { requests: requests + 1, startTime });
//     return true;
// }

const sendOtp = async(identifier,type='email') => {
    // if (!checkRateLimit(identifier)) {
    //     throw new ApiError(429, "Too many OTP requests. Please try again later.");
    // }
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRATION_TIME);

    await OTP.findOneAndUpdate(
        {identifier},
        {otp, otpCreatedAT: new Date(), expiresAt},
        {upsert: true}
    );

    if(type == 'email') {
        let transporter = nodemailer.createTransport({
            host: 'smtpout.secureserver.net',
            port: 465,
            secure: true,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
        let mailOptions = {
            from: '"EXTRAALAYER" <support@extraalayer.com>',
            to: identifier,
            subject: '🔒 Login with EXTRAALAYER OTP',
            html: `
                <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; background-color: #f7f7f7; border-radius: 10px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h1 style="font-size: 28px; font-weight: bold; color: #1c1c1c; margin: 0;">EXTRAALAYER</h1>
                    </div>
                    <h2 style="color: #1c1c1c; font-size: 24px; text-align: center;">Your OTP Code</h2>
                    <p style="font-size: 16px; color: #555;">Hello,</p>
                    <p style="font-size: 16px; color: #555;">Thank you for choosing EXTRAALAYER. To securely log in to your account, please use the OTP code below:</p>
                    <div style="text-align: center; margin: 20px 0;">
                        <span style="font-size: 32px; font-weight: bold; color: #e74c3c; padding: 10px 20px; border: 2px solid #e74c3c; border-radius: 5px; display: inline-block;">
                            ${otp}
                        </span>
                    </div>
                    <p style="font-size: 16px; color: #555;">Please note, this code will expire in 5 minutes.</p>
                    <p style="font-size: 16px; color: #555;">If you didn’t request this OTP, please contact our support team immediately.</p>
                    <div style="margin-top: 30px; text-align: center;">
                        <p style="font-size: 16px; color: #555;">Best regards,</p>
                        <p style="font-size: 16px; font-weight: bold; color: #1c1c1c;">The EXTRAALAYER Team</p>
                        <p style="font-size: 14px; color: #888;">Wear The Trend, Own The Moment</p>
                    </div>
                </div>
            `,
        };
        
        
        await transporter.sendMail(mailOptions);
    } else if(type === 'phone') {
        // await client.messages.create({
        //     body: `Yur OTP code is: ${otp}. It will expire in 5 minutes`,
        //     from: TWILIO_PHONE_NUMBER,
        //     to: identifier
        // });
        console.log(otp);
    }
};

const verifyOtp = async(identifier, otp, type = 'email') => {
    // if (!checkRateLimit(identifier)) {
    //     throw new ApiError(429, "Too many OTP verification attempts. Please try again later.");
    // }
    const otpRecord = await OTP.findOne({identifier});

    if(!otpRecord || otpRecord.otp !== otp) {
        // throw new ApiError(400, "Invalid OTP");
        return false;
    }

    const isOtpExpired = new Date()  > otpRecord.expiresAt;

    if(isOtpExpired) {
        await OTP.deleteOne({ identifier });
        throw new ApiError(400, "OTP expired");
    }

    await OTP.deleteOne({identifier});

    return true;
};

export { sendOtp, verifyOtp };