const { app } = require('../server/app.js');
const { initDB } = require('../server/config/db.js');

module.exports = async (req, res) => {
  try {
    await initDB();
    return app(req, res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
