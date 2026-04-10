import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { sendOTP, verifyOTP } from '../../services/api';
import toast from 'react-hot-toast';
import {
  Heart, Key, Mail, ArrowLeft, Loader, CheckCircle2,
  ShieldCheck, Zap, Users, User, ArrowRight, Calendar
} from 'lucide-react';

export default function PatientLogin() {
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  // States
  const [step, setStep] = useState('email'); // 'email', 'otp', or 'profile'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  // Family Multi-Profile states
  const [profiles, setProfiles] = useState([]);
  const [tempAuth, setTempAuth] = useState(null);

  // Timer for resending OTP
  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleSendOTP = async (e) => {
    if (e) e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const { data } = await sendOTP({ email });
      setStep('otp');
      setTimer(30);
      toast.success(data.message, { duration: 6000 });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error('Please enter the 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const { data } = await verifyOTP({ email, otp });

      if (data.requiresProfileSelection) {
        setProfiles(data.profiles);
        setTempAuth({ user: data.user, token: data.token });
        setStep('profile');
        toast.success("Identity verified! Please select a family member profile.");
      } else {
        loginUser(data.user, data.token);
        toast.success(`Welcome back, ${data.user.name || 'User'}!`);
        
        // Redirect based on role
        if (data.user.role === 'doctor') {
          navigate('/doctor');
        } else if (data.user.role === 'receptionist' || data.user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/patient/dashboard');
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProfile = (profile) => {
    const finalUser = {
      ...tempAuth.user,
      name: profile.name,
      patient_id: profile.patient_id
    };
    loginUser(finalUser, tempAuth.token);
    toast.success(`Logged in as ${profile.name}`);
    
    // Redirect based on role (usually patients have multiple profiles)
    if (finalUser.role === 'doctor') {
      navigate('/doctor');
    } else if (finalUser.role === 'receptionist' || finalUser.role === 'admin') {
      navigate('/admin');
    } else {
      navigate('/patient/dashboard');
    }
  };

  return (
    <div className="auth-bg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', minHeight: '100vh' }}>
      <div className="glass-card fade-in" style={{ maxWidth: step === 'profile' ? 600 : 460, width: '100%', padding: '2.5rem', position: 'relative', zIndex: 20 }}>

        {/* Back Link */}
        <Link to="/login" style={{ position: 'absolute', top: 24, left: 24, color: 'white', display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', fontSize: 12, fontWeight: 800, opacity: 0.6, letterSpacing: '0.05em' }}>
          <ArrowLeft size={16} /> STAFF PORTAL
        </Link>

        {/* Brand/App Icon */}
        <div style={{ textAlign: 'center', marginBottom: step === 'profile' ? '1.5rem' : '2.5rem', marginTop: '1rem' }}>
          <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
            <div style={{ padding: '0.875rem', borderRadius: '50%', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', boxShadow: '0 0 20px rgba(99,102,241,0.2)' }}>
              <ShieldCheck size={36} color="#6366f1" fill="rgba(99,102,241,0.2)" />
            </div>
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: 'white', letterSpacing: '-0.03em', marginBottom: 6 }}>
            Health <span className="gradient-text">Portal</span>
          </h1>
          <p style={{ color: '#94a3b8', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {step === 'profile' ? 'Select Family Profile' : 'Secure Email OTP Login'}
          </p>
        </div>

        {/* Stepper Logic */}
        <div style={{ marginTop: '2rem' }}>
          {step === 'email' ? (
            <form onSubmit={handleSendOTP} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label className="form-label" style={{ color: '#94a3b8', fontSize: 11, fontWeight: 900, marginBottom: 8 }}>EMAIL ADDRESS</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#6366f1' }} />
                  <input
                    type="email"
                    className="form-input"
                    style={{ paddingLeft: '3rem', height: 56, fontSize: 16, fontWeight: 700, color: 'white', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14 }}
                    placeholder="patient@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoFocus
                  />
                </div>
                <p style={{ fontSize: 12, color: '#64748b', marginTop: 12, lineHeight: 1.5 }}>
                  A 6-digit verification code will be sent to your registered email address.
                </p>
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading}
                style={{ width: '100%', justifyContent: 'center', padding: '1.1rem', marginTop: '0.5rem', fontSize: 16, borderRadius: 14, fontWeight: 900, boxShadow: '0 10px 30px rgba(99,102,241,0.3)', gap: 10 }}>
                {loading ? <Loader size={20} className="spinner" /> : <><Zap size={18} /> SEND VERIFICATION CODE</>}
              </button>
            </form>
          ) : step === 'otp' ? (
            <form onSubmit={handleVerifyOTP} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(99,102,241,0.05)', borderRadius: 16, border: '1px dashed rgba(99,102,241,0.2)', marginBottom: '1rem' }}>
                <div style={{ color: '#94a3b8', fontSize: 13, fontWeight: 600 }}>We've sent a code to</div>
                <div style={{ color: 'white', fontSize: 16, fontWeight: 800, marginTop: 4, wordBreak: 'break-all' }}>{email}</div>
                <button type="button" onClick={() => setStep('email')} style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: 12, fontWeight: 800, cursor: 'pointer', marginTop: 8, textDecoration: 'underline' }}>EDIT EMAIL</button>
              </div>

              <div>
                <label className="form-label" style={{ color: '#94a3b8', fontSize: 11, fontWeight: 900, marginBottom: 8 }}>ENTER 6-DIGIT OTP</label>
                <div style={{ position: 'relative' }}>
                  <Key size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#6366f1' }} />
                  <input
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: '3rem', height: 60, fontSize: 24, fontWeight: 900, color: 'white', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, letterSpacing: '0.5em' }}
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    autoFocus
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
                  {timer > 0 ? (
                    <span style={{ fontSize: 13, color: '#64748b', fontWeight: 700 }}>Resend code in {timer}s</span>
                  ) : (
                    <button type="button" onClick={() => handleSendOTP()} style={{ background: 'none', border: 'none', color: '#10b981', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>RESEND OTP</button>
                  )}
                </div>
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading}
                style={{ width: '100%', justifyContent: 'center', padding: '1.2rem', marginTop: '0.5rem', fontSize: 16, borderRadius: 14, fontWeight: 900, background: '#10b981', border: 'none', boxShadow: '0 10px 30px rgba(16,185,129,0.2)', gap: 10 }}>
                {loading ? <Loader size={20} className="spinner" /> : <><CheckCircle2 size={18} /> VERIFY & ACCESS PORTAL</>}
              </button>
            </form>
          ) : (
            <div className="fade-in">
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#94a3b8', fontSize: 14 }}>
                  <Users size={16} /> Multiple family members found
                </div>
                <h3 style={{ color: 'white', fontSize: 20, fontWeight: 800, marginTop: 8 }}>Who is visiting today?</h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
                {profiles.map(profile => (
                  <div
                    key={profile.patient_id}
                    onClick={() => handleSelectProfile(profile)}
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '1.25rem', cursor: 'pointer', transition: 'all 0.2s ease', position: 'relative', overflow: 'hidden' }}
                    className="profile-card"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
                        <User size={24} />
                      </div>
                      <div>
                        <h4 style={{ color: 'white', margin: 0, fontSize: 16, fontWeight: 800 }}>{profile.name}</h4>
                        <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 2, display: 'flex', gap: 8 }}>
                          <span>{profile.age} YRS</span>
                          <span>•</span>
                          <span style={{ textTransform: 'uppercase' }}>{profile.gender}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 10, color: '#64748b', fontWeight: 800 }}>PATIENT ID: #{profile.patient_id}</span>
                      <ArrowRight size={14} color="#6366f1" />
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setStep('email')}
                style={{ width: '100%', background: 'none', border: 'none', color: '#64748b', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginTop: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <ArrowLeft size={14} /> Back to Login
              </button>
            </div>
          )}
        </div>

        {/* Trust Footer */}
        <div style={{ marginTop: '3rem', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 100, border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }}></div>
            <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 800, letterSpacing: '0.05em' }}>END-TO-END SECURE NODE</span>
          </div>
          <p style={{ marginTop: 12, fontSize: 11, color: '#475569', fontWeight: 600 }}>v4.2.1 • HMS Cloud Auth Protocol</p>
        </div>
      </div>
    </div>
  );
}
