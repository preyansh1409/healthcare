const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173', 
  'http://localhost:5174',
  'http://localhost:5000', // Desktop app location
  /\.vercel\.app$/ // Allow all Vercel deployments
];

const io = new Server(server, {
  cors: { origin: "*", methods: ['GET', 'POST'] }
});

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database Initialization Middleware (Ensures tables exist before any request)
const { initDB } = require('./config/db');
app.use(async (req, res, next) => {
  try {
    await initDB();
    next();
  } catch (err) {
    console.error('DB Init Error:', err.message);
    res.status(500).json({ success: false, message: "Database setup in progress or failed. Please refresh in 10 seconds." });
  }
});

// Manual setup trigger
app.get('/api/install', async (req, res) => {
  try {
    await initDB();
    res.json({ success: true, message: "Database initialized successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Routes
const authRoutes = require('./routes/authRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const patientRoutes = require('./routes/patientRoutes');
const adminRoutes = require('./routes/adminRoutes');
const billingRoutes = require('./routes/billingRoutes');
const labReportRoutes = require('./routes/labReportRoutes');


const path = require('path');
// ... other routes ...
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/lab-reports', labReportRoutes);

// Add these lines for hosting the frontend
const distPath = path.join(__dirname, '..', 'client', 'dist');

// Serve static files if they exist
app.use(express.static(distPath));

// In production/Vercel, we don't serve index.html from here if vercel.json is doing its own rewrites.
// We only keep this for local testing as a fallback.
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  if (!process.env.VERCEL) {
    res.sendFile(path.join(distPath, 'index.html'), (err) => {
      if (err) next();
    });
  } else {
    next();
  }
});


// AI Diagnosis suggestion (Real AI using Gemini - Fallbacks to mock if not configured)
const { getDiagnosisFromAI, getAdmissionPlanFromAI } = require('./utils/ai');
app.post('/api/ai/diagnose', async (req, res) => {
  const { symptoms } = req.body;
  try {
    const aiResponse = await getDiagnosisFromAI(symptoms);
    res.json({ success: true, ...aiResponse });
  } catch (error) {
    console.error("AI Error:", error.message);
    res.status(500).json({ success: false, message: "AI Service Error" });
  }
});

app.post('/api/ai/admission-suggest', async (req, res) => {
  const { reason } = req.body;
  try {
    const aiResponse = await getAdmissionPlanFromAI(reason);
    res.json({ success: true, ...aiResponse });
  } catch (error) {
    console.error("Admission AI Error:", error.message);
    res.status(500).json({ success: false, message: "AI Service Error" });
  }
});

// IoT endpoint (mock wearable data)
app.post('/api/iot/vitals', (req, res) => {
  const { patient_id } = req.body;
  res.json({
    success: true,
    data: {
      patient_id,
      heart_rate: Math.floor(Math.random() * 40) + 60,
      blood_pressure: `${Math.floor(Math.random() * 40) + 100}/${Math.floor(Math.random() * 20) + 70}`,
      spo2: Math.floor(Math.random() * 5) + 95,
      temperature: (36.5 + Math.random() * 2).toFixed(1),
      timestamp: new Date().toISOString(),
    }
  });
});

// Socket.IO for real-time notifications
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('join-room', (userId) => socket.join(`user-${userId}`));
  socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});
app.set('io', io);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error' });
});

module.exports = { app, server };
