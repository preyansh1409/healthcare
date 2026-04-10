const { app } = require('../server/app.js');
const { initDB } = require('../server/config/db.js');

// Vercel Serverless Handler
module.exports = async (req, res) => {
  try {
    // Ensure DB is ready before handling ANY request
    await initDB();
    
    // Pass control to Express
    return app(req, res);
  } catch (err) {
    console.error('Final Handler Error:', err.message);
    res.status(500).json({ success: false, message: "Server initializing..." });
  }
};
