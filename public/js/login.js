function showLoader() {
    const loader = document.createElement('div');
    loader.id = 'loader';
    loader.style.position = 'fixed';
    loader.style.top = '50%';
    loader.style.left = '50%';
    loader.style.transform = 'translate(-50%, -50%)';
    loader.style.display = 'flex';
    loader.style.gap = '10px';
    loader.style.zIndex = '1000';

    // Create three dots
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('div');
        dot.style.width = '10px';
        dot.style.height = '10px';
        dot.style.borderRadius = '50%';
        dot.style.backgroundColor = '#3498db';
        dot.style.animation = `pulse 1.5s ease-in-out ${i * 0.2}s infinite`;
        loader.appendChild(dot);
    }

    // Add CSS animation dynamically
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0%, 100% { transform: scale(0.8); opacity: 0.5; }
            50% { transform: scale(1.5); opacity: 1; }
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(loader);
}


// Function to hide the loader
function hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.remove();
    }
}

const callback = (eventCallback) => {
    const ONETAP = () => {
        const { response } = eventCallback;
        
        // Get the token from OTPless response
        const token = response.token;
        if (!token) {
            console.error('No token received from OTPless');
            showError('Authentication failed. Please try again.');
            return;
        }

        // Prepare the form data
        const formData = new FormData(document.getElementById('login-form'));
        const formObj = {
            loginType: 'phone',  // Explicitly set login type
            phoneNumber: document.getElementById('phoneNumber').value,
            otplessToken: token  // Add the token
        };
        
        // Add other form fields
        for (let [key, value] of formData.entries()) {
            if (key !== 'phoneNumber') { // Avoid duplicate phone number
                formObj[key] = value;
            }
        }
        // Send to your backend
        fetch('/users/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formObj)
        })
        .then(response => response.json())
        .then(result => {
            handleVerificationResult(result);
        })
        .catch(error => {
            console.error('Error during backend verification:', error);
            showError('Verification failed. Please try again.');
        });
    };

    const OTP_AUTO_READ = () => {

    };

    const FAILED = () => {
        const { response } = eventCallback;
        console.error('OTPless authentication failed:', response);
        showError('Phone verification failed. Please try again.');
    };

    const FALLBACK_TRIGGERED = () => {
        const { response } = eventCallback;
        // Handle SMS fallback if needed
    };

    const EVENTS_MAP = {
        ONETAP,
        OTP_AUTO_READ,
        FAILED,
        FALLBACK_TRIGGERED
    };

    if ("responseType" in eventCallback) {
        EVENTS_MAP[eventCallback.responseType]();
    }
};

// Initialize OTPless
const OTPlessSignin = new OTPless(callback);

function selectMethod(method) {
    const emailButton = document.getElementById('email-button');
    const phoneButton = document.getElementById('phone-button');
    const emailError = document.getElementById('email-error');
    const phoneError = 
    emailButton.classList.remove('active');
    phoneButton.classList.remove('active');

    if (method === 'email') {
        emailButton.classList.add('active');
        document.getElementById('email-error').style.display = 'none';
        document.getElementById('phone-error').style.display = 'none';
        document.getElementById('email-input').style.display = 'flex';
        document.getElementById('mobile-input').style.display = 'none';
        document.getElementById('loginType').value = 'email';
    } else {
        phoneButton.classList.add('active');
        document.getElementById('email-error').style.display = 'none';
        document.getElementById('phone-error').style.display = 'none';
        document.getElementById('email-input').style.display = 'none';
        document.getElementById('mobile-input').style.display = 'flex';
        document.getElementById('loginType').value = 'phoneNumber';
    }
}
// Function to handle the Enter key press
function handleKeyPress(event) {
    const inputType = event.target.type; // Get the input type
    const charCode = event.charCode ? event.charCode : event.keyCode;

    // If it's a phone number input, restrict to numbers only
    if (inputType === 'tel' && (charCode < 48 || charCode > 57)) {
        event.preventDefault();
    }

    // Prevent form submission on Enter key and call requestOtp function
    if (event.key === 'Enter') {
        event.preventDefault();
        requestOtp();
    }
}

function submitOtp(event) {
    event.preventDefault();
    const loginType = document.getElementById('loginType').value;

    if(loginType === 'email') {
        document.getElementById('email').disabled = false;
        handleEmailOtpVerification();
    } else if(loginType === 'phoneNumber') {
        document.getElementById('phoneNumber').disabled = false;
        handlePhoneOtpVerification();
    }
}

