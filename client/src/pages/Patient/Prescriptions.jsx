import { useState, useEffect } from 'react';
import { 
  ClipboardList, Pill, MapPin, Search, Printer, 
  Share2, ClipboardCheck, LayoutGrid, List, Inbox,
  Activity, Star, Download, ChevronRight, FileText
} from 'lucide-react';
import { getPatientById } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function PatientPrescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [selectedPx, setSelectedPx] = useState(null);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrescriptions = async () => {
      if (!user?.patient_id) { setLoading(false); return; }
      try {
        const { data } = await getPatientById(user.patient_id);
        const pData = data?.data;
        const transformed = (pData?.prescriptions || []).map(px => {
          const notesStr = px.notes || '';
          const bp = notesStr.match(/BP: (.*?),/)?.[1] || '--';
          const pulse = notesStr.match(/Pulse: (.*?),/)?.[1] || '--';
          const weight = notesStr.match(/Weight: (.*?)\./)?.[1] || '--';
          const reports = notesStr.match(/Reports Required: (.*?)\. Diet:/)?.[1] || 'None';
          const diet = notesStr.match(/Diet: (.*?)\. History:/)?.[1] || 'Standard';
          const history = notesStr.match(/History: (.*?)$/)?.[1] || 'None';

          return {
            ...px,
            doctor: px.doctor_name || 'Dr. Practitioner',
            date: px.created_at ? new Date(px.created_at).toLocaleDateString() : 'N/A',
            patient: {
              name: pData.name,
              age: pData.age,
              group: pData.blood_group,
              phone: pData.phone
            },
            vitals: { bp, pulse, weight },
            clinical: { reports, diet, history },
            medicines: (typeof px.medications === 'string' ? JSON.parse(px.medications || '[]') : (px.medications || []))
          };
        });
        setPrescriptions(transformed);
      } catch (err) {
        console.error('Error fetching prescriptions:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPrescriptions();
  }, [user]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
      <div className="spinner"></div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {!selectedPx ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontWeight: 900, fontSize: 32 }}>Medical <span className="gradient-text">Prescriptions</span></h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginTop: 4 }}>History of clinical visits and electronic prescriptions.</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: '300px' }}>
            {prescriptions.length > 0 ? (
              <>
                {/* Column Headers for the "Line" view */}
                <div style={{ 
                  display: 'grid', gridTemplateColumns: '80px 1.5fr 1fr 2fr 180px', 
                  padding: '1rem 2rem', background: '#f8fafc', borderRadius: 12, 
                  border: '1px solid var(--border)', fontWeight: 900, 
                  fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  <div>ID</div>
                  <div>Consultant</div>
                  <div>Visit Date</div>
                  <div>Analysis/Diagnosis</div>
                  <div style={{ textAlign: 'center' }}>Action</div>
                </div>

                {prescriptions.map((px) => (
                  <div key={px.id} style={{ 
                    display: 'grid', gridTemplateColumns: '80px 1.5fr 1fr 2fr 180px', 
                    alignItems: 'center', padding: '1.25rem 2rem', 
                    background: 'white', borderRadius: 12, border: '1px solid var(--border)',
                    transition: 'all 0.3s ease', cursor: 'pointer'
                  }}>
                    <div style={{ fontWeight: 800, color: 'var(--text-secondary)', fontSize: 13 }}>#{px.id.toString().padStart(3, '0')}</div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ padding: '0.5rem', background: 'rgba(99,102,241,0.1)', color: '#6366f1', borderRadius: 8 }}>
                        <FileText size={18} />
                      </div>
                      <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)' }}>{px.doctor}</div>
                    </div>

                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-secondary)' }}>{px.date}</div>
                    
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: '1rem' }}>
                      {px.diagnosis || 'Standard Clinical Visit'}
                    </div>

                    <button 
                      className="btn btn-primary" 
                      style={{ justifyContent: 'center', fontWeight: 900, fontSize: 12, height: 40, borderRadius: 10 }}
                      onClick={() => setSelectedPx(px)}
                    >
                      VIEW DIGITAL SLIP
                    </button>
                  </div>
                ))}
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem', background: 'rgba(0,0,0,0.01)', borderRadius: 24, border: '1px dashed var(--border)' }}>
                <Inbox size={48} opacity={0.2} style={{ marginBottom: 16 }} />
                <div style={{ fontSize: 16, fontWeight: 800, opacity: 0.5 }}>No prescriptions found</div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', animation: 'fadeIn 0.4s ease' }}>
          {/* Detailed Slip View Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="no-print">
            <button 
              onClick={() => setSelectedPx(null)}
              className="btn btn-secondary"
              style={{ fontWeight: 800, gap: 10 }}
            >
              <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} /> BACK TO HISTORY
            </button>
            <button 
              onClick={() => window.print()}
              className="btn btn-primary"
              style={{ fontWeight: 900, gap: 10, background: '#ef4444' }}
            >
              <Printer size={18} /> PRINT PRESCRIPTION
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div id="prescription-paper" style={{ 
              background: 'white', color: '#1a1a1a', 
              borderRadius: '8px', borderTop: '12px solid #ef4444', 
              maxWidth: '850px', width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
              padding: '3rem 4rem',
              position: 'relative'
            }}>
                <style>{`
                  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                  @media print { 
                    .no-print { display: none !important; }
                    body { background: white !important; }
                    #prescription-paper { 
                      position: absolute; left: 0; top: 0; width: 100%; 
                      border: none !important; box-shadow: none !important; 
                      padding: 0 !important; margin: 0 !important; 
                    }
                  }
                `}</style>

                {/* Paper Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <div style={{ fontSize: 32, fontWeight: 900, color: '#ef4444', letterSpacing: '-1.5px' }}>D<span style={{ color: '#1a1a1a' }}>octor's</span></div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#64748b', marginTop: -4 }}>Medical Prescription</div>
                    </div>
                    <div style={{ fontSize: 56, fontWeight: 900, color: '#f1f5f9', userSelect: 'none' }}>℞</div>
                </div>

                {/* Patient Header Box */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '4px', marginBottom: '1.5rem', overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 0.6fr 0.6fr 1.2fr', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                        <div style={{ padding: '0.6rem 1rem', borderRight: '1px solid #e2e8f0' }}>
                        <span style={{ fontWeight: 800, fontSize: 10, color: '#64748b', textTransform: 'uppercase' }}>Patient</span>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{selectedPx.patient.name}</div>
                        </div>
                        <div style={{ padding: '0.6rem 1rem', borderRight: '1px solid #e2e8f0' }}>
                        <span style={{ fontWeight: 800, fontSize: 10, color: '#64748b', textTransform: 'uppercase' }}>Age</span>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{selectedPx.patient.age}</div>
                        </div>
                        <div style={{ padding: '0.6rem 1rem', borderRight: '1px solid #e2e8f0' }}>
                        <span style={{ fontWeight: 800, fontSize: 10, color: '#64748b', textTransform: 'uppercase' }}>Group</span>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{selectedPx.patient.group || 'N/A'}</div>
                        </div>
                        <div style={{ padding: '0.6rem 1rem' }}>
                        <span style={{ fontWeight: 800, fontSize: 10, color: '#64748b', textTransform: 'uppercase' }}>ID / Phone</span>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{selectedPx.patient.phone}</div>
                        </div>
                    </div>
                    <div style={{ padding: '0.6rem 1rem', display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700 }}>
                        <div style={{ display: 'flex', gap: 10 }}>
                        <span style={{ color: '#64748b' }}>CONSULTANT:</span>
                        <span>{selectedPx.doctor}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                        <span style={{ color: '#64748b' }}>DATE:</span>
                        <span>{selectedPx.date}</span>
                        </div>
                    </div>
                </div>

                {/* Vitals Summary */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', border: '1px solid #e2e8f0', borderRadius: '4px', marginBottom: '1.5rem', textAlign: 'center', background: '#fff' }}>
                    <div style={{ padding: '0.6rem', borderRight: '1px solid #e2e8f0' }}>
                        <div style={{ fontWeight: 800, fontSize: 10, color: '#64748b', marginBottom: 2 }}>BP (mmHg)</div>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{selectedPx.vitals.bp}</div>
                    </div>
                    <div style={{ padding: '0.6rem', borderRight: '1px solid #e2e8f0' }}>
                        <div style={{ fontWeight: 800, fontSize: 10, color: '#64748b', marginBottom: 2 }}>PULSE (bpm)</div>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{selectedPx.vitals.pulse}</div>
                    </div>
                    <div style={{ padding: '0.6rem' }}>
                        <div style={{ fontWeight: 800, fontSize: 10, color: '#64748b', marginBottom: 2 }}>WEIGHT (kg)</div>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{selectedPx.vitals.weight}</div>
                    </div>
                </div>

                {/* Diagnosis Title */}
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{ fontWeight: 900, fontSize: 11, color: '#ef4444', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.05em' }}>Clinical Diagnosis</div>
                    <div style={{ fontSize: 18, fontWeight: 800, borderLeft: '5px solid #ef4444', paddingLeft: 12, color: '#1e293b' }}>
                        {selectedPx.diagnosis}
                    </div>
                </div>

                {/* Rx Content */}
                <div style={{ fontSize: 32, fontWeight: 900, marginBottom: 12, color: '#1e293b' }}>℞</div>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '4px', marginBottom: '2rem', overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 0.8fr 1fr 1fr', background: '#f8fafc', fontWeight: 900, fontSize: 11, borderBottom: '1px solid #e2e8f0', color: '#475569', textTransform: 'uppercase' }}>
                        <div style={{ padding: '0.75rem 1.25rem', borderRight: '1px solid #e2e8f0' }}>Medicine Name</div>
                        <div style={{ padding: '0.75rem 1.25rem', borderRight: '1px solid #e2e8f0' }}>Unit</div>
                        <div style={{ padding: '0.75rem 1.25rem', borderRight: '1px solid #e2e8f0' }}>Dosage</div>
                        <div style={{ padding: '0.75rem 1.25rem' }}>Duration</div>
                    </div>
                    {(selectedPx.medicines || []).map((med, i) => (
                        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.5fr 0.8fr 1fr 1fr', borderBottom: i === selectedPx.medicines.length -1 ? 'none' : '1px solid #f1f5f9' }}>
                        <div style={{ padding: '0.75rem 1.25rem', borderRight: '1px solid #f1f5f9', fontSize: 13, fontWeight: 700 }}>{med.name}</div>
                        <div style={{ padding: '0.75rem 1.25rem', borderRight: '1px solid #f1f5f9', fontSize: 12 }}>{med.unit || 'Tablet'}</div>
                        <div style={{ padding: '0.75rem 1.25rem', borderRight: '1px solid #f1f5f9', fontSize: 14, fontWeight: 900, color: '#ef4444' }}>{med.dosage || med.dose || 'N/A'}</div>
                        <div style={{ padding: '0.75rem 1.25rem', fontSize: 12, fontWeight: 600 }}>{med.duration || med.period || 'N/A'}</div>
                        </div>
                    ))}
                </div>

                {/* Professional Notes */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '2rem' }}>
                    <div style={{ background: '#fdfdfd', border: '1px solid #f1f5f9', padding: '1rem', borderRadius: 8 }}>
                        <div style={{ fontSize: 10, fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>Diet Instructions</div>
                        <div style={{ fontSize: 12, lineHeight: 1.6, color: '#334155' }}>{selectedPx.clinical.diet}</div>
                    </div>
                    <div style={{ background: '#fdfdfd', border: '1px solid #f1f5f9', padding: '1rem', borderRadius: 8 }}>
                        <div style={{ fontSize: 10, fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>Pathology / Radiography</div>
                        <div style={{ fontSize: 12, lineHeight: 1.6, color: '#334155' }}>{selectedPx.clinical.reports}</div>
                    </div>
                </div>

                <div style={{ background: '#fafafa', padding: '1rem', borderRadius: 8, marginBottom: '3rem' }}>
                    <div style={{ fontSize: 10, fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>Patient Case History</div>
                    <div style={{ fontSize: 12, fontStyle: 'italic', color: '#475569', lineHeight: 1.6 }}>{selectedPx.clinical.history}</div>
                </div>

                {/* Footer with Seal Area */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div style={{ fontSize: 10, color: '#94a3b8', lineHeight: 1.5 }}>
                        HMS DIGITAL SLIP ID: HMS-PX-{selectedPx.id} <br />
                        Security Hash: {new Date(selectedPx.created_at).getTime().toString(36).toUpperCase()} <br />
                        Digitally Verified on {selectedPx.date}
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 14, fontFamily: "'Dancing Script', cursive", marginBottom: 4, color: '#1a1a1a', fontWeight: 700 }}>Verified Medical Authority</div>
                        <div style={{ width: 180, borderBottom: '2.5px solid #1e293b', marginBottom: 6 }}></div>
                        <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.1em', color: '#64748b' }}>HOSPITAL STAMP & SEAL</div>
                    </div>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
