const { sendOTPEmail } = require('./services/emailService');
require('dotenv').config();

async function testEmail() {
  console.log('Sending test OTP to', process.env.EMAIL_USER);
  const success = await sendOTPEmail(process.env.EMAIL_USER, '123456');
  if (success) {
    console.log('✅ Success! Check your inbox.');
  } else {
    console.log('❌ Failed. Check the error above.');
  }
  process.exit(0);
}

testEmail();
