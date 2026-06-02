import { asyncHandler } from "../utils/asyncHandler.js"; 
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/users.models.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import { sendOtp,verifyOtp } from "../utils/otpService.js";
import { sendRegistrationEmail } from "../utils/emailService.js";
import validator from "validator";


// import { verify } from "jsonwebtoken";

const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating refresh and access token");
    }
}

// const registerUser = asyncHandler(async (req, res) => {
//     const { fullName, email, phoneNumber } = req.body;

//     if (!fullName || !email || !phoneNumber) {
//         return res.status(400).json(new ApiResponse(400, {}, "All fields are required"));
//     }
//     try {
//         const newUser = await User.create({ fullName, email, phoneNumber });

//         const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(newUser._id);
//         const loggedInUser = await User.findById(newUser._id).select("-otp -role -refreshToken");

//         try {
//             await sendRegistrationEmail(email, fullName);
//         } catch (emailError) {
//             console.error(`Failed to send email: `,emailError);
//         }
//         res.cookie("accessToken", accessToken, { httpOnly: true, secure: true });
//         res.cookie("refreshToken", refreshToken, { httpOnly: true, secure: true });

//         return res.status(201).json(
//             new ApiResponse(201, { user: loggedInUser, accessToken }, "User registered successfully")
//         );
//     } catch (error) {
//         if (error.code === 11000) {
//             // Extract the duplicate field from the error
//             const duplicateField = Object.keys(error.keyValue)[0];
//             return res.status(409).json(
//                 new ApiResponse(409, {}, `The ${duplicateField} already exists. Please use a different one.`)
//             );
//         }

//         return res.status(500).json(new ApiResponse(500, {}, "Something went wrong. Please try again."));
//     }
// });

const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, phoneNumber } = req.body;

    if(!validator.isEmail(email)) {
        return res.status(400).json(new ApiResponse(400,{},"Invalid Email format"));
    }

    if(!validator.isMobilePhone(phoneNumber,"any")) {
        return res.status(400).json(new ApiResponse(400,{},"Invalid phone number format"));
    }

    if(!validator.isLength(fullName,{min:2,max:50})) {
        return res.status(400).json(new ApiResponse(400,{},"Full name must be between 2 and 50 characters"));
    }

    const sanitizedFullName = validator.escape(fullName);
    const sanitizedEmail = validator.normalizeEmail(email);
    const sanitizedPhoneNumber = validator.escape(phoneNumber);

    try {
        const newUser = await User.create({
             fullName:sanitizedFullName,
             email: sanitizedEmail,
             phoneNumber: sanitizedPhoneNumber,
        });

        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(newUser._id);
        const loggedInUser = await User.findById(newUser._id).select("-otp -role -refreshToken");

        try {
            await sendRegistrationEmail(email, fullName);
        } catch (emailError) {
            console.error(`Failed to send email: `,emailError);
        }
        res.cookie("accessToken", accessToken, { httpOnly: true, secure: true });
        res.cookie("refreshToken", refreshToken, { httpOnly: true, secure: true });

        return res.status(201).json(
            new ApiResponse(201, { user: loggedInUser, accessToken }, "User registered successfully")
        );
    } catch (error) {
        if (error.code === 11000) {
            // Extract the duplicate field from the error
            const duplicateField = Object.keys(error.keyValue)[0];
            return res.status(409).json(
                new ApiResponse(409, {}, `The ${duplicateField} already exists. Please use a different one.`)
            );
        }

        return res.status(500).json(new ApiResponse(500, {}, "Something went wrong. Please try again."));
    }
});

// const loginUser = asyncHandler(async (req,res) => {
    
//     // First step
//     console.log("The req.body",req.body);
//     const {loginType, email, phoneNumber, otp} = req.body;
//     console.log("login typ", req.body.loginType);
//     console.log("email", req.body.email);
//     console.log("otp", req.body.otp);

//     if (!loginType || (!email && !phoneNumber)) {
//         throw new ApiError(400, "Login type, OTP, and either email or phone number are required");
//     }

