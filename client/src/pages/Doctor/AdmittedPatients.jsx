import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAdmittedPatients, getDoctors, updateBed } from '../../services/api';
import { Bed, User, Phone, MapPin, Activity, Stethoscope, Loader, FileText, Save, X, Pill, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdmittedPatients() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [doctorInfo, setDoctorInfo] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [admData, setAdmData] = useState({ reason: '', treatment: '' });
  const [updating, setUpdating] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [vitals, setVitals] = useState({ bpm: '--', spo2: '--', temp: '--' });

  useEffect(() => {
    const loadAdmitted = async () => {
      setLoading(true);
      try {
        const doctorsRes = await getDoctors();
        const myDoc = doctorsRes.data.data.find(d => d.email === user.email);
        if (myDoc) {
          setDoctorInfo(myDoc);
          const res = await getAdmittedPatients(myDoc.id);
          setPatients(res.data.data);
        }
      } catch (err) {
        toast.error('Failed to load admitted patients');
      } finally {
        setLoading(false);
      }
    };
    loadAdmitted();
  }, [user.email]);

  const openPatientDetails = (p) => {
    setSelectedPatient(p);
    setAdmData({ reason: p.admission_reason || '', treatment: p.treatment_given || '' });
    setShowDetails(true);
    setEditMode(false);
  };

  const handleUpdateTreatment = async () => {
    setUpdating(true);
    try {
      await updateBed(selectedPatient.bed_id, {
        occupied: 1,
        patient_id: selectedPatient.id,
        doctor_id: doctorInfo.id,
        ward: selectedPatient.ward,
        admission_reason: admData.reason,
        treatment_given: admData.treatment
      });
      toast.success('Clinical Chart Updated!');
      setShowDetails(false);
      // Refresh list
      const res = await getAdmittedPatients(doctorInfo.id);
      setPatients(res.data.data);
    } catch {
      toast.error('Failed to update treatment');
    } finally {
      setUpdating(false);
    }
  };

  const startIoTScan = () => {
    setScanning(true);
    setVitals({ bpm: '...', spo2: '...', temp: '...' });
    
    setTimeout(() => {
      setVitals({
        bpm: Math.floor(Math.random() * (95 - 70) + 70),
        spo2: Math.floor(Math.random() * (100 - 95) + 95),
        temp: (Math.random() * (99.5 - 97.5) + 97.5).toFixed(1)
      });
      setScanning(false);
      toast.success('IoT Vitals Synced!');
    }, 2500);
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '8px' }}>
      <Loader size={20} className="spinner" /> <span>Fetching admitted cases...</span>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: 24 }}>Admitted Patients</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Patients currently in <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{doctorInfo?.department}</span> related wards
          </p>
        </div>
        <div style={{ background: 'var(--bg-card)', padding: '0.5rem 1rem', borderRadius: 12, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={16} color="#10b981" />
          <span style={{ fontSize: 13, fontWeight: 600 }}>{patients.length} Active Admissions</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
        {patients.map(p => (
          <div key={p.id} className="glass-card fade-in" 
            style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden', cursor: 'pointer', border: '1px solid var(--border)' }}
            onClick={() => openPatientDetails(p)}
          >
            {/* Ward Badge */}
            <div style={{ 
              position: 'absolute', top: 0, right: 0, padding: '0.4rem 1rem', 
              background: 'linear-gradient(135deg, #6366f1, #0ea5e9)', 
              color: 'white', fontSize: 11, fontWeight: 800, borderBottomLeftRadius: 12,
              textTransform: 'uppercase'
            }}>
              {p.ward} WARD
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={28} color="#6366f1" />
              </div>
              <div>
                <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{p.name}</h3>
                <div style={{ display: 'flex', gap: '0.75rem', fontSize: 12, color: 'var(--text-secondary)' }}>
                  <span>{p.age} Yrs</span>
                  <span>•</span>
                  <span>{p.gender}</span>
                  <span>•</span>
                  <span style={{ color: '#ef4444', fontWeight: 700 }}>{p.blood_group}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 12, marginBottom: '1rem' }}>
              <div>
                <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: 4 }}>Bed Assignment</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Bed size={14} color="var(--primary)" />
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{p.bed_number}</span>
                </div>
              </div>
              <div>
                <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: 4 }}>Status</p>
                <span className="badge badge-confirmed" style={{ fontSize: 10 }}>Monitored</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-secondary)', fontSize: 13 }}>
                <Phone size={14} />
                <span>{p.phone}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-secondary)', fontSize: 13 }}>
                <MapPin size={14} />
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.address}</span>
              </div>
            </div>

            <button className="btn btn-primary" style={{ width: '100%', marginTop: '1.25rem', justifyContent: 'center', fontSize: 13 }} onClick={() => navigate(`/doctor/prescribe/${p.id}`)}>
              Add Prescription / History
            </button>
          </div>
        ))}

        {patients.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '5rem 2rem', background: 'var(--bg-card)', borderRadius: 20, border: '1px dashed var(--border)' }}>
            <Stethoscope size={48} style={{ margin: '0 auto 1.5rem', opacity: 0.2 }} />
            <h3 style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>No Admitted Patients</h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: 300, margin: '0 auto' }}>
              Currently there are no patients admitted in the {doctorInfo?.department} department.
            </p>
          </div>
        )}
      </div>

      {showDetails && selectedPatient && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: '850px', borderRadius: 24, overflow: 'hidden', color: '#1a1a1a', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            
            {/* Modal Header */}
            <div style={{ background: 'linear-gradient(135deg, #1a1a1a, #334155)', padding: '1.25rem 2rem', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={24} />
                </div>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>{selectedPatient.name}</h2>
                  <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.8, textTransform: 'uppercase', letterSpacing: 1 }}>
                    {selectedPatient.ward} WARD • BED {selectedPatient.bed_number}
                  </div>
                </div>
              </div>
              <button onClick={() => setShowDetails(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', padding: 8, borderRadius: 10 }}>
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Clinical Content */}
            <div style={{ padding: '2rem', overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
                {/* IoT Vitals Monitor */}
                <div style={{ background: '#ffffff', borderRadius: 20, padding: '1.5rem', position: 'relative', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'rgba(52, 211, 153, 0.5)', boxShadow: '0 0 15px #10b981', transform: scanning ? 'translateY(150px)' : 'translateY(-10px)', transition: scanning ? 'transform 2.5s linear' : 'none', zIndex: 5 }}></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Activity size={16} color="#10b981" className={scanning ? "heartbeat" : ""} />
                      <span style={{ color: '#1e293b', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1.5 }}>Live IoT Monitor</span>
                    </div>
                    {!scanning && (
                      <button onClick={startIoTScan} style={{ background: '#f0fdf4', border: '1px solid #10b981', color: '#10b981', fontSize: 9, fontWeight: 900, padding: '2px 8px', borderRadius: 4, cursor: 'pointer' }}>
                        SYNC SCAN
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 9, color: '#64748b', marginBottom: 4 }}>BPM</div>
                      <div style={{ fontSize: 28, fontWeight: 900, color: '#1e293b' }}>{vitals.bpm}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 9, color: '#64748b', marginBottom: 4 }}>SpO2 (%)</div>
                      <div style={{ fontSize: 28, fontWeight: 900, color: '#0ea5e9' }}>{vitals.spo2}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 9, color: '#64748b', marginBottom: 4 }}>TEMP (°F)</div>
                      <div style={{ fontSize: 28, fontWeight: 900, color: '#f59e0b' }}>{vitals.temp}</div>
                    </div>
                  </div>
                </div>

                {/* Admission Status */}
                <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: 20, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Clock size={16} color="#6366f1" />
                    </div>
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Admission Time</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{new Date().toLocaleTimeString()}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Activity size={16} color="#10b981" />
                    </div>
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Patient Status</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{scanning ? 'SCANNING...' : 'MONITORED'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Diagnosis Field */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: 12, color: '#475569', marginBottom: 8, textTransform: 'uppercase' }}>
                  <FileText size={14} /> Reason for Admittance / Chief Complaint
                </div>
                {editMode ? (
                  <textarea 
                    value={admData.reason}
                    onChange={e => setAdmData({ ...admData, reason: e.target.value })}
                    style={{ width: '100%', padding: '1rem', borderRadius: 12, border: '2px solid #6366f1', height: 80, fontSize: 14, background: '#f1f5f9' }}
                  />
                ) : (
                  <div style={{ padding: '1.25rem', background: 'rgba(99,102,241,0.05)', borderRadius: 16, border: '1px dashed rgba(99,102,241,0.2)', fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {admData.reason || 'No specific clinical reason recorded.'}
                  </div>
                )}
              </div>

              {/* Treatment Chart Field */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: 12, color: '#475569', marginBottom: 8, textTransform: 'uppercase' }}>
                  <Pill size={14} /> Initial Treatment & Medicine Chart
                </div>
                {editMode ? (
                  <textarea 
                    value={admData.treatment}
                    onChange={e => setAdmData({ ...admData, treatment: e.target.value })}
                    style={{ width: '100%', padding: '1rem', borderRadius: 12, border: '2px solid #6366f1', height: 200, fontSize: 14, background: '#f1f5f9' }}
                  />
                ) : (
                  <div style={{ padding: '1.25rem', background: 'rgba(16,185,129,0.05)', borderRadius: 16, border: '1px dashed rgba(16,185,129,0.2)', fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap', color: '#065f46' }}>
                    {admData.treatment || 'Treatment chart is being drafted.'}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ padding: '1.5rem 2rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              {editMode ? (
                <>
                  <button onClick={() => setEditMode(false)} className="btn" style={{ background: 'white', color: '#64748b', border: '1px solid #e2e8f0', padding: '0.6rem 1.5rem' }}>
                    CANCEL CHANGES
                  </button>
                  <button onClick={handleUpdateTreatment} disabled={updating} className="btn" style={{ background: '#6366f1', color: 'white', padding: '0.6rem 1.5rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {updating ? <Loader className="spinner" size={16} /> : <Save size={16} />}
                    {updating ? 'SAVING...' : 'SAVE TREATMENT UPDATES'}
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setEditMode(true)} className="btn" style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white', padding: '0.6rem 2.5rem', fontWeight: 800 }}>
                    EDIT CLINICAL CHART
                  </button>
                  <button onClick={() => navigate(`/doctor/prescribe/${selectedPatient.id}`)} className="btn btn-primary" style={{ padding: '0.6rem 2.5rem', fontWeight: 800 }}>
                    ADD NEW PRESCRIPTION ℞
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
