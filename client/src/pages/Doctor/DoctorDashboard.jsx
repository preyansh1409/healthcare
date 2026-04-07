import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAppointments, updateAppointment, getDoctorStats, getDoctors } from '../../services/api';
import AppointmentCard from '../../components/AppointmentCard';
import { Calendar, Clock, CheckCircle, Loader, Stethoscope, Users, Activity, ClipboardList, Bell } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const todayVal = new Date();
  const todayStr = `${todayVal.getFullYear()}-${String(todayVal.getMonth() + 1).padStart(2, '0')}-${String(todayVal.getDate()).padStart(2, '0')}`;
  
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState(null);
  const [doctorId, setDoctorId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [apptRes, doctorsRes] = await Promise.all([getAppointments(), getDoctors()]);
      setAppointments(apptRes.data.data);

      const myDoctor = doctorsRes.data.data.find(d => d.email === user.email);
      if (myDoctor) {
        setDoctorId(myDoctor.id);
        const statsRes = await getDoctorStats(myDoctor.id);
        setStats(statsRes.data.data);
      }
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await updateAppointment(id, { status });
      toast.success(`Appointment marked as ${status}`);
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    } catch { toast.error('Failed to update status'); }
  };

  const filtered = appointments.filter(a => {
    const aDate = new Date(a.appointment_date);
    const aDateStr = `${aDate.getFullYear()}-${String(aDate.getMonth() + 1).padStart(2, '0')}-${String(aDate.getDate()).padStart(2, '0')}`;
    const isSameDate = aDateStr === selectedDate;
    if (filter === 'pending') return isSameDate && a.status === 'pending';
    if (filter === 'completed') return isSameDate && a.status === 'completed';
    return isSameDate;
  });

  const dateStats = {
    total: appointments.filter(a => {
      const d = new Date(a.appointment_date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` === selectedDate;
    }).length,
    pending: appointments.filter(a => {
      const d = new Date(a.appointment_date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` === selectedDate && a.status === 'pending';
    }).length,
    completed: appointments.filter(a => {
      const d = new Date(a.appointment_date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` === selectedDate && a.status === 'completed';
    }).length,
  };

  const statItems = [
    { label: "Patients for Date", value: dateStats.total, icon: Calendar, color: '#6366f1' },
    { label: 'Pending for Date', value: dateStats.pending, icon: Clock, color: '#f59e0b' },
    { label: 'Completed for Date', value: dateStats.completed, icon: CheckCircle, color: '#10b981' },
    { label: 'Lifetime Total', value: stats?.total || 0, icon: Users, color: '#0ea5e9' },
  ];

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '0.75rem' }}>
      <Loader size={20} className="spinner" color="#6366f1" />
      <span style={{ color: 'var(--text-secondary)' }}>Loading your dashboard...</span>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontWeight: 900, fontSize: 26 }}>
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, <span className="gradient-text">{(user?.name || '').startsWith('Dr.') ? user.name : `Dr. ${user?.name || 'Doctor'}`}</span> 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div>
          <div style={{ background: 'var(--bg-card)', padding: '0.4rem 1rem', borderRadius: 12, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>Select Dashboard Date:</span>
            <input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontWeight: 800, cursor: 'pointer', outline: 'none', fontSize: 14 }}
            />
          </div>
        </div>
      </div>

      {/* Stats - Only on main dashboard */}
      {window.location.pathname === '/doctor' && stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
          {statItems.map(({ label, value, icon: Icon, color }) => (
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
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', padding: '0.25rem', background: 'var(--bg-card)', borderRadius: 12, width: 'fit-content', border: '1px solid var(--border)' }}>
        {['all', 'pending', 'completed'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{
              padding: '0.5rem 1rem', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: 13, textTransform: 'capitalize',
              background: filter === f ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'transparent',
              color: filter === f ? 'white' : 'var(--text-secondary)',
              transition: 'all 0.2s'
            }}>
            {f === 'all' ? `All Date (${dateStats.total})` : f === 'pending' ? `Pending (${dateStats.pending})` : `Completed (${dateStats.completed})`}
          </button>
        ))}
      </div>

      {/* Hub Quick Actions - Only on main dashboard */}
      {window.location.pathname === '/doctor' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          <button className="glass-card stat-card" style={{ textAlign: 'left', cursor: 'pointer', '--gradient': 'linear-gradient(90deg, #10b981, #34d399)' }} onClick={() => navigate('/doctor/vitals')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Activity color="#10b981" pulse />
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>Real-time Vitals</h3>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Status monitor</p>
              </div>
            </div>
          </button>
          <button className="glass-card stat-card" style={{ textAlign: 'left', cursor: 'pointer', '--gradient': 'linear-gradient(90deg, #f59e0b, #fbbf24)' }} onClick={() => navigate('/doctor/lab-reports')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <ClipboardList color="#f59e0b" />
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>Lab Analytics</h3>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Recent records</p>
              </div>
            </div>
          </button>
          <button className="glass-card stat-card" style={{ textAlign: 'left', cursor: 'pointer', '--gradient': 'linear-gradient(90deg, #6366f1, #a855f7)' }} onClick={() => navigate('/doctor/admitted')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Users color="#6366f1" />
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>New Prescription</h3>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Select patient</p>
            </div>
          </div>
        </button>
        <button className="glass-card stat-card" style={{ textAlign: 'left', cursor: 'pointer', '--gradient': 'linear-gradient(90deg, #ef4444, #f87171)' }} onClick={() => navigate('/doctor/emergency')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Bell color="#ef4444" />
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>Emergency</h3>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Rapid broadcast</p>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Appointments List - Only on dedicated page */}
      {window.location.pathname === '/doctor/appointments' && (
        <div style={{ marginTop: '0.5rem' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: '1rem' }}>My Appointments History</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {filtered.map(appt => (
              <AppointmentCard key={appt.id} appointment={appt} onStatusChange={handleStatusChange} />
            ))}
            {filtered.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
                <Stethoscope size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                <p>No records found for this filter</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