//   // Second Step: sending the otp and verifying it
//    try {
//      if (loginType === 'email' && email && !otp) {
//         await sendOtp(email, 'email');
//         //  Here we need to open the otp page
//         return res.status(200).json(new ApiResponse(200,null,"OTP sent successfully"));
//      } else if (loginType === 'phoneNumber' && phoneNumber && !otp) {
//         await sendOtp(phoneNumber, 'phone');
//         return res.status(200).json(new ApiResponse(200,null,"OTP sent successfully"));
//      }
//      console.log("Running the submit function");
//      if(!otp) {
//          throw new ApiError(400,"OTP is required");
//      }
//      // verifying otp 
 
//      const identifier = loginType ==='email'?email:phoneNumber;
//      console.log("Verifying otp");
//      const isOtpValid = await verifyOtp(identifier, otp);
//      console.log("OTP valid or not: ",isOtpValid);
//     //  if (!isOtpValid) {
//     //     console.log("Running Invalid otp code")
//     //     return res.status(400).render('login', { error: "Invalid OTP or OTP expired", loginType, email, phoneNumber });
//     // }

//     if (!isOtpValid) {
//         console.log("Running Invalid otp code check");
//         return res.json(new ApiResponse(400,{},'Invalid OTP'));
//     }
//     console.log("Running valid otp program");

//      let user = await User.findOne({ 
//          $or: [{email}, {phoneNumber}]
//      });
//      console.log("Running user check");
//      if(!user) {
//          console.log("Checking for new user")
//         //  return res.render('register', { email: email || '', phoneNumber: phoneNumber || '' });
//         return res.json(new ApiResponse(200, { newUser: true, email: email || '', phoneNumber: phoneNumber || '' }, "New user detected, proceed to registration"));
//          // return res.status(200).json(new ApiResponse(200,null,"Additional details required")); 
//      } 
//      console.log("Generating access and refresh token");
//      const {accessToken, refreshToken} =  await generateAccessAndRefreshTokens(user._id);
//      console.log("Selecting the details of the logged in user");
//      const loggedInUser = await User.findById(user._id).select("-otp -role -refreshToken");
//      console.log("Setting the cookies");
//      const options = {
//          httpOnly: true,
//          secure: true,
//          sameSite: 'strict'
//      }
 
//      res.cookie("accessToken",accessToken, options);
//      res.cookie("refreshToken", refreshToken, options)
//      console.log("Redirecting to home page");
//      return res.json(new ApiResponse(200, {}, 'OTP verified successfully'));
//    } catch (error) {
//         // console.log("User controller error message",error);
//         console.log(error);
//         return res.status(500).render('login', { error: "An error occurred during login", loginType, email, phoneNumber }); 
//         // return res.status(400).json(new ApiError(400,"Catch Error"));
        
//    }
//     // return res
//     // .status(200)
//     // .cookie(" ", accessToken,options)
//     // .cookie("refreshToken",refreshToken, options)
//     // .json(
//     //     new ApiResponse(
//     //         200,
//     //         {
//     //             user: loggedInUser, accessToken, refreshToken 
//     //         },
//     //         "User logged in Successfully"
//     //     )
//     // )
// });
const OTPLESS_CONFIG = {
    CLIENT_ID: 'Q4I4TYD955R9H2P4FU57XBJ3SCS8S3ZI',
    CLIENT_SECRET: 'fu91n778uu1tttmq8xoaghzahfvmdb5h',
    VALIDATE_TOKEN_URL: 'https://auth.otpless.com/v1/validate/token'
};

