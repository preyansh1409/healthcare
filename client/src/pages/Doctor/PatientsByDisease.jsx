import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getSpecialtyPatients } from '../../services/api';
import { Search, Users, ExternalLink, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function PatientsByDisease() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadPatients(); }, []);

  const loadPatients = async () => {
    try {
      const { data } = await getSpecialtyPatients();
      setPatients(data.data);
      setFiltered(data.data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load related patients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setFiltered(patients.filter(p => 
      p.name?.toLowerCase().includes(search.toLowerCase()) || 
      p.phone?.includes(search)
    ));
  }, [search, patients]);

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontWeight: 900, fontSize: 26 }}>
          {user?.specialization} <span className="gradient-text">Patients</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
          All patients associated with {user?.specialization?.toLowerCase()} specialization
        </p>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: 380, marginBottom: '1.5rem' }}>
        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
        <input 
          className="form-input" 
          style={{ paddingLeft: '2.25rem' }} 
          placeholder="Search patients..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
        />
      </div>

      <div className="glass-card" style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Age / Gender</th>
              <th>Phone</th>
              <th>Blood</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ 
                      width: 36, height: 36, borderRadius: '50%', flexShrink: 0, 
                      background: 'linear-gradient(135deg, #6366f1, #0ea5e9)', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      fontWeight: 700, color: 'white' 
                    }}>
                      {p.name?.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{p.email || 'No email'}</div>
                    </div>
                  </div>
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>{p.age} yrs · {p.gender}</td>
                <td>{p.phone}</td>
                <td>
                  {p.blood_group ? (
                    <span className="badge" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>{p.blood_group}</span>
                  ) : '—'}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '0.375rem 0.75rem', fontSize: 12 }} 
                      onClick={() => navigate(`/doctor/patients/${p.id}`)}
                    >
                      <ExternalLink size={13} style={{ marginRight: 4 }} /> Details
                    </button>
                    <button 
                      className="btn btn-primary" 
                      style={{ padding: '0.375rem 0.75rem', fontSize: 12 }} 
                      onClick={() => navigate(`/doctor/prescribe/${p.id}`)}
                    >
                      Prescribe
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {loading && <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading specialty patients...</div>}
        
        {!loading && filtered.length === 0 && (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Users size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
            <p>No patients found for this specialization</p>
          </div>
        )}
      </div>
    </div>
  );
}
