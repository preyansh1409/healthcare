import { useState, useEffect } from 'react';
import { Bell, Search, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getNotifications, markNotificationRead } from '../services/api';
import toast from 'react-hot-toast';

export default function Navbar({ sidebarWidth = 240 }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data } = await getNotifications();
      const newNotifs = data.data || [];
      
      // Look for unread emergency notifications to trigger global toast
      const urgent = newNotifs.find(n => n.type === 'emergency' && !n.is_read);
      if (urgent) {
        toast.error(urgent.message, {
          id: `emergency-${urgent.id}`,
          duration: 10000,
          style: { 
            background: '#ef4444', 
            color: 'white', 
            fontWeight: 900, 
            fontSize: '15px', 
            border: '2px solid white',
            boxShadow: '0 0 30px rgba(239, 68, 68, 0.4)'
          },
          icon: <Bell size={24} fill="white" className="pulse-fast" />
        });
      }
      
      setNotifications(newNotifs);
    } catch {}
  };

  const unread = notifications.filter(n => !n.is_read).length;
  const currentEmergency = notifications.find(n => n.type === 'emergency' && !n.is_read);

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      if (currentEmergency?.id === id) {
        toast.success('Emergency Acknowledged');
      }
    } catch { toast.error('Failed to mark as read'); }
  };

  return (
    <>
      {currentEmergency && (
        <div style={{ 
          position: 'fixed', inset: 0, zIndex: 9999, 
          background: 'rgba(239, 68, 68, 0.95)', 
          backdropFilter: 'blur(10px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          color: 'white', padding: '2rem', textAlign: 'center',
          animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{ 
            width: 100, height: 100, borderRadius: '50%', background: 'white', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem',
            boxShadow: '0 0 50px rgba(255,255,255,0.5)'
          }} className="pulse-fast">
            <Bell size={48} color="#ef4444" fill="#ef4444" />
          </div>
          <h1 style={{ fontSize: 42, fontWeight: 900, marginBottom: '1rem', textShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>EMERGENCY ALERT</h1>
          <div style={{ 
            maxWidth: 600, fontSize: 24, fontWeight: 600, lineHeight: 1.4, marginBottom: '3rem',
            background: 'rgba(0,0,0,0.2)', padding: '2rem', borderRadius: 20, border: '1px solid rgba(255,255,255,0.3)'
          }}>
            {currentEmergency.message}
          </div>
          <button 
            onClick={() => handleMarkRead(currentEmergency.id)}
            style={{ 
              padding: '1.25rem 3rem', fontSize: 20, fontWeight: 800, 
              background: 'white', color: '#ef4444', border: 'none', 
              borderRadius: 50, cursor: 'pointer', boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
              transition: 'transform 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            ACKNOWLEDGE & DISMISS
          </button>
          <p style={{ marginTop: '2rem', fontSize: 13, opacity: 0.8, fontWeight: 600 }}>This alert will remain until acknowledged.</p>
        </div>
      )}

      <header className="no-print" style={{
        position: 'fixed', top: 0, left: sidebarWidth, right: 0, height: 64, zIndex: 90,
        background: 'var(--bg-card)', borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 1.5rem',
        transition: 'left 0.3s ease',
      }}>
        {/* Search - REMOVED AS REQUESTED */}
        <div />

        {/* Right section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Notifications kept, User profile removed as requested */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              style={{
                position: 'relative', padding: '0.5rem', borderRadius: 10,
                background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
                cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', alignItems: 'center'
              }}
            >
              <Bell size={18} />
              {unread > 0 && (
                <span style={{
                  position: 'absolute', top: 2, right: 2, width: 16, height: 16,
                  background: '#ef4444', borderRadius: '50%', fontSize: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, color: 'white'
                }}>{unread}</span>
              )}
            </button>

            {showNotifs && (
              <div style={{
                position: 'absolute', right: 0, top: '110%', width: 340,
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
                zIndex: 200, overflow: 'hidden'
              }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>Notifications</span>
                  <button onClick={() => setShowNotifs(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                    <X size={16} />
                  </button>
                </div>
                <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>No notifications</div>
                  ) : notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => handleMarkRead(n.id)}
                      style={{
                        padding: '0.875rem 1rem',
                        borderBottom: '1px solid var(--border)',
                        cursor: 'pointer',
                        background: !n.is_read ? 'rgba(99,102,241,0.05)' : 'transparent',
                        transition: 'background 0.2s'
                      }}
                    >
                      <div style={{ fontSize: 13, color: n.is_read ? 'var(--text-secondary)' : 'var(--text-primary)' }}>{n.message}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>{new Date(n.created_at).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
