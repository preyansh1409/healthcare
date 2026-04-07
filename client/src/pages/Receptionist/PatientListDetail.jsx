import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Phone, Droplets, Mail, User, Eye } from 'lucide-react';
import { getPatients, getTodayAppointments } from '../../services/api';
import toast from 'react-hot-toast';

export default function PatientListDetail() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data } = await getPatients();
      setPatients(data.data || []);
    } catch (err) {
      toast.error('Failed to load clinical data');
    } finally {
      setLoading(false);
    }
  };

  const filtered = patients.filter(p => 
    p.name?.toLowerCase().includes(search.toLowerCase()) || 
    p.phone?.includes(search)
  );

  const getBasePath = () => {
    const p = window.location.pathname;
    if (p.startsWith('/doctor')) return '/doctor';
    return '/admin';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <h1 style={{ fontWeight: 900, fontSize: 28 }}>Patient <span className="gradient-text">Detail Directory</span></h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Exhaustive list of all registered patients and their clinical visit history.
        </p>
      </div>

      <div style={{ position: 'relative', width: '100%' }}>
          <Search size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input 
            className="form-input" 
            style={{ paddingLeft: '3rem', height: 50, fontSize: 16, borderRadius: 12 }} 
            placeholder="Search by name or phone number..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
      </div>

      <div className="glass-card" style={{ padding: '1.5rem', overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Patient Name</th>
              <th>Phone Number</th>
              <th>Blood Group</th>
              <th style={{ textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="4" style={{ textAlign: 'center', padding: '4rem' }}>Loading patient detailed directory...</td></tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '6rem', color: 'var(--text-secondary)' }}>
                  <Users size={48} opacity={0.1} style={{ marginBottom: '1rem' }} />
                  <br />
                  {search ? `No results found for "${search}"` : "No registered patients found."}
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ 
                        width: 38, height: 38, borderRadius: 10, 
                        background: 'linear-gradient(135deg, #6366f1, #0ea5e9)', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 800, fontSize: 15
                      }}>
                         <User size={18} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Code: HMS-{p.id}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                      <Phone size={14} color="#6366f1" /> {p.phone}
                    </div>
                  </td>
                  <td>
                    <div style={{ 
                      padding: '4px 10px', borderRadius: 8, background: '#fff1f2', 
                      color: '#be123c', fontSize: 11, fontWeight: 800,
                      display: 'inline-flex', alignItems: 'center', gap: 6
                    }}>
                      <Droplets size={14} /> {p.blood_group || 'N/A'}
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => navigate(`${getBasePath()}/patients/${p.id}`)}
                      style={{ padding: '6px 14px', fontSize: 12, borderRadius: 10, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <Eye size={14} /> View Data
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
