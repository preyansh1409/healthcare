import { useState, useEffect } from 'react';
import { MessageSquare, Send, Search, CheckCheck, Archive, Trash2, LayoutGrid, List, Inbox } from 'lucide-react';

export default function PatientMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Logic to fetch messages will go here (connected to patient_portal_messages table)
    // For now, it stays empty as per user's clear data request
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontWeight: 900, fontSize: 32 }}>Secure <span className="gradient-text">Messaging</span></h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginTop: 4 }}>Communicate directly with your doctors and hospital staff.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <div style={{ position: 'relative', width: 250 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input className="form-input" placeholder="Search messages..." style={{ paddingLeft: '2.5rem', height: 44, borderRadius: 12, fontSize: 13 }} />
          </div>
          <button className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>NEW MESSAGE</button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: '400px', justifyContent: 'center', alignItems: 'center', background: 'rgba(0,0,0,0.01)', borderRadius: 24, border: '1px dashed var(--border)' }}>
        {messages.length > 0 ? (
          messages.map((msg) => (
            <div key={msg.id} className="glass-card" style={{ width: '100%', padding: '1.5rem', display: 'flex', gap: '1.5rem', border: `1px solid ${msg.unread ? 'rgba(99,102,241,0.3)' : 'var(--border)'}`, transition: 'all 0.2s linear' }}>
              <div style={{ padding: '0.75rem', borderRadius: 12, background: msg.unread ? 'rgba(99,102,241,0.1)' : 'rgba(0,0,0,0.03)', color: msg.unread ? '#6366f1' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'fit-content' }}>
                <MessageSquare size={20} />
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: msg.unread ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{msg.sender}</h3>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>{msg.date}</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>{msg.subject}</div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem', maxWidth: 800 }}>{msg.text}</p>
                
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <button className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: 11, fontWeight: 900 }}>REPLY</button>
                  <button className="btn btn-secondary" style={{ background: 'transparent', padding: '0.4rem' }}><Archive size={16} /></button>
                  <button className="btn btn-secondary" style={{ background: 'transparent', padding: '0.4rem' }}><Trash2 size={16} /></button>
                  {msg.unread === false && <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#10b981', fontWeight: 800 }}><CheckCheck size={14} /> Read</span>}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', opacity: 0.4 }}>
            <Inbox size={48} strokeWidth={1} style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 16, fontWeight: 800 }}>No messages in your inbox</div>
            <p style={{ fontSize: 13, fontWeight: 600 }}>Your secure communication with clinical staff will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
