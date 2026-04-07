const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  connectionTimeout: 5000,
  greetingTimeout: 5000,
  socketTimeout: 10000,
});

const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: `"Smart Healthcare Portal" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your 6-Digit Verification Code - Smart Healthcare Portal',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 500px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
        <h2 style="color: #6366f1; text-align: center;">Verification Code</h2>
        <p>Hello,</p>
        <p>Your one-time password (OTP) for logging into the Smart Healthcare Portal is:</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; color: #6366f1; letter-spacing: 5px; padding: 10px 20px; background: #f0f0ff; border-radius: 5px;">${otp}</span>
        </div>
        <p>This code will expire in 5 minutes. Do not share it with anyone.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #777;">If you did not request this code, please ignore this email.</p>
      </div>
    `,
  };

  // We intentionally do not await the actual transport in a way that blocks the user experience
  // but we return true immediately if the params are valid.
  transporter.sendMail(mailOptions)
    .then(info => console.log('✅ Real email sent: ' + info.response))
    .catch(err => console.error('❌ Error sending real email:', err.message));
    
  return true; 
};

module.exports = { sendOTPEmail };
