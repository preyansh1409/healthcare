import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, ClipboardList, CreditCard,
  Pill, FileText, MessageSquare, User, LogOut, Heart,
  Menu, X, Bell, ChevronDown, UserCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getLinkedProfiles, switchProfile } from '../services/api';
import toast from 'react-hot-toast';

export default function PatientLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [profiles, setProfiles] = useState([]);
  const [showSwitch, setShowSwitch] = useState(false);
  const { user, loginUser, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const { data } = await getLinkedProfiles();
        setProfiles(data.profiles || []);
      } catch (err) {
        console.error('Failed to load profiles');
      }
    };
    fetchProfiles();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSwitch = async (pId) => {
    if (pId === user.patient_id) return;
    const load = toast.loading('Switching profile...');
    try {
      const { data } = await switchProfile({ patientId: pId });
      loginUser(data.user, data.token);
      toast.success(`Switched to ${data.user.name}`, { id: load });
      setShowSwitch(false);
      navigate('/patient/dashboard');
    } catch (err) {
      toast.error('Switch failed', { id: load });
    }
  };

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/patient/dashboard' },
    { name: 'Appointments', icon: Calendar, path: '/patient/appointments' },
    { name: 'Lab Reports', icon: ClipboardList, path: '/patient/lab-reports' },
    { name: 'Billing', icon: CreditCard, path: '/patient/billing' },
    { name: 'Prescriptions', icon: Pill, path: '/patient/prescriptions' },
    { name: 'Medical Records', icon: FileText, path: '/patient/records' },
    { name: 'Messages', icon: MessageSquare, path: '/patient/messages' },
    { name: 'Profile', icon: User, path: '/patient/profile' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-dark)' }}>
      {/* Sidebar */}
      <aside style={{
        width: 280,
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        height: '100vh',
        zIndex: 100,
        transition: 'transform 0.3s ease',
        transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(0)'
      }}>
        {/* Brand */}
        <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ padding: '0.5rem', borderRadius: 12, background: 'linear-gradient(135deg, #6366f1, #0ea5e9)', color: 'white' }}>
            <Heart size={24} fill="white" />
          </div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.02em' }}>Patient <span style={{ color: '#6366f1' }}>Portal</span></h1>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Smart Healthcare</p>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={20} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Card with Enhanced Switching */}
        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border)', position: 'relative' }}>
          {showSwitch && profiles.length > 1 && (
            <div className="glass-card" style={{
              position: 'absolute', bottom: '100%', left: '1.5rem', right: '1.5rem',
              marginBottom: 10, padding: 8, background: 'white', border: '1px solid var(--border)',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', borderRadius: 16, zIndex: 10
            }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', padding: '8px 12px', textTransform: 'uppercase' }}>Available Profiles</div>
              {profiles.filter(p => p.patient_id !== user.patient_id).map(p => (
                <button
                  key={p.patient_id}
                  onClick={() => handleSwitch(p.patient_id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                    borderRadius: 10, border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.2s ease', color: 'var(--text-primary)'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <UserCircle size={18} color="#6366f1" />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{p.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>ID: #{p.patient_id} • Age: {p.age}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div
            className="glass-card"
            onClick={() => profiles.length > 1 && setShowSwitch(!showSwitch)}
            style={{
              padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem',
              marginBottom: '1rem', border: '1px solid var(--border)', cursor: profiles.length > 1 ? 'pointer' : 'default',
              position: 'relative'
            }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>
              {user?.name?.charAt(0) || 'P'}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: 14, fontWeight: 800, whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user?.name || 'Patient'}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>Standard Membership</div>
            </div>
            {profiles.length > 1 && (
              <ChevronDown size={16} style={{ color: 'var(--text-secondary)', transform: showSwitch ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
            )}
          </div>

          <button
            onClick={handleLogout}
            style={{
              width: '100%', padding: '0.75rem', borderRadius: 12, background: 'var(--danger)', color: 'white',
              border: 'none', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer'
            }}
          >
            <LogOut size={18} /> SIGN OUT
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div style={{ flex: 1, marginLeft: 280 }}>
        {/* Navbar */}
        <header style={{
          height: 72, background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)',
          borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '0 2.5rem', position: 'sticky', top: 0, zIndex: 90
        }}>
          <h2 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            HOSPITAL MANAGEMENT SYSTEM • CLIENT INTERFACE
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <button style={{ position: 'relative', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <Bell size={20} />
              <div style={{ position: 'absolute', top: -4, right: -4, width: 14, height: 14, background: 'var(--danger)', borderRadius: '50%', color: 'white', fontSize: 9, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>2</div>
            </button>
            <div style={{ height: 24, width: 2, background: 'var(--border)' }}></div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 800 }}>{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>Location: Main Campus, Pune</div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ padding: '2.5rem' }}>
          <div className="fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
