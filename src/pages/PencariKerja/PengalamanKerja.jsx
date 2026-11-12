import { useState, useEffect, useContext, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { PencariKerjaService } from '../../services/PencariKerjaService';
import { NotificationContext } from '../../contexts/NotificationContext';
import { formatPeriod } from '../../utils/formatDate';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import { Briefcase, Plus, Edit2, Trash2, MapPin, Building2 } from 'lucide-react';

const INITIAL_FORM = {
  company: '',
  position: '',
  jobType: 'Full Time',
  location: '',
  startDate: '',
  endDate: '',
  isCurrent: false,
  responsibilities: ''
};

export function PengalamanKerja() {
  const { user } = useAuth();
  const notify = useContext(NotificationContext);

  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);

  const loadExperiences = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await PencariKerjaService.getExperiences(user.id);
      setExperiences(Array.isArray(data) ? data : []);
    } catch {
      notify?.error('Gagal mengambil data pengalaman.');
      setExperiences([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, notify]);

  useEffect(() => {
    if (user?.id) {
      loadExperiences();
    } else {
      setLoading(false);
    }
  }, [user?.id, loadExperiences]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm(INITIAL_FORM);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingId(item.id);
    setForm({
      company: item.company || '',
      position: item.position || '',
      jobType: item.jobType || 'Full Time',
      location: item.location || '',
      startDate: item.startDate || '',
      endDate: item.isCurrent ? '' : (item.endDate || ''),
      isCurrent: Boolean(item.isCurrent),
      responsibilities: item.responsibilities || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Hapus riwayat pengalaman kerja ini?')) {
      try {
        await PencariKerjaService.deleteExperience(id);
        notify?.success('Pengalaman kerja berhasil dihapus.');
        loadExperiences();
      } catch {
        notify?.error('Gagal menghapus riwayat.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.company.trim() || !form.position.trim()) {
      notify?.error('Nama perusahaan dan posisi wajib diisi.');
      return;
    }

    if (!form.isCurrent && form.startDate && form.endDate && form.endDate < form.startDate) {
      notify?.error('Tanggal selesai tidak boleh lebih awal dari tanggal mulai.');
      return;
    }

    const payload = {
      ...form,
      company: form.company.trim(),
      position: form.position.trim(),
      location: form.location.trim(),
      endDate: form.isCurrent ? '' : form.endDate,
      responsibilities: form.responsibilities.trim()
    };

    setSubmitting(true);
    try {
      if (editingId) {
        await PencariKerjaService.updateExperience(editingId, payload);
        notify?.success('Data pengalaman berhasil diperbarui.');
      } else {
        await PencariKerjaService.addExperience(user.id, payload);
        notify?.success('Pengalaman kerja baru berhasil ditambahkan!');
      }
      setIsModalOpen(false);
      loadExperiences();
    } catch {
      notify?.error('Gagal menyimpan pengalaman.');
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
            Riwayat Pengalaman Kerja & Proyek
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
            Rekam jejak pengalaman profesional, magang, dan proyek industri yang relevan.
          </p>
        </div>
        <button onClick={handleOpenAdd} className="btn btn-primary btn-sm">
          <Plus size={16} /> Tambah Pengalaman
        </button>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          Memuat riwayat pengalaman kerja...
        </div>
      ) : experiences.length === 0 ? (
        <EmptyState
          title="Belum Ada Pengalaman Kerja"
          description="Tambahkan pengalaman kerja, magang, atau proyek Anda untuk memikat calon pemberi kerja."
          actionText="Tambah Sekarang"
          onAction={handleOpenAdd}
          icon={Briefcase}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {experiences.map((exp) => (
            <div key={exp.id} className="card card-hoverable">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '10px',
                      background: '#ecfdf5',
                      color: '#059669',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <Briefcase size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                      {exp.position}
                    </h3>
                    <div style={{ color: '#4f46e5', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Building2 size={14} /> {exp.company}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px', flexWrap: 'wrap' }}>
                      <Badge variant="primary">{exp.jobType || 'Full Time'}</Badge>
                      <span>{formatPeriod(exp.startDate, exp.endDate, exp.isCurrent)}</span>
                      {exp.location && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={13} /> {exp.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleOpenEdit(exp)} className="btn btn-secondary btn-sm" title="Edit">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(exp.id)} className="btn btn-secondary btn-sm" style={{ color: '#ef4444' }} title="Hapus">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {exp.responsibilities && (
                <div style={{ marginTop: '14px', background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', fontSize: '0.86rem', color: '#475569', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                  {exp.responsibilities}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !submitting && setIsModalOpen(false)}
        title={editingId ? 'Ubah Pengalaman Kerja' : 'Tambah Pengalaman Kerja'}
      >
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2">
            <div className="form-group">
              <label className="form-label">Posisi / Jabatan</label>
              <input
                type="text"
                className="form-input"
                placeholder="Contoh: Frontend Developer"
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Nama Perusahaan / Organisasi</label>
              <input
                type="text"
                className="form-input"
                placeholder="Contoh: PT Telkom Digital"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2">
            <div className="form-group">
              <label className="form-label">Tipe Pekerjaan</label>
              <select
                className="form-select"
                value={form.jobType}
                onChange={(e) => setForm({ ...form, jobType: e.target.value })}
              >
                <option value="Full Time">Full Time</option>
                <option value="Part Time">Part Time</option>
                <option value="Contract">Kontrak</option>
                <option value="Internship">Magang / Internship</option>
                <option value="Freelance">Freelance</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Lokasi Kantor</label>
              <input
                type="text"
                className="form-input"
                placeholder="Jakarta / Bandung"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2">
            <div className="form-group">
              <label className="form-label">Tanggal Mulai</label>
              <input
                type="date"
                className="form-input"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tanggal Selesai</label>
              <input
                type="date"
                className="form-input"
                disabled={form.isCurrent}
                value={form.endDate || ''}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.86rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.isCurrent}
                onChange={(e) =>
                  setForm({
                    ...form,
                    isCurrent: e.target.checked,
                    endDate: e.target.checked ? '' : form.endDate
                  })
                }
              />
              <span>Saya saat ini masih aktif bekerja di posisi ini</span>
            </label>
          </div>

          <div className="form-group">
            <label className="form-label">Tanggung Jawab & Kontribusi:</label>
            <textarea
              className="form-textarea"
              rows={4}
              placeholder="Jelaskan peran Anda, teknologi yang digunakan, serta dampak positif yang dihasilkan..."
              value={form.responsibilities}
              onChange={(e) => setForm({ ...form, responsibilities: e.target.value })}
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
              {submitting ? 'Menyimpan...' : 'Simpan Pengalaman'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default PengalamanKerja;