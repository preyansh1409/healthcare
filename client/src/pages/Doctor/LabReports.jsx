import { useState, useEffect } from 'react';
import { ClipboardList, User, FileText, Download, CheckCircle2, AlertCircle, Loader, Sparkles, X, Activity, Calendar } from 'lucide-react';
import { getPatients, getPatientLabReports, analyzeLabReport } from '../../services/api';
import toast from 'react-hot-toast';

export default function LabReports() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [patientReports, setPatientReports] = useState({});
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getPatients();
        const patientList = res.data.data;
        setPatients(patientList);
        
        const reportsMap = {};
        await Promise.all(patientList.map(async (p) => {
          try {
            const rRes = await getPatientLabReports(p.id);
            reportsMap[p.id] = rRes.data.data;
          } catch { reportsMap[p.id] = []; }
        }));
        setPatientReports(reportsMap);
      } catch {
        toast.error('Failed to load patient records');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleAnalyze = async (id) => {
    setAnalyzing(true);
    try {
      const { data } = await analyzeLabReport(id);
      setSelectedReport(data.data);
      toast.success('AI Analysis Completed');
      
      // Update local state so it shows analyzed next time
      const updatedReportsMap = { ...patientReports };
      Object.keys(updatedReportsMap).forEach(pId => {
        updatedReportsMap[pId] = updatedReportsMap[pId].map(r => r.id === id ? data.data : r);
      });
      setPatientReports(updatedReportsMap);

    } catch (err) {
      toast.error('AI Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const [activePatientId, setActivePatientId] = useState(null);
  const [search, setSearch] = useState('');

  const todayStr = new Date().toLocaleDateString('en-CA');

  // Get patients who have reports UPLOADED today
  const patientsWithTodayReports = patients.filter(p => {
    const list = patientReports[p.id] || [];
    return list.some(r => new Date(r.created_at).toLocaleDateString('en-CA') === todayStr);
  });

  const filteredPatients = patientsWithTodayReports.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const activePatient = patients.find(p => p.id === activePatientId);
  const activeReports = patientReports[activePatientId] || [];
  const filteredReports = activeReports.filter(r => 
    r.report_type.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <Loader className="spinner" size={32} color="#6366f1" />
      <span style={{ marginLeft: 12, fontWeight: 600 }}>Loading diagnostic records...</span>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header & Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            {activePatientId && (
              <button 
                onClick={() => setActivePatientId(null)}
                className="btn btn-secondary" 
                style={{ padding: '0.5rem', borderRadius: '50%', width: 36, height: 36, display: 'flex', justifyContent: 'center' }}
              >
                <X size={18} />
              </button>
            )}
            <h1 style={{ fontWeight: 900, fontSize: 26 }}>
              {activePatientId ? (
                <><span className="gradient-text">{activePatient.name}'s</span> Reports</>
              ) : (
                <><span className="gradient-text">Diagnostic</span> Records</>
              )}
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            {activePatientId ? `Viewing ${activeReports.length} results for ${activePatient.name}` : `Viewing ${patientsWithTodayReports.length} patients with new reports today`}
          </p>
        </div>

        <div style={{ position: 'relative', width: '100%', maxWidth: 350 }}>
          <Activity size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input 
            className="form-input" 
            style={{ paddingLeft: '2.5rem' }} 
            placeholder={activePatientId ? "Search tests..." : "Search patients..."} 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
      </div>

      {!activePatientId ? (
        /* PATIENTS TABLE VIEW */
        <div className="glass-card fade-in" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Age / Gender</th>
                  <th>Phone</th>
                  <th>Blood</th>
                  <th>Reports</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: 'white' }}>
                          {p.name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700 }}>{p.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{p.email || 'No email'}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{p.age} yrs • {p.gender}</td>
                    <td style={{ fontWeight: 600 }}>{p.phone}</td>
                    <td>{p.blood_group || '—'}</td>
                    <td>
                      <span className="badge" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                        {patientReports[p.id]?.length || 0} Records
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          onClick={() => setActivePatientId(p.id)}
                          className="btn btn-secondary" 
                          style={{ padding: '0.4rem 0.8rem', fontSize: 12 }}
                        >
                          View Reports
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredPatients.length === 0 && (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
              <ClipboardList size={48} style={{ opacity: 0.2, marginBottom: 12 }} />
              <p>No new diagnostic records uploaded today.</p>
              <p style={{ fontSize: 12 }}>Check individual patient profiles for historical reports.</p>
            </div>
          )}
        </div>
      ) : (
        /* REPORTS TABLE FOR SELECTED PATIENT */
        <div className="glass-card fade-in" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Test Type</th>
                  <th>Report Date</th>
                  <th>Status</th>
                  <th>Analysis</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report) => (
                  <tr key={report.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(99,102,241,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
                          <FileText size={16} />
                        </div>
                        <span style={{ fontWeight: 700 }}>{report.report_type}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{new Date(report.report_date).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge ${report.status === 'analyzed' ? 'badge-completed' : 'badge-pending'}`}>
                        {report.status === 'analyzed' ? 'Completed' : 'Pending Scan'}
                      </span>
                    </td>
                    <td>
                      {report.status === 'analyzed' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10b981', fontSize: 12, fontWeight: 600 }}>
                          <Sparkles size={14} /> AI Insights Ready
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Pending AI Sensor</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          onClick={() => setSelectedReport(report)}
                          className="btn btn-secondary" 
                          style={{ padding: '0.4rem 0.8rem', fontSize: 12 }}
                        >
                          Open
                        </button>
                        <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: 12 }}>
                           <Download size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredReports.length === 0 && (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
              No reports found for this patient.
            </div>
          )}
        </div>
      )}

      {/* DETAILED VIEW OVERLAY */}
      {selectedReport && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="glass-card" style={{ maxWidth: 650, width: '100%', maxHeight: '95vh', overflowY: 'auto', padding: '2.5rem', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
              <div>
                <h2 style={{ fontSize: 26, fontWeight: 900 }}>Report: <span className="gradient-text">{selectedReport.report_type}</span></h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, color: 'var(--text-secondary)', fontSize: 14 }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><User size={14} /> {patients.find(p => p.id === selectedReport.patient_id)?.name}</div>
                   <span>•</span>
                   <div>Uploaded: {new Date(selectedReport.created_at).toLocaleDateString()}</div>
                </div>
              </div>
              <button onClick={() => setSelectedReport(null)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', cursor: 'pointer', padding: 8, borderRadius: 8 }}><X size={20} /></button>
            </div>

            {selectedReport.status !== 'analyzed' ? (
              <div style={{ textAlign: 'center', padding: '3rem', background: 'rgba(255,255,255,0.02)', borderRadius: 20, border: '1px solid var(--border)', marginBottom: '2rem' }}>
                <Activity size={48} style={{ color: 'var(--text-secondary)', opacity: 0.3, marginBottom: '1.5rem' }} />
                <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Original Document Uploaded</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: '2rem' }}>Click below to let the AI scan this report for any medical anomalies or critical values.</p>
                <button 
                  onClick={() => handleAnalyze(selectedReport.id)}
                  disabled={analyzing}
                  className="btn btn-primary" 
                  style={{ margin: '0 auto', height: 50, padding: '0 2rem', gap: 10, fontSize: 16, fontWeight: 700 }}
                >
                  {analyzing ? <Loader className="spinner" size={20} /> : <Sparkles size={20} />}
                  {analyzing ? 'AI ANALYZING NOW...' : 'SCAN WITH AI FOR INSIGHTS'}
                </button>
              </div>
            ) : (
              <div style={{ animation: 'fadeIn 0.5s ease' }}>
                <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(14,165,233,0.1))', borderRadius: 20, padding: '1.5rem', marginBottom: '2rem', border: '1px solid rgba(99,102,241,0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <Sparkles size={18} color="#6366f1" />
                    <span style={{ fontWeight: 800, fontSize: 16, color: '#6366f1' }}>AI Medical Summary</span>
                  </div>
                  <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--text-primary)' }}>{selectedReport.ai_summary}</p>
                </div>

                <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: '1.25rem', paddingLeft: 8 }}>Identified Anomalies</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                  {(() => {
                    let anomalies = [];
                    try { anomalies = Array.isArray(selectedReport.ai_anomalies) ? selectedReport.ai_anomalies : JSON.parse(selectedReport.ai_anomalies || '[]'); } catch(e) { anomalies = []; }
                    
                    if (anomalies.length === 0) return <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14, padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 12 }}>No significant anomalies detected by AI.</p>;
                    
                    return anomalies.map((a, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', background: 'rgba(255,255,255,0.03)', borderRadius: 16, border: '1px solid var(--border)' }}>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 700 }}>{a.parameter}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Normal Range: {a.range}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 16, fontWeight: 900, color: a.status === 'Normal' ? '#10b981' : a.status === 'High' || a.status === 'Critical' ? '#ef4444' : '#f59e0b' }}>{a.value}</div>
                          <span className={`badge ${a.status === 'Normal' ? 'bg-success' : 'bg-danger'}`} style={{ 
                            fontSize: 10, 
                            padding: '4px 10px',
                            background: a.status === 'Normal' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.15)', 
                            color: a.status === 'Normal' ? '#10b981' : '#ef4444'
                          }}>
                            {a.status}
                          </span>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}

            <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem', display: 'flex', gap: '1rem' }}>
               <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setSelectedReport(null)}>CLOSE VIEW</button>
               <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}><Download size={18} /> DOWNLOAD DOC</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
