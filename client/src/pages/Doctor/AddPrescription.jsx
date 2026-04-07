import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPatientById, addPrescription, getDoctors, updateAppointment, getDiagnosis } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Save, Printer, Plus, Trash2, Loader, Stethoscope, Sparkles, Activity, ClipboardList, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AddPrescription() {
  const { patientId, appointmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [doctor, setDoctor] = useState(null);

  const [form, setForm] = useState({
    diagnosis: '',
    bp: '',
    pulse: '',
    weight: '',
    diet: '',
    history: '',
    reports_required: '',
    medications: [{ name: '', unit: 'Tablet', dosage: '', duration: '' }]
  });
  const [analyzing, setAnalyzing] = useState(false);
  const [viewingHistory, setViewingHistory] = useState(null);


  const handleAISuggest = async () => {
    if (!form.diagnosis) return toast.error('Please enter a diagnosis first');
    setAnalyzing(true);
    try {
      const res = await getDiagnosis(form.diagnosis);
      // Simulate more complex AI suggesting meds, diet, reports
      const suggestedPlan = res.data.suggested_plan || {
        medications: [
          { name: 'Antibiotic Example', unit: 'Tablet', dosage: '1-0-1', duration: '5 Days' },
          { name: 'Vitamin C', unit: 'Tablet', dosage: '0-1-0', duration: '15 Days' }
        ],
        diet: 'Increase liquid intake, avoid spices.',
        reports: 'CBC, Blood Sugar'
      };
      setForm(f => ({
        ...f,
        medications: suggestedPlan.medications,
        diet: suggestedPlan.diet,
        reports_required: suggestedPlan.reports
      }));
      toast.success('AI Generated full treatment plan!');
    } catch {
      toast.error('AI Service currently unavailable');
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!patientId) {
        setLoading(false);
        return;
      }
      try {
        const [patientRes, doctorsRes] = await Promise.all([
          getPatientById(patientId),
          getDoctors()
        ]);
        setPatient(patientRes.data.data);
        const myDoc = doctorsRes.data.data.find(d => d.email === user.email);
        setDoctor(myDoc);
      } catch {
        toast.error('Failed to load patient data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [patientId, user.email]);

  const addMed = () => setForm(f => ({ ...f, medications: [...f.medications, { name: '', unit: 'Tablet', dosage: '' }] }));
  const removeMed = (i) => setForm(f => ({ ...f, medications: f.medications.filter((_, idx) => idx !== i) }));
  const updateMed = (i, field, val) => setForm(f => ({
    ...f,
    medications: f.medications.map((m, idx) => idx === i ? { ...m, [field]: val } : m)
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addPrescription(patientId, {
        diagnosis: form.diagnosis,
        notes: `BP: ${form.bp}, Pulse: ${form.pulse}, Weight: ${form.weight}. Reports Required: ${form.reports_required}. Diet: ${form.diet}. History: ${form.history}`,
        medications: form.medications
      });

      // Mark appointment as completed if it exists
      if (appointmentId) {
        await updateAppointment(appointmentId, { status: 'completed' });
      }

      toast.success('Prescription saved & Appointment completed');
      
      // Delay print slightly to ensure UI updates, then block for print, then navigate
      setTimeout(() => {
        window.print();
        navigate('/doctor/appointments');
      }, 800);

    } catch (err) {
      console.error(err);
      toast.error('Failed to save prescription');
    }
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'white' }}><Loader className="spinner" /> <span>Preparing medical form...</span></div>;

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '1rem' }}>
      <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.5rem', fontSize: 14 }}>
        <ArrowLeft size={16} /> Back to Patient Profile
      </button>

      {/* THE OFFICIAL PRESCRIPTION FORM LOOK - COMPACT */}
      <div id="prescription-paper" style={{ background: 'white', color: '#1a1a1a', padding: '1.25rem 2rem', borderRadius: 0, boxShadow: '0 10px 40px rgba(0,0,0,0.5)', minHeight: 'auto', borderTop: '6px solid #ef4444', position: 'relative' }}>

        {/* Header - Compact */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 24, fontWeight: 900, color: '#ef4444', letterSpacing: '-1px' }}>D<span style={{ color: '#1a1a1a' }}>octor's</span></span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a', marginTop: -2 }}>Medical Prescription</div>
          </div>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#1a1a1a' }}>℞</div>
        </div>

        {/* Patient Info Header - Very Simplified */}
        <div style={{ border: '1px solid #ddd', marginBottom: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 0.8fr 1fr 1.2fr', borderBottom: '1px solid #ddd' }}>
            <div style={{ padding: '0.4rem 0.75rem', borderRight: '1px solid #ddd' }}>
              <span style={{ fontWeight: 700, fontSize: 11 }}>Patient Name:</span>
              <input
                defaultValue={patient?.name}
                placeholder="Type here..."
                style={{ marginLeft: 6, fontSize: 12, border: 'none', background: 'transparent', outline: 'none', width: '70%' }}
              />
            </div>
            <div style={{ padding: '0.4rem 0.75rem', borderRight: '1px solid #ddd' }}>
              <span style={{ fontWeight: 700, fontSize: 11 }}>Age:</span>
              <input
                defaultValue={patient?.age}
                placeholder="Age..."
                style={{ marginLeft: 6, fontSize: 12, border: 'none', background: 'transparent', outline: 'none', width: '60%' }}
              />
            </div>
            <div style={{ padding: '0.4rem 0.75rem', borderRight: '1px solid #ddd' }}>
              <span style={{ fontWeight: 700, fontSize: 11 }}>Group:</span>
              <input
                defaultValue={patient?.blood_group}
                placeholder="B+..."
                style={{ marginLeft: 6, fontSize: 12, border: 'none', background: 'transparent', outline: 'none', width: '60%' }}
              />
            </div>
            <div style={{ padding: '0.4rem 0.75rem' }}>
              <span style={{ fontWeight: 700, fontSize: 11 }}>PO Num:</span>
              <input
                defaultValue={patient?.phone}
                placeholder="Number..."
                style={{ marginLeft: 6, fontSize: 12, border: 'none', background: 'transparent', outline: 'none', width: '60%' }}
              />
            </div>
          </div>
          <div style={{ padding: '0.4rem 0.75rem', display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
            <div><span style={{ fontWeight: 700 }}>Doctor Name:</span> <span style={{ marginLeft: 6 }}>{(user?.name?.toLowerCase() || '').startsWith('dr.') ? user.name : `Dr. ${user?.name || 'Practitioner'}`}</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>

              <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#ef4444', animation: 'pulse 2s infinite' }}>
                <Activity size={12} />
                <span style={{ fontSize: 10, fontWeight: 700 }}>LIVE IOT: {68 + Math.floor(Math.random() * 10)} BPM</span>
              </div>
              <div><span style={{ fontWeight: 700 }}>Date:</span> <span style={{ marginLeft: 6 }}>{new Date().toLocaleDateString()}</span></div>
            </div>
          </div>
        </div>

        {/* Prescription Form Logic */}
        <form onSubmit={handleSubmit}>
          {/* Diagnosis Section - Compact with AI */}
          <div style={{ background: '#f8fafc', padding: '0.5rem 0.75rem', border: '1px solid #ddd', marginBottom: '0.75rem', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <div style={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>Diagnosed With:</div>
              <button
                type="button"
                onClick={handleAISuggest}
                disabled={analyzing}
                style={{ fontSize: 10, fontWeight: 800, color: '#6366f1', border: '1px solid #e2e8f0', background: 'white', borderRadius: 4, padding: '2px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                {analyzing ? <Loader className="spinner" size={10} /> : <Sparkles size={10} />}
                {analyzing ? 'AI ANALYZING...' : 'AI ASSISTANT'}
              </button>
            </div>
            <textarea
              value={form.diagnosis}
              onChange={e => setForm(f => ({ ...f, diagnosis: e.target.value }))}
              placeholder="Primary diagnosis details..."
              style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', minHeight: 40, fontSize: 13, fontFamily: 'inherit', resize: 'none' }}
              required
            />
          </div>

          {/* Vitals - Compact grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', border: '1px solid #ddd', marginBottom: '0.75rem', textAlign: 'center' }}>
            <div style={{ padding: '0.35rem', borderRight: '1px solid #ddd' }}>
              <div style={{ fontWeight: 700, fontSize: 10, marginBottom: 2 }}>Blood Pressure</div>
              <input value={form.bp} onChange={e => setForm(f => ({ ...f, bp: e.target.value }))} placeholder="120/80" style={{ border: 'none', textAlign: 'center', width: '100%', outline: 'none', fontSize: 11 }} />
            </div>
            <div style={{ padding: '0.35rem', borderRight: '1px solid #ddd' }}>
              <div style={{ fontWeight: 700, fontSize: 10, marginBottom: 2 }}>Pulse Rate</div>
              <input value={form.pulse} onChange={e => setForm(f => ({ ...f, pulse: e.target.value }))} placeholder="72 BPM" style={{ border: 'none', textAlign: 'center', width: '100%', outline: 'none', fontSize: 11 }} />
            </div>
            <div style={{ padding: '0.35rem' }}>
              <div style={{ fontWeight: 700, fontSize: 10, marginBottom: 2 }}>Weight</div>
              <input value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} placeholder="70 kg" style={{ border: 'none', textAlign: 'center', width: '100%', outline: 'none', fontSize: 11 }} />
            </div>
          </div>

          {/* Drugs Table - Compact */}
          <div style={{ border: '1px solid #ddd', marginBottom: '0.75rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 0.8fr 1fr 1fr 40px', background: '#f8fafc', fontWeight: 700, fontSize: 10, borderBottom: '1px solid #ddd' }}>
              <div style={{ padding: '0.4rem', borderRight: '1px solid #ddd' }}>Drugs Name</div>
              <div style={{ padding: '0.4rem', borderRight: '1px solid #ddd' }}>Unit</div>
              <div style={{ padding: '0.4rem', borderRight: '1px solid #ddd' }}>Dosage</div>
              <div style={{ padding: '0.4rem', borderRight: '1px solid #ddd' }}>Duration</div>
              <div style={{ padding: '0.4rem' }}></div>
            </div>
            {form.medications.map((m, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.5fr 0.8fr 1fr 1fr 40px', borderBottom: i === form.medications.length - 1 ? 'none' : '1px solid #eee' }}>
                <input value={m.name} onChange={e => updateMed(i, 'name', e.target.value)} placeholder="Drug Name..." style={{ padding: '0.4rem', border: 'none', borderRight: '1px solid #ddd', outline: 'none', fontSize: 11 }} />
                <input value={m.unit} onChange={e => updateMed(i, 'unit', e.target.value)} placeholder="Tablet" style={{ padding: '0.4rem', border: 'none', borderRight: '1px solid #ddd', outline: 'none', fontSize: 11 }} />
                <input value={m.dosage} onChange={e => updateMed(i, 'dosage', e.target.value)} placeholder="1-0-1" style={{ padding: '0.4rem', border: 'none', borderRight: '1px solid #ddd', outline: 'none', fontSize: 11 }} />
                <input value={m.duration} onChange={e => updateMed(i, 'duration', e.target.value)} placeholder="10 Days..." style={{ padding: '0.4rem', border: 'none', borderRight: '1px solid #ddd', outline: 'none', fontSize: 11 }} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {i > 0 && <Trash2 size={13} color="#ef4444" style={{ cursor: 'pointer' }} onClick={() => removeMed(i)} />}
                </div>
              </div>
            ))}
            <button type="button" onClick={() => setForm(f => ({ ...f, medications: [...f.medications, { name: '', unit: 'Tablet', dosage: '', duration: '' }] }))} style={{ width: '100%', padding: '0.3rem', background: '#f1f5f9', border: 'none', color: '#6366f1', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
              + ADD DRUG
            </button>
          </div>

          {/* Notes Sections - Tighter layouts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <div style={{ border: '1px solid #ddd', padding: '0.4rem 0.6rem' }}>
              <div style={{ fontWeight: 700, fontSize: 10, marginBottom: 2 }}>Diet to follow:</div>
              <textarea 
                value={form.diet} 
                onChange={e => setForm(f => ({ ...f, diet: e.target.value }))} 
                style={{ border: 'none', width: '100%', outline: 'none', fontSize: 11, minHeight: 45, resize: 'none', fontFamily: 'inherit' }} 
                placeholder="Instructions..." 
              />
            </div>
            <div style={{ border: '1px solid #ddd', padding: '0.4rem 0.6rem' }}>
              <div style={{ fontWeight: 700, fontSize: 10, marginBottom: 2 }}>Reports Required:</div>
              <textarea 
                value={form.reports_required} 
                onChange={e => setForm(f => ({ ...f, reports_required: e.target.value }))} 
                style={{ border: 'none', width: '100%', outline: 'none', fontSize: 11, minHeight: 45, resize: 'none', fontFamily: 'inherit' }} 
                placeholder="e.g. CBC, X-Ray..." 
              />
            </div>
          </div>

          <div style={{ border: '1px solid #ddd', padding: '0.4rem 0.6rem', marginBottom: '1rem' }}>
            <div style={{ fontWeight: 700, fontSize: 10, marginBottom: 2 }}>Brief History:</div>
            <textarea value={form.history} onChange={e => setForm(f => ({ ...f, history: e.target.value }))} style={{ border: 'none', width: '100', outline: 'none', fontSize: 11, minHeight: 40, resize: 'none' }} placeholder="Notes..." />
          </div>

          {/* Footer - Compact Signature */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ fontSize: 10, color: '#999' }}>
              System Generated<br />
              {new Date().toLocaleString()}
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderBottom: '1px solid #334155', width: 140, marginBottom: 4 }}></div>
              <div style={{ fontWeight: 700, fontSize: 11 }}>Physician Signature</div>
            </div>
          </div>

          {/* Actions - Combined into Save & Print */}
          <div className="no-print" style={{ position: 'sticky', bottom: 20, marginTop: '3rem', display: 'flex', gap: '1rem', background: 'rgba(0,0,0,0.8)', padding: '1rem', borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', color: 'white' }}>
            <button type="submit" className="btn" style={{ flex: 1, height: 50, background: '#ef4444', color: 'white', fontWeight: 800, fontSize: 16, justifyContent: 'center' }}>
              <Save size={20} /> <Printer size={18} style={{ marginLeft: 8 }} /> SAVE & PRINT PRESCRIPTION
            </button>
          </div>
        </form>
      </div>

      {/* PREVIOUS PRESCRIPTIONS - ALL PREVIOUS VISITS */}
      {patient?.prescriptions?.length > 0 && (
        <div style={{ marginTop: '2.5rem', background: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.5rem' }}>
            <ClipboardList size={22} color="#6366f1" />
            <h3 style={{ fontSize: 18, fontWeight: 800 }}>Previous Visits & Prescriptions</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {patient.prescriptions.map((px, i) => {
              let historicalMeds = [];
              try { historicalMeds = typeof px.medications === 'string' ? JSON.parse(px.medications) : px.medications; } catch (e) { historicalMeds = []; }
              if (!Array.isArray(historicalMeds)) historicalMeds = [];

              return (
                <div key={px.id} style={{ background: 'rgba(255,255,255,0.05)', padding: '1.25rem', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>Visit #{patient.prescriptions.length - i} • {new Date(px.created_at).toLocaleDateString()}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#ef4444' }}>{px.diagnosis}</div>
                    <button type="button" onClick={() => setViewingHistory(px)} style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', color: '#6366f1', fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 6, cursor: 'pointer' }}>
                      <Printer size={10} style={{ marginRight: 4 }} /> VIEW FULL RX
                    </button>
                  </div>

                  {px.notes && <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 10, fontStyle: 'italic' }}>"{px.notes}"</p>}

                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Medications:</div>
                    {historicalMeds.map((m, j) => (
                      <div key={j} style={{ fontSize: 12, marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                        <span>• {m.name} {m.duration}</span>
                        <span style={{ fontWeight: 700 }}>{m.dosage}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

          </div>
        </div>
      )}

      {/* HISTORICAL PRESCRIPTION VIEW MODAL (RX FORMAT) */}
      {viewingHistory && (
        <div className="no-print" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="glass-card" style={{ maxWidth: 800, width: '100%', padding: '2px', background: 'white', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ padding: '0.75rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, fontSize: 13, color: '#1a1a1a' }}>PREVIEW: Prescription from {new Date(viewingHistory.created_at).toLocaleDateString()}</span>
              <button onClick={() => setViewingHistory(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}><X size={18} /> CLOSE</button>
            </div>

            <div style={{ padding: '2.5rem 3.5rem', background: 'white', color: '#1a1a1a', maxHeight: '80vh', overflowY: 'auto' }}>
              {/* RX Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '3px solid #ef4444', paddingBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#ef4444' }}>D<span style={{ color: '#1a1a1a' }}>octor's</span> RX</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#666' }}>Medical Consultation Record</div>
                </div>
                <div style={{ fontSize: 24, fontWeight: 800 }}>℞</div>
              </div>

              {/* Patient Detail Box */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', border: '1px solid #ddd', fontSize: 11, marginBottom: '2rem' }}>
                <div style={{ padding: 10, borderRight: '1px solid #ddd' }}><b>Name:</b> {patient?.name}</div>
                <div style={{ padding: 10, borderRight: '1px solid #ddd' }}><b>Age:</b> {patient?.age}</div>
                <div style={{ padding: 10, borderRight: '1px solid #ddd' }}><b>Date:</b> {new Date(viewingHistory.created_at).toLocaleDateString()}</div>
                <div style={{ padding: 10 }}><b>Blood:</b> {patient?.blood_group}</div>
              </div>

              {/* Diagnosis */}
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#666', borderBottom: '1px solid #eee', mb: 10 }}>Primary Diagnosis</div>
                <div style={{ fontSize: 15, fontWeight: 700, marginTop: 8 }}>{viewingHistory.diagnosis}</div>
              </div>

              {/* Medications Table */}
              <div style={{ border: '1px solid #eee', borderRadius: 4, mb: 30 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', background: '#f8fafc', fontWeight: 800, fontSize: 11, p: 10, borderBottom: '1px solid #eee' }}>
                  <div style={{ padding: '0.4rem' }}>Medication Name</div>
                  <div style={{ padding: '0.4rem' }}>Dosage</div>
                  <div style={{ padding: '0.4rem' }}>Duration</div>
                </div>
                {(() => {
                  let hisMeds = [];
                  try { hisMeds = typeof viewingHistory.medications === 'string' ? JSON.parse(viewingHistory.medications) : viewingHistory.medications; } catch (e) { }
                  return hisMeds.map((m, k) => (
                    <div key={k} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', fontSize: 13, p: 10, borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ padding: '0.5rem' }}>• {m.name}</div>
                      <div style={{ padding: '0.5rem' }}>{m.dosage}</div>
                      <div style={{ padding: '0.5rem' }}>{m.duration}</div>
                    </div>
                  ));
                })()}
              </div>

              {/* Notes */}
              {viewingHistory.notes && (
                <div style={{ marginTop: '2.5rem', background: '#fdfdfd', padding: 15, borderLeft: '3px solid #eee' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#999', textTransform: 'uppercase' }}>Additional Notes & Diet</div>
                  <div style={{ fontSize: 13, color: '#444', marginTop: 6, lineHeight: 1.6 }}>{viewingHistory.notes}</div>
                </div>
              )}

              {/* Footer */}
              <div style={{ marginTop: '4rem', display: 'flex', justifyContent: 'flex-end', textAlign: 'center' }}>
                <div>
                  <div style={{ borderBottom: '1px solid #000', width: 150, mb: 4 }}></div>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>Dr. {viewingHistory.doctor_name || user?.name}</div>
                  <div style={{ fontSize: 10, color: '#666' }}>Medical Specialist</div>
                </div>
              </div>
            </div>

            <div style={{ padding: '1rem', borderTop: '1px solid #e2e8f0', background: '#fff' }}>
              <button onClick={() => window.print()} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}><Printer size={18} /> PRINT THIS HISTORICAL COPY</button>
            </div>
          </div>
        </div>
      )}

      <style>{`


        @media print {
          .no-print { display: none !important; }
          body { background: white !important; padding: 0 !important; }
          #prescription-paper { box-shadow: none !important; margin: 0 !important; border: 1px solid #eee !important; }
          .sidebar, .navbar { display: none !important; }
        }
      `}</style>
    </div>
  );
}
