import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: 'smtpout.secureserver.net',
    port: 465,
    secure: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    }
});

export const sendRegistrationEmail = async (email, fullName) => {
    try {
        const mailOptions = {
            from: '"EXTRAALAYER" <no-reply@extraalayer.com>',
            to: email,
            subject: `Welcome to EXTRAALAYER, ${fullName}! 🖤`,
            html: `
                <div style="font-family: Arial, sans-serif; background-color: #000; color: #fff; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; border-radius: 10px; box-shadow: 0px 4px 10px rgba(255, 255, 255, 0.1);">
                    <h2 style="text-align: center; color: #fff; border-bottom: 1px solid #555; padding-bottom: 10px;">Welcome to EXTRAALAYER, ${fullName}! 🖤</h2>
                    <p style="text-align: center; font-size: 16px; color: #bbb;">
                        Thank you for joining the EXTRAALAYER family! We’re excited to help you <strong style="color: #fff;">"Wear the Trend, Own the Moment."</strong>
                    </p>
                    <hr style="border: none; border-top: 1px solid #555; margin: 20px 0;">
                    <p style="font-size: 16px; color: #bbb;">
                        Discover the latest fashion trends, exclusive collections, and unique styles that define you. Here's what to expect:
                    </p>
                    <ul style="font-size: 16px; color: #bbb; margin-left: 20px; list-style-type: square;">
                        <li><strong style="color: #fff;">Timeless Styles:</strong> Tailored for you.</li>
                        <li><strong style="color: #fff;">Exclusive Offers:</strong> Just for our community.</li>
                        <li><strong style="color: #fff;">Your Style, Your Moment:</strong> Always make a statement.</li>
                    </ul>
                    <div style="text-align: center; margin: 20px 0;">
                        <a href="https://www.extraalayer.com" target="_blank" style="background: #fff; color: #000; text-decoration: none; padding: 12px 25px; border-radius: 5px; font-size: 16px; display: inline-block; border: 1px solid #fff; transition: 0.3s;">
                            Start Shopping Now
                        </a>
                    </div>
                    <p style="font-size: 16px; color: #bbb;">
                        If you have any questions, feel free to reach out. We're here to assist you!
                    </p>
                    <p style="text-align: center; font-size: 14px; color: #555; margin-top: 30px; border-top: 1px solid #555; padding-top: 15px;">
                        <strong>"Wear the Trend, Own the Moment."</strong><br>
                        The EXTRAALAYER Team
                    </p>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);
        console.log('Registration email sent successfully');
    } catch (error) {
        console.error('Error sending registration email:', error);
        throw new Error('Failed to send registration email');
    }
};



export const sendOrderConfirmationEmail = async (email, fullName, orderId, amount) => {
    try {
        const mailOptions = {
            from: '"EXTRAALAYER" <no-reply@extraalayer.com>',
            to: email,
            subject: `🖤 Order Confirmation - #${orderId} 🖤`,
            html: `
                <div style="font-family: Arial, sans-serif; background-color: #000; color: #fff; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; border-radius: 10px; box-shadow: 0px 4px 10px rgba(255, 255, 255, 0.1);">
                    <h2 style="text-align: center; color: #fff; border-bottom: 1px solid #555; padding-bottom: 10px;">Thank You for Your Order, ${fullName}! 🖤</h2>
                    <p style="font-size: 16px; color: #bbb; text-align: center;">
                        Your order <strong style="color: #fff;">#${orderId}</strong> has been confirmed! We’re thrilled to be a part of your style journey.
                    </p>
                    <hr style="border: none; border-top: 1px solid #555; margin: 20px 0;">
                    <h3 style="color: #fff;">Order Summary:</h3>
                    <ul style="list-style-type: none; padding: 0; font-size: 16px; color: #bbb;">
                        <li style="margin-bottom: 10px;"><strong style="color: #fff;">Order ID:</strong> ${orderId}</li>
                        <li style="margin-bottom: 10px;"><strong style="color: #fff;">Total Amount:</strong> ₹${amount}</li>
                    </ul>
                    <p style="font-size: 16px; color: #bbb;">
                        Your order is being processed and will be shipped to you soon. Stay tuned for updates!
                    </p>
                    <div style="text-align: center; margin: 20px 0;">
                        <a href="https://www.extraalayer.com/tracking" target="_blank" style="background: #fff; color: #000; text-decoration: none; padding: 12px 25px; border-radius: 5px; font-size: 16px; display: inline-block; border: 1px solid #fff; transition: 0.3s;">
                            Track Your Order
                        </a>
                    </div>
                    <p style="font-size: 16px; color: #bbb;">
                        If you have any questions or concerns, don’t hesitate to <a href="mailto:support@extraalayer.com" style="color: #fff;">contact us</a>.
                    </p>
                    <p style="text-align: center; font-size: 14px; color: #555; margin-top: 30px; border-top: 1px solid #555; padding-top: 15px;">
                        <strong>"Wear the Trend, Own the Moment."</strong><br>
                        The EXTRAALAYER Team
                    </p>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);
        console.log('Order confirmation email sent successfully');
    } catch (error) {
        console.error('Error sending order confirmation email:', error);
        throw new Error('Failed to send order confirmation email');
    }
};


export const sendCancelOrderConfirmationEmail = async (email, fullName, orderId, refundAmount) => {
    try {
        const mailOptions = {
            from: '"EXTRAALAYER" <no-reply@extraalayer.com>',
            to: email,
            subject: `Order #${orderId} Canceled - Refund Processed`,
            html: `
                <div style="font-family: Arial, sans-serif; color: #000; background-color: #fff; padding: 20px; border-radius: 10px; border: 1px solid #ccc;">
                    <h1 style="text-align: center; font-size: 24px; font-weight: bold; color: #444;">Order Cancellation Confirmation</h1>
                    <p style="font-size: 16px; color: #555;">Dear <strong>${fullName}</strong>,</p>
                    <p style="font-size: 16px; color: #555;">
                        We regret to inform you that your order <strong>#${orderId}</strong> has been canceled as per your request. A refund of 
                        <strong>₹${refundAmount}</strong> has been initiated and will be processed to your original payment method within 
                        <strong>5–7 business days</strong>.
                    </p>
                    <div style="margin: 20px 0; text-align: center;">
                        <p style="font-size: 16px; color: #555;">We understand your decision and sincerely hope to serve you better in the future.</p>
                    </div>
                    <p style="font-size: 16px; color: #555;">
                        If you have any questions or require further assistance, feel free to contact our support team at 
                        <a href="mailto:support@extraalayer.com" style="color: #000; text-decoration: underline;">support@extraalayer.com</a>.
                    </p>
                    <div style="margin-top: 30px; text-align: center;">
                        <p style="font-size: 16px; color: #000; font-weight: bold;">Thank you for choosing EXTRAALAYER.</p>
                        <p style="font-size: 14px; color: #555;">We hope to see you again soon.</p>
                    </div>
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #ccc;">
                    <div style="text-align: center;">
                        <p style="font-size: 14px; color: #888;">Wear the trend, own the moment — Team EXTRAALAYER</p>
                    </div>
                </div>
            `
        };
        await transporter.sendMail(mailOptions);
        console.log('Cancel order confirmation email sent successfully');
    } catch (error) {
        console.error('Error sending cancel order confirmation email: ', error);
        throw new Error('Failed to send cancel order confirmation email');
    }
};
