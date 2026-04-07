import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPatientById, addPrescription, getPatientVitals, getDiagnosis } from '../../services/api';
import { ArrowLeft, Heart, Activity, Thermometer, Wind, Brain, Plus, X, Pill, Printer, ClipboardList, FileUp } from 'lucide-react';
import toast from 'react-hot-toast';
import LabReportUploadModal from '../../components/LabReportUploadModal';

export default function PatientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [vitals, setVitals] = useState(null);
  const [showRx, setShowRx] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [symptoms, setSymptoms] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [rx, setRx] = useState({ diagnosis: '', notes: '', medications: [{ name: '', dosage: '', frequency: '' }] });
  const [loading, setLoading] = useState(true);
  const [viewingHistory, setViewingHistory] = useState(null);

  useEffect(() => { fetchPatient(); }, [id]);

  const fetchPatient = async () => {
    try {
      const { data } = await getPatientById(id);
      setPatient(data.data);
    } catch { toast.error('Patient not found'); navigate(-1); }
    finally { setLoading(false); }
  };

  const fetchVitals = async () => {
    try {
      const { data } = await getPatientVitals(id);
      setVitals(data.data);
      toast.success('Vitals fetched from IoT device');
    } catch { toast.error('IoT device not connected'); }
  };

  const handleAiDiagnosis = async () => {
    if (!symptoms.trim()) { toast.error('Enter symptoms first'); return; }
    setLoadingAi(true);
    try {
      const { data } = await getDiagnosis(symptoms);
      setAiResult(data.result);
    } catch { toast.error('AI service unavailable'); }
    finally { setLoadingAi(false); }
  };

  const handleAddMed = () => setRx(p => ({ ...p, medications: [...p.medications, { name: '', dosage: '', frequency: '' }] }));
  const handleRemoveMed = (i) => setRx(p => ({ ...p, medications: p.medications.filter((_, idx) => idx !== i) }));
  const updateMed = (i, field, val) => setRx(p => ({ ...p, medications: p.medications.map((m, idx) => idx === i ? { ...m, [field]: val } : m) }));

  const handleSubmitPrescription = async (e) => {
    e.preventDefault();
    try {
      await addPrescription(id, rx);
      toast.success('Prescription added successfully');
      setShowRx(false);
      fetchPatient();
    } catch { toast.error('Failed to add prescription'); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>Loading patient details...</div>;
  if (!patient) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Back */}
      <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 14 }}>
        <ArrowLeft size={16} /> Back
      </button>

      {/* Patient Header */}
      <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg, #6366f1, #0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900, color: 'white' }}>
            {patient.name?.charAt(0)}
          </div>
          <div>
            <h1 style={{ fontWeight: 900, fontSize: 22 }}>{patient.name}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{patient.age} yrs · {patient.gender} · {patient.blood_group || 'Blood group N/A'}</p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>📞 {patient.phone} · ✉️ {patient.email || 'N/A'}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={() => setShowUpload(true)} style={{ color: '#6366f1' }}>
            <FileUp size={16} /> Upload Report
          </button>
          <button className="btn btn-secondary" onClick={() => fetchVitals()}>
            <Activity size={16} color={vitals ? '#10b981' : 'var(--text-secondary)'} /> Get IoT Vitals
          </button>
          <button className="btn btn-primary" onClick={() => setShowRx(true)}>
            <Plus size={16} /> Add Prescription
          </button>
        </div>
      </div>

      {/* Master Patient Container */}
      <div className="glass-card fade-in" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

        {/* Section 1: Personal Information */}
        <div>
          <h3 style={{ fontWeight: 800, marginBottom: '1.25rem', fontSize: 17, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
              <Plus size={18} />
            </span>
            Personal Information
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            {[
              { label: 'Full Name', value: patient.name },
              { label: 'Age / Gender', value: `${patient.age} Yrs · ${patient.gender}` },
              { label: 'Blood Group', value: patient.blood_group || 'Not Specified' },
              { label: 'Contact Number', value: patient.phone },
              { label: 'Email Address', value: patient.email || 'N/A' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{item.label}</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{item.value || '—'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: IoT Vitals (Conditional) */}
        {vitals && (
          <div style={{ padding: '1.5rem', borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ fontWeight: 800, marginBottom: '1.25rem', fontSize: 15, color: '#10b981' }}>🩺 Live IoT Vitals</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
              {[
                { label: 'Heart Rate', value: `${vitals.heart_rate} bpm`, icon: Heart, color: '#ef4444' },
                { label: 'Blood Pressure', value: vitals.blood_pressure, icon: Activity, color: '#6366f1' },
                { label: 'SpO2', value: `${vitals.spo2}%`, icon: Wind, color: '#0ea5e9' },
                { label: 'Temperature', value: `${vitals.temperature}°C`, icon: Thermometer, color: '#f59e0b' },
              ].map(v => (
                <div key={v.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: v.color }}>{v.value}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>{v.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 3: Prescription History */}
        <div>
          <h3 style={{ fontWeight: 800, marginBottom: '1.25rem', fontSize: 17, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <Pill size={18} />
            </span>
            Medical History & Prescriptions
          </h3>
          {patient.prescriptions?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {patient.prescriptions.map(p => (
                <div key={p.id} style={{ padding: '1.25rem', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: '#ef4444' }}>{p.diagnosis}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>{new Date(p.created_at).toLocaleDateString()}</span>
                      <button
                        onClick={() => setViewingHistory(p)}
                        style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#6366f1', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        <Printer size={12} /> View RX
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <p style={{ fontSize: 13, color: 'var(--text-primary)', fontStyle: 'italic' }}>{p.notes || 'No secondary notes.'}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Prescribed by Dr. {p.doctor_name}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.01)', borderRadius: 12, border: '1px dashed var(--border)' }}>
              No prescription history available for this patient.
            </div>
          )}
        </div>

      </div>

      {/* HISTORICAL PRESCRIPTION VIEW MODAL (RX FORMAT) */}
      {viewingHistory && (
        <div className="modal-overlay" style={{ background: 'rgba(0,0,0,0.9)', zIndex: 3000 }}>
          <div className="glass-card" style={{ maxWidth: 800, width: '95%', padding: '0', background: 'white', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '0.75rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, fontSize: 13, color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: 8 }}>
                <ClipboardList size={14} /> PRESCRIPTION PREVIEW • {new Date(viewingHistory.created_at).toLocaleDateString()}
              </span>
              <button onClick={() => setViewingHistory(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ padding: '2rem 3rem', background: 'white', color: '#1a1a1a', maxHeight: '75vh', overflowY: 'auto' }}>
              {/* Document Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '3px solid #ef4444', paddingBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#ef4444' }}>D<span style={{ color: '#1a1a1a' }}>octor's</span> RX</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#666', textTransform: 'uppercase' }}>Official Medical Record</div>
                </div>
                <div style={{ fontSize: 32, fontWeight: 900 }}>℞</div>
              </div>

              {/* Patient/Doctor Block */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', border: '1px solid #ddd', fontSize: 11, marginBottom: '2rem' }}>
                <div style={{ padding: 12, borderRight: '1px solid #ddd' }}><b>PATIENT:</b> <span style={{ textTransform: 'uppercase' }}>{patient.name}</span></div>
                <div style={{ padding: 12, borderRight: '1px solid #ddd' }}><b>AGE/GENDER:</b> {patient.age} / {patient.gender}</div>
                <div style={{ padding: 12 }}><b>DOCTOR:</b> DR. {viewingHistory.doctor_name?.toUpperCase()}</div>
              </div>

              {/* Clinical Details */}
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#999', textTransform: 'uppercase', marginBottom: 6 }}>Clinical Diagnosis</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#000' }}>{viewingHistory.diagnosis}</div>
              </div>

              {/* Medications Table */}
              <div style={{ border: '1px solid #eee', borderRadius: 8, overflow: 'hidden', marginBottom: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', background: '#f8fafc', fontWeight: 800, fontSize: 11, padding: '10px 15px', borderBottom: '1px solid #eee' }}>
                  <div>Medication</div>
                  <div>Dosage</div>
                  <div>Duration</div>
                </div>
                {(() => {
                  let meds = [];
                  try { meds = typeof viewingHistory.medications === 'string' ? JSON.parse(viewingHistory.medications) : viewingHistory.medications; } catch (e) { }
                  if (!Array.isArray(meds)) meds = [];
                  return meds.length > 0 ? meds.map((m, k) => (
                    <div key={k} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', fontSize: 13, padding: '12px 15px', borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ fontWeight: 700 }}>• {m.name}</div>
                      <div>{m.dosage}</div>
                      <div>{m.duration || 'As directed'}</div>
                    </div>
                  )) : (
                    <div style={{ padding: '1.5rem', textAlign: 'center', fontSize: 12, color: '#999' }}>No specific medications listed.</div>
                  );
                })()}
              </div>

              {/* Advice/Notes */}
              <div style={{ background: '#fdfdfd', padding: 18, borderLeft: '4px solid #ef4444', marginBottom: '3rem' }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#999', textTransform: 'uppercase', marginBottom: 8 }}>Doctor's Advice & Notes</div>
                <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6 }}>{viewingHistory.notes || 'Maintain hydration and follow prescribed dosage.'}</div>
              </div>

              {/* Signature */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', textAlign: 'center' }}>
                <div>
                  <div style={{ borderBottom: '1px solid #000', width: 160, marginBottom: 6 }}></div>
                  <div style={{ fontSize: 12, fontWeight: 800 }}>Dr. {viewingHistory.doctor_name || 'Physician'}</div>
                  <div style={{ fontSize: 10, color: '#666' }}>Certified Medical Practitioner</div>
                </div>
              </div>
            </div>

            <div style={{ padding: '1.25rem', borderTop: '1px solid #e2e8f0', background: '#fff' }}>
              <button onClick={() => window.print()} className="btn btn-primary" style={{ width: '100%', height: 48, justifyContent: 'center', fontSize: 15 }}>
                <Printer size={18} /> PRINT OFFICIAL COPY
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <LabReportUploadModal
          patient={patient}
          onClose={() => setShowUpload(false)}
          onSuccess={fetchPatient}
        />
      )}

      {/* Add Prescription Modal */}
      {showRx && (
        <div className="modal-overlay">
          <div className="glass-card" style={{ width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
              <h3 style={{ fontWeight: 700 }}>Add Prescription</h3>
              <button onClick={() => setShowRx(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmitPrescription} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label">Diagnosis *</label>
                <input className="form-input" value={rx.diagnosis} onChange={e => setRx(p => ({ ...p, diagnosis: e.target.value }))} placeholder="Primary diagnosis" required />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label className="form-label" style={{ margin: 0 }}>Medications</label>
                  <button type="button" onClick={handleAddMed} className="btn btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: 12 }}><Plus size={12} /> Add</button>
                </div>
                {rx.medications.map((med, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input className="form-input" placeholder="Drug name" value={med.name} onChange={e => updateMed(i, 'name', e.target.value)} style={{ fontSize: 13 }} />
                    <input className="form-input" placeholder="Dosage" value={med.dosage} onChange={e => updateMed(i, 'dosage', e.target.value)} style={{ fontSize: 13 }} />
                    <input className="form-input" placeholder="Frequency" value={med.frequency} onChange={e => updateMed(i, 'frequency', e.target.value)} style={{ fontSize: 13 }} />
                    {i > 0 && <button type="button" onClick={() => handleRemoveMed(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><X size={16} /></button>}
                  </div>
                ))}
              </div>
              <div>
                <label className="form-label">Notes</label>
                <textarea className="form-input" rows={3} value={rx.notes} onChange={e => setRx(p => ({ ...p, notes: e.target.value }))} placeholder="Additional notes or instructions" style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowRx(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary"><Pill size={15} /> Save Prescription</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
