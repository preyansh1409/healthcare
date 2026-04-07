import { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Droplets, Camera, Lock, ShieldCheck, Heart, Search, Loader, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { updatePatient } from '../../services/api';
import toast from 'react-hot-toast';

export default function PatientProfile() {
  const { user, loadUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    birth_date: '',
    address: '',
    blood_group: '',
    emergency_contact: '',
    age: '',
    allergies: '',
    gender: ''
  });

  // Populate form when user data is available
  useEffect(() => {
    if (user) {
      let bDate = '';
      try {
        if (user.birth_date) {
          const d = new Date(user.birth_date);
          if (!isNaN(d.getTime())) {
            // CRITICAL: We use manual string trimming to avoid timezone shift on plain DATE columns
            bDate = user.birth_date.includes('T') ? user.birth_date.split('T')[0] : user.birth_date;
            // Double check if it looks like a date
            if (!/^\d{4}-\d{2}-\d{2}$/.test(bDate)) {
              bDate = new Date(user.birth_date).toISOString().split('T')[0];
            }
          }
        }
      } catch (e) {
        console.error("Invalid date:", user.birth_date);
      }

      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        birth_date: bDate,
        address: user.address || '',
        blood_group: user.blood_group || '',
        emergency_contact: user.emergency_contact || '',
        age: user.age || '',
        allergies: user.allergies || '',
        gender: user.gender || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!user?.patient_id) return toast.error('No patient profile linked');
    setLoading(true);
    try {
      // Send all fields to avoid clearing ones that aren't shown in the current screen
      await updatePatient(user.patient_id, {
        ...formData,
      });
      toast.success('Profile updated successfully');
      if (loadUser) await loadUser();
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontWeight: 900, fontSize: 32 }}>Personal <span className="gradient-text">Profile</span></h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginTop: 4 }}>Manage your personal details and security preferences.</p>
        </div>
        <button
          className="btn btn-primary"
          style={{ padding: '0.75rem 2rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: 10 }}
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? <Loader size={18} className="spinner" /> : 'SAVE CHANGES'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        {/* Profile Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto 1.5rem' }}>
              <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, fontWeight: 900, color: 'white', border: '5px solid white', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
                {formData.name.charAt(0) || 'P'}
              </div>
              <button style={{ position: 'absolute', bottom: 0, right: 0, padding: 8, borderRadius: '50%', background: 'white', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--primary)', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                <Camera size={16} />
              </button>
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 900 }}>{formData.name}</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '2rem' }}>
              {user?.role?.toUpperCase() || 'USER'} ACCOUNT
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.02)', borderRadius: 12 }}>
                <label style={{ fontSize: 10, fontWeight: 900, color: '#ef4444', textTransform: 'uppercase', display: 'block', marginBottom: 4, textAlign: 'left' }}>Blood Group</label>
                <select
                  name="blood_group"
                  value={formData.blood_group}
                  onChange={handleChange}
                  style={{ width: '100%', background: 'transparent', border: 'none', textAlign: 'center', fontWeight: 800, color: 'var(--text-primary)', outline: 'none', cursor: 'pointer' }}
                >
                  <option value="">Not Specified</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
              <ProfileStat label="Member Since" value="Aug 2024" icon={User} color="#6366f1" />
              <ProfileStat label="Security Status" value="Verified" icon={ShieldCheck} color="#10b981" />
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.5rem', background: 'rgba(239, 68, 68, 0.03)', border: '1px dashed rgba(239, 68, 68, 0.3)' }}>
            <h4 style={{ fontSize: 15, fontWeight: 800, color: '#ef4444', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Heart size={18} /> Emergency Contact
            </h4>
            <input
              name="emergency_contact"
              value={formData.emergency_contact}
              onChange={handleChange}
              placeholder="Name or Phone number"
              style={{ width: '100%', background: 'transparent', border: 'none', fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', outline: 'none' }}
            />
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, marginTop: 4 }}>Who to call in an emergency</div>
          </div>
        </div>

        {/* Edit Form Fields */}
        <div className="glass-card" style={{ padding: '2.5rem' }}>
          <h3 style={{ fontSize: 20, fontWeight: 900, marginBottom: '2rem' }}>Detailed Account Information</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <Field label="Full Legal Name" name="name" value={formData.name} onChange={handleChange} icon={User} />
            <Field label="Email Address" name="email" value={formData.email} icon={Mail} readOnly />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <Field label="Primary Phone" name="phone" value={formData.phone} onChange={handleChange} icon={Phone} />
            <Field label="Date of Birth" name="birth_date" value={formData.birth_date} onChange={handleChange} icon={Calendar} type="date" />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <Field label="Residential Address" name="address" value={formData.address} onChange={handleChange} icon={MapPin} />
          </div>

          <div style={{ borderTop: '2px solid var(--bg-dark)', paddingTop: '2rem' }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Lock size={18} color="var(--primary)" /> Security & Confidentiality
            </h3>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', background: 'rgba(0,0,0,0.02)', borderRadius: 16, border: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800 }}>Two-Factor Authentication</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Secure your account using biometric or email OTP.</div>
              </div>
              <button className="btn btn-secondary" style={{ padding: '0.6rem 1.25rem' }}>ENABLE</button>
            </div>

            <p style={{ marginTop: '2rem', fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center' }}>
              Your account is protected by industry-standard encryption.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileStat({ label, value, icon: Icon, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(0,0,0,0.02)', borderRadius: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ padding: '0.4rem', borderRadius: 8, background: `${color}15`, color: color }}>
          <Icon size={16} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>{label}</span>
      </div>
      <span style={{ fontSize: 13, fontWeight: 800 }}>{value}</span>
    </div>
  );
}

function Field({ label, value, icon: Icon, readOnly, onChange, name, type = "text" }) {
  return (
    <div>
      <label className="form-label" style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 6 }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <Icon size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
        <input
          className="form-input"
          style={{ paddingLeft: '2.75rem', fontWeight: 800, background: readOnly ? 'rgba(255,255,255,0.05)' : 'white' }}
          value={value}
          name={name}
          type={type}
          onChange={onChange}
          readOnly={readOnly}
        />
      </div>
    </div>
  );
}
