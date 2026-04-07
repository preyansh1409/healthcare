import { useState, useEffect } from 'react';
import { getBeds, updateBed, getPatients, getDoctors, getAdmissionSuggestion, checkDoctorAvailability } from '../../services/api';
import { Bed, Search, User, Pill, FileText, X, Sparkles, Loader, Stethoscope } from 'lucide-react';
import toast from 'react-hot-toast';

const WARDS = ['General', 'Semi-Private', 'Private', 'ICU', 'Pediatrics', 'Maternity', 'Surgical', 'Emergency'];

export default function BedManagement() {
  const [beds, setBeds] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [allPatients, setAllPatients] = useState([]);
  const [allDoctors, setAllDoctors] = useState([]);
  const [selectedBed, setSelectedBed] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ patient_id: '', doctor_id: '', reason: '', treatment: '' });
  const [analyzing, setAnalyzing] = useState(false);
  const [checkingLeave, setCheckingLeave] = useState(false);
  const [isDoctorOnLeave, setIsDoctorOnLeave] = useState(false);

  const handleAISuggest = async () => {
    if (!formData.reason) return toast.error('Please enter the reason for admittance first');
    setAnalyzing(true);
    try {
      const res = await getAdmissionSuggestion(formData.reason);
      setFormData(f => ({
        ...f, 
        treatment: res.data.treatment,
        reason: res.data.reason || f.reason 
      }));
      toast.success('AI Treatment Plan Generated!');
    } catch {
      toast.error('AI Service Error');
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => { 
    fetchBeds(); 
    getPatients().then(res => setAllPatients(res.data.data)).catch(console.error);
    getDoctors().then(res => setAllDoctors(res.data.data)).catch(console.error);
  }, []);

  useEffect(() => {
    const runCheck = async () => {
      if (!formData.doctor_id) {
        setIsDoctorOnLeave(false);
        return;
      }
      setCheckingLeave(true);
      try {
        const today = new Date().toISOString().split('T')[0];
        const res = await checkDoctorAvailability(formData.doctor_id, today);
        setIsDoctorOnLeave(!res.data.available);
      } catch (err) {
        console.error('Availability error:', err);
      } finally {
        setCheckingLeave(false);
      }
    };
    runCheck();
  }, [formData.doctor_id]);

  const fetchBeds = async () => {
    try {
      const { data } = await getBeds();
      setBeds(data.data);
    } catch { toast.error('Failed to load beds'); }
    finally { setLoading(false); }
  };

  const handleAllot = async (e) => {
    e.preventDefault();
    try {
      await updateBed(selectedBed.id, { 
        occupied: 1, 
        patient_id: formData.patient_id, 
        doctor_id: formData.doctor_id,
        ward: selectedBed.ward,
        admission_reason: formData.reason,
        treatment_given: formData.treatment
      });
      toast.success('Room allotted successfully');
      setShowModal(false);
      setFormData({ patient_id: '', doctor_id: '', reason: '', treatment: '' });
      fetchBeds();
    } catch { toast.error('Allocation failed'); }
  };

  const handleRelease = async (bed) => {
    try {
      await updateBed(bed.id, { occupied: 0, patient_id: null, ward: bed.ward, admission_reason: '', treatment_given: '' });
      toast.success('Bed released');
      fetchBeds();
    } catch { toast.error('Release failed'); }
  };

  const visible = filter === 'All' ? beds : beds.filter(b => b.ward === filter);
  const stats = {
    total: beds.length,
    occupied: beds.filter(b => b.occupied).length,
    available: beds.filter(b => !b.occupied).length,
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'white', gap: '10px' }}>
        <Loader className="spinner" size={20} />
        <span>Initializing room control...</span>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontWeight: 900, fontSize: 26 }}>Bed & Room <span className="gradient-text">Management</span></h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>Monitor and manage hospital beds</p>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Beds', value: stats.total, color: '#6366f1' },
          { label: 'Occupied', value: stats.occupied, color: '#ef4444' },
          { label: 'Available', value: stats.available, color: '#10b981' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ '--gradient': `linear-gradient(90deg, ${s.color}, ${s.color}88)` }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Visual capacity bar */}
      <div className="glass-card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Occupancy Rate</span>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{stats.total ? Math.round((stats.occupied / stats.total) * 100) : 0}%</span>
        </div>
        <div style={{ height: 10, background: 'rgba(99,102,241,0.1)', borderRadius: 5, overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 5, width: `${stats.total ? (stats.occupied / stats.total) * 100 : 0}%`, background: 'linear-gradient(90deg, #6366f1, #0ea5e9)', transition: 'width 0.5s ease' }} />
        </div>
      </div>

      {/* Ward filter */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {['All', ...WARDS].map(w => (
          <button key={w} onClick={() => setFilter(w)}
            className="btn"
            style={{ padding: '0.375rem 0.875rem', fontSize: 12, background: filter === w ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'rgba(99,102,241,0.08)', color: filter === w ? 'white' : 'var(--text-secondary)', border: '1px solid ' + (filter === w ? 'transparent' : 'var(--border)') }}>
            {w}
          </button>
        ))}
      </div>

      {/* Bed grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
        {visible.map(bed => (
          <div key={bed.id} className="glass-card" style={{ padding: '1.25rem', borderColor: bed.occupied ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)', transition: 'all 0.3s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <Bed size={20} color={bed.occupied ? '#ef4444' : '#10b981'} />
              <div style={{ display: 'flex', gap: 5 }}>
                <span className="badge" style={{ background: bed.occupied ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', color: bed.occupied ? '#ef4444' : '#10b981', fontSize: 10 }}>
                  {bed.occupied ? 'Occupied' : 'Free'}
                </span>
                {bed.ward === 'ICU' && <span className="badge" style={{ background: '#ef444422', color: '#ef4444', fontSize: 10 }}>CRITICAL</span>}
              </div>
            </div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>Bed {bed.bed_number}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>{bed.ward} Ward</div>
            
            {bed.occupied ? (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#6366f1' }}>👤 {bed.patient_name}</div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>Reason: {bed.admission_reason || 'N/A'}</div>
                <button
                  className="btn"
                  style={{ width: '100%', justifyContent: 'center', padding: '0.4rem', fontSize: 11, background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', marginTop: 8 }}
                  onClick={() => handleRelease(bed)}>
                  Release Bed
                </button>
              </div>
            ) : (
              <button
                className="btn"
                style={{ width: '100%', justifyContent: 'center', padding: '0.4rem', fontSize: 11, background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none' }}
                onClick={() => { setSelectedBed(bed); setShowModal(true); }}>
                Allot Room
              </button>
            )}
          </div>
        ))}
      </div>

      {/* CLINICAL ADMISSION RECORD MODAL */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, left: 'var(--sidebar-width, 240px)', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem', overflowY: 'auto' }}>
          <div style={{ maxWidth: 850, width: '100%', position: 'relative' }}>
            {/* Close Button UI */}
            <button onClick={() => setShowModal(false)} style={{ position: 'absolute', right: -40, top: 0, background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} /></button>

            {/* THE PAPER - WHITE CLINICAL RECORD */}
            <div style={{ background: 'white', color: '#1a1a1a', padding: '1.5rem 2.5rem', borderRadius: 0, position: 'relative', borderTop: '8px solid #6366f1', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
              
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 28, fontWeight: 900, color: '#6366f1', letterSpacing: '-1.5px' }}>C<span style={{ color: '#1a1a1a' }}>linical</span></span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>Admission & Treatment Record</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#6366f1' }}>WARD: {selectedBed?.ward || 'General'}</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#1a1a1a' }}>BED {selectedBed?.bed_number || '--'}</div>
                </div>
              </div>

              {/* Patient Info Header - Clinical Grid */}
              <div style={{ border: '1px solid #ddd', marginBottom: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', borderBottom: '1px solid #ddd' }}>
                  <div style={{ padding: '0.6rem 1rem', borderRight: '1px solid #ddd' }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', marginBottom: 4 }}>SELECT PATIENT FOR ADMISSION</div>
                    <div style={{ position: 'relative' }}>
                      <User size={14} style={{ position: 'absolute', left: 0, top: 4, color: '#6366f1' }} />
                      <select 
                        required
                        value={formData.patient_id}
                        onChange={e => setFormData({ ...formData, patient_id: e.target.value })}
                        style={{ width: '100%', padding: '0 0 0 1.5rem', border: 'none', borderBottom: '1px dashed #cbd5e1', background: 'transparent', outline: 'none', fontSize: 13, fontWeight: 700 }}
                      >
                        <option value="">Choose from database...</option>
                        {allPatients.map(p => <option key={p.id} value={p.id}>{p.name} (ID: #{p.id})</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ padding: '0.6rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ width: '100%' }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', marginBottom: 4 }}>ASSIGN TREATING DOCTOR</div>
                      <div style={{ position: 'relative' }}>
                        <Stethoscope size={14} style={{ position: 'absolute', left: 0, top: 4, color: '#10b981' }} />
                        <select 
                          required
                          value={formData.doctor_id}
                          onChange={e => setFormData({ ...formData, doctor_id: e.target.value })}
                          style={{ width: '100%', padding: '0 0 0 1.5rem', border: 'none', borderBottom: '1px dashed #cbd5e1', background: 'transparent', outline: 'none', fontSize: 13, fontWeight: 700, color: isDoctorOnLeave ? '#ef4444' : 'inherit' }}
                        >
                          <option value="">Choose Physician...</option>
                          {allDoctors.map(d => <option key={d.id} value={d.id}>{d.name} ({d.specialization})</option>)}
                        </select>
                        {isDoctorOnLeave && (
                          <div style={{ position: 'absolute', right: 0, top: 4, background: '#fee2e2', color: '#ef4444', fontSize: 9, fontWeight: 900, padding: '2px 6px', borderRadius: 4, border: '1px solid #fecaca' }}>
                            DOCTOR ON LEAVE
                          </div>
                        )}
                        {checkingLeave && (
                          <div style={{ position: 'absolute', right: 0, top: 4 }}>
                            <Loader className="spinner" size={10} color="#64748b" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Patient Multi-Details Row (New) */}
                {formData.patient_id && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', background: '#f8fafc', padding: '0.5rem 1rem', fontSize: 11, borderTop: '1px solid #ddd' }}>
                    <div><span style={{ fontWeight: 700, color: '#64748b' }}>Age:</span> <span style={{ fontWeight: 700 }}>{allPatients.find(p => p.id == formData.patient_id)?.age} Yrs</span></div>
                    <div><span style={{ fontWeight: 700, color: '#64748b' }}>Gender:</span> <span style={{ fontWeight: 700 }}>{allPatients.find(p => p.id == formData.patient_id)?.gender}</span></div>
                    <div><span style={{ fontWeight: 700, color: '#64748b' }}>Group:</span> <span style={{ fontWeight: 700 }}>{allPatients.find(p => p.id == formData.patient_id)?.blood_group || 'N/A'}</span></div>
                    <div><span style={{ fontWeight: 700, color: '#64748b' }}>Contact:</span> <span style={{ fontWeight: 700 }}>{allPatients.find(p => p.id == formData.patient_id)?.phone}</span></div>
                  </div>
                )}
              </div>

              {/* Admission Content */}
              <form onSubmit={handleAllot}>
                {/* Reason / Diagnosis */}
                <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', border: '1px solid #ddd', marginBottom: '1rem' }}>
                  <div style={{ fontWeight: 800, fontSize: 11, color: '#475569', marginBottom: 8, textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FileText size={14} /> Reason for Admittance / Chief Complaint
                    </div>
                    <button
                      type="button"
                      onClick={handleAISuggest}
                      disabled={analyzing}
                      style={{ fontSize: 10, fontWeight: 900, color: '#6366f1', border: '1px solid #cbd5e1', background: 'white', borderRadius: 4, padding: '2px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      {analyzing ? <Loader className="spinner" size={10} /> : <Sparkles size={10} />}
                      {analyzing ? 'AI ANALYZING...' : 'AI ASSISTANT'}
                    </button>
                  </div>
                  <textarea 
                    required
                    placeholder="Describe the medical condition in detail..."
                    value={formData.reason}
                    onChange={e => setFormData({ ...formData, reason: e.target.value })}
                    style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', minHeight: 60, fontSize: 14, fontFamily: 'inherit', resize: 'none', lineHeight: 1.5 }}
                  />
                </div>

                {/* Treatment / Medication Grid */}
                <div style={{ border: '1px solid #ddd', marginBottom: '2rem' }}>
                  <div style={{ background: '#f1f5f9', padding: '0.5rem 1rem', borderBottom: '1px solid #ddd', fontWeight: 800, fontSize: 11, color: '#475569', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Pill size={14} /> Initial Treatment & Medicine Chart
                    </div>
                    <button
                      type="button"
                      onClick={handleAISuggest}
                      disabled={analyzing}
                      style={{ fontSize: 10, fontWeight: 900, color: '#6366f1', border: '1px solid #cbd5e1', background: 'white', borderRadius: 4, padding: '2px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      {analyzing ? <Loader className="spinner" size={10} /> : <Sparkles size={10} />}
                      {analyzing ? 'AI ANALYZING...' : 'AI ASSISTANT'}
                    </button>
                  </div>
                  <div style={{ padding: '0.75rem 1rem' }}>
                    <textarea 
                      required
                      placeholder="List drugs administered (Dosage, Route, Frequency)..."
                      value={formData.treatment}
                      onChange={e => setFormData({ ...formData, treatment: e.target.value })}
                      style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', minHeight: 120, fontSize: 14, fontFamily: 'inherit', resize: 'none', lineHeight: 1.6 }}
                    />
                  </div>
                </div>

                {/* Footer Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>
                    * This is a legal admission record.<br />
                    Generated: {new Date().toLocaleString()}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ borderBottom: '1px solid #1e293b', width: 200, marginBottom: 4 }}></div>
                    <div style={{ fontWeight: 800, fontSize: 12, color: '#1e293b' }}>Registrar Signature</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '1rem', marginTop: '3rem' }}>
                  <button type="button" onClick={() => setShowModal(false)} className="btn" style={{ flex: 0.5, padding: '1rem', height: 55, borderRadius: 12, border: '1px solid #ddd', fontWeight: 700, background: '#f8fafc', color: '#64748b' }}>
                    CANCEL
                  </button>
                  <button 
                    type="submit" 
                    disabled={isDoctorOnLeave || checkingLeave || analyzing}
                    className="btn" 
                    style={{ flex: 1, padding: '1rem', height: 55, borderRadius: 12, background: isDoctorOnLeave ? '#94a3b8' : 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white', fontWeight: 800, fontSize: 16, justifyContent: 'center', gap: 10, boxShadow: isDoctorOnLeave ? 'none' : '0 10px 30px rgba(99,102,241,0.3)', cursor: isDoctorOnLeave || analyzing ? 'not-allowed' : 'pointer' }}
                  >
                    <Bed size={20} /> 
                    {analyzing ? 'RECORDING ON BLOCKCHAIN...' : (isDoctorOnLeave ? 'DOCTOR UNAVAILABLE' : 'CONFIRM ADMISSION & ALLOT BED')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {!loading && visible.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem' }}>No beds found for this ward</div>}
    </div>
  );
}
