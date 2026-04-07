import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, CheckCircle, ChevronRight, Share2, Printer, Inbox, X, User, Heart, Zap, Stethoscope, AlertCircle } from 'lucide-react';
import { getPatientById, getDoctors, createAppointment, checkDoctorAvailability } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

const SHIFTS = [
  { label: 'Morning Shift (9 AM – 12 PM)', value: 'morning', slots: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30'] },
  { label: 'Evening Shift (4 PM – 7 PM)', value: 'evening', slots: ['16:00', '16:30', '17:00', '17:30', '18:00', '18:30'] },
];

const formatTime = (t) => {
  const [h, m] = t.split(':');
  const h12 = h % 12 || 12;
  return `${h12}:${m} ${h >= 12 ? 'PM' : 'AM'}`;
};

export default function PatientAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [patientData, setPatientData] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const { user } = useAuth();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  const [availStatus, setAvailStatus] = useState({ loading: false, error: null, available: true });

  const [form, setForm] = useState({
    doctor_id: '', appointment_date: '', appointment_time: '', shift: '', reason: ''
  });

  const fetchAppointments = async () => {
    if (!user?.patient_id) { setLoading(false); return; }
    try {
      const { data } = await getPatientById(user.patient_id);
      setPatientData(data?.data);
      const transformed = (data?.data?.appointments || []).map(apt => {
         const d = new Date(apt.appointment_date);
         return {
           id: apt.id,
           date: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ', ' + d.getFullYear(),
           time: apt.appointment_time || 'TBD',
           status: (apt.status || 'pending').charAt(0).toUpperCase() + (apt.status || 'pending').slice(1),
           doctor: apt.doctor_name || 'Practitioner',
           specialty: apt.specialization || 'General',
           room: 'Consultation Room'
         };
      });
      setAppointments(transformed);
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAppointments(); }, [user]);

  useEffect(() => {
    if (showModal) {
      getDoctors().then(res => setDoctors(res.data.data.filter(d => d.available)));
    }
  }, [showModal]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('openModal') === 'true') {
      setShowModal(true);
    }
  }, [location]);

  useEffect(() => {
    if (form.doctor_id && form.appointment_date) {
      checkAvailability();
    }
  }, [form.doctor_id, form.appointment_date]);

  const checkAvailability = async () => {
    setAvailStatus({ loading: true, error: null, available: true });
    try {
      const { data } = await checkDoctorAvailability(form.doctor_id, form.appointment_date);
      if (!data.available) {
        setAvailStatus({ loading: false, error: `Dr. is on Leave: ${data.reason || 'Not specified'}`, available: false });
        toast.error(`Dr. is on leave on the selected date.`);
      } else {
        setAvailStatus({ loading: false, error: null, available: true });
      }
    } catch {
      setAvailStatus({ loading: false, error: 'Unavailability check failed', available: true });
    }
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!form.doctor_id || !form.appointment_date || !form.appointment_time) {
      toast.error('Please fill in all required fields');
      return;
    }
    setBookingLoading(true);
    try {
      await createAppointment({
        patient_id: user.patient_id,
        ...form
      });
      toast.success('Appointment Requested! Awaiting Receptionist Approval.');
      setShowModal(false);
      fetchAppointments();
      setForm({ doctor_id: '', appointment_date: '', appointment_time: '', shift: '', reason: '' });
      setSelectedShift(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking request failed');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}>Loading...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontWeight: 900, fontSize: 32 }}>My <span className="gradient-text">Appointments</span></h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginTop: 4 }}>Manage and view your upcoming hospital visits.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ padding: '0.75rem 2rem' }}>
          SCHEDULE NEW VISIT
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem' }}>
        {appointments.length > 0 ? (
          appointments.map((apt) => (
            <div key={apt.id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s linear' }}>
              <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                <div style={{ padding: '1rem', background: 'rgba(99,102,241,0.08)', borderRadius: 16, textAlign: 'center', minWidth: 100 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--primary)', marginBottom: 2 }}>{apt.date.split(',')[0]}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{apt.date.split(',')[1]}</div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span className={`badge ${apt.status === 'Completed' ? 'badge-completed' : apt.status === 'Confirmed' ? 'badge-confirmed' : apt.status === 'Requested' ? 'badge-pending' : 'badge-pending'}`}
                          style={apt.status === 'Requested' ? { background: 'rgba(245,158,11,0.1)', color: '#f59e0b' } : {}}>
                      {apt.status}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>#{apt.id}</span>
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 800 }}>{apt.doctor}</h3>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>{apt.specialty}</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, borderLeft: '1px solid var(--border)', paddingLeft: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--text-secondary)' }}>
                    <Clock size={16} /> <b>{apt.time}</b>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--text-secondary)' }}>
                    <MapPin size={16} /> {apt.room}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-secondary" style={{ padding: '0.6rem' }} title="Print Slip"><Printer size={18} /></button>
                <button className="btn btn-primary" style={{ padding: '0.6rem 1.25rem', fontSize: 12 }}>
                  VIEW DETAILS <ChevronRight size={16} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem', background: 'rgba(0,0,0,0.01)', borderRadius: 24, border: '1px dashed var(--border)' }}>
            <Inbox size={48} opacity={0.2} style={{ marginBottom: 16 }} />
            <div style={{ fontSize: 16, fontWeight: 800, opacity: 0.5 }}>No appointments found</div>
            <p style={{ fontSize: 13, fontWeight: 600, opacity: 0.4 }}>You have no upcoming or past appointments scheduled.</p>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {showModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-card fade-in" style={{ maxWidth: 500, width: '100%', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: 24, fontWeight: 900 }}>Request <span className="gradient-text">Appointment</span></h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X /></button>
            </div>

            <form onSubmit={handleBooking} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Readonly Info */}
              <div style={{ background: 'rgba(99,102,241,0.04)', padding: '1rem', borderRadius: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                   <label style={{ fontSize: 10, fontWeight: 800, color: '#6366f1' }}>NAME</label>
                   <div style={{ fontSize: 13, fontWeight: 700 }}>{patientData?.name}</div>
                </div>
                <div>
                   <label style={{ fontSize: 10, fontWeight: 800, color: '#6366f1' }}>PATIENT ID</label>
                   <div style={{ fontSize: 13, fontWeight: 700 }}>#{patientData?.id}</div>
                </div>
              </div>

              <div>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Stethoscope size={14} /> SELECT SPECIALIST *</label>
                <select name="doctor_id" className="form-input" style={{ background: 'white' }} value={form.doctor_id} onChange={(e) => setForm(f => ({ ...f, doctor_id: e.target.value }))} required>
                  <option value="">Choose a doctor...</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>Dr. {d.name} ({d.specialization})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Calendar size={14} /> DATE *</label>
                  <input type="date" className="form-input" style={{ background: 'white' }} value={form.appointment_date} onChange={(e) => setForm(f => ({ ...f, appointment_date: e.target.value }))} min={new Date().toLocaleDateString('en-CA')} required />
                </div>
                <div>
                  <label className="form-label">SHIFT *</label>
                  <select className="form-input" style={{ background: 'white' }} value={form.shift} onChange={(e) => {
                    const sh = SHIFTS.find(s => s.value === e.target.value);
                    setSelectedShift(sh);
                    setForm(f => ({ ...f, shift: e.target.value, appointment_time: '' }));
                  }} required>
                    <option value="">Select Shift</option>
                    {SHIFTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>

              {selectedShift && (
                <div>
                  <label className="form-label">AVAILABLE SLOTS *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                    {selectedShift.slots.map(slot => (
                      <button type="button" key={slot} onClick={() => setForm(p => ({ ...p, appointment_time: slot }))} style={{ padding: '0.6rem', borderRadius: 8, border: `1px solid ${form.appointment_time === slot ? '#6366f1' : 'var(--border)'}`, background: form.appointment_time === slot ? '#6366f1' : 'white', color: form.appointment_time === slot ? 'white' : 'inherit', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>{formatTime(slot)}</button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="form-label">REASON FOR VISIT</label>
                <textarea className="form-input" style={{ background: 'white', minHeight: 80 }} value={form.reason} onChange={(e) => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="Briefly describe your concern..." />
              </div>

              {!availStatus.available && (
                <div style={{ padding: '0.75rem', background: 'rgba(239,68,68,0.06)', borderRadius: 10, border: '1px solid rgba(239,68,68,0.2)', display: 'flex', gap: 10, alignItems: 'center' }}>
                   <AlertCircle size={18} color="#ef4444" />
                   <p style={{ fontSize: 12, color: '#ef4444', fontWeight: 600 }}>{availStatus.error}</p>
                </div>
              )}

              <button type="submit" className="btn btn-primary" disabled={bookingLoading || !availStatus.available} style={{ width: '100%', justifyContent: 'center', padding: '1rem', borderRadius: 12, background: !availStatus.available ? '#94a3b8' : '#6366f1' }}>
                {bookingLoading ? 'SUBMITTING REQUEST...' : 'SUBMIT APPOINTMENT REQUEST'}
              </button>
            </form>
          </div>
        </div>
      )}
      
      {/* Help Note */}
      <div style={{ marginTop: '1rem', padding: '1.5rem', background: '#f8fafc', borderRadius: 16, border: '1px dashed #cbd5e1' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <CheckCircle size={20} color="#10b981" />
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <b>Note to Patient:</b> Please arrive at least 15 minutes before your scheduled appointment time. Bring your Patient ID and any relevant medical insurance documents.
          </p>
        </div>
      </div>
    </div>
  );
}
