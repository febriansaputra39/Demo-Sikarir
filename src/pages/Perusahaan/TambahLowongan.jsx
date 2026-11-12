import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { jobService } from '../../services/jobService';
import { NotificationContext } from '../../contexts/NotificationContext';
import { validateJobForm } from '../../utils/validation';
import { parseRupiahInput, formatRupiah } from '../../utils/formatNumber';
import { PlusCircle, Plus, X, ArrowLeft, CheckCircle2 } from 'lucide-react';

export function TambahLowongan() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const notify = useContext(NotificationContext);

  const [form, setForm] = useState({
    title: '',
    category: 'IT & Software',
    jobType: 'Full Time',
    workplaceType: 'Hybrid',
    location: user?.location || 'Jakarta',
    salaryMin: 6000000,
    salaryMax: 10000000,
    experienceLevel: '1-3 tahun',
    educationLevel: 'S1 / D4',
    description: '',
    responsibilitiesText: '',
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  const [skills, setSkills] = useState(['React', 'JavaScript', 'CSS3']);
  const [skillInput, setSkillInput] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (!skillInput.trim()) return;
    if (!skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
    }
    setSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = validateJobForm(form);

    if (!validation.isValid) {
      setErrors(validation.errors);
      notify?.error('Mohon lengkapi seluruh field yang wajib diisi.');
      return;
    }

    if (skills.length === 0) {
      notify?.error('Tambahkan minimal 1 keahlian wajib.');
      return;
    }

    setLoading(true);
    try {
      const responsibilities = form.responsibilitiesText
        ? form.responsibilitiesText.split('\n').filter((line) => line.trim().length > 0)
        : [form.description];

      await jobService.createJob({
        ...form,
        companyId: user.id,
        companyName: user.name,
        companyLogo: user.avatar,
        requiredSkills: skills,
        responsibilities
      });

      notify?.success('Lowongan pekerjaan baru berhasil diterbitkan dan masuk antrean verifikasi!');
      navigate('/perusahaan/lowongan');
    } catch {
      notify?.error('Gagal menerbitkan lowongan pekerjaan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => navigate('/perusahaan/lowongan')}
          className="btn btn-secondary btn-sm mb-4"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <ArrowLeft size={16} /> Kembali ke Lowongan Saya
        </button>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a' }}>
          Pasang Lowongan Pekerjaan Baru
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
          Isi informasi posisi dan kualifikasi yang dicari agar algoritma Smart Matching dapat merekomendasikan kandidat terbaik.
        </p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          {/* Posisi & Kategori */}
          <div className="grid grid-cols-2">
            <div className="form-group">
              <label className="form-label">
                Posisi / Judul Lowongan <span className="required">*</span>
              </label>
              <input
                type="text"
                name="title"
                className={`form-input ${errors.title ? 'is-invalid' : ''}`}
                placeholder="Contoh: Senior Frontend Engineer"
                value={form.title}
                onChange={handleChange}
              />
              {errors.title && <span className="form-error-text">{errors.title}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">
                Kategori Bidang Pekerjaan <span className="required">*</span>
              </label>
              <select name="category" className="form-select" value={form.category} onChange={handleChange}>
                <option value="IT & Software">IT & Software</option>
                <option value="Data & AI">Data & AI</option>
                <option value="Desain Grafis & UI/UX">Desain Grafis & UI/UX</option>
                <option value="Pemasaran">Pemasaran & Digital Marketing</option>
                <option value="Keuangan & Perbankan">Keuangan & Akuntansi</option>
                <option value="Operasional">Operasional & Logistik</option>
              </select>
            </div>
          </div>

          {/* Tipe & Lokasi */}
          <div className="grid grid-cols-3">
            <div className="form-group">
              <label className="form-label">Tipe Pekerjaan</label>
              <select name="jobType" className="form-select" value={form.jobType} onChange={handleChange}>
                <option value="Full Time">Full Time</option>
                <option value="Part Time">Part Time</option>
                <option value="Contract">Kontrak</option>
                <option value="Internship">Magang / Internship</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Model Kerja</label>
              <select name="workplaceType" className="form-select" value={form.workplaceType} onChange={handleChange}>
                <option value="Hybrid">Hybrid (Kantor + Remote)</option>
                <option value="On-site">On-site (WFO Penuh)</option>
                <option value="Remote">Remote Penuh (WFH)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Kota Penempatan</label>
              <input
                type="text"
                name="location"
                className="form-input"
                placeholder="Jakarta Pusat, DKI Jakarta"
                value={form.location}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Gaji & Pengalaman */}
          <div className="grid grid-cols-2">
            <div className="form-group">
              <label className="form-label">Gaji Minimal (IDR / Bulan)</label>
              <input
                type="number"
                name="salaryMin"
                className="form-input"
                value={form.salaryMin}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Gaji Maksimal (IDR / Bulan)</label>
              <input
                type="number"
                name="salaryMax"
                className={`form-input ${errors.salaryMax ? 'is-invalid' : ''}`}
                value={form.salaryMax}
                onChange={handleChange}
              />
              {errors.salaryMax && <span className="form-error-text">{errors.salaryMax}</span>}
            </div>
          </div>

          <div className="grid grid-cols-2">
            <div className="form-group">
              <label className="form-label">Syarat Pengalaman Kerja</label>
              <select name="experienceLevel" className="form-select" value={form.experienceLevel} onChange={handleChange}>
                <option value="Fresh Graduate / Pemula">Fresh Graduate / Tanpa Pengalaman</option>
                <option value="1-3 tahun">1 - 3 Tahun</option>
                <option value="3-5 tahun">3 - 5 Tahun</option>
                <option value="5+ tahun">5+ Tahun (Senior)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Batas Akhir Pendaftaran</label>
              <input
                type="date"
                name="deadline"
                className="form-input"
                value={form.deadline}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Skill Tag Inputs */}
          <div className="form-group">
            <label className="form-label">Kompetensi & Keahlian Wajib (Tekan Tambah):</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Ketik keahlian (contoh: React, SQL, Node.js)"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill(e);
                  }
                }}
              />
              <button type="button" onClick={handleAddSkill} className="btn btn-secondary">
                <Plus size={16} /> Tambah
              </button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {skills.map((s, idx) => (
                <span
                  key={idx}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 12px',
                    borderRadius: '6px',
                    background: '#eef2ff',
                    color: '#4f46e5',
                    fontSize: '0.84rem',
                    fontWeight: 600
                  }}
                >
                  {s}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(s)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6366f1' }}
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Deskripsi */}
          <div className="form-group">
            <label className="form-label">
              Ringkasan & Deskripsi Lowongan <span className="required">*</span>
            </label>
            <textarea
              name="description"
              className={`form-textarea ${errors.description ? 'is-invalid' : ''}`}
              rows={4}
              placeholder="Jelaskan peran pekerjaan dan profil tim..."
              value={form.description}
              onChange={handleChange}
            />
            {errors.description && <span className="form-error-text">{errors.description}</span>}
          </div>

          {/* Tanggung jawab */}
          <div className="form-group">
            <label className="form-label">Tanggung Jawab Pekerjaan (Tiap baris satu poin):</label>
            <textarea
              name="responsibilitiesText"
              className="form-textarea"
              rows={4}
              placeholder="Mengembangkan fitur web...&#10;Melakukan optimasi performa...&#10;Bekerja sama dengan product team..."
              value={form.responsibilitiesText}
              onChange={handleChange}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '28px' }}>
            <button type="button" onClick={() => navigate('/perusahaan/lowongan')} className="btn btn-secondary">
              Batal
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              <PlusCircle size={16} />
              <span>{loading ? 'Menerbitkan...' : 'Terbitkan Lowongan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TambahLowongan;
