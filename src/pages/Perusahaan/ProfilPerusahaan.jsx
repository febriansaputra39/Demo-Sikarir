import { useState, useEffect, useContext } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { PerusahaanService } from '../../services/PerusahaanService';
import { NotificationContext } from '../../contexts/NotificationContext';
import Badge from '../../components/common/Badge';
import { Building2, Globe, MapPin, Mail, Phone, Save, CheckCircle, ShieldCheck } from 'lucide-react';

export function ProfilPerusahaan() {
  const { user, updateProfile } = useAuth();
  const notify = useContext(NotificationContext);

  const [form, setForm] = useState({
    name: '',
    industry: 'Teknologi Informasi & Telekomunikasi',
    location: '',
    website: '',
    phone: '',
    companySize: '100-500 karyawan',
    description: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        industry: user.industry || 'Teknologi Informasi & Telekomunikasi',
        location: user.location || '',
        website: user.website || '',
        phone: user.phone || '',
        companySize: user.companySize || '100-500 karyawan',
        description: user.description || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile(form);
      notify?.success('Profil perusahaan berhasil diperbarui!');
    } catch {
      notify?.error('Gagal memperbarui profil perusahaan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a' }}>
          Profil Perusahaan & Brand Rekruter
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
          Informasi ini ditampilkan kepada para kandidat pada detail lowongan dan halaman pencarian perusahaan.
        </p>
      </div>

      <div className="card">
        {/* Banner */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', paddingBottom: '20px', borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?auto=format&fit=crop&w=150&q=80'}
              alt="Logo Perusahaan"
              style={{ width: '72px', height: '72px', borderRadius: '12px', objectFit: 'cover', border: '1px solid #e2e8f0' }}
            />
            <div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800 }}>{form.name}</h3>
              <div style={{ color: '#4f46e5', fontWeight: 600, fontSize: '0.9rem' }}>{form.industry}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>{user?.email}</div>
            </div>
          </div>

          <Badge variant={user?.verified ? 'success' : 'warning'} dot>
            {user?.verified ? 'Mitra Terverifikasi Resmi' : 'Menunggu Verifikasi Dokumen'}
          </Badge>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2">
            <div className="form-group">
              <label className="form-label">Nama Resmi Perusahaan</label>
              <input
                type="text"
                name="name"
                className="form-input"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Sektor Industri</label>
              <select name="industry" className="form-select" value={form.industry} onChange={handleChange}>
                <option value="Teknologi Informasi & Telekomunikasi">Teknologi Informasi & Telekomunikasi</option>
                <option value="Perbankan & Fintech">Perbankan & Fintech</option>
                <option value="Manufaktur & Otomotif">Manufaktur & Otomotif</option>
                <option value="Kesehatan & Farmasi">Kesehatan & Farmasi</option>
                <option value="E-Commerce & Logistik">E-Commerce & Logistik</option>
                <option value="Konsultan & Jasa Profesional">Konsultan & Jasa Profesional</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2">
            <div className="form-group">
              <label className="form-label">Alamat Kantor / Domisili</label>
              <input
                type="text"
                name="location"
                className="form-input"
                placeholder="Jakarta Pusat, DKI Jakarta"
                value={form.location}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Situs Web Resmi (URL)</label>
              <input
                type="text"
                name="website"
                className="form-input"
                placeholder="https://perusahaan.co.id"
                value={form.website}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-2">
            <div className="form-group">
              <label className="form-label">Nomor Kontak HR / Telepon</label>
              <input
                type="text"
                name="phone"
                className="form-input"
                placeholder="021-1234567 / 0812345678"
                value={form.phone}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Skala Ukuran Perusahaan</label>
              <select name="companySize" className="form-select" value={form.companySize} onChange={handleChange}>
                <option value="1-50 karyawan">1 - 50 Karyawan (Startup / Rintisan)</option>
                <option value="51-200 karyawan">51 - 200 Karyawan (Menengah)</option>
                <option value="201-1000 karyawan">201 - 1000 Karyawan (Korporasi)</option>
                <option value="1000+ karyawan">1000+ Karyawan (Enterprise / Multinasional)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Profil Singkat & Visi Misi Perusahaan</label>
            <textarea
              name="description"
              className="form-textarea"
              rows={4}
              placeholder="Ceritakan sejarah, budaya kerja, dan benefit bergabung bersama perusahaan Anda..."
              value={form.description}
              onChange={handleChange}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button type="submit" disabled={loading} className="btn btn-primary">
              <Save size={16} />
              <span>{loading ? 'Menyimpan...' : 'Perbarui Profil Perusahaan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProfilPerusahaan;
