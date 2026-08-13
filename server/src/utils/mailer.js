// server/src/utils/mailer.js
const nodemailer = require('nodemailer');
const { SESClient, SendRawEmailCommand } = require('@aws-sdk/client-ses'); // ✨ FIX: Modern SDK v3

// ✨ FIX: Create the v3 SES Client
const sesClient = new SESClient({ region: process.env.AWS_REGION || 'ap-south-1' });

const sendMail = async (to, subject, html) => {
    const mailOptions = {
        from: process.env.FROM_EMAIL || 'admin@vitalmeds.com', // Must be verified in AWS SES
        to,
        subject,
        html
    };

    try {
        if (process.env.USE_AWS_SES === 'true') {
            // ✨ FIX: Production AWS SES Transport mapped for Nodemailer v9+
            const transporter = nodemailer.createTransport({ 
                SES: { 
                    ses: sesClient, 
                    aws: { SendRawEmailCommand } 
                } 
            });
            
            await transporter.sendMail(mailOptions);
            console.log(`[AWS SES] Email successfully sent to ${to}`);
        } else {
            // 🚀 DEV OVERRIDE
            throw new Error("AWS SES not configured. Triggering Dev Fallback.");
        }
    } catch (error) {
        console.warn(`[DEV MAILER] Email delivery bypassed. Check console for OTP!`);
        throw error; // Let the controller handle the fallback print
    }
};

module.exports = { sendMail };