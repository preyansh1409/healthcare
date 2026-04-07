const { server } = require('./app');
require('./config/db'); // Initialize DB connection

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Healthcare API Server running on http://localhost:${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use.`);
    console.log(`💡 Run this to free it: Stop-Process -Id (Get-NetTCPConnection -LocalPort ${PORT}).OwningProcess -Force`);
    console.log(`   Or just close the other terminal running the server.\n`);
    process.exit(1);
  } else {
    throw err;
  }
});
