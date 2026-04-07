import { useState, useEffect } from 'react';
import {
  Calendar, User, Phone, Watch, CheckCircle, Search,
  MapPin, Stethoscope, Clock, ShieldCheck, UserPlus,
  ListTodo, Unlock, Lock, Inbox
} from 'lucide-react';
import {
  getPatients, getDoctors, createPatient, createAppointment,
  getAppointmentsByDate, checkInAppointment, checkDoctorAvailability,
  getAppointments, updateAppointment
} from '../../services/api';
import toast from 'react-hot-toast';

const SHIFTS = [
  { label: 'Morning (9AM - 12PM)', value: 'morning', slots: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30'] },
  { label: 'Evening (4PM - 7PM)', value: 'evening', slots: ['16:00', '16:30', '17:00', '17:30', '18:00', '18:30'] },
];

const formatTime = (t) => {
  if (!t) return 'TBD';
  const [h, m] = t.split(':');
  const h12 = h % 12 || 12;
  return `${h12}:${m} ${h >= 12 ? 'PM' : 'AM'}`;
};

export default function BookAppointment() {
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedShift, setSelectedShift] = useState(null);
  const [todayAppts, setTodayAppts] = useState([]);
  const [arrivalsDate, setArrivalsDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [activeTab, setActiveTab] = useState('book'); // 'book', 'arrivals', or 'requests'
  const [pendingRequests, setPendingRequests] = useState([]);
  const [editingRequestId, setEditingRequestId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [availStatus, setAvailStatus] = useState({ loading: false, error: null, available: true });
  const [success, setSuccess] = useState({ id: null, patientId: null, isReturning: false });
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [form, setForm] = useState({
    patient_id: '',
    patient_name: '',
    patient_phone: '',
    patient_age: '',
    patient_email: '',
    patient_dob: '',
    patient_gender: 'male',
    patient_blood: '',
    doctor_id: '',
    appointment_date: '',
    appointment_time: '',
    shift: '',
    reason: ''
  });

  useEffect(() => {
    loadData();
    fetchArrivals();
  }, []);

  const loadData = async () => {
    Promise.all([getPatients(), getDoctors(), getAppointments()]).then(([pRes, dRes, aRes]) => {
      setPatients(pRes.data.data);
      setDoctors(dRes.data.data.filter(d => d.available));
      // Filter for 'requested' status
      setPendingRequests(aRes.data.data.filter(a => a.status === 'requested'));
    }).catch(() => toast.error('Failed to load data'));
  }

  const fetchArrivals = async () => {
    try {
      const { data: res } = await getAppointmentsByDate(arrivalsDate);
      setTodayAppts(res.data);
    } catch (err) {
      console.error('Failed to fetch arrivals:', err);
    }
  };

  useEffect(() => { fetchArrivals(); }, [arrivalsDate]);

  const checkAvailability = async (docId, date) => {
    setAvailStatus({ loading: true, error: null, available: true });
    try {
      const { data } = await checkDoctorAvailability(docId, date);
      if (!data.available) {
        setAvailStatus({ loading: false, error: `Dr. is on Leave: ${data.reason || 'Not specified'}`, available: false });
        toast.error(`Dr. is on leave on the selected date.`);
      } else {
        setAvailStatus({ loading: false, error: null, available: true });
      }
    } catch (err) {
      setAvailStatus({ loading: false, error: 'Failed to verify availability', available: true });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => {
      const updated = { ...prev, [name]: value };
      if ((name === 'doctor_id' || name === 'appointment_date') && updated.doctor_id && updated.appointment_date) {
        checkAvailability(updated.doctor_id, updated.appointment_date);
      }
      return updated;
    });
  };

  const handlePhoneChange = (e) => {
    const phone = e.target.value;
    setForm(prev => ({ ...prev, patient_phone: phone }));
    const found = patients.find(p => p.phone === phone);
    if (found) {
      setForm(prev => ({
        ...prev,
        patient_id: found.id,
        patient_name: found.name,
        patient_age: found.age || '',
        patient_gender: found.gender || 'male',
        patient_email: found.email || '',
        patient_blood: found.blood_group || '',
        patient_dob: found.birth_date ? new Date(found.birth_date).toLocaleDateString('en-CA') : ''
      }));
      toast.success(`Patient "${found.name}" recognized!`);
    }
  };

  const handlePatientNameChange = (e) => {
    const input = e.target.value;
    if (input.includes(' - ')) {
      const phone = input.split(' - ')[1];
      handlePhoneChange({ target: { value: phone } });
    } else {
      setForm(prev => ({ ...prev, patient_name: input }));
    }
  };

  const handleShiftSelect = (shift) => {
    setSelectedShift(shift);
    setForm(prev => ({ ...prev, shift: shift.value, appointment_time: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalPatientId = form.patient_id;
      let isReturning = !!form.patient_id;
      const targetDoctor = doctors.find(d => String(d.id) === String(form.doctor_id));

      if (editingRequestId) {
        // CONFIRMING A REQUEST (Update status to pending and possibly update time)
        await updateAppointment(editingRequestId, {
          status: 'confirmed',
          appointment_date: form.appointment_date,
          appointment_time: form.appointment_time,
          doctor_id: form.doctor_id,
          shift: form.shift,
          notes: form.reason
        });
        toast.success('Appointment Confirmed & Booked! 📅');
        setEditingRequestId(null);
      } else {
        // NEW BOOKING (Manual)
        if (!finalPatientId) {
          if (!form.patient_phone || !form.patient_age) {
            toast.error('Please provide Phone and Age for the new patient');
            setLoading(false);
            return;
          }
          const pRes = await createPatient({
            name: form.patient_name,
            phone: form.patient_phone,
            email: form.patient_email,
            age: form.patient_age,
            birth_date: form.patient_dob,
            gender: form.patient_gender,
            address: '',
            blood_group: form.patient_blood,
            allergies: '',
            emergency_contact: '',
            assigned_doctor_name: targetDoctor?.name || 'Dr. Not Assigned'
          });
          finalPatientId = pRes.data.patientId;
          isReturning = pRes.data.isReturning;
        }

        const aRes = await createAppointment({
          patient_id: finalPatientId,
          doctor_id: form.doctor_id,
          appointment_date: form.appointment_date,
          appointment_time: form.appointment_time,
          shift: form.shift,
          reason: form.reason
        });

        setSuccess({
          id: aRes.data.appointmentId,
          patientId: finalPatientId,
          isReturning
        });
        toast.success(isReturning ? 'Returning Patient Appointment Booked! 📅' : 'New Patient Registered & Appt Booked! 🎉');
      }

      loadData();

      setTimeout(() => {
        setSuccess({ id: null, patientId: null, isReturning: false });
        setForm({
          patient_id: '', patient_name: '', patient_phone: '', patient_age: '', patient_email: '', patient_dob: '',
          patient_gender: 'male', patient_blood: '',
          doctor_id: '', appointment_date: '', appointment_time: '', shift: '', reason: ''
        }); setSelectedShift(null);
      }, 5000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (apptId) => {
    try {
      const { data } = await checkInAppointment(apptId);
      toast.success(`Patient checked in! Token: #${data.token}`);
      const { data: res } = await getAppointmentsByDate(arrivalsDate);
      setTodayAppts(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-in failed');
    }
  };

  const handleApproveRequest = (request) => {
    setForm({
      patient_id: request.patient_id,
      patient_name: request.patient_name,
      patient_phone: request.patient_phone,
      patient_age: request.age,
      patient_gender: request.gender,
      patient_email: request.email || '',
      patient_blood: request.blood_group || '',
      patient_dob: request.birth_date ? new Date(request.birth_date).toLocaleDateString('en-CA') : '',
      doctor_id: request.doctor_id,
      appointment_date: new Date(request.appointment_date).toLocaleDateString('en-CA'),
      appointment_time: request.appointment_time,
      shift: request.shift,
      reason: request.reason || ''
    });
    setEditingRequestId(request.id);
    setSelectedShift(SHIFTS.find(s => s.value === request.shift));
    setActiveTab('book');
    toast.success('Edit or Confirm the requested time below.');
  };

  const isReturningPatient = !!form.patient_id;
  const selectedDoctor = doctors.find(d => d.id == form.doctor_id);

  // Locked input style for returning patients
  const lockedStyle = {
    background: 'rgba(99,102,241,0.04)',
    border: '1px solid rgba(99,102,241,0.25)',
    color: '#1e293b',
    fontWeight: 700,
    cursor: 'not-allowed',
    opacity: 0.85
  };

  return (
    <div style={{ padding: '0 1rem' }}>
      <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)' }}>
        <button onClick={() => setActiveTab('book')} style={{ padding: '1rem 0', background: 'none', border: 'none', color: activeTab === 'book' ? '#6366f1' : 'var(--text-secondary)', borderBottom: activeTab === 'book' ? '2px solid #6366f1' : 'none', cursor: 'pointer', fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calendar size={18} /> Schedule Appointment
        </button>
        <button onClick={() => setActiveTab('requests')} style={{ padding: '1rem 0', background: 'none', border: 'none', color: activeTab === 'requests' ? '#6366f1' : 'var(--text-secondary)', borderBottom: activeTab === 'requests' ? '2px solid #6366f1' : 'none', cursor: 'pointer', fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
          <Inbox size={18} /> Patient Requests
          {pendingRequests.length > 0 && <span style={{ background: '#6366f1', color: 'white', borderRadius: 20, padding: '0 6px', fontSize: 10, position: 'absolute', top: 4, right: -15 }}>{pendingRequests.length}</span>}
        </button>
        <button onClick={() => setActiveTab('arrivals')} style={{ padding: '1rem 0', background: 'none', border: 'none', color: activeTab === 'arrivals' ? '#6366f1' : 'var(--text-secondary)', borderBottom: activeTab === 'arrivals' ? '2px solid #6366f1' : 'none', cursor: 'pointer', fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <ListTodo size={18} /> Daily Arrivals & Queue
          {todayAppts.filter(a => a.status === 'confirmed').length > 0 && <span style={{ background: '#ef4444', color: 'white', borderRadius: 20, padding: '0 6px', fontSize: 10 }}>{todayAppts.filter(a => a.status === 'confirmed').length}</span>}
        </button>
      </div>

      {activeTab === 'book' ? (
        success.patientId ? (
          <div className="glass-card" style={{ padding: '4rem', textAlign: 'center', borderColor: 'rgba(16,185,129,0.4)' }}>
            <CheckCircle size={64} color="#10b981" style={{ marginBottom: '1rem' }} />
            <h2 style={{ fontWeight: 800, fontSize: 22, color: '#10b981' }}>Appointment Booked Successfully!</h2>
            <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 12, padding: '1rem', display: 'inline-block', marginTop: '1rem' }}>
              <p style={{ fontWeight: 800, fontSize: 18, color: '#065f46', margin: 0 }}>UNIQUE PATIENT ID: #{success.patientId}</p>
              <p style={{ fontSize: 12, color: '#059669', opacity: 0.8 }}>{success.isReturning ? 'Handled as Returning Patient' : 'A New Patient record was created'}</p>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginTop: '1.5rem' }}>The appointment is confirmed. The medical bill will be generated automatically when you click "Present" for check-in.</p>
            <button className="btn btn-secondary" style={{ marginTop: '2rem', marginInline: 'auto' }} onClick={() => setSuccess({ id: null, patientId: null, isReturning: false })}>Book Another</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>
            <form onSubmit={handleSubmit} className="glass-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ background: isReturningPatient ? 'rgba(16,185,129,0.04)' : 'rgba(99,102,241,0.03)', border: `1px solid ${isReturningPatient ? 'rgba(16,185,129,0.3)' : 'rgba(99,102,241,0.2)'}`, padding: '1rem', borderRadius: 12 }}>
                {/* Patient search by phone */}
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', marginBottom: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label className="form-label"><Phone size={12} style={{ display: 'inline', marginRight: 4 }} />Phone Number *
                      {isReturningPatient && <span style={{ marginLeft: 8, background: '#10b981', color: 'white', borderRadius: 20, padding: '1px 8px', fontSize: 10, fontWeight: 800 }}>✓ Returning Patient</span>}
                    </label>
                    <input
                      className="form-input" placeholder="Enter phone to search patient..."
                      value={form.patient_phone} onChange={handlePhoneChange}
                      name="patient_phone" required
                      style={isReturningPatient ? lockedStyle : {}}
                      readOnly={isReturningPatient}
                    />
                  </div>
                  {isReturningPatient && (
                    <button type="button" onClick={() => setForm(f => ({ ...f, patient_id: '', patient_name: '', patient_phone: '', patient_age: '', patient_gender: 'other', patient_email: '', patient_blood: '' }))} style={{ padding: '0.6rem 1rem', borderRadius: 10, border: '1px solid #ef4444', background: 'rgba(239,68,68,0.06)', color: '#ef4444', cursor: 'pointer', fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap' }}>
                      <Unlock size={12} style={{ display: 'inline', marginRight: 4 }} />Clear
                    </button>
                  )}
                </div>

                <label className="form-label"><User size={12} style={{ display: 'inline', marginRight: 4 }} />Patient Name *</label>
                <div style={{ position: 'relative' }}>
                  {isReturningPatient ? (
                    <input className="form-input" value={form.patient_name} readOnly style={lockedStyle} />
                  ) : (
                    <div style={{ position: 'relative' }}>
                      <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', zIndex: 1 }} />
                      <input
                        className="form-input"
                        style={{ paddingLeft: '2.5rem' }}
                        placeholder="Search patient name..."
                        value={form.patient_name}
                        onChange={(e) => {
                          handlePatientNameChange(e);
                          setShowSuggestions(true);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        required
                      />

                      {showSuggestions && form.patient_name && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            backgroundColor: '#ffffff',
                            borderRadius: '12px',
                            marginTop: '0.4rem',
                            boxShadow: '0 15px 40px rgba(0,0,0,0.2)',
                            zIndex: 1000,
                            maxHeight: '260px',
                            overflowY: 'auto',
                            border: '1px solid #e2e8f0',
                            animation: 'fadeIn 0.2s ease'
                          }}
                        >
                          {patients
                            .filter(p =>
                              p.name?.toLowerCase().includes(form.patient_name.toLowerCase()) ||
                              p.phone?.includes(form.patient_name)
                            )
                            .slice(0, 8)
                            .map(p => (
                              <div
                                key={p.id}
                                onClick={() => {
                                  handlePhoneChange({ target: { value: p.phone } });
                                  setShowSuggestions(false);
                                }}
                                style={{
                                  padding: '0.75rem 1rem',
                                  cursor: 'pointer',
                                  borderBottom: '1px solid #f1f5f9',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontWeight: 700, color: '#1e293b' }}>{p.name}</span>
                                  <span style={{ fontSize: '11px', background: '#eff6ff', color: '#1e40af', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>{p.phone}</span>
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: 4 }}>
                                  {p.age} yrs • {p.gender} • Blood: {p.blood_group || 'N/A'}
                                </div>
                              </div>
                            ))}
                          {patients.filter(p => p.name?.toLowerCase().includes(form.patient_name.toLowerCase())).length === 0 && (
                            <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                              No matching patients found
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {isReturningPatient && <Lock size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#10b981', opacity: 0.7 }} />}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label className="form-label" style={{ fontSize: 11 }}>Birth Date</label>
                    <input type="date" className="form-input" value={form.patient_dob} onChange={handleChange} name="patient_dob" readOnly={isReturningPatient} style={isReturningPatient ? lockedStyle : {}} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label className="form-label" style={{ fontSize: 11 }}>Age *</label>
                    <input type="number" required className="form-input" value={form.patient_age} onChange={handleChange} name="patient_age" readOnly={isReturningPatient} style={isReturningPatient ? lockedStyle : {}} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label className="form-label" style={{ fontSize: 11 }}>Blood Group</label>
                    {isReturningPatient ? (
                      <input className="form-input" value={form.patient_blood || 'N/A'} readOnly style={lockedStyle} />
                    ) : (
                      <select className="form-input" value={form.patient_blood} onChange={handleChange} name="patient_blood">
                        <option value="">Select</option>
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                      </select>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label className="form-label" style={{ fontSize: 11 }}>Patient Email Address</label>
                  <input type="email" className="form-input" value={form.patient_email} onChange={handleChange} name="patient_email" readOnly={isReturningPatient} placeholder="e.g. name@example.com" style={isReturningPatient ? { ...lockedStyle, opacity: 1 } : {}} />
                </div>

                {!isReturningPatient && form.patient_name && (
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px dashed rgba(99,102,241,0.3)' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', marginBottom: 8 }}><UserPlus size={12} style={{ display: 'inline', marginRight: 4 }} />New Patient — Additional Details</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <select className="form-input" value={form.patient_gender} onChange={handleChange} name="patient_gender">
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="form-label">Select Doctor *</label>
                <select name="doctor_id" className="form-input" value={form.doctor_id} onChange={handleChange} required>
                  <option value="">-- Select a doctor --</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.specialization})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Date *</label>
                <input type="date" name="appointment_date" className="form-input" value={form.appointment_date} onChange={handleChange} min={new Date().toLocaleDateString('en-CA')} required />
              </div>

              {(form.doctor_id || editingRequestId) && (
                <div>
                  <label className="form-label">Select Shift *</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {SHIFTS.map(shift => (
                      <button type="button" key={shift.value} onClick={() => handleShiftSelect(shift)} style={{ flex: 1, padding: '0.75rem', borderRadius: 10, border: `1px solid ${selectedShift?.value === shift.value ? '#6366f1' : 'var(--border)'}`, background: selectedShift?.value === shift.value ? 'rgba(99,102,241,0.1)' : 'white', cursor: 'pointer' }}>{shift.label}</button>
                    ))}
                  </div>
                </div>
              )}

              {selectedShift && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                  {selectedShift.slots.map(slot => (
                    <button type="button" key={slot} onClick={() => setForm(p => ({ ...p, appointment_time: slot }))} style={{ padding: '0.5rem', borderRadius: 8, border: `1px solid ${form.appointment_time === slot ? '#6366f1' : 'var(--border)'}`, background: form.appointment_time === slot ? '#6366f1' : 'white', color: form.appointment_time === slot ? 'white' : 'inherit', cursor: 'pointer' }}>{formatTime(slot)}</button>
                  ))}
                </div>
              )}

              <textarea name="reason" className="form-input" value={form.reason} onChange={handleChange} placeholder="Reason for visit..." />

              <button type="submit" className="btn btn-primary" disabled={loading || !availStatus.available} style={{ justifyContent: 'center', background: !availStatus.available ? '#94a3b8' : '#6366f1', cursor: !availStatus.available ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Processing...' : !availStatus.available ? 'Doctor on Leave' : editingRequestId ? 'Confirm & Book Appointment' : 'Confirm Appointment'}
              </button>
            </form>

            <div>
              {selectedDoctor && (
                <div className="glass-card" style={{ padding: '1rem', marginBottom: '1rem' }}>
                  <div style={{ fontWeight: 700 }}>{selectedDoctor.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{selectedDoctor.specialization}</div>
                </div>
              )}
              {(form.patient_name || form.appointment_date) && (
                <div className="glass-card" style={{ padding: '1rem' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Summary</div>
                  <div style={{ fontSize: 13, fontWeight: 800 }}>{form.patient_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{form.patient_email} {form.patient_blood && `• Blood: ${form.patient_blood}`}</div>
                  <div style={{ fontSize: 13, marginTop: 8 }}>{form.appointment_date} {form.appointment_time}</div>
                </div>
              )}
            </div>
          </div>
        )
      ) : activeTab === 'requests' ? (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontWeight: 800 }}>Patient Requested Appointments</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Review and confirm appointments requested via the patient portal.</p>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Desired Date</th>
                <th>Desired Time</th>
                <th>Doctor</th>
                <th>Reason</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingRequests.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem' }}>
                  <Inbox size={32} opacity={0.2} style={{ marginBottom: 12 }} /><br />
                  No pending requests from patients
                </td></tr>
              ) : (
                pendingRequests.map(req => (
                  <tr key={req.id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{req.patient_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{req.patient_phone}</div>
                    </td>
                    <td>{new Date(req.appointment_date).toLocaleDateString()}</td>
                    <td>{formatTime(req.appointment_time)}</td>
                    <td>Dr. {req.doctor_name}</td>
                    <td style={{ fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{req.reason || 'N/A'}</td>
                    <td>
                      <button className="btn btn-primary" onClick={() => handleApproveRequest(req)} style={{ padding: '6px 12px', fontSize: 12 }}>Review & Confirm</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontWeight: 800 }}>Arrival Queue</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Check-in patients for the selected date.</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input type="date" className="form-input" value={arrivalsDate} onChange={e => setArrivalsDate(e.target.value)} style={{ width: 160 }} />
              <button className="btn btn-secondary" onClick={() => setArrivalsDate(new Date().toLocaleDateString('en-CA'))}>Today</button>
            </div>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Token</th>
                <th>Patient</th>
                <th>Time</th>
                <th>Doctor</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {todayAppts.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No records for this date</td></tr>
              ) : (
                todayAppts.map(appt => (
                  <tr key={appt.id}>
                    <td>{appt.token_number || '-'}</td>
                    <td>{appt.patient_name}</td>
                    <td>{formatTime(appt.appointment_time)}</td>
                    <td>Dr. {appt.doctor_name}</td>
                    <td>{appt.status}</td>
                    <td>
                      {appt.status !== 'checked_in' && (
                        <button className="btn btn-primary" onClick={() => handleCheckIn(appt.id)} style={{ padding: '4px 10px', fontSize: 12 }}>Check-in</button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
