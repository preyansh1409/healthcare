import { useState, useEffect } from 'react';
import { getPatients, createPatient, createAppointment, getTodayAppointments, getAppointments, getDoctors, checkInAppointment } from '../../services/api';
import { Calendar, Plus, Search, Eye, Edit, Users, FileUp, ClipboardCheck, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PatientForm from '../../components/PatientForm';
import toast from 'react-hot-toast';
import LabReportUploadModal from '../../components/LabReportUploadModal';


export default function PatientRegistration() {
  const [patients, setPatients] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [editPatient, setEditPatient] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [loading, setLoading] = useState(true);
  const [allAppts, setAllAppts] = useState([]);
  const [filterDate, setFilterDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();
  const basePath = user?.role === 'admin' ? '/admin' : '/doctor';
  const isReceptionist = user?.role === 'admin'; // Admin acts as receptionist in this portal

  useEffect(() => { loadPatients(); }, []);
  useEffect(() => {
    let list = patients;

    if (search) {
      // Global Search: Ignore date/doctor filters to find any patient matching the search
      list = list.filter(p =>
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.phone?.includes(search)
      );
    } else {
      // Schedule View: Apply Doctor and Date filters
      if (selectedDoctorId) {
        const patientIdsForDoctor = new Set(allAppts.filter(a => a.doctor_id == selectedDoctorId).map(a => a.patient_id));
        list = list.filter(p => patientIdsForDoctor.has(p.id));
      }
      if (filterDate) {
        const patientIdsOnDate = new Set(allAppts.filter(a => new Date(a.appointment_date).toLocaleDateString('en-CA') === filterDate).map(a => a.patient_id));
        list = list.filter(p => {
          const regDate = new Date(p.created_at).toLocaleDateString('en-CA');
          return regDate === filterDate || patientIdsOnDate.has(p.id);
        });
      }
    }
    setFiltered(list);
  }, [search, patients, selectedDoctorId, allAppts, filterDate]);

  const loadPatients = async () => {
    try {
      const [{ data: patientsRes }, { data: apptRes }, { data: doctorsRes }] = await Promise.all([
        getPatients(),
        user?.role === 'doctor' ? getTodayAppointments() : getAppointments(),
        getDoctors()
      ]);

      setDoctors(doctorsRes.data);
      setAllAppts(apptRes.data);

      let list = patientsRes.data;
      if (user?.role === 'doctor') {
        const todayPatientIds = new Set(apptRes.data.map(a => a.patient_id));
        list = list.filter(p => todayPatientIds.has(p.id));
      }

      setPatients(list);
      setFiltered(list);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  const handleCheckIn = async (patientId) => {
    if (loading) return; // Guard against multiple rapid clicks
    setLoading(true);
    // 0. Refresh appointments first to be absolutely sure we don't duplicate
    let freshAppts = allAppts;
    try {
      const { data } = user?.role === 'doctor' ? await getTodayAppointments() : await getAppointments();
      freshAppts = data.data;
      setAllAppts(freshAppts);
    } catch (err) {
      console.error('Failed to sync appointments before check-in');
    }

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // 1. Find today's pending appointment for this patient
    let appt = freshAppts.find(a => {
      const aDate = new Date(a.appointment_date);
      const aDateStr = `${aDate.getFullYear()}-${String(aDate.getMonth() + 1).padStart(2, '0')}-${String(aDate.getDate()).padStart(2, '0')}`;
      return a.patient_id == patientId && aDateStr === todayStr && (a.status === 'pending' || a.status === 'confirmed');
    });

    // 2. If no appointment, try to auto-create a walk-in if a doctor is selected
    if (!appt) {
      if (!selectedDoctorId) {
        toast.error('No appointment found. Please select a doctor from the filter above for this walk-in.');
        return;
      }

      setLoading(true);
      try {
        const createRes = await createAppointment({
          patient_id: patientId,
          doctor_id: parseInt(selectedDoctorId),
          appointment_date: todayStr,
          appointment_time: new Date().toTimeString().split(' ')[0], // HH:MM:SS
          reason: 'Walk-in Visit',
          shift: 'morning'
        });

        const newApptId = createRes.data.appointmentId;
        const { data: checkInData } = await checkInAppointment(newApptId);
        toast.success(`Walk-in Registered & Billed! Token #${checkInData.token}`);
        loadPatients();
      } catch (err) {
        console.error('Check-in error:', err);
        const errorMsg = err.response?.data?.message || err.message || 'Auto-booking failed';
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
      return;
    }

    // 3. Normal check-in if appt exists
    try {
      const { data } = await checkInAppointment(appt.id);
      toast.success(`Checked in! Token #${data.token}`);
      loadPatients();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontWeight: 900, fontSize: 26 }}>OPD Patients <span className="gradient-text">{isReceptionist ? 'Management' : "Today's Schedule"}</span></h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
            {isReceptionist
              ? (search ? `Found ${filtered.length} matching patients` : `Viewing ${filtered.length} patients for ${filterDate === new Date().toLocaleDateString('en-CA') ? 'Today' : filterDate}`)
              : `You have ${filtered.length} patients scheduled for today`}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={16} /> Register Patient
        </button>
      </div>

      {/* Search & Filter */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: '100%', zIndex: 1010 }}>
          <Search size={15} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            className="form-input"
            style={{ paddingLeft: '3rem', height: 48, borderRadius: 12, fontSize: 15 }}
            placeholder="Search by name or phone..."
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          />

          {showSuggestions && search && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                marginTop: '0.5rem',
                boxShadow: '0 15px 30px rgba(0,0,0,0.2)',
                zIndex: 9999,
                maxHeight: '300px',
                overflowY: 'auto',
                border: '1px solid #e2e8f0'
              }}
            >
              {patients
                .filter(p =>
                  p.name?.toLowerCase().includes(search.toLowerCase()) ||
                  p.phone?.includes(search)
                )
                .slice(0, 10)
                .map(p => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setSearch(p.name);
                      setShowSuggestions(false);
                    }}
                    style={{
                      padding: '0.75rem 1rem',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f1f5f9',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, color: '#1e293b' }}>{p.name}</span>
                      <span style={{ fontSize: '11px', background: '#eff6ff', color: '#1e40af', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>{p.phone}</span>
                    </div>
                  </div>
                ))}
              {patients.filter(p => p.name?.toLowerCase().includes(search.toLowerCase())).length === 0 && (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                  No match found for "<b>{search}</b>"
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ position: 'relative', width: 170 }}>
          <Calendar size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6366f1' }} />
          <input type="date" className="form-input" style={{ paddingLeft: '2.5rem' }} value={filterDate} onChange={e => setFilterDate(e.target.value)} />
        </div>

        {isReceptionist && (
          <div style={{ position: 'relative', width: '100%', maxWidth: 300 }}>
            <select
              className="form-input"
              style={{ appearance: 'none', paddingRight: '2rem' }}
              value={selectedDoctorId}
              onChange={e => setSelectedDoctorId(e.target.value)}
            >
              <option value="">All Doctors / General List</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id}>Filter: Dr. {d.name} ({d.specialization})</option>
              ))}
            </select>
            <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-secondary)' }}>▼</div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="glass-card" style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Age / Gender</th>
              <th>Phone</th>
              <th>Blood</th>
              <th>Registered</th>
              {isReceptionist && <th style={{ textAlign: 'center', width: '240px' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr
                key={p.id}
                onClick={() => navigate(`${basePath}/patients/${p.id}`)}
                style={{ cursor: 'pointer' }}
                className="hover-row"
              >
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, #6366f1, #0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white' }}>
                      {p.name?.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#6366f1' }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{p.email || 'No email'}</div>
                    </div>
                  </div>
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>{p.age} yrs · {p.gender}</td>
                <td>{p.phone}</td>
                <td>
                  {p.blood_group ? (
                    <span className="badge" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>{p.blood_group}</span>
                  ) : '—'}
                </td>
                <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{new Date(p.created_at).toLocaleDateString()}</td>
                {isReceptionist && (
                  <td onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', alignItems: 'center' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ minWidth: '100px', padding: '8px 16px', fontSize: 13, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontWeight: 700, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)' }}
                        onClick={() => navigate(`${basePath}/patients/${p.id}`)}
                      >
                        <Eye size={16} /> View
                      </button>

                      {allAppts.some(a => {
                        const today = new Date();
                        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                        const aDate = new Date(a.appointment_date);
                        const aDateStr = `${aDate.getFullYear()}-${String(aDate.getMonth() + 1).padStart(2, '0')}-${String(aDate.getDate()).padStart(2, '0')}`;
                        return a.patient_id == p.id && aDateStr === todayStr && (a.status === 'checked_in' || a.status === 'completed');
                      }) ? (
                        (() => {
                          const today = new Date();
                          const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                          const appt = allAppts.find(a => {
                            const aDate = new Date(a.appointment_date);
                            const aDateStr = `${aDate.getFullYear()}-${String(aDate.getMonth() + 1).padStart(2, '0')}-${String(aDate.getDate()).padStart(2, '0')}`;
                            return a.patient_id == p.id && aDateStr === todayStr && (a.status === 'checked_in' || a.status === 'completed');
                          });

                          if (appt?.status === 'completed') {
                            return (
                              <div style={{ minWidth: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <div style={{
                                  padding: '8px 20px',
                                  background: 'rgba(16,185,129,0.1)',
                                  color: '#10b981',
                                  border: '1.5px solid #10b981',
                                  borderRadius: 10,
                                  fontSize: 13,
                                  fontWeight: 800,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8,
                                  boxShadow: '0 2px 6px rgba(16,185,129,0.1)'
                                }}>
                                  <CheckCircle size={16} /> Already Visited
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div style={{ minWidth: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <div style={{
                                padding: '8px 20px',
                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                color: 'white',
                                borderRadius: 10,
                                fontSize: 14,
                                fontWeight: 800,
                                boxShadow: '0 4px 10px rgba(16,185,129,0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8
                              }}>
                                <ClipboardCheck size={16} /> Token #{appt?.token_number || '?'}
                              </div>
                            </div>
                          );
                        })()
                      ) : (
                        <button
                          className="btn btn-primary"
                          style={{ minWidth: '100px', padding: '8px 16px', fontSize: 13, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontWeight: 700, boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}
                          onClick={(e) => { e.stopPropagation(); handleCheckIn(p.id); }}
                        >
                          <Users size={16} /> Present
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading patients...</div>}
        {!loading && filtered.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Users size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <p>No patients found</p>
          </div>
        )}
      </div>

      {showForm && (
        <PatientForm
          patient={editPatient}
          onClose={() => { setShowForm(false); setEditPatient(null); }}
          onSuccess={loadPatients}
        />
      )}
      {showUpload && (
        <LabReportUploadModal
          patient={editPatient}
          onClose={() => { setShowUpload(false); setEditPatient(null); }}
          onSuccess={loadPatients}
        />
      )}
    </div>
  );
}

