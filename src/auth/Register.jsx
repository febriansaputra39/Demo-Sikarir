import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { NotificationContext } from '../contexts/NotificationContext';
import { validateRegisterForm } from '../utils/validation';
import { Sparkles, User, Building2, Mail, Lock, Phone, ArrowRight } from 'lucide-react';

export function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const notify = useContext(NotificationContext);

  const [role, setRole] = useState('PencariKerja'); // 'PencariKerja' | 'Perusahaan'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    headline: '',
    industry: 'Teknologi Informasi',
    location: 'DKI Jakarta'
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...formData, role };
    const validation = validateRegisterForm(payload);

    if (!validation.isValid) {
      setErrors(validation.errors);
      notify?.error('Mohon perbaiki data formulir yang belum sesuai.');
      return;
    }

    setLoading(true);
    try {
      const user = await register(payload);
      notify?.success(`Pendaftaran akun ${user.name} berhasil!`);
      if (user.role === 'Perusahaan') navigate('/perusahaan');
      else navigate('/pencari-kerja');
    } catch (err) {
      notify?.error(err.message || 'Pendaftaran gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#f8fafc', padding: '40px 20px', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ maxWidth: '580px', width: '100%', padding: '36px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px'
            }}
          >
            <Sparkles size={24} />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>
            Buat Akun Baru di SiKarir
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
            Pilih jenis akun yang sesuai dengan kebutuhan Anda.
          </p>
        </div>

        {/* Role Toggle Tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}>
          <button
            type="button"
            onClick={() => setRole('PencariKerja')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px',
              borderRadius: '8px',
              border: role === 'PencariKerja' ? '2px solid #4f46e5' : '1px solid #e2e8f0',
              background: role === 'PencariKerja' ? '#eef2ff' : '#ffffff',
              color: role === 'PencariKerja' ? '#4f46e5' : '#64748b',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            <User size={18} />
            <span>Pencari Kerja</span>
          </button>

          <button
            type="button"
            onClick={() => setRole('Perusahaan')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px',
              borderRadius: '8px',
              border: role === 'Perusahaan' ? '2px solid #10b981' : '1px solid #e2e8f0',
              background: role === 'Perusahaan' ? '#ecfdf5' : '#ffffff',
              color: role === 'Perusahaan' ? '#059669' : '#64748b',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            <Building2 size={18} />
            <span>Perusahaan / HRD</span>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              {role === 'Perusahaan' ? 'Nama Perusahaan / Instansi' : 'Nama Lengkap'}
              <span className="required"> *</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                name="name"
                className={`form-input ${errors.name ? 'is-invalid' : ''}`}
                placeholder={role === 'Perusahaan' ? 'PT Teknologi Inovasi Mandiri' : 'Nama Lengkap & Gelar'}
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            {errors.name && <span className="form-error-text">{errors.name}</span>}
          </div>

          <div className="grid grid-cols-2">
            <div className="form-group">
              <label className="form-label">Alamat Email <span className="required">*</span></label>
              <input
                type="email"
                name="email"
                className={`form-input ${errors.email ? 'is-invalid' : ''}`}
                placeholder="nama@domain.com"
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && <span className="form-error-text">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Nomor WhatsApp / HP</label>
              <input
                type="text"
                name="phone"
                className="form-input"
                placeholder="08123456789"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
          </div>

          {role === 'PencariKerja' ? (
            <div className="form-group">
              <label className="form-label">Minat Karir / Headline Singkat</label>
              <input
                type="text"
                name="headline"
                className="form-input"
                placeholder="Contoh: Software Engineer | Data Analyst"
                value={formData.headline}
                onChange={handleChange}
              />
            </div>
          ) : (
            <div className="grid grid-cols-2">
              <div className="form-group">
                <label className="form-label">Sektor Industri</label>
                <select name="industry" className="form-select" value={formData.industry} onChange={handleChange}>
                  <option value="Teknologi Informasi">Teknologi Informasi</option>
                  <option value="Perbankan & Keuangan">Perbankan & Keuangan</option>
                  <option value="Manufaktur">Manufaktur</option>
                  <option value="Kesehatan">Kesehatan</option>
                  <option value="Pendidikan">Pendidikan</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Kota Penempatan</label>
                <input
                  type="text"
                  name="location"
                  className="form-input"
                  placeholder="Jakarta / Bandung / Surabaya"
                  value={formData.location}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2">
            <div className="form-group">
              <label className="form-label">Kata Sandi <span className="required">*</span></label>
              <input
                type="password"
                name="password"
                className={`form-input ${errors.password ? 'is-invalid' : ''}`}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
              />
              {errors.password && <span className="form-error-text">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Ulangi Kata Sandi <span className="required">*</span></label>
              <input
                type="password"
                name="confirmPassword"
                className={`form-input ${errors.confirmPassword ? 'is-invalid' : ''}`}
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              {errors.confirmPassword && <span className="form-error-text">{errors.confirmPassword}</span>}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-lg w-full mt-4"
          >
            <span>{loading ? 'Mendaftarkan Akun...' : 'Daftar Sekarang'}</span>
            <ArrowRight size={18} />
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.88rem', color: '#64748b' }}>
          Sudah memiliki akun?{' '}
          <Link to="/login" style={{ fontWeight: 700, color: '#4f46e5' }}>
            Masuk Disini
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
