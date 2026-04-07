import { useState, useEffect } from 'react';
import { getAllDoctorLeaves } from '../../services/api';
import { Calendar, User, Clock, Search, AlertCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DoctorAvailability() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'));

  useEffect(() => { fetchLeaves(); }, []);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const { data } = await getAllDoctorLeaves();
      setLeaves(data.data);
    } catch { toast.error('Failed to load doctor leaves'); }
    finally { setLoading(false); }
  };

  const filteredLeaves = leaves.filter(l => {
    const matchesSearch = l.doctor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          l.specialization.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Exact date match for availability on a specific day
    const leaveDate = new Date(l.leave_date).toLocaleDateString('en-CA');
    return matchesSearch && (selectedDate ? leaveDate === selectedDate : true);
  });

  const isToday = (dateStr) => {
    const today = new Date().toLocaleDateString('en-CA');
    const leaveDate = new Date(dateStr).toLocaleDateString('en-CA');
    return leaveDate === today;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontWeight: 900, fontSize: 32 }}>Doctor <span className="gradient-text">Availability Board</span></h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>Centralized view of all medical staff absences and leave schedules.</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchLeaves} disabled={loading} style={{ height: 45 }}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh List
        </button>
      </div>

      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 280 }}>
            <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search by doctor or specialty..." 
              style={{ paddingLeft: '2.75rem' }}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={{ position: 'relative', width: 170 }}>
             <Calendar size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6366f1' }} />
             <input type="date" className="form-input" style={{ paddingLeft: '2.5rem' }} value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
          </div>
          <button className="btn btn-secondary" onClick={() => setSelectedDate(new Date().toLocaleDateString('en-CA'))}>
             Today
          </button>
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Doctor</th>
                <th>Specialization</th>
                <th>Leave Date</th>
                <th>Reason</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    {loading ? 'Fetching records...' : 'No doctor absences reported for the selected period.'}
                  </td>
                </tr>
              ) : (
                filteredLeaves.map(l => (
                  <tr key={l.id} style={{ opacity: isToday(l.leave_date) ? 1 : 0.8 }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12, fontWeight: 700 }}>
                          {l.doctor_name.charAt(0)}
                        </div>
                        <span style={{ fontWeight: 700 }}>Dr. {l.doctor_name}</span>
                      </div>
                    </td>
                    <td>
                      <div className="badge" style={{ background: 'rgba(99,102,241,0.08)', color: '#6366f1' }}>{l.specialization}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Calendar size={14} color="#6366f1" />
                        <span style={{ fontWeight: 600 }}>{new Date(l.leave_date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                      {l.reason || 'Not specified'}
                    </td>
                    <td>
                      {isToday(l.leave_date) ? (
                        <div className="badge" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', fontWeight: 800 }}>
                          <AlertCircle size={12} /> ON LEAVE TODAY
                        </div>
                      ) : (
                        <div className="badge" style={{ background: 'rgba(99,102,241,0.08)', color: '#6366f1' }}>
                          <Clock size={12} /> UPCOMING
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
