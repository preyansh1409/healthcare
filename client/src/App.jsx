import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import PatientLayout from './layouts/PatientLayout';

// Pages
import Login from './pages/Login';
import PatientLogin from './pages/Patient/PatientLogin';
import Dashboard from './pages/Patient/Dashboard';
import Appointments from './pages/Patient/Appointments';
import Billing from './pages/Patient/Billing';
import PatientLabReports from './pages/Patient/LabReports';
import Prescriptions from './pages/Patient/Prescriptions';
import Records from './pages/Patient/Records';
import Messages from './pages/Patient/Messages';
import Profile from './pages/Patient/Profile';

import BlockchainAudit from './pages/Admin/BlockchainAudit';
import ManageDoctors from './pages/Admin/ManageDoctors';
import BedManagement from './pages/Admin/BedManagement';
import DoctorDashboard from './pages/Doctor/DoctorDashboard';
import PatientDetails from './pages/Doctor/PatientDetails';
import AdmittedPatients from './pages/Doctor/AdmittedPatients';
import AddPrescription from './pages/Doctor/AddPrescription';
import DoctorLabReports from './pages/Doctor/LabReports';
import PatientVitals from './pages/Doctor/PatientVitals';
import EmergencyAlert from './pages/Doctor/EmergencyAlert';
import PatientsByDisease from './pages/Doctor/PatientsByDisease';
import LeaveCalendar from './pages/Doctor/LeaveCalendar';
import RegisterPatient from './pages/Receptionist/PatientRegistration';
import PatientListDetail from './pages/Receptionist/PatientListDetail';
import BookAppointment from './pages/Receptionist/BookAppointment';
import BillingManagement from './pages/Admin/BillingManagement';
import AdminOverview from './pages/Admin/AdminOverview';
import UserManagement from './pages/Admin/UserManagement';
import DoctorAvailability from './pages/Admin/DoctorAvailability';
import DoctorReport from './pages/Admin/DoctorReport';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          containerClassName="no-print"
          toastOptions={{
            style: { background: '#ffffff', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: '12px' },
            duration: 3500,
          }}
        />
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Login />} />
          <Route path="/patient/login" element={<PatientLogin />} />

          {/* Patient Portal */}
          <Route path="/patient" element={
            <ProtectedRoute allowedRoles={['patient', 'admin', 'doctor', 'receptionist']}>
              <PatientLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="lab-reports" element={<PatientLabReports />} />
            <Route path="billing" element={<Billing />} />
            <Route path="prescriptions" element={<Prescriptions />} />
            <Route path="records" element={<Records />} />
            <Route path="messages" element={<Messages />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          {/* Admin routes */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin', 'receptionist']}>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminOverview />} />
            <Route path="overview" element={<AdminOverview />} />
            <Route path="blockchain" element={<BlockchainAudit />} />
            <Route path="doctors" element={<ManageDoctors />} />
            <Route path="doctor-availability" element={<DoctorAvailability />} />
            <Route path="beds" element={<BedManagement />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="patients" element={<RegisterPatient />} />
            <Route path="patient-detail" element={<PatientListDetail />} />
            <Route path="patients/:id" element={<PatientDetails />} />
            <Route path="prescribe/:patientId" element={<AddPrescription />} />
            <Route path="appointments" element={<BookAppointment />} />
            <Route path="billing" element={<BillingManagement />} />
            <Route path="doctor-reports" element={<DoctorReport />} />
            <Route path="doctor-reports/:doctorId" element={<DoctorReport />} />

          </Route>

          {/* Doctor routes */}
          <Route path="/doctor" element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route index element={<DoctorDashboard />} />
            <Route path="appointments" element={<DoctorDashboard />} />
            <Route path="admitted" element={<AdmittedPatients />} />
            <Route path="vitals" element={<PatientVitals />} />
            <Route path="lab-reports" element={<DoctorLabReports />} />
            <Route path="leave" element={<LeaveCalendar />} />
            <Route path="emergency" element={<EmergencyAlert />} />
            <Route path="prescribe/:patientId" element={<AddPrescription />} />
            <Route path="prescribe/:patientId/:appointmentId" element={<AddPrescription />} />
            <Route path="patients" element={<RegisterPatient />} />
            <Route path="patient-detail" element={<PatientListDetail />} />
            <Route path="specialty-patients" element={<PatientsByDisease />} />
            <Route path="patients/:id" element={<PatientDetails />} />

          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
