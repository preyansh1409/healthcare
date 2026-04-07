import { useState, useEffect } from 'react';
import { Trash2, Plus, Users, ShieldCheck } from 'lucide-react';
import { getUsers, deleteUser, createUser } from '../../services/api';
import toast from 'react-hot-toast';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'doctor', password: '', phone: '', specialization: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data } = await getUsers();
      setUsers(data.data);
    } catch { toast.error('Failed to load user data'); }
    finally { setLoading(false); }
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

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div className="spinner" style={{ width: 40, height: 40 }}></div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontWeight: 900, fontSize: 32 }}>Staff <span className="gradient-text">Management</span></h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>Manage and secure hospital staff user accounts.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddUser(true)} style={{ height: 50, padding: '0 1.5rem' }}>
          <Plus size={18} /> Add New Staff Member
        </button>
      </div>

      {showAddUser && (
        <form onSubmit={handleCreateUser} className="glass-card" style={{ padding: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', animation: 'fadeIn 0.3s ease' }}>
          <h4 style={{ gridColumn: 'span 2', fontWeight: 800, marginBottom: 8, fontSize: 18 }}>System Registration</h4>
          {[{ name: 'name', placeholder: 'Full Name' }, { name: 'email', placeholder: 'Institutional Email' }, { name: 'phone', placeholder: 'Contact Number' }, { name: 'password', placeholder: 'Unique Password' }].map(f => (
            <div key={f.name}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>{f.placeholder}</label>
                <input name={f.name} className="form-input" placeholder={f.placeholder} value={newUser[f.name]} onChange={e => setNewUser(p => ({ ...p, [e.target.name]: e.target.value }))} required={f.name !== 'phone'} />
            </div>
          ))}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>System Role</label>
            <select name="role" className="form-input" value={newUser.role} onChange={e => setNewUser(p => ({ ...p, role: e.target.value }))}>
              <option value="doctor">Medical Doctor</option>
              <option value="admin">Receptionist / Administrator</option>
            </select>
          </div>
          {newUser.role === 'doctor' && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Specialization</label>
              <input name="specialization" className="form-input" placeholder="e.g. Cardiology" value={newUser.specialization} onChange={e => setNewUser(p => ({ ...p, specialization: e.target.value }))} />
            </div>
          )}
          <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: 12 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowAddUser(false)} style={{ height: 45 }}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ height: 45, padding: '0 2rem' }}>Authorize User</button>
          </div>
        </form>
      )}

      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead><tr><th>Staff Name</th><th>Institutional Email</th><th>Portal Access</th><th>Action</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 700 }}>{u.name}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{u.email}</td>
                  <td>
                    <span className="badge" style={{ 
                        background: u.role === 'admin' ? 'rgba(99,102,241,0.1)' : 'rgba(14,165,233,0.1)', 
                        color: u.role === 'admin' ? '#6366f1' : '#0ea5e9' 
                    }}>
                        {u.role === 'admin' ? 'RECEPTIONIST' : 'DOCTOR'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-danger" style={{ padding: '0.5rem', borderRadius: 8 }} onClick={() => handleDeleteUser(u.id)}>
                        <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
