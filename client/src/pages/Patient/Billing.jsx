import { useState, useEffect } from 'react';
import {
  CreditCard, Download, FileText, LayoutDashboard, Search, Printer,
  List, CheckCircle2, Clock, Inbox, AlertCircle, ChevronRight,
  ArrowLeft, ShoppingBag, Receipt, ShieldCheck
} from 'lucide-react';
import { getPatientById } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function PatientBilling() {
  const [bills, setBills] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchBills = async () => {
      if (!user?.patient_id) { setLoading(false); return; }
      try {
        const { data } = await getPatientById(user.patient_id);
        const transformed = (data?.data?.bills || []).map(b => {
          const items = typeof b.items === 'string' ? JSON.parse(b.items || '[]') : (b.items || []);
          const subtotal = items.reduce((acc, item) => acc + (parseFloat(item.cost) || 0), 0);

          return {
            ...b,
            items,
            subtotal,
            totalNum: parseFloat(b.total_amount),
            taxNum: parseFloat(b.tax || 0),
            discountNum: parseFloat(b.discount || 0),
            total: b.total_amount ? `₹${parseFloat(b.total_amount).toLocaleString()}` : '₹0',
            detailedAmount: subtotal ? `₹${subtotal.toLocaleString()}` : '₹0',
            tax: b.tax ? `₹${parseFloat(b.tax).toLocaleString()}` : '₹0',
            discount: b.discount ? `₹${parseFloat(b.discount).toLocaleString()}` : '₹0',
            date: b.created_at ? new Date(b.created_at).toLocaleDateString() : 'N/A',
            method: (b.payment_method || 'CASH').toUpperCase(),
            status: (b.status || 'UNPAID').toUpperCase(),
            color: b.status === 'paid' ? '#10b981' : b.status === 'partially_paid' ? '#f59e0b' : '#ef4444',
            icon: b.status === 'paid' ? CheckCircle2 : b.status === 'partially_paid' ? Clock : AlertCircle,
            doctor: b.doctor_name || 'Hospital Bill',
            patient: {
              name: b.patient_name || user.name,
              phone: b.patient_phone || '1234567890'
            }
          };
        });
        setBills(transformed);
      } catch (err) {
        console.error('Error fetching bills:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBills();
  }, [user]);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading bills...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {!selectedBill ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontWeight: 900, fontSize: 32 }}>Billing & <span className="gradient-text">Payments</span></h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginTop: 4 }}>Manage your invoices and view payment history.</p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <div style={{ position: 'relative', width: 250 }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input className="form-input" placeholder="Search invoices..." style={{ paddingLeft: '2.5rem', height: 44, borderRadius: 12, fontSize: 13 }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: '300px' }}>
            {bills.length > 0 ? (
              <>
                {/* Column Headers for Linear List */}
                <div style={{
                  display: 'grid', gridTemplateColumns: '100px 140px 1.5fr 1fr 1fr 120px',
                  padding: '1rem 2rem', background: '#f8fafc', borderRadius: 12,
                  border: '1px solid var(--border)', fontWeight: 900,
                  fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  <div>Invoice ID</div>
                  <div>Date</div>
                  <div>Consultant</div>
                  <div>Amount</div>
                  <div>Status</div>
                  <div style={{ textAlign: 'center' }}>Action</div>
                </div>

                {bills.map((bill) => (
                  <div key={bill.id} style={{
                    display: 'grid', gridTemplateColumns: '100px 140px 1.5fr 1fr 1fr 120px',
                    alignItems: 'center', padding: '1.25rem 2rem',
                    background: 'white', borderRadius: 12, border: '1px solid var(--border)',
                    transition: 'all 0.3s ease', cursor: 'pointer'
                  }} onClick={() => setSelectedBill(bill)}>
                    <div style={{ fontWeight: 800, color: 'var(--text-secondary)', fontSize: 13 }}>#INV-{bill.id.toString().padStart(4, '0')}</div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{bill.date}</div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ padding: '0.5rem', background: 'rgba(99,102,241,0.1)', color: '#6366f1', borderRadius: 8 }}>
                        <FileText size={16} />
                      </div>
                      <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)' }}>{bill.doctor}</div>
                    </div>

                    <div style={{ fontWeight: 900, fontSize: 16, color: 'var(--text-primary)' }}>{bill.total}</div>

                    <div>
                      <span style={{
                        padding: '6px 12px', background: `${bill.color}15`, color: bill.color,
                        borderRadius: 20, fontSize: 11, fontWeight: 900, display: 'inline-flex', gap: 6, alignItems: 'center'
                      }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: bill.color }}></div>
                        {bill.status}
                      </span>
                    </div>

                    <button
                      className="btn btn-secondary"
                      style={{ justifyContent: 'center', fontWeight: 900, fontSize: 11, height: 36, borderRadius: 8, padding: '0 15px' }}
                      onClick={(e) => { e.stopPropagation(); setSelectedBill(bill); }}
                    >
                      VIEW
                    </button>
                  </div>
                ))}
              </>
            ) : (
              <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem', background: 'rgba(0,0,0,0.01)', borderRadius: 24, border: '1px dashed var(--border)' }}>
                <Inbox size={48} opacity={0.2} style={{ marginBottom: 16 }} />
                <div style={{ fontSize: 16, fontWeight: 800, opacity: 0.5 }}>No invoices found</div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', animation: 'fadeIn 0.4s ease' }}>
          <style>{`
            @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            @media print { .no-print { display: none !important; } }
          `}</style>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="no-print">
            <button
              onClick={() => setSelectedBill(null)}
              className="btn btn-secondary"
              style={{ fontWeight: 800, gap: 10 }}
            >
              <ArrowLeft size={18} /> BACK TO BILLING
            </button>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-secondary" style={{ fontWeight: 800 }}>
                CANCEL
              </button>
              <button
                onClick={() => window.print()}
                className="btn btn-primary"
                style={{ fontWeight: 900, gap: 10 }}
              >
                <Printer size={18} /> SAVE & PRINT BILL
              </button>
            </div>
          </div>

          <div className="glass-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border)' }}>
            <div style={{ padding: '2.5rem', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#6366f1', marginBottom: '2.5rem' }}>
                <Receipt size={24} />
                <h2 style={{ fontSize: 18, fontWeight: 900 }}>Invoice Detail: #BILL-{selectedBill.id.toString().padStart(4, '0')}</h2>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ padding: '1.25rem', borderRadius: 16, border: '1px solid #e2e8f0', background: '#fcfcfc' }}>
                  <div style={{ fontSize: 10, fontWeight: 900, color: '#6366f1', textTransform: 'uppercase', marginBottom: 8 }}>Bill To (Patient Detail)</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{selectedBill.patient.name} ({selectedBill.patient.phone})</div>
                </div>
                <div style={{ padding: '1.25rem', borderRadius: 16, border: '1px solid #e2e8f0', background: '#fcfcfc' }}>
                  <div style={{ fontSize: 10, fontWeight: 900, color: '#0ea5e9', textTransform: 'uppercase', marginBottom: 8 }}>Treatment Reference</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{selectedBill.date} - {selectedBill.doctor}</div>
                </div>
              </div>

              <div style={{ border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ background: '#fff', padding: '1.25rem' }}>
                  <div style={{ fontWeight: 900, fontSize: 14, marginBottom: '1.5rem' }}>Billing Items</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>
                    <span>Description</span>
                    <span>Amount (₹)</span>
                  </div>
                  <div style={{ marginTop: '1.25rem' }}>
                    {selectedBill.items.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', borderBottom: idx === selectedBill.items.length - 1 ? 'none' : '1px dotted #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ fontSize: 14, fontWeight: 800 }}>{item.name}</div>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 900 }}>{parseFloat(item.cost).toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem', marginTop: '2.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1, padding: '1rem', borderRadius: 16, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8 }}>Payment Status</div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{selectedBill.status} / Due</div>
                  </div>
                  <div style={{ flex: 1, padding: '1rem', borderRadius: 16, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8 }}>Payment Method</div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{selectedBill.method}</div>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: 20, border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 600, color: '#64748b' }}>
                      <span>Subtotal:</span>
                      <span style={{ color: '#1e293b', fontWeight: 800 }}>₹{selectedBill.subtotal.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 600, color: '#64748b' }}>
                      <span>GST (5% Fixed):</span>
                      <span style={{ color: '#1e293b', fontWeight: 800 }}>₹{selectedBill.taxNum.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 600, color: '#64748b' }}>
                      <div>
                        <span>Discount (%):</span>
                        <div style={{ fontSize: 10, color: '#ef4444', fontWeight: 900 }}>(-₹{selectedBill.discountNum.toFixed(2)})</div>
                      </div>
                      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '4px 12px', fontWeight: 800 }}>0.00</div>
                    </div>
                    <div style={{ height: 1.5, background: '#e2e8f0', margin: '1rem 0' }}></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 20, fontWeight: 900 }}>Grand Total:</span>
                      <span style={{ fontSize: 24, fontWeight: 900, color: '#6366f1' }}>₹{selectedBill.totalNum.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
