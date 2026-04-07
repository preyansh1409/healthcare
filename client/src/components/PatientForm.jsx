import { useState } from 'react';
import { X, User, Phone, Mail, MapPin, Droplets, AlertCircle } from 'lucide-react';
import { createPatient, updatePatient } from '../services/api';
import toast from 'react-hot-toast';

const genders = ['Male', 'Female', 'Other'];
const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function PatientForm({ patient = null, onClose, onSuccess }) {
  const isEdit = !!patient;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: patient?.name || '',
    age: patient?.age || '',
    gender: patient?.gender || 'Male',
    phone: patient?.phone || '',
    email: patient?.email || '',
    address: patient?.address || '',
    blood_group: patient?.blood_group || '',
    allergies: patient?.allergies || '',
    emergency_contact: patient?.emergency_contact || '',
  });

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.age || !form.gender || !form.phone) {
      toast.error('Please fill in all required fields');
      return;
    }
    setLoading(true);
    try {
      if (isEdit) {
        await updatePatient(patient.id, form);
        toast.success('Patient updated successfully');
      } else {
        await createPatient(form);
        toast.success('Patient registered successfully');
      }
      onSuccess?.();
      onClose?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, name, type = 'text', placeholder, icon: Icon, required, children }) => (
    <div>
      <label className="form-label">{label}{required && <span style={{ color: '#ef4444' }}> *</span>}</label>
      {children || (
        <div style={{ position: 'relative' }}>
          {Icon && <Icon size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />}
          <input
            type={type}
            name={name}
            className="form-input"
            style={{ paddingLeft: Icon ? '2.25rem' : '1rem' }}
            placeholder={placeholder}
            value={form[name]}
            onChange={handleChange}
            required={required}
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="glass-card" style={{ width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontWeight: 800, fontSize: 20 }}>{isEdit ? 'Edit Patient' : 'Register New Patient'}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>Fill in patient details below</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '0.25rem' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Field label="Full Name" name="name" placeholder="Enter full name" icon={User} required />
            <Field label="Age" name="age" type="number" placeholder="Age in years" required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Field label="Gender" name="gender" required>
              <select name="gender" className="form-input" value={form.gender} onChange={handleChange}>
                {genders.map(g => <option key={g}>{g}</option>)}
              </select>
            </Field>
            <Field label="Blood Group" name="blood_group">
              <select name="blood_group" className="form-input" value={form.blood_group} onChange={handleChange}>
                <option value="">Select blood group</option>
                {bloodGroups.map(bg => <option key={bg}>{bg}</option>)}
              </select>
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Field label="Phone Number" name="phone" type="tel" placeholder="+91 XXXXXXXXXX" icon={Phone} required />
            <Field label="Email Address" name="email" type="email" placeholder="patient@email.com" icon={Mail} />
          </div>

          <Field label="Home Address" name="address" placeholder="Full address..." icon={MapPin} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Field label="Known Allergies" name="allergies" placeholder="e.g., Penicillin, Peanuts" icon={AlertCircle} />
            <Field label="Emergency Contact" name="emergency_contact" placeholder="Name & Phone" icon={Phone} />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '⟳ Saving...' : isEdit ? 'Update Patient' : 'Register Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
