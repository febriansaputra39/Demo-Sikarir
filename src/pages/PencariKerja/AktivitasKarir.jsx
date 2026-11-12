import { useState, useEffect, useContext, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { PencariKerjaService } from '../../services/PencariKerjaService';
import { NotificationContext } from '../../contexts/NotificationContext';
import { formatIndonesianDate } from '../../utils/formatDate';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import { Activity, Plus, Trash2, Calendar, Award, BookOpen, Users } from 'lucide-react';

const INITIAL_FORM = {
  title: '',
  category: 'Sertifikasi',
  provider: '',
  date: new Date().toISOString().split('T')[0],
  description: ''
};

export function AktivitasKarir() {
  const { user } = useAuth();
  const notify = useContext(NotificationContext);

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);

  const loadActivities = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await PencariKerjaService.getActivities(user.id);
      setActivities(Array.isArray(data) ? data : []);
    } catch {
      notify?.error('Gagal mengambil data aktivitas karir.');
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, notify]);

  useEffect(() => {
    if (user?.id) {
      loadActivities();
    } else {
      setLoading(false);
    }
  }, [user?.id, loadActivities]);

  const handleDelete = async (id) => {
    if (window.confirm('Hapus catatan aktivitas ini?')) {
      try {
        await PencariKerjaService.deleteActivity(id);
        notify?.success('Aktivitas karir berhasil dihapus.');
        loadActivities();
      } catch {
        notify?.error('Gagal menghapus aktivitas.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.provider.trim()) {
      notify?.error('Judul dan penyelenggara wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      await PencariKerjaService.addActivity(user.id, {
        ...form,
        title: form.title.trim(),
        provider: form.provider.trim(),
        description: form.description.trim()
      });
      notify?.success('Aktivitas karir baru berhasil ditambahkan!');
      setIsModalOpen(false);
      setForm({
        ...INITIAL_FORM,
        date: new Date().toISOString().split('T')[0]
      });
      loadActivities();
    } catch {
      notify?.error('Gagal menyimpan aktivitas.');
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryBadge = (cat) => {
    switch (cat) {
      case 'Sertifikasi':
        return <Badge variant="success">Sertifikasi</Badge>;
      case 'Pelatihan':
        return <Badge variant="purple">Pelatihan / Bootcamp</Badge>;
      case 'Job Fair':
        return <Badge variant="info">Bursa Kerja (Job Fair)</Badge>;
      case 'Webinar':
        return <Badge variant="warning">Webinar / Seminar</Badge>;
      default:
        return <Badge variant="primary">Kegiatan Karir</Badge>;
    }
  };

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'Sertifikasi':
        return <Award size={22} />;
      case 'Pelatihan':
        return <BookOpen size={22} />;
      case 'Job Fair':
      case 'Webinar':
        return <Users size={22} />;
      default:
        return <Activity size={22} />;
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a' }}>
            Aktivitas & Milestone Pengembangan Karir
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
            Catat keikutsertaan dalam sertifikasi profesi, pelatihan intensif, bootcamp, dan bursa kerja.
          </p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary btn-sm">
          <Plus size={16} /> Tambah Aktivitas
        </button>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          Memuat data aktivitas karir...
        </div>
      ) : activities.length === 0 ? (
        <EmptyState
          title="Belum Ada Catatan Aktivitas"
          description="Dokumentasikan sertifikasi dan pelatihan yang pernah Anda ikuti untuk memperkuat CV Anda."
          actionText="Tambah Aktivitas Sekarang"
          onAction={() => setIsModalOpen(true)}
          icon={Activity}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {activities.map((act) => (
            <div key={act.id} className="card card-hoverable">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '10px',
                      background: '#f5f3ff',
                      color: '#7c3aed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    {getCategoryIcon(act.category)}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>{act.title}</h3>
                    <div style={{ color: '#4f46e5', fontSize: '0.86rem', fontWeight: 600 }}>{act.provider}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px', flexWrap: 'wrap' }}>
                      {getCategoryBadge(act.category)}
                      <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={13} />
                        {act.date ? formatIndonesianDate(act.date) : '-'}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(act.id)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '6px' }}
                  title="Hapus"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {act.description && (
                <div style={{ marginTop: '12px', background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', fontSize: '0.84rem', color: '#475569' }}>
                  {act.description}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !submitting && setIsModalOpen(false)}
        title="Tambah Aktivitas / Sertifikasi Karir"
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nama Kegiatan / Sertifikasi</label>
            <input
              type="text"
              className="form-input"
              placeholder="Contoh: Sertifikasi Pengembang Web BNSP"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2">
            <div className="form-group">
              <label className="form-label">Kategori</label>
              <select
                className="form-select"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="Sertifikasi">Sertifikasi Profesi</option>
                <option value="Pelatihan">Pelatihan / Bootcamp</option>
                <option value="Job Fair">Bursa Kerja / Job Fair</option>
                <option value="Webinar">Webinar / Seminar</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Lembaga Penyelenggara</label>
              <input
                type="text"
                className="form-input"
                placeholder="Contoh: BNSP / Dicoding / Kemnaker"
                value={form.provider}
                onChange={(e) => setForm({ ...form, provider: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Tanggal Pelaksanaan / Terbit</label>
            <input
              type="date"
              className="form-input"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Deskripsi / Hasil Kompetensi</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Keahlian spesifik yang dipelajari atau nomor sertifikasi..."
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
              {submitting ? 'Menyimpan...' : 'Simpan Aktivitas'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default AktivitasKarir;