async function handleEmailOtpVerification() {
    try {
        combineOtp();
        const formData = new FormData(document.getElementById('login-form'));
        const formObj = {};
        
        for (let [key, value] of formData.entries()) {
            formObj[key] = value;
        }
        showLoader();
        const response = await fetch('/users/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formObj)
        });
        
        const result = await response.json();
        handleVerificationResult(result);
    } catch (error) {
        console.error('Email verification error:', error);
        showError('Email verification failed. Please try again.');
    } finally {
        hideLoader();
    }
}

async function handlePhoneOtpVerification() {
    showLoader();
    const phoneNumber = document.getElementById('phoneNumber').value.trim();
    const countryCode = document.getElementById('countryCode')?.value.trim() || '+91';
    const otp = combineOtp(); // Generate the OTP.
    if (!phoneNumber || !otp) {
        console.error('Missing phone or OTP:', { phoneNumber, otp });
        showError('Phone number and OTP are required.');
        return;
    }

    // Ensure OTP is a 6-digit number.
    if (otp.length !== 6 || isNaN(otp)) {
        console.error('Invalid OTP format:', otp);
        showError('OTP must be a 6-digit number.');
        hideLoader();
        return;
    }

    const requestData = {
        channel: 'PHONE',
        phone: phoneNumber,
        otp: otp,
        countryCode: countryCode,
    };

    try {
        const response = await OTPlessSignin.verify(requestData);

        if (response.success) {
            // Proceed to the next step.
        } else {
            console.error('Verification failed:', response.response || 'No response');
            showError('Invalid OTP');
        }
    } catch (error) {
        console.error('Error during verification:', error);
        showError('An error occurred while verifying. Please try again.');
    } finally {
        hideLoader();
    }
}

function handleVerificationResult(result) {
    if (result.statusCode === 400) {
        showError('Invalid OTP entered.');
    } else if (result.statusCode === 200) {
        if (result.data?.newUser) {
            const { email = '', phoneNumber = '' } = result.data;
            window.location.href = `/register?email=${encodeURIComponent(email)}&phoneNumber=${encodeURIComponent(phoneNumber)}`;
        } else {
            window.location.href = '/';
        }
    } else if(result.message === "Too many OTP requests from this IP, please try again after a few minutes.") {
        showError('Verification limit exceeded');
        // document.getElementById('error-message').style.display = 'block';
        // document.getElementById('error-message').innerText = 'verification limit exceeded';
    } else {
        showError('An unexpected error occurred');
    }
}

function showError(message) {
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
        errorElement.style.display = 'block';
        errorElement.innerText = message;
        // Optional: Hide error after 5 seconds
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 5000);
    }
}

function combineOtp() {
    // Get the values of the individual OTP fields
    const otp1 = document.getElementById('otp1').value;
    const otp2 = document.getElementById('otp2').value;
    const otp3 = document.getElementById('otp3').value;
    const otp4 = document.getElementById('otp4').value;
    const otp5 = document.getElementById('otp5').value;
    const otp6 = document.getElementById('otp6').value;

    // Combine the values into one OTP string
    const fullOtp = otp1 + otp2 + otp3 + otp4 + otp5 + otp6;

    // Set the combined OTP into the hidden input field
    document.getElementById('otp').value = fullOtp;
    return fullOtp;
    
}

function moveToNext(current, nextFieldId) {
    if (current.value.length === current.maxLength) {
        document.getElementById(nextFieldId).focus();
    }
}


