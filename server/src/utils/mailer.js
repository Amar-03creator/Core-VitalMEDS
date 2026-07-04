// server/src/utils/mailer.js
const nodemailer = require('nodemailer');
const aws = require('aws-sdk'); // Install this: npm install aws-sdk nodemailer

// AWS SES Configuration (Will use IAM roles/ENV vars when deployed)
const ses = new aws.SES({ apiVersion: '2010-12-01', region: process.env.AWS_REGION || 'ap-south-1' });

const sendMail = async (to, subject, html) => {
    const mailOptions = {
        from: process.env.FROM_EMAIL || 'admin@vitalmeds.com', // Must be verified in AWS SES
        to,
        subject,
        html
    };

    try {
        if (process.env.USE_AWS_SES === 'true') {
            // Production AWS SES Transport
            const transporter = nodemailer.createTransport({ SES: ses });
            await transporter.sendMail(mailOptions);
            console.log(`[AWS SES] Email successfully sent to ${to}`);
        } else {
            // 🚀 DEV OVERRIDE: If AWS isn't set up yet, throw a fake error to trigger the console fallback
            throw new Error("AWS SES not configured. Triggering Dev Fallback.");
        }
    } catch (error) {
        console.warn(`[DEV MAILER] Email delivery bypassed. Check console for OTP!`);
        throw error; // Let the controller handle the fallback print
    }
};

module.exports = { sendMail };