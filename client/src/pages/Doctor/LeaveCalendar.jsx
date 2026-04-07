import { useState, useEffect } from 'react';
import { markLeave, getDoctorLeaves } from '../../services/api';
import { Calendar, Clock, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LeaveCalendar() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ date: '', reason: '' });

  useEffect(() => { fetchLeaves(); }, []);

  const fetchLeaves = async () => {
    try {
      const { data } = await getDoctorLeaves();
      setLeaves(data.data);
    } catch { toast.error('Failed to load leaves'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await markLeave(formData);
      toast.success('Unavailability marked successfully');
      setFormData({ date: '', reason: '' });
      fetchLeaves();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark leave');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ marginBottom: '1rem' }}>
        <h1 style={{ fontWeight: 900, fontSize: 32 }}>Leave & <span className="gradient-text">Availability</span></h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>Manage your clinical schedule and mark planned absences.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '2rem', alignItems: 'start' }}>
        {/* Form Selection */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h2 style={{ fontWeight: 800, fontSize: 20, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Calendar size={20} color="#6366f1" /> Schedule Absence
          </h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label className="form-label">Select Date *</label>
              <input 
                type="date" 
                required 
                className="form-input"
                min={new Date().toLocaleDateString('en-CA')}
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">Reason for Unavailability</label>
              <textarea 
                className="form-input"
                placeholder="e.g. Personal, Conference, Surgery Day..."
                rows={4}
                value={formData.reason}
                onChange={e => setFormData({ ...formData, reason: e.target.value })}
              />
            </div>
            <div style={{ 
              background: 'rgba(99,102,241,0.08)', padding: '1rem', borderRadius: 12, border: '1px solid rgba(99,102,241,0.2)',
              fontSize: 12, color: 'var(--text-secondary)', display: 'flex', gap: 10
            }}>
              <AlertCircle size={16} color="#6366f1" style={{ flexShrink: 0 }} />
              <p>Once marked, receptionists will not be able to book appointments for you on this date.</p>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ height: 50, justifyContent: 'center' }}>
              {loading ? 'Processing...' : 'Mark Unavailability'}
            </button>
          </form>
        </div>

        {/* Existing Leaves List */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h2 style={{ fontWeight: 800, fontSize: 20, marginBottom: '1.5rem' }}>Upcoming Planned Absences</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {leaves.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 0', opacity: 0.5 }}>
                <Clock size={48} style={{ margin: '0 auto 1rem' }} />
                <p>No upcoming absences planned.</p>
              </div>
            ) : (
              leaves.map(l => (
                <div key={l.id} style={{ 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                  padding: '1.25rem', borderRadius: 16, border: '1px solid var(--border)',
                  background: 'rgba(255,255,255,0.02)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{ 
                      width: 50, height: 50, borderRadius: 12, background: 'rgba(16,185,129,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981'
                    }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase' }}>
                          {new Date(l.leave_date).toLocaleDateString('en-US', { month: 'short' })}
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 900 }}>
                          {new Date(l.leave_date).getDate()}
                        </div>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{new Date(l.leave_date).toLocaleDateString('en-US', { weekday: 'long' })}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{l.reason || 'No specific reason provided'}</div>
                    </div>
                  </div>
                  <div className="badge" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                    <CheckCircle2 size={12} /> ACTIVE
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
