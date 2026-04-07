const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

/**
 * Get diagnosis and suggested treatment plan from Gemini
 * Returns a JSON structure matching the frontend's expectations
 */
async function getDiagnosisFromAI(symptoms) {
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error("Missing GOOGLE_API_KEY in .env file");
  }

  const prompt = `You are an expert medical AI assistant.
  The patient has the following symptoms: "${symptoms}".
  
  Provide a professional diagnosis and suggest a treatment plan.
  Your response MUST be in RAW JSON format only. No extra text or markdown.
  
  JSON Structure:
  {
    "diagnosis": "Brief clinical diagnosis",
    "suggested_plan": {
      "medications": [
        { "name": "Medication Name", "unit": "Tablet/Capsule/Syrup", "dosage": "e.g. 1-0-1", "duration": "e.g. 5 Days" }
      ],
      "diet": "Brief diet instructions",
      "reports": "Required lab tests if any"
    }
  }`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  let text = response.text();

  // Clean JSON if needed (sometimes Gemini wraps in ```json)
  text = text.replace(/```json|```/g, "").trim();

  return JSON.parse(text);
}

/**
 * Analyze lab report details and return summary + anomalies
 */
async function analyzeReportWithAI(reportType, details) {
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error("Missing GOOGLE_API_KEY in .env file");
  }

  const prompt = `You are a medical lab report expert. Analyze the following "${reportType}" with details: "${details}".
  
  Your response MUST be in RAW JSON format only. No extra text or markdown.
  
  JSON Structure:
  {
    "summary": "Professional summary of findings",
    "anomalies": [
      { "parameter": "Parameter name", "value": "Current Value", "status": "Normal/High/Low/Critical", "range": "Reference Range" }
    ]
  }`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  let text = response.text();

  text = text.replace(/```json|```/g, "").trim();

  return JSON.parse(text);
}

/**
 * Get suggested treatment for hospital admission based on reason
 */
async function getAdmissionPlanFromAI(reason) {
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error("Missing GOOGLE_API_KEY in .env file");
  }

  const prompt = `You are a hospital administration and clinical expert. 
  A patient is being admitted for: "${reason}".
  
  Suggest an INITIAL TREATMENT & MEDICINE CHART for this admission.
  Provide ONLY short points numbered 1, 2, 3, etc. Avoid long descriptions.
  Include:
  1. Primary treatments (e.g. Saline, Glucose, Oxygen).
  2. Nursing instructions (How many times to check vitals/patient in a day).
  3. Basic medications applicable for this acute phase.
  
  Your response MUST be in RAW JSON format only. No extra text or markdown.
  
  JSON Structure:
  {
    "treatment": "Short numbered points (1., 2., 3.) listing drugs and vitals check frequency.",
    "summary": "ONE-LINE summary of clinical reason"
  }`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  let text = response.text();

  text = text.replace(/```json|```/g, "").trim();
  const data = JSON.parse(text);

  // Format for the UI textarea
  const formattedTreatment = `[ADMISSION PLAN]:\n${data.treatment}`;

  return {
    treatment: formattedTreatment,
    reason: data.summary // AI summarized reason
  };
}

module.exports = { getDiagnosisFromAI, analyzeReportWithAI, getAdmissionPlanFromAI };
