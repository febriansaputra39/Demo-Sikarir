import { useState, useEffect, useContext, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { PencariKerjaService } from '../../services/PencariKerjaService';
import { NotificationContext } from '../../contexts/NotificationContext';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import { GraduationCap, Plus, Edit2, Trash2 } from 'lucide-react';

const INITIAL_FORM = {
  institution: '',
  degree: 'S1',
  major: '',
  gpa: '',
  startYear: '2020',
  endYear: '2024',
  description: ''
};

export function Pendidikan() {
  const { user } = useAuth();
  const notify = useContext(NotificationContext);

  const [educations, setEducations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);

  const loadEducations = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await PencariKerjaService.getEducations(user.id);
      setEducations(Array.isArray(data) ? data : []);
    } catch {
      notify?.error('Gagal mengambil data pendidikan.');
      setEducations([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, notify]);

  useEffect(() => {
    if (user?.id) {
      loadEducations();
    } else {
      setLoading(false);
    }
  }, [user?.id, loadEducations]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm(INITIAL_FORM);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingId(item.id);
    setForm({
      institution: item.institution || '',
      degree: item.degree || 'S1',
      major: item.major || '',
      gpa: item.gpa || '',
      startYear: item.startYear || '',
      endYear: item.endYear || '',
      description: item.description || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Hapus riwayat pendidikan ini?')) {
      try {
        await PencariKerjaService.deleteEducation(id);
        notify?.success('Riwayat pendidikan berhasil dihapus.');
        loadEducations();
      } catch {
        notify?.error('Gagal menghapus riwayat.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.institution.trim() || !form.major.trim()) {
      notify?.error('Nama institusi dan jurusan wajib diisi.');
      return;
    }

    if (form.startYear && form.endYear && Number(form.endYear) < Number(form.startYear)) {
      notify?.error('Tahun lulus tidak boleh lebih awal dari tahun masuk.');
      return;
    }

    const payload = {
      ...form,
      institution: form.institution.trim(),
      major: form.major.trim(),
      gpa: form.gpa.trim(),
      description: form.description.trim()
    };

    setSubmitting(true);
    try {
      if (editingId) {
        await PencariKerjaService.updateEducation(editingId, payload);
        notify?.success('Data pendidikan berhasil diperbarui.');
      } else {
        await PencariKerjaService.addEducation(user.id, payload);
        notify?.success('Riwayat pendidikan baru berhasil ditambahkan!');
      }
      setIsModalOpen(false);
      loadEducations();
    } catch {
      notify?.error('Gagal menyimpan riwayat pendidikan.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a' }}>
            Riwayat Pendidikan Formal
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
            Cantumkan jenjang pendidikan formal Anda untuk meningkatkan kredibilitas di mata rekruter.
          </p>
        </div>
        <button onClick={handleOpenAdd} className="btn btn-primary btn-sm">
          <Plus size={16} /> Tambah Pendidikan
        </button>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          Memuat riwayat pendidikan...
        </div>
      ) : educations.length === 0 ? (
        <EmptyState
          title="Belum Ada Riwayat Pendidikan"
          description="Tambahkan latar belakang pendidikan Anda untuk memenuhi syarat seleksi lowongan."
          actionText="Tambah Sekarang"
          onAction={handleOpenAdd}
          icon={GraduationCap}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {educations.map((edu) => (
            <div key={edu.id} className="card card-hoverable">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '10px',
                      background: '#eef2ff',
                      color: '#4f46e5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <GraduationCap size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                      {edu.institution}
                    </h3>
                    <div style={{ color: '#4f46e5', fontWeight: 600, fontSize: '0.9rem' }}>
                      {edu.degree} — {edu.major}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px', flexWrap: 'wrap' }}>
                      <span>
                        Tahun {edu.startYear} - {edu.endYear || 'Sekarang'}
                      </span>
                      {edu.gpa && (
                        <span>
                          • IPK: <strong>{edu.gpa}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleOpenEdit(edu)} className="btn btn-secondary btn-sm" title="Edit">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(edu.id)} className="btn btn-secondary btn-sm" style={{ color: '#ef4444' }} title="Hapus">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {edu.description && (
                <p style={{ fontSize: '0.86rem', color: '#475569', marginTop: '14px', lineHeight: 1.5, background: '#f8fafc', padding: '10px 14px', borderRadius: '8px' }}>
                  {edu.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !submitting && setIsModalOpen(false)}
        title={editingId ? 'Ubah Riwayat Pendidikan' : 'Tambah Riwayat Pendidikan'}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nama Universitas / Institusi / Sekolah</label>
            <input
              type="text"
              className="form-input"
              placeholder="Contoh: Universitas Indonesia"
              value={form.institution}
              onChange={(e) => setForm({ ...form, institution: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2">
            <div className="form-group">
              <label className="form-label">Jenjang Pendidikan</label>
              <select
                className="form-select"
                value={form.degree}
                onChange={(e) => setForm({ ...form, degree: e.target.value })}
              >
                <option value="SMA / SMK">SMA / SMK</option>
                <option value="D3">Diploma 3 (D3)</option>
                <option value="D4">Diploma 4 (D4)</option>
                <option value="S1">Sarjana (S1)</option>
                <option value="S2">Magister (S2)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Jurusan / Program Studi</label>
              <input
                type="text"
                className="form-input"
                placeholder="Contoh: Ilmu Komputer / Teknik Elektro"
                value={form.major}
                onChange={(e) => setForm({ ...form, major: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3">
            <div className="form-group">
              <label className="form-label">IPK / Nilai Akhir</label>
              <input
                type="text"
                className="form-input"
                placeholder="Contoh: 3.82"
                value={form.gpa}
                onChange={(e) => setForm({ ...form, gpa: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Tahun Masuk</label>
              <input
                type="number"
                className="form-input"
                min="1970"
                max="2035"
                value={form.startYear}
                onChange={(e) => setForm({ ...form, startYear: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Tahun Lulus</label>
              <input
                type="number"
                className="form-input"
                min="1970"
                max="2035"
                placeholder="Kosongkan jika masih aktif"
                value={form.endYear}
                onChange={(e) => setForm({ ...form, endYear: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Prestasi / Deskripsi Skripsi (Opsional)</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Lulus dengan predikat Cum Laude, fokus riset sistem kecerdasan buatan..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
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
              {submitting ? 'Menyimpan...' : 'Simpan Pendidikan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Pendidikan;