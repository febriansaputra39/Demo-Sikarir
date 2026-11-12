import { useState, useEffect, useContext, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { PencariKerjaService } from '../../services/PencariKerjaService';
import { NotificationContext } from '../../contexts/NotificationContext';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import { Award, Plus, Trash2 } from 'lucide-react';

const INITIAL_FORM = {
  name: '',
  category: 'Frontend',
  level: 4
};

const CATEGORIES = [
  'Semua',
  'Frontend',
  'Backend',
  'Database',
  'Mobile',
  'UI/UX',
  'Tools',
  'Soft Skills'
];

export function Keterampilan() {
  const { user } = useAuth();
  const notify = useContext(NotificationContext);

  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);

  const loadSkills = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await PencariKerjaService.getSkills(user.id);
      setSkills(Array.isArray(data) ? data : []);
    } catch {
      notify?.error('Gagal mengambil daftar keahlian.');
      setSkills([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, notify]);

  useEffect(() => {
    if (user?.id) {
      loadSkills();
    } else {
      setLoading(false);
    }
  }, [user?.id, loadSkills]);

  const handleDelete = async (skill) => {
    if (!window.confirm(`Hapus keahlian "${skill.name}" dari profil Anda?`)) return;
    try {
      await PencariKerjaService.deleteSkill(skill.id);
      notify?.success('Keahlian berhasil dihapus.');
      loadSkills();
    } catch {
      notify?.error('Gagal menghapus keahlian.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedName = form.name.trim();
    if (!trimmedName) {
      notify?.error('Nama keahlian wajib diisi.');
      return;
    }

    const isDuplicate = skills.some(
      (s) => s.name?.toLowerCase() === trimmedName.toLowerCase()
    );
    if (isDuplicate) {
      notify?.error(`Keahlian "${trimmedName}" sudah ada dalam daftar Anda.`);
      return;
    }

    setSubmitting(true);
    try {
      await PencariKerjaService.addSkill(user.id, {
        name: trimmedName,
        category: form.category,
        level: Number(form.level)
      });
      notify?.success(`Keahlian "${trimmedName}" berhasil ditambahkan!`);
      setIsModalOpen(false);
      setForm(INITIAL_FORM);
      loadSkills();
    } catch {
      notify?.error('Gagal menambahkan keahlian.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredSkills = skills.filter((s) => {
    if (selectedCategory === 'Semua') return true;
    return s.category === selectedCategory;
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a' }}>
            Kompetensi & Keahlian (Skills)
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
            Daftar kompetensi teknis dan soft skills yang digunakan oleh AI Smart Matching untuk mencocokkan lowongan.
          </p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary btn-sm">
          <Plus size={16} /> Tambah Keahlian
        </button>
      </div>

      {/* Category Pills */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          Memuat daftar keahlian...
        </div>
      ) : skills.length === 0 ? (
        <EmptyState
          title="Belum Ada Keahlian Ditambahkan"
          description="Tambahkan keahlian Anda untuk memicu rekomendasi cerdas AI."
          actionText="Tambah Sekarang"
          onAction={() => setIsModalOpen(true)}
          icon={Award}
        />
      ) : filteredSkills.length === 0 ? (
        <EmptyState
          title={`Tidak Ada Keahlian di Kategori "${selectedCategory}"`}
          description="Pilih kategori lain atau tambahkan keahlian baru untuk kategori ini."
          actionText="Tambah Keahlian"
          onAction={() => {
            setForm((prev) => ({ ...prev, category: selectedCategory }));
            setIsModalOpen(true);
          }}
          icon={Award}
        />
      ) : (
        <div className="grid grid-cols-3">
          {filteredSkills.map((skill) => (
            <div key={skill.id} className="card card-hoverable" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e293b' }}>{skill.name}</h4>
                  <Badge variant="info" style={{ marginTop: '4px' }}>{skill.category}</Badge>
                </div>
                <button
                  onClick={() => handleDelete(skill)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px' }}
                  title="Hapus"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Rating level */}
              <div style={{ marginTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#64748b', marginBottom: '6px' }}>
                  <span>Tingkat Kemahiran:</span>
                  <span style={{ fontWeight: 700, color: '#4f46e5' }}>{skill.level} / 5</span>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <div
                      key={lvl}
                      style={{
                        flex: 1,
                        height: '6px',
                        borderRadius: '4px',
                        background: lvl <= skill.level ? '#4f46e5' : '#e2e8f0'
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Tambah Keahlian */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !submitting && setIsModalOpen(false)}
        title="Tambah Kompetensi / Keahlian Baru"
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nama Keahlian / Teknologi</label>
            <input
              type="text"
              className="form-input"
              placeholder="Contoh: React, TypeScript, Python, Figma, SQL..."
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2">
            <div className="form-group">
              <label className="form-label">Kategori Bidang</label>
              <select
                className="form-select"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="Frontend">Frontend Development</option>
                <option value="Backend">Backend & API</option>
                <option value="Database">Database & SQL</option>
                <option value="Mobile">Mobile App</option>
                <option value="UI/UX">UI/UX & Desain</option>
                <option value="Tools">Tools & Version Control</option>
                <option value="Soft Skills">Soft Skills & Komunikasi</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Tingkat Kemahiran (1-5)</label>
              <select
                className="form-select"
                value={form.level}
                onChange={(e) => setForm({ ...form, level: Number(e.target.value) })}
              >
                <option value="1">1 - Pemula (Beginner)</option>
                <option value="2">2 - Dasar (Elementary)</option>
                <option value="3">3 - Menengah (Intermediate)</option>
                <option value="4">4 - Mahir (Advanced)</option>
                <option value="5">5 - Ahli (Expert)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn btn-secondary"
              disabled={submitting}
            >
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Menyimpan...' : 'Simpan Keahlian'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Keterampilan;