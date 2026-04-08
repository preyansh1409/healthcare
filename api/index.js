const { app } = require('../server/app.js');
require('../server/config/db.js');

// Vercel expects the express instance to be the default export
module.exports = app;
