import { useState, useEffect } from 'react';
import { Users, Calendar, Activity, Bed, Bell } from 'lucide-react';
import { getAdminStats, getAnalytics, getEmergencyLogs, getAllDoctorLeaves } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import EmergencyModal from '../../components/EmergencyModal';
import toast from 'react-hot-toast';

const COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444'];

export default function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [showEmergency, setShowEmergency] = useState(false);
  const [tab, setTab] = useState('overview');
  const [emergencyLogs, setEmergencyLogs] = useState([]);
  const [doctorLeaves, setDoctorLeaves] = useState([]);
  const tabs = ['overview', 'Emergency Logs', 'Staff Roster'];

  useEffect(() => { loadData(); }, [selectedMonth]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, analyticsRes, logsRes, leavesRes] = await Promise.all([
        getAdminStats(selectedMonth), getAnalytics(), getEmergencyLogs(), getAllDoctorLeaves()
      ]);
      setStats(statsRes.data.data);
      setAnalytics(analyticsRes.data.data);
      setEmergencyLogs(logsRes.data.data);
      setDoctorLeaves(leavesRes.data.data);
    } catch { toast.error('Failed to load overview data'); }
    finally { setLoading(false); }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div className="spinner" style={{ width: 40, height: 40 }}></div>
    </div>
  );

  const statCards = [
    { label: 'Total Patient', value: stats?.totalPatients || 0, icon: Users, color: '#6366f1', gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)' },
    { label: 'Hospital Doctors', value: stats?.totalDoctors || 0, icon: Activity, color: '#0ea5e9', gradient: 'linear-gradient(135deg, #0ea5e9, #0284c7)' },
    { label: 'Total Appointments', value: stats?.totalAppointments || 0, icon: Calendar, color: '#10b981', gradient: 'linear-gradient(135deg, #10b981, #059669)' },
    { label: 'Available Beds', value: (stats?.totalBeds - stats?.occupiedBeds) || 0, icon: Bed, color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontWeight: 900, fontSize: 32 }}>Hospital <span className="gradient-text">Overview</span></h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>Real-time hospital operations and performance analytics.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ position: 'relative' }}>
             <Calendar size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#6366f1' }} />
             <input 
                type="month" 
                className="form-input" 
                style={{ paddingLeft: '2.5rem', width: 220, height: 42 }} 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)} 
             />
          </div>
          <button 
            className="btn" 
            onClick={() => setShowEmergency(true)}
            style={{ background: '#ef4444', color: 'white', fontWeight: 800, height: 42, padding: '0 1.5rem', borderRadius: 12, boxShadow: '0 8px 30px rgba(239,68,68,0.3)' }}
          >
            <Bell size={18} fill="white" /> EMERGENCY
          </button>
        </div>
      </div>

      {showEmergency && <EmergencyModal onClose={() => setShowEmergency(false)} />}
      
      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{
              padding: '0.5rem 1rem', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em',
              background: tab === t ? 'rgba(99,102,241,0.1)' : 'transparent',
              color: tab === t ? '#6366f1' : 'var(--text-secondary)',
              transition: 'all 0.2s'
            }}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        {statCards.map(({ label, value, icon: Icon, color, gradient }) => (
          <div key={label} className="stat-card" style={{ '--gradient': gradient }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500, marginBottom: 8 }}>{label}</p>
                <p style={{ fontSize: 28, fontWeight: 900, color }}>{value}</p>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={20} color={color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {analytics && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: 15 }}>Monthly Appointments</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analytics.monthlyAppts}>
                <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
                <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: 15 }}>Appointment Specializations</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={analytics.bySpecialization} dataKey="count" nameKey="specialization" cx="50%" cy="50%" outerRadius={80}>
                  {analytics.bySpecialization.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          </div>
        )}
      </>
    )}

      {/* EMERGENCY LOGS TAB */}
      {tab === 'Emergency Logs' && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontWeight: 800, fontSize: 18, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Bell size={20} color="#ef4444" /> Recent Emergency Broadcasts
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr><th>Triggered By</th><th>Targeted Doctor/Group</th><th>Alert Message</th><th>Date & Time</th></tr>
              </thead>
              <tbody>
                {emergencyLogs.length === 0 ? (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No emergencies logged recently.</td></tr>
                ) : (
                  emergencyLogs.map(log => (
                    <tr key={log.id}>
                      <td style={{ fontWeight: 700 }}>{log.sender_name}</td>
                      <td><span className="badge" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>{log.target}</span></td>
                      <td style={{ fontSize: 13 }}>{log.message}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DOCTOR LEAVE ROSTER (MONTHLY VIEW) */}
      {tab === 'Staff Roster' && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontWeight: 800, fontSize: 18, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Calendar size={20} color="#6366f1" /> Monthly Staff Availability Roster
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: '2rem' }}>Complete view of upcoming staff leaves to assist in appointment scheduling.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {doctorLeaves.length === 0 ? (
                <div style={{ gridColumn: 'span 15', textAlign: 'center', padding: '3rem', background: 'rgba(255,255,255,0.02)', borderRadius: 12 }}>
                    No staff leaves scheduled for this month.
                </div>
            ) : (
                Object.entries(
                    doctorLeaves.reduce((acc, leave) => {
                        const drName = leave.doctor_name;
                        if (!acc[drName]) acc[drName] = [];
                        acc[drName].push(leave);
                        return acc;
                    }, {})
                ).map(([name, leaves]) => (
                    <div key={name} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 13 }}>
                                {name.charAt(0)}
                            </div>
                            <div>
                                <h4 style={{ fontWeight: 700, fontSize: 14 }}>Dr. {name}</h4>
                                <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{leaves[0].specialization}</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Off Duty:</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                {leaves.map((l, i) => (
                                    <span key={i} className="badge" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontSize: 10, border: '1px solid rgba(245,158,11,0.05)' }}>
                                        {new Date(l.leave_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
