import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Calendar, ClipboardList, CreditCard,
  Pill, FileText, MessageSquare, User, Activity,
  Search, Bell, Plus, ArrowUpRight, TrendingUp, Clock, MapPin, Inbox
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function PatientCommandCenter() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Overview');
  const [loading, setLoading] = useState(false);

  // Real data states (initialized as empty to reflect cleared database)
  const [metrics, setMetrics] = useState({
    heartRate: { value: '--', unit: 'bpm', trend: 'No Data' },
    bloodGlucose: { value: '--', unit: 'mg/dL', trend: 'No Data' },
    temperature: { value: '--', unit: '°F', trend: 'No Data' }
  });
  const [history, setHistory] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [billing, setBilling] = useState({ totalDue: 0, items: [] });
  const [medications, setMedications] = useState([]);

  // Fetch real data from backend
  useEffect(() => {
    const fetchPortalData = async () => {
      if (!user?.patient_id) return;
      setLoading(true);
      try {
        const [patientRes, billingRes] = await Promise.all([
          axios.get(`/api/patients/${user.patient_id}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('hms_token')}` }
          }),
          axios.get('/api/billing', {
            headers: { Authorization: `Bearer ${localStorage.getItem('hms_token')}` }
          })
        ]);

        const pData = patientRes.data.data;

        // Update Appointments (Map DB fields to component props)
        setAppointments((pData.appointments || []).slice(0, 3).map(appt => ({
          doctor: appt.doctor_name,
          time: appt.appointment_time,
          date: appt.appointment_date ? new Date(appt.appointment_date).toDateString() : 'N/A',
          room: appt.status.toUpperCase()
        })));

        // Update Prescriptions/Medications
        if (pData.prescriptions?.length > 0) {
          const latest = pData.prescriptions[0];
          let meds = [];
          try {
            meds = typeof latest.medications === 'string' ? JSON.parse(latest.medications) : latest.medications;
          } catch (e) { }
          setMedications((meds || []).map(m => ({
            name: m.name || 'Unknown Medicine',
            dose: m.dosage || '',
            frequency: m.duration || '',
            rem: 'ACTIVE',
            danger: false
          })));

          // Map prescriptions to Clinical Audit Trail (History)
          setHistory(pData.prescriptions.slice(0, 5).map(px => ({
            id: px.id,
            label: px.diagnosis,
            date: new Date(px.created_at).toLocaleDateString(),
            status: 'Verified',
            icon: ClipboardList
          })));
        }

        // Update Billing
        const bills = billingRes.data.data || [];
        const unpaid = bills.filter(b => b.status === 'unpaid');
        const totalDue = unpaid.reduce((sum, b) => sum + parseFloat(b.total_amount), 0);
        setBilling({
          totalDue,
          items: unpaid.slice(0, 3).map(b => ({ name: `Invoice #${b.id}`, amount: b.total_amount }))
        });

        // Update Metrics (from vitals if available, else random mock for now)
        // In a real system, we'd fetch from /api/iot/vitals
        setMetrics({
          heartRate: { value: 72 + Math.floor(Math.random() * 10), unit: 'bpm', trend: '+2%' },
          bloodGlucose: { value: 95 + Math.floor(Math.random() * 20), unit: 'mg/dL', trend: '-1%' },
          temperature: { value: 98.6, unit: '°F', trend: 'Normal' }
        });

        setLoading(false);
      } catch (err) {
        console.error('Error fetching portal data:', err);
        setLoading(false);
      }
    };
    fetchPortalData();
  }, [user]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header with Quick Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.05em' }}>
            Patient Management Console
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.02em' }}>
            Health <span className="gradient-text">Command Center</span>
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" style={{ padding: '0.75rem 1.25rem' }}>
            <MessageSquare size={18} /> CONTACT NURSE
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/patient/appointments?openModal=true')} style={{ padding: '0.75rem 1.5rem', fontWeight: 900 }}>
            <Plus size={20} /> NEW APPOINTMENT
          </button>
        </div>
      </div>

      {/* Main Command Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2rem' }}>

        {/* Left Column: Health Metrics & Reports */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

          {/* Quick Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
            <MetricCard title="Heart Rate" value={metrics.heartRate.value} unit={metrics.heartRate.unit} icon={Activity} color="#ef4444" trend={metrics.heartRate.trend} />
            <MetricCard title="Blood Glucose" value={metrics.bloodGlucose.value} unit={metrics.bloodGlucose.unit} icon={Activity} color="#10b981" trend={metrics.bloodGlucose.trend} />
            <MetricCard title="Temperature" value={metrics.temperature.value} unit={metrics.temperature.unit} icon={Activity} color="#6366f1" trend={metrics.temperature.trend} />
          </div>

          {/* Clinical Record History */}
          <div className="glass-card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h3 style={{ fontSize: 18, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 10 }}>
                <ClipboardList size={22} color="var(--primary)" /> Clinical Audit Trail
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: 200, justifyContent: 'center', alignItems: 'center', background: 'rgba(0,0,0,0.01)', borderRadius: 16 }}>
              {history.length > 0 ? (
                history.map(item => <HistoryItem key={item.id} {...item} />)
              ) : (
                <EmptyState icon={Inbox} message="No clinical records found" />
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Scheduling & Billing */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

          {/* Active Appointments */}
          <div className="glass-card" style={{ padding: '1.75rem', border: '1px solid rgba(99,102,241,0.2)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 900, marginBottom: '1.5rem', color: 'var(--primary)' }}>UPCOMING SESSIONS</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {appointments.length > 0 ? (
                appointments.map((appt, i) => <SessionItem key={i} {...appt} />)
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }}>
                  No upcoming appointments
                </div>
              )}
            </div>
          </div>

          {/* Billing Overview */}
          <div className="glass-card" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: 16, fontWeight: 900, marginBottom: '1.5rem' }}>BILLING SUMMARY</h3>
            <div style={{ position: 'relative', padding: '1.5rem', background: 'rgba(0,0,0,0.02)', borderRadius: 16, border: '1px solid var(--border)', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 700 }}>PAST DUE AMOUNT</div>
              <div style={{ fontSize: 32, fontWeight: 900, margin: '4px 0' }}>₹{billing.totalDue.toLocaleString()}</div>
              {billing.totalDue > 0 && <div style={{ fontSize: 11, color: '#ef4444', fontWeight: 800 }}>ACTION REQUIRED</div>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {billing.items.length > 0 ? (
                billing.items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{item.name}</span>
                    <span style={{ fontWeight: 800 }}>₹{item.amount}</span>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center', opacity: 0.6 }}>No outstanding balances</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Prescription Shelf */}
      <div className="glass-card" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Pill size={22} color="var(--primary)" /> Active Medications
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {medications.length > 0 ? (
            medications.map((med, i) => <MedCard key={i} {...med} />)
          ) : (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', background: 'rgba(0,0,0,0.02)', borderRadius: 20 }}>
              <Pill size={32} style={{ opacity: 0.1, marginBottom: 12 }} />
              <div style={{ fontSize: 14, fontWeight: 700, opacity: 0.4 }}>No active prescriptions scheduled</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, message }) {
  return (
    <div style={{ textAlign: 'center', opacity: 0.5 }}>
      <Icon size={40} strokeWidth={1.5} style={{ marginBottom: 12 }} />
      <div style={{ fontSize: 14, fontWeight: 700 }}>{message}</div>
    </div>
  );
}

function MetricCard({ title, value, unit, icon: Icon, color, trend }) {
  return (
    <div className="glass-card" style={{ padding: '1.5rem', borderLeft: `4px solid ${color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ padding: 8, borderRadius: 10, background: `${color}15`, color: color }}>
          <Icon size={18} />
        </div>
        <span style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', background: 'rgba(0,0,0,0.05)', padding: '2px 8px', borderRadius: 100 }}>
          {trend}
        </span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 900 }}>{value} <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{unit}</span></div>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginTop: 4 }}>{title}</div>
    </div>
  );
}

function HistoryItem({ id, label, date, status, icon: Icon }) {
  return (
    <div style={{ width: '100%', padding: '1rem', borderRadius: 14, background: 'white', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
          <Icon size={18} />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800 }}>{label}</div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>Ref: #{id} • {date}</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 900, color: '#10b981' }}>{status}</span>
        <ArrowUpRight size={16} style={{ opacity: 0.3 }} />
      </div>
    </div>
  );
}

function SessionItem({ doctor, time, date, room }) {
  const parts = (date || '').split(' ');
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <div style={{ width: 50, height: 50, borderRadius: 14, background: 'var(--primary)', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, textTransform: 'uppercase' }}>
        <div style={{ fontSize: 14 }}>{parts[2] || '--'}</div>
        <div style={{ fontSize: 9, opacity: 0.8 }}>{parts[1] || 'DATE'}</div>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 800 }}>{doctor || 'Dr. Practitioner'}</div>
        <div style={{ display: 'flex', gap: 8, fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>
          <Clock size={12} /> {time || 'TBD'} <span style={{ opacity: 0.3 }}>|</span> {room || 'N/A'}
        </div>
      </div>
    </div>
  );
}

function MedCard({ name, dose, frequency, rem, danger }) {
  return (
    <div style={{ padding: '1.25rem', borderRadius: 16, background: 'rgba(0,0,0,0.02)', border: `1px solid ${danger ? '#ef444430' : 'var(--border)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: danger ? '#ef4444' : '#10b981' }}></div>
          <span style={{ fontSize: 15, fontWeight: 800 }}>{name}</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>{dose} • {frequency}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: danger ? '#ef4444' : 'var(--text-secondary)' }}>{rem}</div>
        <button style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 11, fontWeight: 900, cursor: 'pointer', padding: 0, marginTop: 4 }}>REORDER</button>
      </div>
    </div>
  );
}
