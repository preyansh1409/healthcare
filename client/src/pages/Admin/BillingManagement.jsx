import { useState, useEffect } from 'react';
import axios from 'axios';
import { getBills, createBill, updateBill, updateBillStatus, getPatients, getAppointments } from '../../services/api';
import { CreditCard, Plus, IndianRupee, Search, CheckCircle, Clock, Trash2, Edit, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BillingManagement() {
  const [bills, setBills] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);

  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState({ patient_id: '', appointment_id: '', doctor_id: '', items: [], tax: 0, discount: 0, status: 'unpaid', payment_method: 'cash' });
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [endDate, setEndDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [newItemName, setNewItemName] = useState('');
  const [newItemCost, setNewItemCost] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [bRes, pRes, aRes, dRes] = await Promise.all([
        getBills(),
        getPatients(),
        getAppointments(),
        axios.get('/api/doctors') // Using direct axios if getDoctors isn't exported in a way I like or just use it
      ]);
      setBills(bRes.data.data);
      setPatients(pRes.data.data);
      setAppointments(aRes.data.data);
      setDoctors(dRes.data.data);
    } catch (err) {
      toast.error('Failed to load billing data');
    } finally {
      setLoading(false);
    }
  };

  const getSubtotal = () => form.items.reduce((sum, item) => sum + (Number(item.price || item.cost) * Number(item.quantity === undefined ? 0 : item.quantity)), 0);
  const getTax = (sub) => (sub * 0.05);
  const getDiscAmount = (sub) => (sub * Number(form.discount || 0)) / 100;
  const getTotal = () => {
    const sub = getSubtotal();
    const tax = getTax(sub);
    const disc = getDiscAmount(sub);
    return Math.max(0, sub + tax - disc);
  };

  const addItem = (name, price) => {
    const itemName = name || newItemName;
    const itemPrice = Number(price || newItemCost);

    if (!itemName || isNaN(itemPrice)) return;

    const existingIdx = form.items.findIndex(i => i.name === itemName);
    if (existingIdx > -1) {
      const newItems = [...form.items];
      newItems[existingIdx].quantity = (newItems[existingIdx].quantity || 0) + 1;
      setForm({ ...form, items: newItems });
    } else {
      setForm({
        ...form,
        items: [...form.items, {
          id: Date.now().toString(),
          name: itemName,
          price: itemPrice,
          quantity: 0
        }]
      });
    }

    if (!name) {
      setNewItemName('');
      setNewItemCost('');
    }
  };

  const updateItemQty = (id, newQty) => {
    if (newQty < 0) return;
    setForm({
      ...form,
      items: form.items.map(i => i.id === id ? { ...i, quantity: Number(newQty) } : i)
    });
  };

  const removeItem = (id) => {
    setForm({ ...form, items: form.items.filter(i => i.id !== id) });
  };

  const openNewBill = () => {
    setEditId(null);
    setForm({ patient_id: '', appointment_id: '', doctor_id: '', items: [], tax: 0, discount: 0, status: 'unpaid', payment_method: 'cash' });
    setShowForm(true);
  };

  const openEditBill = (bill) => {
    setEditId(bill.id);
    let parsedItems = [];
    try { parsedItems = typeof bill.items === 'string' ? JSON.parse(bill.items) : (bill.items || []); } catch { }
    setForm({
      patient_id: bill.patient_id,
      appointment_id: bill.appointment_id || '',
      doctor_id: bill.doctor_id || '',
      items: parsedItems,
      tax: bill.tax || 0,
      discount: bill.discount || 0,
      status: bill.status,
      payment_method: bill.payment_method || 'cash'
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.items.length === 0) {
      return toast.error('Please add at least one item to the bill');
    }
    const subtotal = getSubtotal();
    const tax = getTax(subtotal);
    const total_amount = getTotal();
    const payload = { ...form, tax, total_amount };

    try {
      if (editId) {
        await updateBill(editId, payload);
      } else {
        await createBill(payload);
      }
      setShowForm(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save bill');
    }
  };

  const handleUpdateStatus = async (id, status, payment_method) => {
    try {
      await updateBillStatus(id, { status, payment_method });
      toast.success('Bill updated');
      loadData();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const saveAndPrint = async () => {
    if (form.items.length === 0) return toast.error('Please add at least one item');
    const sub = getSubtotal();
    const tax = getTax(sub);
    const updatedForm = { ...form, status: 'paid', tax, total_amount: getTotal() };

    // Visually update the form status on screen immediately
    setForm(prev => ({ ...prev, status: 'paid' }));

    try {
      await updateBill(editId, updatedForm);
      toast.success('Bill is Paid & Saved for Printing!');
      loadData();

      // Clear form after print
      const handleAfterPrint = () => {
        setShowForm(false);
        window.removeEventListener('afterprint', handleAfterPrint);
      };
      window.addEventListener('afterprint', handleAfterPrint);

      setTimeout(() => {
        window.print();
      }, 800);
    } catch (err) { toast.error('Failed to save bill'); }
  };

  const filteredBills = bills.filter(b => {
    // Search match
    const searchMatch = (b.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
      b.patient_phone?.includes(search));

    if (!searchMatch) return false;

    // Date range match
    if (startDate || endDate) {
      const billDate = new Date(b.created_at);
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (billDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (billDate > end) return false;
      }
    }

    return true;
  });

  return (
    <div className="billing-page">
      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @media print {
          body, html { background: white !important; padding: 0 !important; margin: 0 !important; }
          .no-print, .sidebar { display: none !important; }
          div[style*="margin-left"] { margin-left: 0 !important; }
          main { margin: 0 !important; padding: 0 !important; max-width: 100% !important; }
          .print-container { padding: 0 !important; margin: 0 !important; border: none !important; box-shadow: none !important; display: block !important; width: 100% !important; max-width: 100% !important; }
          select { -webkit-appearance: none !important; appearance: none !important; border: none !important; background: transparent !important; padding: 0 !important; font-weight: 700 !important; color: #000 !important; }
          input { border: none !important; background: transparent !important; padding: 0 !important; font-weight: 700 !important; color: #000 !important; }
          .form-group-card { border: 1px solid #ccc !important; break-inside: avoid; }
        }
      `}</style>


      <div style={{ padding: '0 1rem' }}>
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontWeight: 900, fontSize: 26 }}>Billing <span className="gradient-text">Management</span></h1>
          </div>
          {!showForm && (
            <button className="btn btn-primary" onClick={openNewBill}>
              <Plus size={16} /> Create New Bill
            </button>
          )}
        </div>

        {showForm && (
          <div className="print-container" style={{ background: '#fff', padding: '2.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '2rem', animation: 'slideUp 0.3s ease', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h3 style={{ fontWeight: 900, fontSize: 20, display: 'flex', alignItems: 'center', gap: 10, color: '#6366f1', margin: 0 }}>
                <CreditCard size={24} />
                {editId ? `Invoice Detail: #BILL-${editId.toString().padStart(4, '0')}` : 'Generate Patient Invoice'}
              </h3>
              <div className="print-only" style={{ display: 'none' }}>
                <h2 style={{ fontSize: 18, color: '#000', fontWeight: 900, margin: 0 }}>HealthCare HMS</h2>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="form-group-card" style={{ padding: '1.25rem', borderRadius: 12, border: '1px solid #e2e8f0', background: '#fcfcfc' }}>
                  <label style={{ fontWeight: 900, textTransform: 'uppercase', fontSize: 10, color: '#6366f1', marginBottom: 8, display: 'block' }}>Bill To (Patient Detail)</label>
                  <select className="form-input" required value={form.patient_id} onChange={e => setForm({ ...form, patient_id: e.target.value })} style={{ border: 'none', background: 'transparent', padding: 0, outline: 'none', fontSize: 14, fontWeight: 700, color: '#1e293b', width: '100%', cursor: 'pointer' }}>
                    <option value="">-- Select Patient --</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.phone})</option>)}
                  </select>
                </div>
                <div className="form-group-card" style={{ padding: '1.25rem', borderRadius: 12, border: '1px solid #e2e8f0', background: '#fcfcfc' }}>
                  <label style={{ fontWeight: 900, textTransform: 'uppercase', fontSize: 10, color: '#0ea5e9', marginBottom: 8, display: 'block' }}>Treatment Reference</label>
                  <select className="form-input" value={form.appointment_id} onChange={e => setForm({ ...form, appointment_id: e.target.value })} style={{ border: 'none', background: 'transparent', padding: 0, outline: 'none', fontSize: 14, fontWeight: 700, color: '#1e293b', width: '100%', cursor: 'pointer' }}>
                    <option value="">-- General Case / Walk-in --</option>
                    {appointments.filter(a => a.patient_id == form.patient_id).map(a =>
                      <option key={a.id} value={a.id}>{new Date(a.appointment_date).toLocaleDateString('en-GB')} - {a.doctor_name}</option>
                    )}
                  </select>
                </div>
                <div className="form-group-card" style={{ padding: '1.25rem', borderRadius: 12, border: '1px solid #e2e8f0', background: '#fcfcfc' }}>
                  <label style={{ fontWeight: 900, textTransform: 'uppercase', fontSize: 10, color: '#10b981', marginBottom: 8, display: 'block' }}>Consulting Doctor</label>
                  <select className="form-input" required={!form.appointment_id} value={form.doctor_id} onChange={e => setForm({ ...form, doctor_id: e.target.value })} style={{ border: 'none', background: 'transparent', padding: 0, outline: 'none', fontSize: 14, fontWeight: 700, color: '#1e293b', width: '100%', cursor: 'pointer' }}>
                    <option value="">-- Select Doctor --</option>
                    {doctors.map(d => <option key={d.id} value={d.id}>{d.name} ({d.specialization})</option>)}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '2rem', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div style={{ padding: '1.25rem 1.5rem', background: '#fff', borderBottom: '1px solid #f1f5f9', fontWeight: 900, fontSize: 15, color: '#0f172a' }}>Billing Items</div>
                <div style={{ padding: '0 1.5rem' }}>
                  {form.items.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem', fontSize: 14 }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #f8fafc', color: '#64748b' }}>
                          <th style={{ textAlign: 'left', padding: '12px 0', fontSize: 13, fontWeight: 800 }}>Description</th>
                          <th style={{ textAlign: 'center', padding: '12px 0', width: 100, fontSize: 13, fontWeight: 800 }}>Days</th>
                          <th style={{ textAlign: 'right', padding: '12px 0', width: 120, fontSize: 13, fontWeight: 800 }}>Price (₹)</th>
                          <th style={{ textAlign: 'right', padding: '12px 0', width: 120, fontSize: 13, fontWeight: 800 }}>Total (₹)</th>
                          <th className="no-print" style={{ width: 40 }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {form.items.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px dotted #e2e8f0' }}>
                            <td style={{ padding: '14px 0', fontWeight: 600, color: '#1e293b' }}>{item.name}</td>
                            <td style={{ padding: '14px 0', textAlign: 'center' }}>
                               <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                 <span style={{ fontWeight: 800, fontSize: '15px', color: '#0f172a' }}>{item.quantity || 0}</span>
                                 <input 
                                    type="number" 
                                    min="0" 
                                    value={item.quantity === undefined ? 0 : item.quantity} 
                                    onChange={(e) => updateItemQty(item.id, e.target.value)}
                                    className="no-print"
                                    style={{ width: 45, textAlign: 'center', border: '1px solid #e2e8f0', borderRadius: 4, fontSize: '11px', padding: '2px', background: '#f8fafc' }}
                                 />
                                   </div>
                            </td>
                            <td style={{ padding: '14px 0', textAlign: 'right', fontWeight: 600, color: '#64748b' }}>{(item.price || item.cost || 0).toFixed(2)}</td>
                            <td style={{ padding: '14px 0', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                              {((item.price || item.cost || 0) * (item.quantity === undefined ? 0 : item.quantity)).toFixed(2)}
                            </td>
                            <td className="no-print" style={{ textAlign: 'right' }}>
                              <button type="button" onClick={() => removeItem(item.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}>
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', fontSize: 13 }}>Add billing items below to generate invoice.</div>
                  )}

                  {!form.appointment_id && (
                    <div className="no-print" style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: 12, border: '1px dashed #cbd5e1' }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#6366f1', textTransform: 'uppercase', marginBottom: 10 }}>Quick Add Admission Charges (IPD Only)</div>
                      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <select
                          className="form-input"
                          style={{ width: 220, fontSize: 12, height: 38, borderRadius: 8 }}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (!val) return;
                            const [name, cost] = val.split('|');
                            addItem(`Room Charge (${name})`, cost);
                            e.target.value = '';
                          }}
                        >
                          <option value="">Add Room Charge...</option>
                          <option value="General|2000">General Ward (₹2,000)</option>
                          <option value="Semi-Private|4500">Semi-Private (₹4,500)</option>
                          <option value="Private|8000">Private Room (₹8,000)</option>
                          <option value="ICU|18000">ICU (₹18,000)</option>
                        </select>

                        <button
                          className="btn"
                          style={{ background: 'white', border: '1px solid #e2e8f0', fontSize: 11, height: 38, padding: '0 1rem', borderRadius: 8, color: '#0f172a', fontWeight: 700 }}
                          onClick={() => addItem('Doctor Visit/Rounding Charge', 1000)}
                        >
                          Doctor Visit (₹1000)
                        </button>

                        <button
                          type="button"
                          className="btn"
                          style={{ background: 'white', border: '1px solid #e2e8f0', fontSize: 11, height: 38, padding: '0 1rem', borderRadius: 8, color: '#0f172a', fontWeight: 700 }}
                          onClick={() => addItem('Nursing Care Service Charge', 500)}
                        >
                          Nursing Charge (₹500)
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="no-print" style={{ display: 'grid', gridTemplateColumns: '1fr 120px auto', gap: '1rem', marginTop: '1.5rem', alignItems: 'center', paddingBottom: '1.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <label style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', position: 'absolute', top: -18, left: 0 }}>ADD CUSTOM ITEM</label>
                      <input className="form-input" placeholder="Item description (e.g., Medicine, Lab Test)" value={newItemName} onChange={e => setNewItemName(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addItem())} style={{ borderRadius: 10, border: '1px solid #e2e8f0', padding: '0.75rem 1rem', width: '100%' }} />
                    </div>
                    <div style={{ position: 'relative', width: 120 }}>
                      <label style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', position: 'absolute', top: -18, left: 0 }}>COST (₹)</label>
                      <input type="number" className="form-input" placeholder="Cost" value={newItemCost} onChange={e => setNewItemCost(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addItem())} style={{ borderRadius: 10, border: '1px solid #e2e8f0', padding: '0.75rem 1rem', width: '100%' }} />
                    </div>
                    <button type="button" onClick={addItem} style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1', border: 'none', height: 44, width: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginTop: 4 }}><Plus size={20} /></button>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1.2fr) minmax(300px, 1fr)', gap: '2rem', alignItems: 'start' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group-card" style={{ padding: '1.25rem', borderRadius: 12, border: '1px solid #e2e8f0', background: '#fcfcfc' }}>
                    <label style={{ fontWeight: 900, fontSize: 10, textTransform: 'uppercase', color: '#64748b', marginBottom: 12, display: 'block' }}>Payment Status</label>
                    <select className="form-input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={{ border: 'none', background: 'transparent', padding: 0, outline: 'none', fontSize: 15, fontWeight: 800, color: '#1e293b', width: '100%', cursor: 'pointer' }}>
                      <option value="unpaid">Unpaid / Due</option>
                      <option value="paid">Fully Paid</option>
                    </select>
                  </div>
                  <div className="form-group-card" style={{ padding: '1.25rem', borderRadius: 12, border: '1px solid #e2e8f0', background: '#fcfcfc' }}>
                    <label style={{ fontWeight: 900, fontSize: 10, textTransform: 'uppercase', color: '#64748b', marginBottom: 12, display: 'block' }}>Payment Method</label>
                    <select className="form-input" value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })} style={{ border: 'none', background: 'transparent', padding: 0, outline: 'none', fontSize: 15, fontWeight: 800, color: '#1e293b', width: '100%', cursor: 'pointer' }}>
                      <option value="cash">Cash</option>
                      <option value="card">Credit/Debit Card</option>
                      <option value="upi">UPI / Online</option>
                      <option value="insurance">Insurance</option>
                    </select>
                  </div>
                </div>

                <div className="form-group-card" style={{ padding: '1.5rem', borderRadius: 16, border: '1px solid #e2e8f0', background: '#fcfcfc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.875rem', fontSize: 14 }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Subtotal:</span>
                    <span style={{ color: '#0f172a', fontWeight: 800 }}>₹{getSubtotal().toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem', fontSize: 14 }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>GST (5% Fixed):</span>
                    <span style={{ color: '#0f172a', fontWeight: 800 }}>₹{getTax(getSubtotal()).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', fontSize: 14 }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ color: '#64748b', fontWeight: 600 }}>Discount (%):</span>
                      <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 800 }}>(-₹{getDiscAmount(getSubtotal()).toFixed(2)})</span>
                    </div>
                    <input type="number" className="form-input" style={{ width: 80, padding: '4px 12px', textAlign: 'right', background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, fontWeight: 800, color: '#0f172a' }} value={form.discount} onChange={e => setForm({ ...form, discount: e.target.value })} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '1.25rem', borderTop: '1px dashed #cbd5e1', fontSize: 18 }}>
                    <span style={{ fontWeight: 900, color: '#0f172a' }}>Grand Total:</span>
                    <span style={{ fontWeight: 900, color: '#0f172a' }}>₹{getTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="no-print" style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)} style={{ background: 'white', border: '1px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>Cancel</button>
                {editId ? (
                  <button type="button" className="btn btn-primary" style={{ minWidth: 160, justifyContent: 'center', background: '#6366f1', fontWeight: 800, boxShadow: '0 4px 15px rgba(99,102,241,0.2)' }} onClick={saveAndPrint}>
                    Save & Print Bill
                  </button>
                ) : (
                  <button type="submit" className="btn btn-primary" style={{ minWidth: 160, justifyContent: 'center', background: '#6366f1', fontWeight: 800 }}>
                    <CheckCircle size={16} /> Generate Bill
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Search & Filters */}
        {!showForm && (
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <div className="search-bar" style={{ position: 'relative', maxWidth: 380, flex: 1 }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input className="form-input" style={{ paddingLeft: '2.25rem' }} placeholder="Search bills by patient name or phone..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.5rem 1rem', borderRadius: 12, border: '1px solid var(--border)' }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>From</span>
                <input type="date" className="form-input" style={{ background: 'transparent', border: 'none', padding: 0, fontSize: 13, width: 120 }} value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.5rem 1rem', borderRadius: 12, border: '1px solid var(--border)' }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>To</span>
                <input type="date" className="form-input" style={{ background: 'transparent', border: 'none', padding: 0, fontSize: 13, width: 120 }} value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
              {(search || startDate || endDate) && (
                <button className="btn btn-secondary" onClick={() => { setSearch(''); setStartDate(''); setEndDate(''); }} style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', height: 38 }}>
                  Reset
                </button>
              )}
            </div>
          </div>
        )}

        {/* Table */}
        {!showForm && (
          <div className="glass-card" style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Patient</th>
                  <th>Date</th>
                  <th>Total Amount</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBills.map(b => (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>#BILL-{b.id.toString().padStart(4, '0')}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{b.patient_name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{b.patient_phone}</div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{new Date(b.created_at).toLocaleDateString()}</td>
                    <td style={{ fontWeight: 800 }}>₹{b.total_amount}</td>
                    <td style={{ textTransform: 'capitalize', color: 'var(--text-secondary)', fontSize: 13 }}>{b.payment_method}</td>
                    <td>
                      <span className="badge" style={{
                        background: 'rgba(0,0,0,0.05)',
                        color: '#000',
                        fontWeight: 700,
                        border: '1px solid #ccc'
                      }}>
                        {b.status === 'paid' ? <CheckCircle size={12} style={{ marginRight: 4 }} /> : <Clock size={12} style={{ marginRight: 4 }} />}
                        {b.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-secondary" style={{ padding: '0.375rem 1rem', fontSize: 13, borderRadius: 10, color: '#6366f1', gap: 6, display: 'flex', alignItems: 'center' }} onClick={() => openEditBill(b)}>
                          <Edit size={14} /> View/Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {loading && <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading invoices...</div>}
            {!loading && filteredBills.length === 0 && (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <CreditCard size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                <p>No invoices found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