// Function to handle OTP request
function requestOtp(isResend = false) {
    const loginType = document.getElementById('loginType').value;
    let valueofidentifier;

    // Handle email and phone differently
    if (loginType === 'email') {
        const email = document.getElementById('email').value;
        valueofidentifier = email;
        
        if (!isResend) {
            if (!email) {
                alert('Please enter your email.');
                return;
            }
            if (!validateEmail(email)) {
                document.getElementById('email-error').style.display = 'block';
                document.getElementById('email-error').innerText = 'Please enter a valid email address.';
                return;
            }
            document.getElementById('email-error').style.display = 'none';
            document.getElementById('email').disabled = true;
        }

        // Handle loader placement
        let requestBtn = isResend ? document.getElementById('resend-otp-button') : document.getElementById('requestbtn');
        requestBtn.style.display = 'none';

        // Insert the loader
        const loader = document.createElement('div');
        loader.className = 'loader';
        loader.innerHTML = '<div></div><div></div><div></div><div></div>';
        loader.style.display = 'flex';  // Force visibility
        loader.style.justifyContent = 'center';
        loader.style.marginTop = '20px';

        loader.style.cssText = `
        display: flex;
        justify-content: center;
        align-items: center;
        margin: 20px auto;
        background: transparent;
    `;

        if (isResend) {
            const otpInput = document.getElementById('otp-input');
            otpInput.parentNode.insertBefore(loader, otpInput.nextSibling);
        } else {
            requestBtn.parentNode.insertBefore(loader, requestBtn);
        }
        // Make API request for email OTP
        fetch('/users/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, loginType })
        })
        .then(response => response.json())
        .then(result => {
            if (result.statusCode === 200) {
                if (!isResend) {
                    updateUIAfterOTPRequest(loginType, valueofidentifier);
                }
                loader.remove();
                startResendOtpTimer();
            } else {
                alert('Error: ' + result.message);
                loader.remove();
                requestBtn.style.display = 'inline';
                requestBtn.disabled = false;
            }
        })

        .catch(error => {
            console.error('Error:', error);
            loader.remove();
            requestBtn.style.display = 'inline';
            requestBtn.disabled = false;
        });

    } else {
        // Handle phone number OTP using OTPless
        const phoneNumber = document.getElementById('phoneNumber').value;
        valueofidentifier = phoneNumber;

        if (!phoneNumber) {
            alert('Please enter your phone number.');
            return;
        }
        if (!validatePhoneNumber(phoneNumber)) {
            document.getElementById('phone-error').style.display = 'block';
            document.getElementById('phone-error').innerText = 'Please enter a valid phone number.';
            return;
        }
        console.log("Phone number otp: ",phoneNumber);
        try {
            OTPlessSignin.initiate({
                channel: "PHONE",
                phone: phoneNumber,
                countryCode: '+91',
                method: "SMS",
                forceOTP: true
            });
            document.getElementById('phone-error').style.display = 'none';
            document.getElementById('phoneNumber').disabled = true;
            document.getElementById('requestbtn').style.display = 'none';
            
            if (!isResend) {
                updateUIAfterOTPRequest(loginType, valueofidentifier);
            }
            startResendOtpTimer();
        } catch(error) {
            document.getElementById('phone-error').innerText = 'Something went wrong';
            return;
        }
    }
}

// Helper function to update UI after OTP request
function updateUIAfterOTPRequest(loginType, identifier) {
    document.getElementById('verification-message').textContent = `Verification code has been sent to your ${loginType}`;
    document.getElementById('display-contact').textContent = identifier;
    document.getElementById('method-selection').style.display = 'none';
    document.getElementById('email-input').style.display = 'none';
    document.getElementById('mobile-input').style.display = 'none';
    document.getElementById('head').style.display = 'none';
    document.getElementById('otp-input').style.display = 'block';
    document.getElementById('submit-button').style.display = 'inline';
    document.getElementById('requestbtn').style.display = 'none';
}


function startResendOtpTimer() {
    const resendBtn = document.getElementById('resend-otp-button');
    const resendTimer = document.getElementById('resend-timer');
    const timerDisplay = document.getElementById('timer');
    let timeLeft = 60; // 1 minute (60 seconds)

    resendBtn.style.display = 'none'; // Hide the button initially
    resendTimer.style.display = 'block'; // Show the timer

    const countdown = setInterval(() => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;

        // Format minutes and seconds to always be two digits
        timerDisplay.textContent = 
            String(minutes).padStart(2, '0') + ':' + 
            String(seconds).padStart(2, '0');

        timeLeft--;

        if (timeLeft < 0) {
            clearInterval(countdown); // Stop the countdown
            resendTimer.style.display = 'none'; // Hide the timer
            resendBtn.style.display = 'inline'; // Show the resend button
        }
    }, 1000);
}

function resendOtp() {
    // Call requestOtp with isResend flag
    requestOtp(true);
    // Hide the error message
    document.getElementById('error-message').style.display = 'none';
    document.getElementById('resend-otp-button').style.display = 'none';
}

function validateEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
}

// Function to validate phone number
function validatePhoneNumber(phoneNumber) {
    const phoneRegex = /^\d{10}$/; // Assuming 10-digit phone number
    return phoneRegex.test(phoneNumber);
}

function moveToPrev(currentInput, prevInputId) {
    // Check if the backspace key is pressed and the input is empty
    if (currentInput.value.length === 0 && event.key === "Backspace") {
        document.getElementById(prevInputId).focus();
    }
}


function allowNumbersOnly(event) {
    const charCode = event.charCode ? event.charCode : event.keyCode;
    // If the character is not a number (0-9), prevent input
    if (charCode < 48 || charCode > 57) {
        event.preventDefault();
    }
}