import { useState, useEffect } from 'react';
import { getAdminStats, getAppointments, getTodayAppointments, getPatients } from '../../services/api';
import { Calendar, Users, Clock, CheckCircle } from 'lucide-react';
import AppointmentCard from '../../components/AppointmentCard';
import EmergencyModal from '../../components/EmergencyModal';
import toast from 'react-hot-toast';
import { Bell } from 'lucide-react';

export default function ReceptionistDashboard() {
  const [stats, setStats] = useState(null);
  const [todayAppts, setTodayAppts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEmergency, setShowEmergency] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [statsRes, todayRes] = await Promise.all([getAdminStats(), getTodayAppointments()]);
      setStats(statsRes.data.data);
      setTodayAppts(todayRes.data.data);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  const statCards = stats ? [
    { label: "Today's Appointments", value: stats.todayAppointments, icon: Calendar, color: '#6366f1' },
    { label: 'Total Patients', value: stats.totalPatients, icon: Users, color: '#0ea5e9' },
    { label: 'Available Beds', value: (stats.totalBeds || 0) - (stats.occupiedBeds || 0), icon: CheckCircle, color: '#10b981' },
    { label: 'Total Appointments', value: stats.totalAppointments, icon: Clock, color: '#f59e0b' },
  ] : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontWeight: 900, fontSize: 26 }}>Receptionist <span className="gradient-text">Dashboard</span></h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button 
          className="btn" 
          onClick={() => setShowEmergency(true)}
          style={{ background: '#ef4444', color: 'white', fontWeight: 800, padding: '0.75rem 1.5rem', borderRadius: 12, boxShadow: '0 8px 30px rgba(239,68,68,0.3)' }}
        >
          <Bell size={18} fill="white" /> EMERGENCY BROADCAST
        </button>
      </div>

      {showEmergency && <EmergencyModal onClose={() => setShowEmergency(false)} />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-card" style={{ '--gradient': `linear-gradient(90deg, ${color}, ${color}88)` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 6 }}>{label}</p>
                <p style={{ fontSize: 32, fontWeight: 900, color }}>{value}</p>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={20} color={color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Today's appointments */}
      <div>
        <h2 style={{ fontWeight: 700, fontSize: 18, marginBottom: '1rem' }}>Today's Appointments</h2>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Loading...</div>
        ) : todayAppts.length === 0 ? (
          <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Calendar size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <p>No appointments scheduled for today</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {todayAppts.map(appt => <AppointmentCard key={appt.id} appointment={appt} showActions={false} />)}
          </div>
        )}
      </div>
    </div>
  );
}
