import { useState, useEffect } from 'react';
import { Activity, Heart, Thermometer, Wind, Droplets, User, Loader } from 'lucide-react';
import { getPatients } from '../../services/api';
import toast from 'react-hot-toast';

export default function PatientVitals() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getPatients();
        setPatients(res.data.data.slice(0, 4)); // Mocking some patients
      } catch {
        toast.error('Failed to load patients for vitals');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <div>Loading Vitals...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontWeight: 800, fontSize: 24 }}>Real-time Patient Vitals</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Monitoring critical signs across your patients</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {patients.map((p, idx) => (
          <div key={p.id} className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={20} color="#6366f1" />
                </div>
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: 16 }}>{p.name}</h3>
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Patient ID: #{p.id}</p>
                </div>
              </div>
              <div className="pulse-dot" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.05)', borderRadius: 16, border: '1px solid rgba(239,68,68,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Heart size={16} color="#ef4444" />
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#ef4444' }}>Pulse (BPM)</span>
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, color: 'white' }}>{72 + idx * 4}</div>
                <div style={{ height: 4, width: '100%', background: 'rgba(0,0,0,0.2)', borderRadius: 10, marginTop: '0.5rem', overflow: 'hidden' }}>
                  <div style={{ width: '70%', height: '100%', background: '#ef4444' }} />
                </div>
              </div>

              <div style={{ padding: '1rem', background: 'rgba(16,185,129,0.05)', borderRadius: 16, border: '1px solid rgba(16,185,129,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Droplets size={16} color="#10b981" />
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#10b981' }}>SpO2 (%)</span>
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, color: 'white' }}>{98 - idx}</div>
                <div style={{ height: 4, width: '100%', background: 'rgba(0,0,0,0.2)', borderRadius: 10, marginTop: '0.5rem', overflow: 'hidden' }}>
                  <div style={{ width: '95%', height: '100%', background: '#10b981' }} />
                </div>
              </div>

              <div style={{ padding: '1rem', background: 'rgba(245,158,11,0.05)', borderRadius: 16, border: '1px solid rgba(245,158,11,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Thermometer size={16} color="#f59e0b" />
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#f59e0b' }}>Temp (°F)</span>
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'white' }}>98.{6 + idx}</div>
              </div>

              <div style={{ padding: '1rem', background: 'rgba(14,165,233,0.05)', borderRadius: 16, border: '1px solid rgba(14,165,233,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Wind size={16} color="#0ea5e9" />
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#0ea5e9' }}>BP (mmHg)</span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>120/80</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
