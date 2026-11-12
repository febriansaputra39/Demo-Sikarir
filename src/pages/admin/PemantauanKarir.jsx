import { useState, useEffect, useContext, useCallback } from 'react';
import { api } from '../../services/api';
import { PencariKerjaService } from '../../services/PencariKerjaService';
import { NotificationContext } from '../../contexts/NotificationContext';
import { formatIndonesianDate } from '../../utils/formatDate';
import Badge from '../../components/common/Badge';
import StatCard from '../../components/common/StatCard';
import Modal from '../../components/common/Modal';
import {
  Activity,
  Clock,
  CheckCircle,
  TrendingUp,
  Edit3,
  UserCheck,
  Search
} from 'lucide-react';

export function PemantauanKarir() {
  const notify = useContext(NotificationContext);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');

  // Status Change Modal
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [newStatus, setNewStatus] = useState('Bekerja');
  const [statusNote, setStatusNote] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchCandidates = useCallback(() => {
    setLoading(true);
    try {
      const rawUsers = api.getCollection('users');
      const users = Array.isArray(rawUsers) ? rawUsers : [];
      const pkList = users.filter((u) => u.role === 'PencariKerja');
      setCandidates(pkList);
    } catch {
      notify?.error('Gagal memuat data pemantauan karir.');
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const handleOpenStatusModal = (cand) => {
    setSelectedCandidate(cand);
    setNewStatus(cand.statusKarir || 'Menganggur');
    setStatusNote(cand.statusNote || '');
    setIsModalOpen(true);
  };

  const handleSaveStatus = async () => {
    if (!selectedCandidate || saving) return;
    setSaving(true);
    const trimmedNote = statusNote.trim();

    try {
      await PencariKerjaService.updateCareerStatus(
        selectedCandidate.id,
        newStatus,
        trimmedNote
      );

      // Pastikan statusNote & statusUpdatedAt ikut tersimpan di koleksi users
      if (typeof api.updateItem === 'function') {
        api.updateItem('users', selectedCandidate.id, {
          statusKarir: newStatus,
          statusNote: trimmedNote,
          statusUpdatedAt: new Date().toISOString()
        });
      }

      notify?.success(
        `Status karir ${selectedCandidate.name} berhasil diperbarui menjadi ${newStatus}.`
      );
      setIsModalOpen(false);
      fetchCandidates();
    } catch {
      notify?.error('Gagal memperbarui status karir.');
    } finally {
      setSaving(false);
    }
  };

  const bekerjaCount = candidates.filter((c) => c.statusKarir === 'Bekerja').length;
  const magangCount = candidates.filter((c) => c.statusKarir === 'Magang').length;
  const pelatihanCount = candidates.filter((c) => c.statusKarir === 'Pelatihan').length;
  const menganggurCount = candidates.filter(
    (c) => !c.statusKarir || c.statusKarir === 'Menganggur'
  ).length;

  const filteredCandidates = candidates.filter((cand) => {
    const currentStatus = cand.statusKarir || 'Menganggur';
    const matchesStatus = statusFilter === 'Semua' || currentStatus === statusFilter;
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !q ||
      (cand.name && cand.name.toLowerCase().includes(q)) ||
      (cand.email && cand.email.toLowerCase().includes(q)) ||
      (cand.headline && cand.headline.toLowerCase().includes(q));

    return matchesStatus && matchesSearch;
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a' }}>
            Pemantauan Progres Karir & Penyerapan Kerja
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
            Pantau transisi alumni dan pencari kerja menuju kemandirian ekonomi secara berkelanjutan.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 mb-6">
        <StatCard
          title="Terserap Bekerja"
          value={bekerjaCount}
          icon={CheckCircle}
          trend={`${candidates.length ? Math.round((bekerjaCount / candidates.length) * 100) : 0}% total serapan`}
          trendType="positive"
          iconBg="#ecfdf5"
          iconColor="#10b981"
        />
        <StatCard
          title="Program Magang"
          value={magangCount}
          icon={Activity}
          subtext="Persiapan transisi kerja"
          iconBg="#f0f9ff"
          iconColor="#0ea5e9"
        />
        <StatCard
          title="Pelatihan / Upskilling"
          value={pelatihanCount}
          icon={TrendingUp}
          subtext="Penguatan kompetensi"
          iconBg="#f5f3ff"
          iconColor="#8b5cf6"
        />
        <StatCard
          title="Belum Bekerja"
          value={menganggurCount}
          icon={Clock}
          subtext="Rata-rata tunggu 2.4 bulan"
          iconBg="#fffbeb"
          iconColor="#f59e0b"
        />
      </div>

      {/* Trajectory Table */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <h3 className="card-title">
            <UserCheck size={20} color="#4f46e5" />
            <span>Matriks Pemantauan Individu Pencari Kerja</span>
          </h3>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Menampilkan {filteredCandidates.length} dari {candidates.length} Talenta
          </span>
        </div>

        {/* Filter Bar */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
            <Search
              size={16}
              color="#94a3b8"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '36px' }}
              placeholder="Cari nama talenta atau bidang kompetensi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ width: '210px' }}>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="Semua">Semua Status Penyerapan</option>
              <option value="Bekerja">Sudah Bekerja</option>
              <option value="Magang">Program Magang</option>
              <option value="Pelatihan">Pelatihan / Upskilling</option>
              <option value="Menganggur">Belum Bekerja</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            Memuat matriks pemantauan karir...
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table-custom">
              <thead>
                <tr>
                  <th>Nama Talenta</th>
                  <th>Bidang Kompetensi</th>
                  <th>Domisili</th>
                  <th>Status Penyerapan</th>
                  <th>Pembaruan & Catatan</th>
                  <th style={{ textAlign: 'center' }}>Aksi Pemantau</th>
                </tr>
              </thead>
              <tbody>
                {filteredCandidates.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '28px', color: '#94a3b8' }}>
                      Tidak ada data talenta yang sesuai dengan filter pemantauan.
                    </td>
                  </tr>
                ) : (
                  filteredCandidates.map((cand) => {
                    const status = cand.statusKarir || 'Menganggur';
                    return (
                      <tr key={cand.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img
                              src={cand.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                              alt={cand.name}
                              style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }}
                            />
                            <div>
                              <div style={{ fontWeight: 700, color: '#1e293b' }}>{cand.name}</div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{cand.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{cand.headline || 'Talenta Karir'}</div>
                        </td>
                        <td style={{ fontSize: '0.84rem', color: '#475569' }}>
                          {cand.location || 'Indonesia'}
                        </td>
                        <td>
                          <Badge
                            variant={
                              status === 'Bekerja'
                                ? 'success'
                                : status === 'Magang'
                                  ? 'info'
                                  : status === 'Pelatihan'
                                    ? 'purple'
                                    : 'warning'
                            }
                            dot
                          >
                            {status}
                          </Badge>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: '#64748b', maxWidth: '240px' }}>
                          <div>
                            {cand.statusUpdatedAt
                              ? formatIndonesianDate(cand.statusUpdatedAt)
                              : 'Tersinkronisasi'}
                          </div>
                          {cand.statusNote && (
                            <div
                              style={{
                                fontSize: '0.75rem',
                                color: '#475569',
                                marginTop: '2px',
                                fontStyle: 'italic'
                              }}
                            >
                              "{cand.statusNote}"
                            </div>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            onClick={() => handleOpenStatusModal(cand)}
                            className="btn btn-secondary btn-sm"
                            title="Perbarui Status Penyerapan"
                          >
                            <Edit3 size={14} /> Update Status
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Update Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !saving && setIsModalOpen(false)}
        title="Pembaruan Status Penyerapan Karir"
      >
        {selectedCandidate && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <strong>Kandidat:</strong> {selectedCandidate.name} ({selectedCandidate.email})
            </div>

            <div className="form-group">
              <label className="form-label">Pilih Status Penyerapan Kerja Baru:</label>
              <select
                className="form-select"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              >
                <option value="Bekerja">Sudah Bekerja (Terserap Industri)</option>
                <option value="Magang">Program Magang / Internship</option>
                <option value="Pelatihan">Sedang Mengikuti Pelatihan / Sertifikasi</option>
                <option value="Menganggur">Belum Bekerja / Sedang Mencari</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Catatan Pemantauan (Opsional):</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Contoh: Diterima bekerja sebagai Web Developer di PT Telkom Digital Solusi mulai 1 Maret..."
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="btn btn-secondary"
                disabled={saving}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveStatus}
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? 'Menyimpan...' : 'Simpan Status'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default PemantauanKarir;