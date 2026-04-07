import { useState, useEffect } from 'react';
import { triggerEmergency, getDoctors } from '../services/api';
import { Bell, Send, X, AlertCircle, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EmergencyModal({ onClose }) {
  const [specialty, setSpecialty] = useState('All');
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getDoctors().then(res => setDoctors(res.data.data)).catch(() => toast.error('Failed to load doctors'));
  }, []);

  const specialties = ['All', 'Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'Emergency Medicine', 'Surgery'];

  const handleSend = async () => {
    setLoading(true);
    try {
      await triggerEmergency({ 
        specialty: selectedDoctorId ? null : specialty, 
        doctorId: selectedDoctorId || null,
        message: message.trim() || "Come at emergency floor" 
      });
      toast.success('EMERGENCY BROADCAST SENT!', {
        duration: 5000,
        style: { background: '#ef4444', color: 'white', fontWeight: 900 }
      });
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send alert');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1.5rem' }}>
      <div className="glass-card" style={{ maxWidth: 520, width: '100%', padding: '2rem', border: '2px solid rgba(239, 68, 68, 0.4)', animation: 'slideUp 0.3s ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bell size={20} color="white" fill="white" className="pulse" />
            </div>
            <div>
              <h2 style={{ fontWeight: 900, color: '#ef4444', fontSize: 20 }}>Emergency Broadcast</h2>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Trigger a hospital-wide or individual doctor alert</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="form-label" style={{ fontWeight: 700 }}>Target Specialist Group</label>
              <select className="form-input" disabled={!!selectedDoctorId} value={specialty} onChange={(e) => setSpecialty(e.target.value)} style={{ borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                {specialties.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label" style={{ fontWeight: 700, color: '#ef4444' }}><User size={10} style={{ display: 'inline', marginRight: 4 }} />Specific Doctor</label>
              <select className="form-input" value={selectedDoctorId} onChange={(e) => setSelectedDoctorId(e.target.value)} style={{ borderColor: 'rgba(239, 68, 68, 0.4)', background: 'rgba(239, 68, 68, 0.05)' }}>
                <option value="">-- Optional: Individual --</option>
                {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.name} ({d.specialization})</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="form-label" style={{ fontWeight: 700 }}>Priority Message (Optional)</label>
            <textarea 
              className="form-input" 
              placeholder="Defaults to: Come at emergency floor" 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              style={{ resize: 'none', borderColor: 'rgba(239, 68, 68, 0.2)', padding: '1rem' }}
            />
          </div>

          <div style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '1rem', borderRadius: 12, display: 'flex', gap: 12, border: '1px solid rgba(239, 68, 68, 0.1)' }}>
            <AlertCircle size={24} color="#ef4444" style={{ flexShrink: 0 }} />
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0 }}>This will send a high-priority alert. A default message "Come at emergency floor" will be sent if none is provided.</p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button 
              className="btn pulse" 
              onClick={handleSend}
              disabled={loading}
              style={{ flex: 2, background: '#ef4444', color: 'white', fontWeight: 900, justifyContent: 'center', fontSize: 16 }}
            >
              {loading ? 'Broadcasting...' : <><Send size={18} /> INITIATE EMERGENCY</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
