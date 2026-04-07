import { useState, useEffect } from 'react';
import { Users, Calendar, Activity, Bed, Trash2, Plus, Bell, Settings, LayoutDashboard, Database, ShieldCheck, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { getAdminStats, getAnalytics, getUsers, getBeds, deleteUser, createUser, updateBed, verifyLedger, getBlockchainLedger, getEmergencyLogs, getAllDoctorLeaves } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import EmergencyModal from '../../components/EmergencyModal';
import toast from 'react-hot-toast';

const COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444'];
const tabs = ['overview', 'users', 'beds', 'Emergency Logs', 'Staff Roster', 'Blockchain Audit'];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [beds, setBeds] = useState([]);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'doctor', password: '', phone: '', specialization: '' });
  const [showEmergency, setShowEmergency] = useState(false);
  const [emergencyLogs, setEmergencyLogs] = useState([]);
  const [doctorLeaves, setDoctorLeaves] = useState([]);
  const [blockchainBlocks, setBlockchainBlocks] = useState([]);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, analyticsRes, usersRes, bedsRes, logsRes, leavesRes, blockchainRes] = await Promise.all([
        getAdminStats(), getAnalytics(), getUsers(), getBeds(), getEmergencyLogs(), getAllDoctorLeaves(), getBlockchainLedger()
      ]);
      setStats(statsRes.data.data);
      setAnalytics(analyticsRes.data.data);
      setUsers(usersRes.data.data);
      setBeds(bedsRes.data.data);
      setEmergencyLogs(logsRes.data.data);
      setDoctorLeaves(leavesRes.data.data);
      setBlockchainBlocks(blockchainRes.data.data);
    } catch { toast.error('Failed to load dashboard data'); }
    finally { setLoading(false); }
  };

  const handleVerifyLedger = async () => {
    setVerificationLoading(true);
    setVerificationResult(null);
    try {
      const res = await verifyLedger();
      setVerificationResult(res.data);
      if (res.data.valid) {
        toast.success('Blockchain Integrity Verified!');
      } else {
        toast.error('TAMPERING DETECTED!');
      }
    } catch {
      toast.error('Verification failed');
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await createUser(newUser);
      toast.success('User created');
      setShowAddUser(false);
      setNewUser({ name: '', email: '', role: 'doctor', password: '', phone: '', specialization: '' });
      loadData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create user'); }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await deleteUser(id);
      toast.success('User deleted');
      loadData();
    } catch { toast.error('Delete failed'); }
  };

  const handleUpdateBed = async (id, currentStatus) => {
    try {
      await updateBed(id, { occupied: currentStatus ? 0 : 1 });
      toast.success('Bed status updated');
      loadData();
    } catch { toast.error('Update failed'); }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div className="spinner" style={{ width: 40, height: 40 }}></div>
    </div>
  );

  const statCards = [
    { label: 'Total Patients', value: stats?.totalPatients || 0, icon: Users, color: '#6366f1', gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)' },
    { label: 'Hospital Doctors', value: stats?.totalDoctors || 0, icon: Activity, color: '#0ea5e9', gradient: 'linear-gradient(135deg, #0ea5e9, #0284c7)' },
    { label: 'Appointments', value: stats?.totalAppointments || 0, icon: Calendar, color: '#10b981', gradient: 'linear-gradient(135deg, #10b981, #059669)' },
    { label: 'Available Beds', value: (stats?.totalBeds - stats?.occupiedBeds) || 0, icon: Bed, color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontWeight: 900, fontSize: 32 }}>Receptionist <span className="gradient-text">Dashboard</span></h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>Hospital Management & Analytics Control Center</p>
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

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', padding: '0.25rem', background: 'var(--bg-card)', borderRadius: 12, width: 'fit-content', border: '1px solid var(--border)' }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{
              padding: '0.5rem 1.25rem', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: 13, textTransform: 'capitalize',
              background: tab === t ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'transparent',
              color: tab === t ? 'white' : 'var(--text-secondary)',
              transition: 'all 0.2s'
            }}>
            {t}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
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
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={analytics.monthlyAppts}>
                    <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
                    <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: 15 }}>Specializations</h3>
                <ResponsiveContainer width="100%" height={220}>
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

      {/* USERS TAB */}
      {tab === 'users' && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontWeight: 700, fontSize: 18 }}>User Accounts</h3>
            <button className="btn btn-primary" onClick={() => setShowAddUser(true)}><Plus size={16} /> Add User</button>
          </div>
          {showAddUser && (
            <form onSubmit={handleCreateUser} style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, padding: '1.25rem', marginBottom: '1.25rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <h4 style={{ gridColumn: 'span 2', fontWeight: 700, marginBottom: 4 }}>Create New User</h4>
              {[{ name: 'name', placeholder: 'Full Name' }, { name: 'email', placeholder: 'Email' }, { name: 'phone', placeholder: 'Phone' }, { name: 'password', placeholder: 'Password' }].map(f => (
                <input key={f.name} name={f.name} className="form-input" placeholder={f.placeholder} value={newUser[f.name]} onChange={e => setNewUser(p => ({ ...p, [e.target.name]: e.target.value }))} required={f.name !== 'phone'} />
              ))}
              <select name="role" className="form-input" value={newUser.role} onChange={e => setNewUser(p => ({ ...p, role: e.target.value }))}>
                <option value="doctor">Doctor</option>
                <option value="admin">Receptionist</option>
              </select>
              <div style={{ gridColumn: 'span 2', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddUser(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create User</button>
              </div>
            </form>
          )}
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Action</th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td><span className="badge" style={{ background: u.role === 'admin' ? 'rgba(99,102,241,0.1)' : 'rgba(14,165,233,0.1)', color: u.role === 'admin' ? '#6366f1' : '#0ea5e9' }}>{u.role}</span></td>
                    <td><button className="btn btn-danger" onClick={() => handleDeleteUser(u.id)}><Trash2 size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* BEDS TAB */}
      {tab === 'beds' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {beds.map(bed => (
            <div key={bed.id} className="glass-card" style={{ padding: '1.25rem', borderColor: bed.occupied ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <div style={{ fontWeight: 700 }}>Bed {bed.bed_number}</div>
                <span className="badge" style={{ background: bed.occupied ? '#ef444415' : '#10b98115', color: bed.occupied ? '#ef4444' : '#10b981' }}>{bed.occupied ? 'Occupied' : 'Free'}</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{bed.ward} WARD </p>
            </div>
          ))}
        </div>
      )}

      {/* EMERGENCY LOGS TAB */}
      {tab === 'Emergency Logs' && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontWeight: 800, fontSize: 20, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 10 }}>
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
          <h3 style={{ fontWeight: 800, fontSize: 20, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Calendar size={20} color="#6366f1" /> Monthly Staff Availability Roster
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: '2rem' }}>Complete view of upcoming staff leaves to assist in appointment scheduling.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
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
                    <div key={name} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 16, padding: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #6366f1, #0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800 }}>
                                {name.charAt(0)}
                            </div>
                            <div>
                                <h4 style={{ fontWeight: 700, fontSize: 15 }}>Dr. {name}</h4>
                                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{leaves[0].specialization}</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Planned Absences:</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {leaves.map((l, i) => (
                                    <span key={i} className="badge" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontSize: 11, border: '1px solid rgba(245,158,11,0.2)' }}>
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

      {/* BLOCKCHAIN AUDIT TAB */}
      {tab === 'Blockchain Audit' && (
        <div className="glass-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <h3 style={{ fontWeight: 800, fontSize: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                <ShieldCheck size={28} color="#10b981" /> Immutable Clinical Ledger
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
                Real-time cryptographic audit trail for all clinical activities.
              </p>
            </div>
            <button 
              className="btn btn-primary" 
              onClick={handleVerifyLedger}
              disabled={verificationLoading}
              style={{ padding: '0.75rem 1.5rem', fontSize: 14, fontWeight: 700, borderRadius: 12 }}
            >
              {verificationLoading ? (
                <RefreshCw size={18} className="spin" style={{ marginRight: 8 }} />
              ) : (
                <ShieldCheck size={18} style={{ marginRight: 8 }} />
              )}
              {verificationLoading ? 'Verifying Hashes...' : 'Verify Entire Chain'}
            </button>
          </div>

          {/* Verification Banner */}
          {verificationResult && (
            <div style={{
              padding: '1.25rem',
              borderRadius: 16,
              marginBottom: '2rem',
              background: verificationResult.valid ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${verificationResult.valid ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              {verificationResult.valid ? (
                <CheckCircle size={32} color="#10b981" />
              ) : (
                <AlertTriangle size={32} color="#ef4444" />
              )}
              <div>
                <h4 style={{ fontWeight: 800, color: verificationResult.valid ? '#10b981' : '#ef4444', marginBottom: 2 }}>
                  {verificationResult.valid ? 'Ledger Verified' : 'CRITICAL ERROR: TAMPERING DETECTED'}
                </h4>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  {verificationResult.valid 
                    ? `All ${verificationResult.count} blocks have been cryptographically verified against the genesis hash.` 
                    : verificationResult.error || 'The cryptographic chain has been broken. Database records do not match the ledger.'}
                </p>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {blockchainBlocks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', background: 'rgba(255,255,255,0.02)', borderRadius: 20, border: '1px dashed var(--border)' }}>
                <Database size={40} color="var(--text-secondary)" style={{ opacity: 0.3, marginBottom: '1rem' }} />
                <p style={{ color: 'var(--text-secondary)' }}>No blocks recorded yet.</p>
              </div>
            ) : (
              blockchainBlocks.map((block, idx) => {
                const data = JSON.parse(block.data);
                const blockReport = verificationResult?.report?.find(r => r.id === block.id);
                const isBlockTampered = blockReport && !blockReport.isValid;

                return (
                  <div key={block.id} className="glass-card" style={{ 
                    padding: '1.25rem', 
                    background: isBlockTampered ? 'rgba(239, 68, 68, 0.05)' : 'rgba(255,255,255,0.01)',
                    border: `1px solid ${isBlockTampered ? '#ef4444' : 'var(--border)'}`,
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    {/* Block index badge */}
                    <div style={{ 
                      position: 'absolute', right: 0, top: 0, 
                      padding: '4px 12px', background: isBlockTampered ? '#ef4444' : 'var(--border)', 
                      fontSize: 10, fontWeight: 900, borderBottomLeftRadius: 12,
                      color: isBlockTampered ? 'white' : 'var(--text-secondary)'
                    }}>
                      BLOCK #{block.id} {isBlockTampered && '— TAMPERED'}
                    </div>

                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span className="badge" style={{ 
                            background: data.type === 'PRESCRIPTION' ? 'rgba(99,102,241,0.1)' : 'rgba(14,165,233,0.1)',
                            color: data.type === 'PRESCRIPTION' ? '#6366f1' : '#0ea5e9',
                            fontWeight: 800
                          }}>
                            {data.type}
                          </span>
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                            Recorded: {new Date(block.timestamp).toLocaleString()}
                          </span>
                        </div>

                        {isBlockTampered && (
                          <div style={{ 
                            padding: '0.75rem', 
                            background: 'rgba(239, 68, 68, 0.1)', 
                            borderRadius: 8,
                            fontSize: 12,
                            color: '#ef4444',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8
                          }}>
                            <AlertTriangle size={14} /> {blockReport.errorMessage}
                          </div>
                        )}

                        <div style={{ 
                          padding: '1rem', 
                          background: 'rgba(0,0,0,0.2)', 
                          borderRadius: 12,
                          fontSize: 13
                        }}>
                          {data.type === 'PRESCRIPTION' ? (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                              <div><strong style={{ color: 'var(--text-secondary)' }}>Diagnosis:</strong> {data.diagnosis}</div>
                              <div><strong style={{ color: 'var(--text-secondary)' }}>Patient ID:</strong> {data.patientId}</div>
                              <div style={{ gridColumn: 'span 2' }}>
                                <strong style={{ color: 'var(--text-secondary)' }}>Medications:</strong> {Array.isArray(data.medications) ? data.medications.map(m => m.name).join(', ') : 'N/A'}
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                              <div><strong style={{ color: 'var(--text-secondary)' }}>Action:</strong> Patient Admission</div>
                              <div><strong style={{ color: 'var(--text-secondary)' }}>Bed ID:</strong> {data.bedId}</div>
                              <div><strong style={{ color: 'var(--text-secondary)' }}>Ward:</strong> {data.ward}</div>
                              <div><strong style={{ color: 'var(--text-secondary)' }}>Patient ID:</strong> {data.patientId}</div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ width: 280, borderLeft: '1px solid var(--border)', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div>
                          <p style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>Stored Hash</p>
                          <code style={{ fontSize: 10, wordBreak: 'break-all', color: isBlockTampered ? '#ef4444' : '#10b981' }}>{block.hash}</code>
                        </div>
                        <div>
                          <p style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>Previous Link</p>
                          <code style={{ fontSize: 10, wordBreak: 'break-all', opacity: 0.6 }}>{block.previous_hash}</code>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
