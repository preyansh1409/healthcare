const { pool } = require('../config/db');

// --- Mock AI Lab Analysis Function ---
const performAIAnalysis = (reportType, details) => {
  const text = (details || '').toLowerCase();
  
  // Keyword-based simulated analysis
  if (reportType.toLowerCase().includes('x-ray') || text.includes('fracture') || text.includes('break') || text.includes('bone')) {
    return {
      summary: "AI analysis of the Orthopedic Imaging reveals a displaced fracture. The anatomical alignment indicates a significant structural compromise requiring immediate orthopedic intervention.",
      anomalies: [
        { parameter: "Bone Integrity", value: "Displaced Fracture", status: "Critical", range: "Intact" },
        { parameter: "Structural Alignment", value: "Deviated", status: "High", range: "Aligned" },
        { parameter: "Soft Tissue Swelling", value: "Significant", status: "High", range: "None" }
      ]
    };
  }

  const commonResults = {
    'Blood Test': {
      summary: "Patient's blood profile shows slightly elevated white blood cell counts, suggesting a possible minor infection or inflammation.",
      anomalies: [
        { parameter: "WBC Count", value: "11,500 cells/µL", status: "High", range: "4,500-11,000" },
        { parameter: "Hemoglobin", value: "14.2 g/dL", status: "Normal", range: "13.5-17.5" }
      ]
    },
    'Urine Analysis': {
      summary: "Urine culture is positive for bacterial growth (E. coli), confirming a Urinary Tract Infection (UTI). Glucose and Protein levels are normal.",
      anomalies: [
        { parameter: "Bacterial Growth", value: "Positive (E. coli)", status: "Critical", range: "Negative" },
        { parameter: "pH", value: "6.5", status: "Normal", range: "4.5-8.0" }
      ]
    },
    'Thyroid Profile': {
      summary: "Thyroid Stimulating Hormone (TSH) is significantly high, indicating Hypothyroidism. T3 and T4 levels are at the lower end of the normal range.",
      anomalies: [
        { parameter: "TSH", value: "8.4 mIU/L", status: "High", range: "0.4-4.0" }
      ]
    },
    'ECG / Heart': {
      summary: "The ECG shows a normal sinus rhythm with no signs of ischemia or arrhythmia. Heart rate is slightly elevated (92 BPM) possibly due to stress.",
      anomalies: [
        { parameter: "Heart Rate", value: "92 BPM", status: "Borderline", range: "60-90" }
      ]
    }
  };

  return commonResults[reportType] || {
    summary: "Report successfully scanned. AI has determined that the results are within acceptable medical parameters for this category.",
    anomalies: []
  };
};

// Simplified Upload (no AI analysis at this stage)
exports.uploadReport = async (req, res) => {
  const { patient_id, report_type, report_date, details, uploaded_by } = req.body;
  if (!patient_id || !report_type) return res.status(400).json({ success: false, message: 'Missing required data' });

  try {
    const [result] = await pool.query(
      `INSERT INTO lab_reports (patient_id, report_type, report_date, details, uploaded_by, status) VALUES (?, ?, ?, ?, ?, 'pending')`,
      [patient_id, report_type, report_date || new Date().toISOString().split('T')[0], details, uploaded_by]
    );
    res.status(201).json({ success: true, message: 'Report uploaded successfully', reportId: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Analysis triggered by Doctor (Real AI using Gemini - Fallbacks to mock if not configured)
const { analyzeReportWithAI } = require('../utils/ai');
exports.analyzeReport = async (req, res) => {
  const { id } = req.params;
  try {
    const [reports] = await pool.query('SELECT * FROM lab_reports WHERE id = ?', [id]);
    if (reports.length === 0) return res.status(404).json({ success: false, message: 'Report not found' });
    
    const report = reports[0];
    let aiResult;

    if (!process.env.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
      // Mock Fallback
      aiResult = performAIAnalysis(report.report_type, report.details);
    } else {
      // Real AI
      aiResult = await analyzeReportWithAI(report.report_type, report.details);
    }

    await pool.query(
      'UPDATE lab_reports SET ai_summary = ?, ai_anomalies = ?, status = \'analyzed\' WHERE id = ?',
      [aiResult.summary, JSON.stringify(aiResult.anomalies), id]
    );

    res.json({ success: true, message: 'AI Analysis completed', data: { ...report, ai_summary: aiResult.summary, ai_anomalies: aiResult.anomalies, status: 'analyzed' } });
  } catch (err) {
    console.error("AI Lab Analysis Error:", err.message);
    res.status(500).json({ success: false, message: 'AI Analysis failed' });
  }
};

// Get all reports for a patient
exports.getPatientReports = async (req, res) => {
  const { patientId } = req.params;
  try {
    const [reports] = await pool.query(
      'SELECT lr.*, u.name as uploader_name FROM lab_reports lr LEFT JOIN users u ON lr.uploaded_by = u.id WHERE lr.patient_id = ? ORDER BY lr.report_date DESC',
      [patientId]
    );
    // Parse JSON if it exists
    reports.forEach(r => { if (r.ai_anomalies) r.ai_anomalies = JSON.parse(r.ai_anomalies); });
    res.json({ success: true, data: reports });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get single report
exports.getReportById = async (req, res) => {
  const { id } = req.params;
  try {
    const [reports] = await pool.query('SELECT * FROM lab_reports WHERE id = ?', [id]);
    if (reports.length === 0) return res.status(404).json({ success: false, message: 'Report not found' });
    
    const report = reports[0];
    if (report.ai_anomalies) report.ai_anomalies = JSON.parse(report.ai_anomalies);
    res.json({ success: true, data: report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
