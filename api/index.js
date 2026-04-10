const { app } = require('../server/app.js');

// Exporting the Express app directly is Vercel's recommended way for Node.js servers
// It automatically handles the request/response cycle without needing a manual wrapper.
module.exports = app;
