import { useState, useEffect, useRef } from 'react';
import { ShieldAlert, X } from 'lucide-react';
import { verifyLedger } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function SecurityGuardian() {
  const { user } = useAuth();
  const [alert, setAlert] = useState(null);
  const [dismissedBlocks, setDismissedBlocks] = useState(() => {
    try {
      const saved = localStorage.getItem('dismissed_tamper_blocks');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });
  const dismissedRef = useRef(dismissedBlocks);

  const runScan = async () => {
    try {
      // User requested only 1 time per day
      const today = new Date().toDateString();
      const lastShownDate = localStorage.getItem('last_tamper_alert_date');
      if (lastShownDate === today) return;

      const { data } = await verifyLedger();
      if (!data.valid) {
        if (!dismissedRef.current.has(data.tamperedBlockId)) {
          // Show the alert
          setAlert({
            id: data.tamperedBlockId,
            message: 'CRITICAL SECURITY BREACH: UNAUTHORIZED DATABASE MODIFICATION DETECTED!',
            details: data.error
          });
          // Immediately record that we've notified the user today
          localStorage.setItem('last_tamper_alert_date', today);
        }
      }
    } catch (err) {
      console.warn('Background integrity scan failed');
    }
  };

  useEffect(() => {
    // Only admins/receptionists should have the background security check
    if (user?.role !== 'admin' && user?.role !== 'receptionist') return;

    // Run initial scan on mount
    runScan();

    // Listen for custom events to trigger extra scans (e.g. after a save)
    const handleCheck = () => runScan();
    window.addEventListener('blockchain-check', handleCheck);

    // Auto-scan every 5 minutes instead of 20 seconds to be less intrusive
    const interval = setInterval(runScan, 300000);
    
    return () => {
      window.removeEventListener('blockchain-check', handleCheck);
      clearInterval(interval);
    };
  }, [user]);

  const acknowledgeAlert = () => {
    if (alert) {
      const newDismissed = new Set(dismissedBlocks);
      newDismissed.add(alert.id);
      dismissedRef.current = newDismissed;
      setDismissedBlocks(newDismissed);
      
      // Persist the dismissal and the date
      localStorage.setItem('dismissed_tamper_blocks', JSON.stringify(Array.from(newDismissed)));
      localStorage.setItem('last_tamper_alert_date', new Date().toDateString());
      
      setAlert(null);
    }
  };

  if (!alert) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.95)',
      backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem', animation: 'fadeIn 0.3s ease'
    }}>
      <div className="glass-card" style={{
        maxWidth: 600, width: '100%', padding: '3rem', border: '3px solid #ef4444',
        textAlign: 'center', boxShadow: '0 0 50px rgba(239, 68, 68, 0.4)', borderRadius: 24,
        background: 'white', position: 'relative', animation: 'scaleUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        <button 
          onClick={acknowledgeAlert}
          style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
        >
          <X size={24} />
        </button>

        <div style={{
          width: 80, height: 80, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)',
          color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.5rem', animation: 'pulseEffect 1s infinite'
        }}>
          <ShieldAlert size={40} />
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#ef4444', marginBottom: '1rem', letterSpacing: '-0.02em' }}>
          TAMPER ALERT!
        </h1>
        <p style={{ fontSize: 16, color: '#0f172a', fontWeight: 700, marginBottom: '1.5rem', lineHeight: 1.5 }}>
          {alert.message}
        </p>
        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 16, border: '1px dashed #ef4444', fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'monospace', marginBottom: '2rem' }}>
          {alert.details}
        </div>

        <button 
          onClick={() => {
            acknowledgeAlert();
            window.location.href = '/admin/blockchain';
          }}
          style={{
            width: '100%', padding: '1.25rem', borderRadius: 16, background: '#ef4444',
            color: 'white', border: 'none', fontWeight: 900, fontSize: 16, cursor: 'pointer',
            boxShadow: '0 10px 20px -5px rgba(239, 68, 68, 0.3)'
          }}
        >
          INVESTIGATE AUDIT LOGS
        </button>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleUp { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes pulseEffect { 
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          70% { transform: scale(1.05); box-shadow: 0 0 0 15px rgba(239, 68, 68, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
      `}</style>
    </div>
  );
}
