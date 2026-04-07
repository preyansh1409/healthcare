import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDoctors, getDoctorStats } from '../services/api';
import {
  LayoutDashboard, Calendar, Clock, Users, UserCog, Bed, Bell,
  LogOut, ChevronLeft, ChevronRight, Stethoscope, ClipboardList,
  BarChart3, Heart, Settings, Menu, CreditCard, ShieldCheck,
  ChevronDown, ChevronUp
} from 'lucide-react';

const adminLinks = [
  {
    to: '/admin',
    icon: LayoutDashboard,
    label: 'Dashboard',
    children: [
      { to: '/admin/overview', icon: BarChart3, label: 'Analytics Overview' },
      { to: '/admin/users', icon: Users, label: 'User Management' },
      { to: '/admin/beds', icon: Bed, label: 'Bed & Ward Control' },
      { to: '/admin/blockchain', icon: ShieldCheck, label: 'Blockchain Audit' },
    ]
  },
  { to: '/admin/appointments', icon: Calendar, label: 'Appointments' },
  { to: '/admin/patients', icon: Users, label: 'OPD Patients' },
  { to: '/admin/patient-detail', icon: ClipboardList, label: 'Patient Detail' },
  { to: '/admin/doctor-availability', icon: Clock, label: 'Doctor Availability' },
  { to: '/admin/billing', icon: CreditCard, label: 'Billing' },
  { to: '/admin/doctors', icon: Stethoscope, label: 'Manage Doctors' },
  { to: '/admin/doctor-reports', icon: ClipboardList, label: 'Doctor Wise Report' },
];

const doctorLinks = [
  { to: '/doctor', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/doctor/appointments', icon: Calendar, label: 'My Appointments' },
  { to: '/doctor/admitted', icon: Bed, label: 'Patients (Admitted)' },
  { to: '/doctor/patients', icon: Users, label: 'OPD Patients' },
  { to: '/doctor/patient-detail', icon: ClipboardList, label: 'Patient Detail' },
  { to: '/doctor/lab-reports', icon: ClipboardList, label: 'Lab Reports' },
  { to: '/doctor/leave', icon: Calendar, label: 'Leave Management' },
  { to: '/doctor/emergency', icon: Bell, label: 'Emergency Alert' },
];

const receptionistLinks = [
  { to: '/admin/overview', icon: LayoutDashboard, label: 'Overview' },
  { to: '/admin/appointments', icon: Calendar, label: 'Appointments' },
  { to: '/admin/patients', icon: Users, label: 'OPD Patients' },
  { to: '/admin/patient-detail', icon: ClipboardList, label: 'Patient Detail' },
  { to: '/admin/billing', icon: CreditCard, label: 'Billing' },
  { to: '/admin/beds', icon: Bed, label: 'Bed Management' },
];

const roleLinksMap = { admin: adminLinks, doctor: doctorLinks, receptionist: receptionistLinks };

export default function Sidebar({ collapsed, setCollapsed }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ new_bookings: 0, new_reports: 0 });
  const [expanded, setExpanded] = useState({ Dashboard: false });

  useEffect(() => {
    const loadData = async () => {
      try {
        if (user?.role === 'doctor') {
          const { data } = await getDoctors();
          const me = data.data.find(d => d.email === user.email);
          if (me) {
            const { data: stData } = await getDoctorStats(me.id);
            setStats(stData.data);
          }
        }
      } catch (e) {
        console.error('Sidebar data fail', e);
      }
    };
    loadData();
  }, [user]);

  const baseLinks = roleLinksMap[user?.role] || [];
  const links = [...baseLinks];

  useEffect(() => {
    // Auto-expand parents if child is active on load
    const currentPath = window.location.pathname;
    const initialExpanded = { Dashboard: false };

    links.forEach(link => {
      if (link.children && link.children.some(child => currentPath === child.to)) {
        initialExpanded[link.label] = true;
      }
    });
    setExpanded(prev => ({ ...prev, ...initialExpanded }));
  }, [window.location.pathname]);


  const roleColors = {
    admin: 'from-purple-500 to-indigo-600',
    doctor: 'from-teal-500 to-cyan-600',
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside
      className="sidebar"
      style={{
        width: collapsed ? '72px' : '240px',
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border)',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 100,
        transition: 'width 0.3s ease',
        overflow: 'hidden',
      }}
    >
      {/* Logo */}
      <div style={{ padding: '1.5rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12, flexShrink: 0,
          background: `linear-gradient(135deg, #6366f1, #0ea5e9)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Heart size={20} color="white" fill="white" />
        </div>
        {!collapsed && (
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)' }}>HealthCare</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{user?.role === 'admin' ? 'receptionist' : user?.role} Portal</div>
          </div>
        )}
      </div>

      {/* Nav Links */}
      <nav style={{ flex: 1, padding: '1rem 0.75rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {links.map(({ to, icon: Icon, label, children }) => {
          const isExpanded = expanded[label];
          return (
            <div key={to} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <NavLink
                to={to}
                end={to === '/admin' || to === '/doctor'}
                onClick={() => children && setExpanded(prev => ({ ...prev, [label]: !prev[label] }))}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                title={collapsed ? label : ''}
                style={{ position: 'relative' }}
              >
                <Icon size={18} style={{ flexShrink: 0 }} />
                {!collapsed && (
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {label === 'My Appointments' && stats.new_bookings > 0 && (
                        <span className="badge" style={{ padding: '2px 6px', fontSize: 10, background: '#ef4444', color: 'white', borderRadius: 10, animation: 'pulse 2s infinite' }}>{stats.new_bookings}</span>
                      )}
                      {label === 'Lab Reports' && stats.new_reports > 0 && (
                        <span className="badge" style={{ padding: '2px 6px', fontSize: 10, background: '#6366f1', color: 'white', borderRadius: 10, animation: 'pulse 2s infinite' }}>{stats.new_reports}</span>
                      )}
                      {children && (isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                    </div>
                  </div>
                )}
                {collapsed && (label === 'My Appointments' && stats.new_bookings > 0 || label === 'Lab Reports' && stats.new_reports > 0) && (
                  <div style={{ position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: '50%', background: '#ef4444', border: '2px solid var(--bg-sidebar)' }} />
                )}
              </NavLink>

              {/* Render children if expanded and not collapsed */}
              {!collapsed && children && isExpanded && children.map(child => {
                const ChildIcon = child.icon;
                return (
                  <NavLink
                    key={child.to}
                    to={child.to}
                    className={({ isActive }) => `sidebar-link sub-link ${isActive ? 'active' : ''}`}
                    style={{ marginLeft: '1rem', padding: '0.5rem 0.75rem', fontSize: 12, opacity: 0.8, animation: 'slideDown 0.2s ease' }}
                  >
                    <ChildIcon size={14} style={{ flexShrink: 0 }} />
                    <span>{child.label}</span>
                  </NavLink>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* User Info + Logout */}
      <div style={{ padding: '1rem 0.75rem', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: 12, background: 'rgba(99,102,241,0.08)' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #6366f1, #0ea5e9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 14, color: 'white'
            }}>
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{user?.role === 'admin' ? 'receptionist' : user?.role}</div>
            </div>
          </div>
        )}
        <button onClick={handleLogout} className="sidebar-link" style={{ border: 'none', background: 'none', color: '#ef4444', width: '100%' }}>
          <LogOut size={18} />
          {!collapsed && <span>Logout</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', borderRadius: 8, background: 'rgba(99,102,241,0.08)', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  );
}
