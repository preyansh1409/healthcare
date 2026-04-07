import { useState } from 'react';
import { ShieldCheck, Settings, LayoutDashboard, AlertTriangle, CheckCircle, Database, RefreshCw, Eye } from 'lucide-react';
import { verifyLedger, getBlockchainLedger } from '../../services/api';
import { useEffect } from 'react';
import toast from 'react-hot-toast';

const styles = `
  @keyframes pulseEffect {
    0% { background: rgba(239, 68, 68, 0.1); }
    50% { background: rgba(239, 68, 68, 0.25); }
    100% { background: rgba(239, 68, 68, 0.1); }
  }
`;

export default function BlockchainAudit() {
  const [audit, setAudit] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    fetchBlocks();
  }, []);

  const fetchBlocks = async () => {
    try {
      const { data } = await getBlockchainLedger();
      setBlocks(data.data);
    } catch { toast.error('Failed to fetch ledger blocks'); }
    finally { setFetching(false); }
  };

  // Pagination Logic
  const totalPages = Math.ceil(blocks.length / pageSize);
  const currentBlocks = blocks.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const runAudit = async () => {
    setLoading(true);
    try {
      const { data } = await verifyLedger();
      setAudit(data);
      if (data.valid) {
        toast.success('Chain Integrity Verified');
      } else {
        toast.error('TAMPERING DETECTED!');
      }
      // Re-fetch blocks in case they changed
      fetchBlocks();
    } catch { toast.error('Audit failed'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <style>{styles}</style>
      <div style={{ marginBottom: '1rem' }}>
        <h1 style={{ fontWeight: 900, fontSize: 32 }}>Security & <span className="gradient-text">Compliance</span></h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>Verify the cryptographic integrity of hospital medical records.</p>
      </div>

      <div className="glass-card" style={{ padding: '2rem', border: '1px solid var(--primary)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h2 style={{ fontWeight: 900, fontSize: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
              <ShieldCheck size={28} color="var(--primary)" />
              Clinical Blockchain <span className="gradient-text">Ledger Audit</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>Ensure no records have been modified since their original creation date.</p>
          </div>
          <button className="btn btn-primary" onClick={runAudit} disabled={loading} style={{ height: 55, padding: '0 2.5rem', fontSize: 16 }}>
            {loading ? 'Crunching Hashes...' : 'Verify Ledger Integrity'}
          </button>
        </div>

        {audit ? (
          <div style={{ animation: 'fadeIn 0.5s ease' }}>
            <div style={{ 
              padding: '2.5rem', borderRadius: 24, 
              background: audit.valid ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
              border: `2px solid ${audit.valid ? '#10b981' : '#ef4444'}`,
              textAlign: 'center', marginBottom: '2rem', boxShadow: '0 12px 40px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: 48, marginBottom: 10 }}>{audit.valid ? '✅' : '🚨'}</div>
              <h1 style={{ fontSize: 36, color: audit.valid ? '#10b981' : '#ef4444', fontWeight: 900, marginBottom: 12 }}>
                {audit.valid ? 'INTEGRITY VERIFIED' : 'TAMPER DETECTED'}
              </h1>
              <p style={{ fontSize: 18, color: 'var(--text-primary)', fontWeight: 600 }}>
                {audit.valid ? `Chain intact with ${audit.count} verified cryptographic blocks.` : audit.error}
              </p>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Block #</th>
                    <th>Previous Hash</th>
                    <th>Block Hash</th>
                    <th>Timestamp</th>
                    <th>Action</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {currentBlocks.map((block) => {
                    const blockReport = audit?.report?.find(r => r.id === block.id);
                    const isTampered = blockReport && !blockReport.isValid;
                    const blockData = JSON.parse(block.data);

                    return (
                      <tr key={block.id} style={{ 
                        background: isTampered ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                        borderLeft: isTampered ? '6px solid #ef4444' : 'none',
                        animation: isTampered ? 'pulseEffect 1.5s infinite' : 'none'
                      }}>
                        <td style={{ fontWeight: 800 }}>{block.id}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: 10, opacity: 0.5 }}>
                          {block.previous_hash.substring(0, 10)}...
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: 11, color: isTampered ? '#ef4444' : 'var(--primary)', fontWeight: isTampered ? 900 : 500 }}>
                          {block.hash.substring(0, 24)}...
                        </td>
                        <td style={{ fontSize: 12 }}>
                          {new Date(block.timestamp).toLocaleTimeString()}
                        </td>
                        <td style={{ fontSize: 11, fontWeight: 700 }}>
                          <span className="badge" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>
                            {blockData.type}
                          </span>
                        </td>
                        <td>
                          {isTampered ? (
                            <div style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', animation: 'pulseEffect 1s infinite' }}></span>
                              <AlertTriangle size={18} /> SECURITY VIOLATION • TAMPERED
                            </div>
                          ) : (
                            <div style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700 }}>
                              <CheckCircle size={14} /> IMMUTABLE
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination UI */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', padding: '1rem', background: 'rgba(0,0,0,0.02)', borderRadius: 16 }}>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Showing <span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{(currentPage - 1) * pageSize + 1}</span> to <span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{Math.min(currentPage * pageSize, blocks.length)}</span> of <span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{blocks.length}</span> blocks
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button 
                    className="btn" 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    style={{ padding: '0.5rem 1rem', fontSize: 12, background: 'white', border: '1px solid var(--border)', borderRadius: 10 }}
                  >
                    Previous
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      style={{
                        width: 38, height: 38, borderRadius: 10, border: 'none',
                        background: currentPage === i + 1 ? 'var(--primary)' : 'white',
                        color: currentPage === i + 1 ? 'white' : 'var(--text-primary)',
                        fontWeight: 800, fontSize: 12, cursor: 'pointer',
                        boxShadow: currentPage === i + 1 ? '0 4px 12px rgba(99,102,241,0.3)' : 'none'
                      }}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button 
                    className="btn" 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    style={{ padding: '0.5rem 1rem', fontSize: 12, background: 'white', border: '1px solid var(--border)', borderRadius: 10 }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Detailed Tamper Report */}
            {!audit.valid && (
              <div style={{ marginTop: '2.5rem', borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 800, color: '#ef4444', marginBottom: '1.5rem' }}>
                  <AlertTriangle size={24} /> Detailed Tampering Report
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {audit.report.filter(r => !r.isValid).map(report => {
                    const tamperedBlock = blocks.find(b => b.id === report.id);
                    const currentData = JSON.parse(tamperedBlock.data);
                    return (
                      <div key={report.id} className="glass-card" style={{ padding: '1.5rem', border: '1px solid #ef4444' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                          <h4 style={{ fontWeight: 700 }}>Block #{report.id} - Security Violation</h4>
                          <span className="badge" style={{ background: '#ef444415', color: '#ef4444' }}>FAILED HASH CHECK</span>
                        </div>
                        <p style={{ fontSize: 14, color: '#ef4444', fontWeight: 600, marginBottom: '1.5rem' }}>
                          {report.errorMessage}
                        </p>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                          <div style={{ background: 'rgba(0,0,0,0.1)', padding: '1rem', borderRadius: 12 }}>
                            <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase' }}>Current Tampered Data (from database):</p>
                            <pre style={{ fontSize: 12, overflowX: 'auto', background: '#000', padding: '1rem', borderRadius: 8, color: '#ff4444' }}>
                              {JSON.stringify(currentData, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ padding: '5rem 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <div style={{ marginBottom: '1.5rem', opacity: 0.5 }}><LayoutDashboard size={64} style={{ margin: '0 auto' }} /></div>
            <p style={{ fontSize: 16, fontWeight: 500 }}>Audit not yet performed for this session.</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>Click 'Verify Ledger Integrity' to check the SHA-256 chain.</p>
          </div>
        )}
      </div>
    </div>
  );
}
