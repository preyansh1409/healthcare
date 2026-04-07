import { useState, useEffect } from 'react';
import { getDoctors, updateDoctor, createUser } from '../../services/api';
import { Stethoscope, Search, Edit, Trash2, CheckCircle, XCircle, Plus, Lock, User, Mail, Phone, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';

const specializations = [
  'General Medicine','Cardiology','Neurology','Orthopedics','Pediatrics',
  'Dermatology','Psychiatry','Radiology','Oncology','ENT','Ophthalmology',
  'Gynecology','Urology','Endocrinology','Nephrology'
];

export default function ManageDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newDoctor, setNewDoctor] = useState({
    name: '', email: '', password: '', phone: '',
    role: 'doctor', specialization: 'General Medicine', department: 'General Medicine'
  });

  useEffect(() => { fetchDoctors(); }, []);
  useEffect(() => {
    setFiltered(doctors.filter(d =>
      d.name?.toLowerCase().includes(search.toLowerCase()) ||
      d.specialization?.toLowerCase().includes(search.toLowerCase())
    ));
  }, [search, doctors]);

  const fetchDoctors = async () => {
    try {
      const { data } = await getDoctors();
      setDoctors(data.data);
      setFiltered(data.data);
    } catch { toast.error('Failed to fetch doctors'); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createUser(newDoctor);
      toast.success(`Dr. ${newDoctor.name} registered successfully`);
      setShowAddModal(false);
      setNewDoctor({
        name: '', email: '', password: '', phone: '',
        role: 'doctor', specialization: 'General Medicine', department: 'General Medicine'
      });
      fetchDoctors();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
  };

  const handleToggleAvailability = async (doctor) => {
    try {
      await updateDoctor(doctor.id, { ...doctor, available: doctor.available ? 0 : 1 });
      toast.success(`Dr. ${doctor.name} marked as ${doctor.available ? 'unavailable' : 'available'}`);
      fetchDoctors();
    } catch { toast.error('Failed to update availability'); }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateDoctor(editing.id, editing);
      toast.success('Doctor updated successfully');
      setEditing(null);
      fetchDoctors();
    } catch { toast.error('Update failed'); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontWeight: 900, fontSize: 26 }}>Manage <span className="gradient-text">Doctors</span></h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>{doctors.length} doctors registered in the system</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> Add New Doctor
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: 320, marginBottom: '1.5rem' }}>
        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
        <input className="form-input" style={{ paddingLeft: '2.25rem' }} placeholder="Search doctors..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="glass-card" style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Doctor</th><th>Specialization</th><th>Department</th>
              <th>Fee</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(d => (
              <tr key={d.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                      {d.name?.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{d.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{d.email}</div>
                    </div>
                  </div>
                </td>
                <td><span className="badge badge-confirmed">{d.specialization}</span></td>
                <td style={{ color: 'var(--text-secondary)' }}>{d.department}</td>
                <td style={{ color: '#10b981', fontWeight: 600 }}>₹{d.consultation_fee || 0}</td>
                <td>
                  <span className="badge" style={{ background: d.available ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: d.available ? '#10b981' : '#ef4444' }}>
                    {d.available ? '● Available' : '● Unavailable'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-secondary" style={{ padding: '0.375rem 0.75rem', fontSize: 12 }} onClick={() => setEditing({ ...d })}>
                      <Edit size={14} />
                    </button>
                    <button className="btn" style={{ padding: '0.375rem 0.75rem', fontSize: 12, background: d.available ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', color: d.available ? '#ef4444' : '#10b981', border: `1px solid ${d.available ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}` }}
                      onClick={() => handleToggleAvailability(d)}>
                      {d.available ? <XCircle size={14} /> : <CheckCircle size={14} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading doctors...</div>}
        {!loading && filtered.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No doctors found</div>}
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="modal-overlay">
          <div className="glass-card" style={{ width: '100%', maxWidth: 480 }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontWeight: 700, fontSize: 18 }}>Edit Doctor Profile</h3>
            </div>
            <form onSubmit={handleUpdate} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {[
                { label: 'Specialization', name: 'specialization', isSelect: true },
                { label: 'Department', name: 'department' },
                { label: 'Consultation Fee (₹)', name: 'consultation_fee', type: 'number' },
              ].map(f => (
                <div key={f.name}>
                  <label className="form-label">{f.label}</label>
                  {f.isSelect ? (
                    <select className="form-input" value={editing[f.name] || ''} onChange={e => setEditing(p => ({ ...p, [f.name]: e.target.value }))}>
                      {specializations.map(s => <option key={s}>{s}</option>)}
                    </select>
                  ) : (
                    <input type={f.type || 'text'} className="form-input" value={editing[f.name] || ''} onChange={e => setEditing(p => ({ ...p, [f.name]: e.target.value }))} />
                  )}
                </div>
              ))}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Add Doctor Modal */}
      {showAddModal && (
        <div className="modal-overlay" style={{ backdropFilter: 'blur(8px)' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontWeight: 800, fontSize: 20 }}>Register <span className="gradient-text">New Doctor</span></h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><XCircle size={20} /></button>
            </div>
            <form onSubmit={handleCreate} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label">Full Name</label>
                  <div style={{ position: 'relative' }}>
                    <User size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input required className="form-input" style={{ paddingLeft: '2.5rem' }} placeholder="Dr. Name" value={newDoctor.name} onChange={e => setNewDoctor(p => ({ ...p, name: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="form-label">Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input required type="email" className="form-input" style={{ paddingLeft: '2.5rem' }} placeholder="doctor@hospital.com" value={newDoctor.email} onChange={e => setNewDoctor(p => ({ ...p, email: e.target.value }))} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label">System Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input required type="password" className="form-input" style={{ paddingLeft: '2.5rem' }} placeholder="Minimum 6 chars" value={newDoctor.password} onChange={e => setNewDoctor(p => ({ ...p, password: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="form-label">Phone Number</label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input className="form-input" style={{ paddingLeft: '2.5rem' }} placeholder="0987654321" value={newDoctor.phone} onChange={e => setNewDoctor(p => ({ ...p, phone: e.target.value }))} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label">Specialization</label>
                  <div style={{ position: 'relative' }}>
                    <Stethoscope size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <select className="form-input" style={{ paddingLeft: '2.5rem' }} value={newDoctor.specialization} onChange={e => setNewDoctor(p => ({ ...p, specialization: e.target.value, department: e.target.value }))}>
                      {specializations.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="form-label">Department</label>
                  <div style={{ position: 'relative' }}>
                    <Briefcase size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input className="form-input" style={{ paddingLeft: '2.5rem' }} placeholder="General Medicine" value={newDoctor.department} onChange={e => setNewDoctor(p => ({ ...p, department: e.target.value }))} />
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowAddModal(false)}>CANCEL</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>REGISTER DOCTOR</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
