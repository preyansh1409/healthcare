import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAppointments, getDoctors } from '../../services/api';
import { ClipboardList, User, Users, Calendar, Stethoscope, Search, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DoctorReport() {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [allDoctors, setAllDoctors] = useState([]);
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState(new Date().toLocaleDateString('en-CA'));

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const [appRes, docRes] = await Promise.all([
          getAppointments(),
          getDoctors()
        ]);
        
        let allAppts = appRes.data.data;
        const docs = docRes.data.data;
        setAllDoctors(docs);

        // ALWAYS filter by date as requested "fetch current date and current date data not previously"
        if (filterDate) {
          allAppts = allAppts.filter(a => new Date(a.appointment_date).toLocaleDateString('en-CA') === filterDate);
        }
        
        if (doctorId) {
          const currentDoc = docs.find(d => d.id.toString() === doctorId);
          setDoctor(currentDoc);
          setAppointments(allAppts.filter(a => a.doctor_id.toString() === doctorId));
        } else {
          setAppointments(allAppts);
        }
      } catch {
        toast.error('Failed to load records');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [doctorId, filterDate]);

  // Group appointments by Doctor for the list view
  const doctorStats = appointments.reduce((acc, appt) => {
    const docId = appt.doctor_id;
    if (!acc[docId]) {
      acc[docId] = { count: 0 };
    }
    acc[docId].count += 1;
    return acc;
  }, {});

  const filteredDoctors = allDoctors.filter(doc => 
    doc.name.toLowerCase().includes(search.toLowerCase()) || 
    doc.specialization.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-secondary)' }}>
      <Stethoscope className="spinner" size={32} />
      <span style={{ marginLeft: 12 }}>Loading records...</span>
    </div>
  );

  // VIEW 1: SELECT DOCTOR (MAIN SCREEN)
  if (!doctorId) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontWeight: 900, fontSize: 32 }}>
              <span className="gradient-text">Doctor Wise</span> Patient Report
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>Select a doctor to view their detailed patient visit history.</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', width: '100%', maxWidth: 550 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                className="form-input" 
                style={{ paddingLeft: '2.5rem' }} 
                placeholder="Search doctor..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
              />
            </div>
            <div style={{ position: 'relative', width: 170 }}>
               <Calendar size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6366f1' }} />
               <input type="date" className="form-input" style={{ paddingLeft: '2.5rem' }} value={filterDate} onChange={e => setFilterDate(e.target.value)} />
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {filteredDoctors.map(doc => (
            <div 
              key={doc.id} 
              className="glass-card fade-in" 
              onClick={() => navigate(`/admin/doctor-reports/${doc.id}`)}
              style={{ padding: '1.5rem', cursor: 'pointer', transition: 'transform 0.2s, border-color 0.2s', border: '1px solid var(--border)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 18 }}>
                  {doc.name.replace('Dr. ', '').charAt(0)}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 17 }}>{doc.name}</div>
                  <div style={{ fontSize: 12, color: '#6366f1', fontWeight: 600 }}>{doc.specialization}</div>
                </div>
              </div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Total Consultations</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)' }}>{doctorStats[doc.id]?.count || 0}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // VIEW 2: DOCTOR SPECIFIC DETAILS
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <button 
        onClick={() => navigate('/admin/doctor-reports')}
        style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
      >
        <ArrowLeft size={16} /> Back to Doctors List
      </button>

      <div>
        <h1 style={{ fontWeight: 900, fontSize: 32 }}>
          <span className="gradient-text">{doctor?.name}'s</span> Report
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>Listing {appointments.length} patient visits for {doctor?.name}.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(99,102,241,0.1)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Patients Visited</div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{appointments.length}</div>
          </div>
        </div>
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(16,185,129,0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Calendar size={24} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Specialization</div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{doctor?.specialization}</div>
          </div>
        </div>
      </div>

      <div className="glass-card fade-in" style={{ padding: '1.5rem' }}>
         <h4 style={{ fontSize: 15, fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <ClipboardList size={18} color="#6366f1" /> HISTORY OF VISITED PATIENTS
        </h4>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Patient Details</th>
                <th>Visit Date</th>
                <th>Time</th>
                <th>Status</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((p, idx) => (
                <tr key={idx}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(99,102,241,0.1)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>
                        {p.patient_name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{p.patient_name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{p.age}y / {p.gender}</div>
                      </div>
                    </div>
                  </td>
                  <td>{new Date(p.appointment_date).toLocaleDateString()}</td>
                  <td>{p.appointment_time}</td>
                  <td>
                    <span className={`badge ${p.status === 'completed' ? 'bg-success' : 'bg-warning'}`}>{p.status}</span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{p.reason || 'Checkup'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
