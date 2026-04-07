import { useState } from 'react';
import { Bell, AlertTriangle, Send, History, User, Activity, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EmergencyAlert() {
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');

  const sendAlert = async () => {
    if (!reason.trim()) return toast.error('Please specify the reason for the emergency');
    setLoading(true);
    // Mocking an emergency alert system
    setTimeout(() => {
      setLoading(false);
      setReason('');
      toast.success('EMERGENCY ALERT BROADCASTED TO RAPID RESPONSE TEAM!', {
        duration: 5000,
        style: { background: '#ef4444', color: 'white', fontWeight: 900 }
      });
    }, 1500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontWeight: 800, fontSize: 24 }}>Rapid Response Tool</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Summon medical support and broadcast emergency alerts to relevant wards</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1.5fr) minmax(280px, 1fr)', gap: '1.5rem', flexWrap: 'wrap' }}>
        {/* Main Alert Panel */}
        <div className="glass-card fade-in" style={{ padding: '2rem', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '2rem' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bell size={24} color="white" fill="white" className="spinner" style={{ animationDuration: '0.8s' }} />
            </div>
            <div>
              <h2 style={{ fontWeight: 900, color: '#ef4444', fontSize: 20 }}>Trigger Emergency System</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Critical system for summoning specialists and rapid medical teams</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Reason for Alert</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex: Code Blue in Patient Ward G-05 - Immediate surgery required..."
                style={{ width: '100%', height: 120, padding: '1rem', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--border)', borderRadius: 12, resize: 'none' }}
              />
            </div>

            <button
              onClick={sendAlert}
              disabled={loading}
              className="btn"
              style={{ width: '100%', height: 60, background: '#ef4444', color: 'white', justifyContent: 'center', fontSize: 18, fontWeight: 900, boxShadow: '0 8px 32px rgba(239,68,68,0.3)' }}
            >
              {loading ? <Loader size={24} className="spinner" /> : <><Send size={24} /> BROADCAST ALERT</>}
            </button>
            <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-secondary)' }}>Note: This action will ping all medical staff on duty within your department.</p>
          </div>
        </div>

        {/* Recent Alerts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="glass-card" style={{ padding: '1.5rem', flex: 1 }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem' }}>
              <History size={16} color="var(--primary)" />
              <h3 style={{ fontWeight: 700, fontSize: 14 }}>Recent Broadcasts</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { time: '10:45 AM', type: 'Code Blue', status: 'Resolved' },
                { time: 'Yesterday', type: 'Specialist Required', status: 'Completed' },
              ].map((h, i) => (
                <div key={i} style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <AlertTriangle size={14} color="#f59e0b" />
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600 }}>{h.type}</p>
                      <p style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{h.time}</p>
                    </div>
                  </div>
                  <span style={{ fontSize: 10, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '0.2rem 0.5rem', borderRadius: 6, fontWeight: 700 }}>{h.status}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="glass-card" style={{ padding: '1.5rem', background: 'var(--primary)', color: 'white' }}>
            <h4 style={{ fontSize: 13, fontWeight: 800, marginBottom: 4 }}>Rapid Medical Support</h4>
            <p style={{ fontSize: 11, opacity: 0.9 }}>Contact the Rapid Medical Support team immediately for assistance with complex cases or emergency situations.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