// loginController.js
const loginUser = asyncHandler(async (req, res) => {
    console.log("Request body:", req.body);
    const { loginType, email, phoneNumber, otp, otplessToken } = req.body;
    console.log("119 running");
    if (!loginType || (!email && !phoneNumber)) {
        throw new ApiError(400, "Login type and either email or phone number are required");
    }
    console.log("123 running");
    try {
        // Handle initial OTP sending for email
        if (loginType === 'email' && email && !otp) {
            await sendOtp(email, 'email');
            return res.status(200).json(
                new ApiResponse(200, null, "OTP sent successfully")
            );
        }
    console.log("132 running");
        // Handle OTP verification
        let isVerified = false;
        let verifiedPhoneNumber;

        if (loginType === 'email') {
            if (!otp) {
                throw new ApiError(400, "OTP is required for email verification");
            }
            isVerified = await verifyOtp(email, otp);
        } else if (loginType === 'phoneNumber') {
            if (!otplessToken) {
                throw new ApiError(400, "OTPless token is required for phone verification");
            }
            // Verify token and get user details
            console.log("Line no.146 running");
            const otplessResponse = await verifyOtplessToken(otplessToken);
            console.log("The otp less response: ",otplessResponse);
            isVerified = otplessResponse.verified;
            console.log("The is verified: ", isVerified);
            verifiedPhoneNumber = otplessResponse.phoneNumber;
            console.log("The verified phone number: ",verifiedPhoneNumber);
        }

        if (!isVerified) {
            return res.status(400).json(
                new ApiResponse(400, {}, 'Verification failed')
            );
        }

        // If phone verification was successful, use the verified phone number
        const searchPhoneNumber = loginType === 'phone' ? verifiedPhoneNumber : phoneNumber;

        // Find or create user
        let user = await User.findOne({
            $or: [{ email }, { phoneNumber: searchPhoneNumber }]
        });

        if (!user) {
            return res.status(200).json(
                new ApiResponse(200, {
                    newUser: true,
                    email: email || '',
                    phoneNumber: searchPhoneNumber || ''
                }, "New user detected, proceed to registration")
            );
        }

        // Generate tokens
        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
        
        // Get user details
        const loggedInUser = await User.findById(user._id).select("-otp -role -refreshToken");

        // Set cookies
        const options = {
            httpOnly: true,
            secure: true,
            sameSite: 'strict'
        };

        res.cookie("accessToken", accessToken, options);
        res.cookie("refreshToken", refreshToken, options);

        return res.status(200).json(
            new ApiResponse(200, {
                user: loggedInUser,
                accessToken,
                refreshToken
            }, "User logged in successfully")
        );

    } catch (error) {
        console.error("Login error:", error);
        throw new ApiError(500, "An error occurred during login");
    }
});

const verifyOtplessToken = async (token) => {
    try {
        const response = await fetch('https://user-auth.otpless.app/auth/v1/validate/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                clientId: OTPLESS_CONFIG.CLIENT_ID,
                clientSecret: OTPLESS_CONFIG.CLIENT_SECRET,
            },
            body: JSON.stringify({ token }),
        });

        if (!response.ok) {
            // Handle HTTP status errors explicitly
            if (response.status === 401) {
                console.error('Authorization error: Invalid credentials');
                return { verified: false, error: 'Invalid credentials' };
            }
            if (response.status === 400) {
                console.error('Bad Request: Token validation failed');
                return { verified: false, error: 'Invalid token' };
            }
            console.error('Unexpected error occurred:', response.statusText);
            return { verified: false, error: 'Unexpected error' };
        }

        const data = await response.json();
        console.log('OTPless Verification Response:', data);

        if (data.status !== 'SUCCESS') {
            console.error('OTPless token validation failed:', data);
            return { verified: false, error: 'Token validation failed' };
        }

        // Extract phone number from identities array
        const phoneIdentity = data.identities.find(
            (identity) => identity.identityType === 'MOBILE' || identity.identityType === 'WHATSAPP'
        );

        if (!phoneIdentity) {
            console.error('No phone number found in OTPless response');
            return { verified: false, error: 'Phone number not found' };
        }

        return {
            verified: true,
            phoneNumber: phoneIdentity.identityValue,
        };
    } catch (error) {
        console.error('OTPless token verification error:', error);
        return { verified: false, error: 'Fetch request failed' };
    }
};


const logoutUser = asyncHandler(async(req,res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
     )

     const options = {
        httpOnly: true,
        secure: true
     }

     return res
     .status(200)
     .clearCookie("accessToken",options)
     .clearCookie("refreshToken", options)
     .json(new ApiResponse(200,{},"User logged out"))
});


export {registerUser, loginUser,logoutUser}