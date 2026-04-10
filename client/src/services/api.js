import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Request interceptor — attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hms_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('hms_token');
      localStorage.removeItem('hms_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth ─────────────────────────────────────
export const login = (data) => api.post('/auth/login', data);
export const register = (data) => api.post('/auth/register', data);
export const sendOTP = (data) => api.post('/auth/send-otp', data);
export const verifyOTP = (data) => api.post('/auth/verify-otp', data);
export const getMe = () => api.get('/auth/me');
export const changePassword = (data) => api.put('/auth/change-password', data);
export const getLinkedProfiles = () => api.get('/auth/profiles');
export const switchProfile = (data) => api.post('/auth/switch-profile', data);

// ─── Appointments ──────────────────────────────
export const getAppointments = () => api.get('/appointments');
export const getTodayAppointments = () => api.get('/appointments/today');
export const getAppointmentsByDate = (date) => api.get(`/appointments/by-date/${date}`);
export const getAppointmentById = (id) => api.get(`/appointments/${id}`);
export const createAppointment = (data) => api.post('/appointments', data);
export const updateAppointment = (id, data) => api.put(`/appointments/${id}`, data);
export const deleteAppointment = (id) => api.delete(`/appointments/${id}`);
export const checkInAppointment = (id) => api.put(`/appointments/${id}/check-in`);

// ─── Patients ─────────────────────────────────
export const getPatients = () => api.get('/patients');
export const getPatientById = (id) => api.get(`/patients/${id}`);
export const createPatient = (data) => api.post('/patients', data);
export const updatePatient = (id, data) => api.put(`/patients/${id}`, data);
export const deletePatient = (id) => api.delete(`/patients/${id}`);
export const addPrescription = (patientId, data) => api.post(`/patients/${patientId}/prescriptions`, data);

// ─── Doctors ──────────────────────────────────
export const getDoctors = () => api.get('/doctors');
export const getDoctorById = (id) => api.get(`/doctors/${id}`);
export const updateDoctor = (id, data) => api.put(`/doctors/${id}`, data);
export const getDoctorSchedule = (id, date) => api.get(`/doctors/${id}/schedule`, { params: { date } });
export const getDoctorStats = (id) => api.get(`/doctors/${id}/stats`);
export const getAdmittedPatients = (id) => api.get(`/doctors/${id}/admitted`);
export const getSpecialtyPatients = () => api.get('/doctors/patients/by-specialty');
export const markLeave = (data) => api.post('/doctors/leave', data);
export const getDoctorLeaves = () => api.get('/doctors/leave');
export const checkDoctorAvailability = (id, date) => api.get(`/doctors/${id}/check-availability`, { params: { date } });

// ─── Admin ────────────────────────────────────
export const getAdminStats = (month) => api.get(`/admin/stats${month ? `?month=${month}` : ''}`);
export const getUsers = () => api.get('/admin/users');
export const createUser = (data) => api.post('/admin/users', data);
export const deleteUser = (id) => api.delete(`/admin/users/${id}`);
export const getBeds = () => api.get('/admin/beds');
export const updateBed = (id, data) => api.put(`/admin/beds/${id}`, data);
export const getAnalytics = () => api.get('/admin/analytics');
export const getNotifications = () => api.get('/admin/notifications');
export const triggerEmergency = (data) => api.post('/admin/emergency', data);
export const verifyLedger = () => api.get('/admin/verify-ledger');
export const getBlockchainLedger = () => api.get('/admin/blockchain-ledger');
export const getAllDoctorLeaves = () => api.get('/admin/doctor-leaves');
export const getEmergencyLogs = () => api.get('/admin/emergency-logs');
export const markNotificationRead = (id) => api.put(`/admin/notifications/${id}/read`);

// ─── AI / IoT ─────────────────────────────────
export const getDiagnosis = (symptoms) => api.post('/ai/diagnose', { symptoms });
export const getAdmissionSuggestion = (reason) => api.post('/ai/admission-suggest', { reason });
export const getPatientVitals = (patientId) => api.post('/iot/vitals', { patient_id: patientId });

// ─── Billing ──────────────────────────────────
export const getBills = () => api.get('/billing');
export const createBill = (data) => api.post('/billing', data);
export const updateBill = (id, data) => api.put(`/billing/${id}`, data);
export const updateBillStatus = (id, data) => api.put(`/billing/${id}/status`, data);

// ─── Lab Reports & AI Analysis ──────────────────
export const uploadLabReport = (data) => api.post('/lab-reports/upload', data);
export const getPatientLabReports = (patientId) => api.get(`/lab-reports/patient/${patientId}`);
export const getLabReportById = (id) => api.get(`/lab-reports/${id}`);
export const analyzeLabReport = (id) => api.post(`/lab-reports/${id}/analyze`);


export default api;

