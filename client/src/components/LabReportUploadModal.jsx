import { useState, useRef } from 'react';
import { uploadLabReport } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { X, FileUp, Loader, CheckCircle2, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LabReportUploadModal({ patient, onClose, onSuccess }) {
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [form, setForm] = useState({
    report_type: 'Blood Test',
    report_date: new Date().toLocaleDateString('en-CA'),
    details: ''
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile && !form.details) {
      return toast.error('Please upload a file or enter report details');
    }
    
    setLoading(true);
    try {
      await uploadLabReport({
        ...form,
        patient_id: patient.id,
        uploaded_by: user?.id || 1,
        file_name: selectedFile?.name || 'manual_entry.pdf'
      });
      
      setIsSuccess(true);
      toast.success('Report uploaded successfully');
      if (onSuccess) onSuccess();
      // Auto close after 2 seconds or let user close
      setTimeout(() => onClose(), 2000);
    } catch (err) {
      toast.error('Failed to upload report');
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
        <div className="glass-card" style={{ maxWidth: 400, width: '100%', padding: '3rem', textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <CheckCircle2 size={48} />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 8 }}>Upload Successful</h2>
          <p style={{ color: 'var(--text-secondary)' }}>The report has been saved to the doctor's record.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
      <div className="glass-card" style={{ maxWidth: 500, width: '100%', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: 20, fontWeight: 900 }}>Receptionist <span className="gradient-text">File Upload</span></h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ padding: '0.75rem', background: 'rgba(99,102,241,0.08)', borderRadius: 12, border: '1px solid rgba(99,102,241,0.2)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white' }}>{patient?.name?.charAt(0)}</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{patient?.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Patient ID: #{patient?.id}</div>
            </div>
          </div>

          <div>
            <label className="form-label">Category</label>
            <select className="form-input" value={form.report_type} onChange={e => setForm(f => ({ ...f, report_type: e.target.value }))}>
              <option value="Blood Test">Blood Test (CBC, LFT)</option>
              <option value="Urine Analysis">Urine Analysis</option>
              <option value="Thyroid Profile">Thyroid Profile</option>
              <option value="ECG / Heart">ECG / Heart</option>
              <option value="X-Ray / MRI">X-Ray / MRI Conclusion</option>
            </select>
          </div>

          <div>
            <label className="form-label">Report Date</label>
            <input type="date" className="form-input" value={form.report_date} onChange={e => setForm(f => ({ ...f, report_date: e.target.value }))} />
          </div>

          <div>
            <label className="form-label">Select Report File</label>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/*,application/pdf" />
            <div onClick={() => fileInputRef.current?.click()} style={{ border: selectedFile ? '2px solid #10b981' : '2px dashed var(--border)', borderRadius: 12, padding: '1.5rem', textAlign: 'center', cursor: 'pointer', background: selectedFile ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.02)' }}>
              {selectedFile ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: '#10b981' }}>
                  <FileText size={24} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{selectedFile.name}</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <FileUp size={24} style={{ color: 'var(--text-secondary)', marginBottom: 8 }} />
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Click to pick file</div>
                </div>
              )}
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ height: 50, justifyContent: 'center', fontSize: 15, fontWeight: 700 }}>
            {loading ? <Loader className="spinner" size={20} /> : 'SAVE REPORT TO RECORDS'}
          </button>
        </form>
      </div>
    </div>
  );
}
