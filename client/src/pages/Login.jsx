import { useState, useEffect } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login, getDoctors } from '../services/api';
import toast from 'react-hot-toast';
import { Heart, Eye, EyeOff, Lock, Mail, Loader } from 'lucide-react';

const demoCredentials = [
  { role: 'Admin', email: 'admin@hospital.com', password: 'admin123', color: '#ef4444' },
  { role: 'Receptionist', email: 'nurse@hospital.com', password: 'receptionist123', color: '#6366f1' },
  { role: 'Doctor', email: 'doctor@hospital.com', password: 'doctor123', color: '#0ea5e9' },
];

export default function Login() {
  const { loginUser, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
    const [demoClicked, setDemoClicked] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getDoctors()
      .then(res => setDoctors(res.data.data))
      .catch(err => console.error('Could not load doctors'));
  }, []);

  // Logic to always show login panel even if user is already logged in
  // to allow role switching via demo credentials as requested.

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { toast.error('Please enter email and password'); return; }
    setLoading(true);
    try {
      const { data } = await login(form);
      loginUser(data.user, data.token);
      toast.success(`Welcome back, ${data.user.name}! 🎉`);
      
      const role = data.user.role?.toLowerCase();
      let path = '/';

      if (role === 'admin' || role === 'receptionist') {
        path = '/admin';
      } else if (role === 'doctor') {
        path = '/doctor';
      } else if (role === 'patient') {
        path = '/patient/dashboard';
      }

      navigate(path);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  

  const fillDemo = (cred) => setForm({ email: cred.email, password: cred.password });

  return (
    <div className="auth-bg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="glass-card fade-in" style={{ maxWidth: 520, width: '100%', padding: '2.5rem', border: '1px solid rgba(255,255,255,0.18)', position: 'relative', zIndex: 20 }}>
        
        {/* Header Section Inside Card */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
            <Heart size={48} color="white" fill="white" className="pulse" />
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 4, color: 'white', letterSpacing: '-0.02em' }}>
            <span className="gradient-text">HealthCare</span> HMS
          </h1>
          <p style={{ color: '#94a3b8', fontSize: 13, fontWeight: 500 }}>Smart Healthcare Management System</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label className="form-label" style={{ fontWeight: 600 }}>Staff Identification</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="email" name="email" className="form-input"
                style={{ paddingLeft: '2.75rem', height: 46, fontSize: 14 }}
                placeholder="name@hospital.com"
                value={form.email} onChange={handleChange}
              />
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Security Key</label>
                <span 
                    onClick={() => toast.error('Please contact your Hospital IT Administrator to reset your security key.')}
                    style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}>
                    Forgot?
                </span>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type={showPass ? 'text' : 'password'} name="password" className="form-input"
                style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem', height: 46, fontSize: 14 }}
                placeholder="••••••••"
                value={form.password} onChange={handleChange}
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '1rem', marginTop: '0.5rem', fontSize: 16, borderRadius: 12, fontWeight: 900, boxShadow: '0 8px 30px rgba(99,102,241,0.3)' }}>
            {loading ? <Loader size={20} className="spinner" /> : 'Enter HMS Dashboard →'}
          </button>
          
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Link to="/patient/login" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', textDecoration: 'none', background: 'rgba(99,102,241,0.05)', borderRadius: 12, fontWeight: 700 }}>
              Access Patient Portal
            </Link>
          </div>
        </form>

        {/* Unified Divider */}
        <div style={{ margin: '2rem 0 1.5rem', position: 'relative', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }}></div>
            <span style={{ fontSize: 11, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Experts Directory</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }}></div>
        </div>

        {/* Staff Directory - Compact Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', maxHeight: 200, overflowY: 'hidden' }}>
            {Array.isArray(doctors) && doctors.slice(0, 8).map(d => (
                <button
                    key={d.id}
                    onClick={() => { setForm({ email: d.email, password: 'doctor123' }); toast.success(`Acting as Dr. ${d.name.split(' ')[0]}`); }}
                    style={{
                        padding: '0.75rem 0.5rem', borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(255,255,255,0.03)', cursor: 'pointer', transition: 'all 0.2s',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                >
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 14, color: 'white' }}>
                        {d.name.charAt(0)}
                    </div>
                    <span style={{ fontSize: 10, color: '#ffffff', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                        {d.name.split(' ')[0]}
                    </span>
                </button>
            ))}
        </div>

        {/* Quick Staff Login */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            {demoCredentials.map(cred => (
                <button key={cred.role} onClick={() => fillDemo(cred)}
                    style={{
                        flex: 1, padding: '0.75rem', borderRadius: 12, border: `1px solid ${cred.color}40`,
                        background: `${cred.color}10`, color: cred.color,
                        fontSize: 12, fontWeight: 900, cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = `${cred.color}25`}
                    onMouseLeave={(e) => e.currentTarget.style.background = `${cred.color}10`}
                >
                    {cred.role} Portal
                </button>
            ))}
        </div>

      </div>
    </div>
  );
}
