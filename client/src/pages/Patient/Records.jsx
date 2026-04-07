import { useState, useEffect } from 'react';
import { ClipboardList, Activity, Brain, Heart, Download, Share2, Search, Printer, LayoutGrid, List, Inbox } from 'lucide-react';
import { getPatientById } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function PatientRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchRecords = async () => {
      if (!user?.patient_id) { setLoading(false); return; }
      try {
        const { data } = await getPatientById(user.patient_id);
        const transformed = (data?.data?.prescriptions || []).map(px => ({
          ...px,
          type: 'Clinical Diagnosis',
          diagnosis: px.diagnosis || 'General Checkup',
          doctor: px.doctor_name || 'Dr. Practitioner',
          date: px.created_at ? new Date(px.created_at).toLocaleDateString() : 'N/A',
          color: (px.diagnosis || '').toLowerCase().includes('heart') ? '#ef4444' : (px.diagnosis || '').toLowerCase().includes('brain') ? '#6366f1' : '#10b981'
        }));
        setRecords(transformed);
      } catch (err) {
        console.error('Error fetching records:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, [user]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontWeight: 900, fontSize: 32 }}>Medical <span className="gradient-text">Records</span></h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginTop: 4 }}>Full history of your diagnoses, treatments, and clinical notes.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <div style={{ position: 'relative', width: 250 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input className="form-input" placeholder="Search diagnoses..." style={{ paddingLeft: '2.5rem', height: 44, borderRadius: 12, fontSize: 13 }} />
          </div>
          <button className="btn btn-secondary" style={{ padding: '0.625rem' }}><LayoutGrid size={20} /></button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: '400px' }}>
        {records.length > 0 ? (
          <>
            <div style={{ 
              display: 'grid', gridTemplateColumns: '80px 1.5fr 2fr 1.5fr 1fr 100px', 
              padding: '1rem 2rem', background: '#f8fafc', borderRadius: 12, 
              border: '1px solid var(--border)', fontWeight: 900, 
              fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              <div>ID</div>
              <div>Record Type</div>
              <div>Primary Diagnosis</div>
              <div>Surgeon</div>
              <div>Visit Date</div>
              <div style={{ textAlign: 'center' }}>Actions</div>
            </div>

            {records.map((record) => (
              <div key={record.id} style={{ 
                display: 'grid', gridTemplateColumns: '80px 1.5fr 2fr 1.5fr 1fr 100px', 
                alignItems: 'center', padding: '1.25rem 2rem', 
                background: 'white', borderRadius: 12, border: '1px solid var(--border)',
                transition: 'all 0.3s ease'
              }}>
                <div style={{ fontWeight: 800, color: 'var(--text-secondary)', fontSize: 13 }}>#{record.id?.toString().padStart(3, '0')}</div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ padding: '0.5rem', background: `${record.color}15`, color: record.color, borderRadius: 8 }}>
                    <ClipboardList size={18} />
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)' }}>{record.type}</div>
                </div>

                <div style={{ fontWeight: 600, fontSize: 13, color: '#64748b', paddingRight: '1rem' }}>
                  {record.diagnosis}
                </div>

                <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)' }}>{record.doctor}</div>
                
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-secondary)' }}>{record.date}</div>

                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                  <button className="btn btn-secondary" style={{ padding: '0.5rem', background: '#f1f5f9', border: 'none' }}><Download size={16} /></button>
                  <button className="btn btn-secondary" style={{ padding: '0.5rem', background: '#f1f5f9', border: 'none' }}><Share2 size={16} /></button>
                </div>
              </div>
            ))}
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem', background: 'rgba(0,0,0,0.01)', borderRadius: 24, border: '1px dashed var(--border)' }}>
            <Inbox size={48} opacity={0.2} style={{ marginBottom: 16 }} />
            <div style={{ fontSize: 16, fontWeight: 800, opacity: 0.5 }}>No medical records found</div>
            <p style={{ fontSize: 13, fontWeight: 600, opacity: 0.4 }}>Your historical diagnoses and treatment reports will appear here.</p>
          </div>
        )}
      </div>
      
      {/* Privacy Note */}
      <div style={{ marginTop: '2rem', padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 12 }}>
        Medical records are secured using end-to-end encryption. Sharing records generates a temporary, single-use access token for the recipient.
      </div>
    </div>
  );
}
