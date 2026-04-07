import { useState, useEffect } from 'react';
import { ClipboardList, Share2, Printer, Download, Search, LayoutGrid, List, Inbox } from 'lucide-react';
import { getPatientLabReports } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function PatientLabReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchReports = async () => {
      if (!user?.patient_id) { setLoading(false); return; }
      try {
        const { data } = await getPatientLabReports(user.patient_id);
        const transformed = (data?.data || []).map(r => ({
          ...r,
          name: r.report_type || 'Unknown Diagnostic',
          date: r.report_date ? new Date(r.report_date).toLocaleDateString() : 'N/A',
          doctor: 'Verified Lab Specialist',
          id: r.id
        }));
        setReports(transformed);
      } catch (err) {
        console.error('Error fetching lab reports:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [user]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontWeight: 900, fontSize: 32 }}>Lab <span className="gradient-text">Reports</span></h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginTop: 4 }}>Access your medical test results and diagnostic findings.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <div style={{ position: 'relative', width: 250 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input className="form-input" placeholder="Search tests..." style={{ paddingLeft: '2.5rem', height: 44, borderRadius: 12, fontSize: 13 }} />
          </div>
          <button className="btn btn-secondary" style={{ padding: '0.625rem' }}><LayoutGrid size={20} /></button>
          <button className="btn btn-secondary" style={{ padding: '0.625rem' }}><List size={20} /></button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem', minHeight: '300px' }}>
        {reports.length > 0 ? (
          reports.map((report) => (
            <div key={report.id} className="glass-card" style={{ padding: '1.5rem', transition: 'all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div style={{ padding: '0.5rem', borderRadius: '50%', background: 'rgba(16,185,129,0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ClipboardList size={24} />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-secondary" style={{ padding: '0.4rem', background: 'transparent' }}><Printer size={16} /></button>
                  <button className="btn btn-secondary" style={{ padding: '0.4rem', background: 'transparent' }}><Share2 size={16} /></button>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>{report.name}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>
                  <span>{report.date}</span>
                  <span style={{ opacity: 0.3 }}>|</span>
                  <span>#{report.id}</span>
                </div>
              </div>

              <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.02)', borderRadius: 12, border: '1px solid var(--border)', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>Verified By</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>{report.doctor}</div>
              </div>

              <button className="btn btn-primary" style={{ width: '100%', padding: '0.8rem', justifyContent: 'center', fontSize: 13, gap: 10, fontWeight: 900 }}>
                DOWNLOAD REPORT <Download size={18} />
              </button>
            </div>
          ))
        ) : (
          <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem', background: 'rgba(0,0,0,0.01)', borderRadius: 24, border: '1px dashed var(--border)' }}>
            <Inbox size={48} opacity={0.2} style={{ marginBottom: 16 }} />
            <div style={{ fontSize: 16, fontWeight: 800, opacity: 0.5 }}>No lab reports found</div>
            <p style={{ fontSize: 13, fontWeight: 600, opacity: 0.4 }}>Your clinical test results will be uploaded here once verified.</p>
          </div>
        )}
      </div>
      
      {/* Footer / Summary Info */}
      <div style={{ padding: '2rem', textAlign: 'center', borderTop: '1px solid var(--border)', opacity: 0.5 }}>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          Only official pathological reports verified by hospital staff are available for download. 
          Contact the help desk for older historical records.
        </p>
      </div>
    </div>
  );
}
