import { Calendar, Clock, User, Stethoscope, MoreVertical, ExternalLink, Pill, CheckCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const statusConfig = {
  pending: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'Pending' },
  confirmed: { color: '#6366f1', bg: 'rgba(99,102,241,0.12)', label: 'Confirmed' },
  checked_in: { color: '#0ea5e9', bg: 'rgba(14,165,233,0.12)', label: 'Checked In' },
  completed: { color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: 'Already Visited' },
  cancelled: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', label: 'Cancelled' },
};

export default function AppointmentCard({ appointment, onStatusChange, showActions = true }) {
  const navigate = useNavigate();
  const { patient_name, doctor_name, specialization, appointment_date, appointment_time, reason, status, id, patient_id } = appointment;
  const cfg = statusConfig[status] || statusConfig.pending;

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const formatTime = (t) => {
    const [h, m] = t.split(':');
    const h12 = h % 12 || 12;
    return `${h12}:${m} ${h >= 12 ? 'PM' : 'AM'}`;
  };

  const goToPrescription = (e) => {
    // Prevent navigation if clicking on action buttons
    if (e.target.closest('button')) return;
    navigate(`/doctor/prescribe/${patient_id}/${id}`);
  };

  return (
    <div 
      className="glass-card fade-in hover-card" 
      onClick={goToPrescription}
      style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem', cursor: 'pointer', transition: 'all 0.2s' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, #6366f1, #0ea5e9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <User size={18} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--primary)' }}>
              {patient_name}
              <ExternalLink size={12} style={{ opacity: 0.6 }} />
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Stethoscope size={11} />
              {doctor_name} · {specialization}
            </div>
          </div>
        </div>
        <span className="badge" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
      </div>

      {/* Details */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
          <Calendar size={13} color="#6366f1" />
          {formatDate(appointment_date)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
          <Clock size={13} color="#0ea5e9" />
          {formatTime(appointment_time)}
        </div>
      </div>

      {reason && (
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', background: 'rgba(99,102,241,0.06)', padding: '0.5rem 0.75rem', borderRadius: 8 }}>
          📋 {reason}
        </div>
      )}

      {/* Actions */}
      {showActions && onStatusChange && (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
          {(status === 'pending' || status === 'checked_in' || status === 'confirmed') && (
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', justifyContent: 'center', padding: '0.625rem', fontSize: 12, borderRadius: 10 }}
              onClick={(e) => { e.stopPropagation(); navigate(`/doctor/prescribe/${patient_id}/${id}`); }}
            >
              <Pill size={14} /> Add Prescription / Patient Hx
            </button>
          )}
          {status === 'completed' && (
             <div style={{ fontSize: 11, color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, width: '100%', justifyContent: 'center' }}>
              <CheckCircle size={14} /> Already Visited
             </div>
          )}
        </div>
      )}
    </div>
  );
}
