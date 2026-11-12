import { useState, useEffect, useContext } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { applicationService } from '../../services/applicationService';
import { jobService } from '../../services/jobService';
import { PencariKerjaService } from '../../services/PencariKerjaService';
import { NotificationContext } from '../../contexts/NotificationContext';
import { formatIndonesianDate } from '../../utils/formatDate';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import { Users, Filter, Calendar, CheckCircle, XCircle, Eye, Mail, Phone, Sparkles } from 'lucide-react';

export function LamaranMasuk() {
  const { user } = useAuth();
  const notify = useContext(NotificationContext);
  const [searchParams] = useSearchParams();

  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedJobId, setSelectedJobId] = useState(searchParams.get('jobId') || 'Semua');
  const [statusFilter, setStatusFilter] = useState('Semua');

  // Review & Interview Modal
  const [selectedApp, setSelectedApp] = useState(null);
  const [candidateProfile, setCandidateProfile] = useState(null);
  const [isDossierOpen, setIsDossierOpen] = useState(false);

  // Status Change State
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('Seleksi Berkas');
  const [interviewDate, setInterviewDate] = useState('');
  const [statusNote, setStatusNote] = useState('');

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user, selectedJobId, statusFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const companyJobs = await jobService.getAllJobs({ companyId: user.id });
      setJobs(companyJobs);

      const apps = await applicationService.getCompanyApplications(user.id, selectedJobId);
      let filtered = apps;
      if (statusFilter !== 'Semua') {
        filtered = filtered.filter((a) => a.status === statusFilter);
      }
      setApplications(filtered);
    } catch {
      notify?.error('Gagal mengambil daftar pelamar masuk.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDossier = async (app) => {
    setSelectedApp(app);
    setIsDossierOpen(true);
    try {
      const full = await PencariKerjaService.getFullProfile(app.applicantId);
      setCandidateProfile(full);
    } catch {
      notify?.error('Gagal memuat profil lengkap pelamar.');
    }
  };

  const handleOpenStatusModal = (app) => {
    setSelectedApp(app);
    setNewStatus(app.status);
    setInterviewDate(app.interviewDate ? app.interviewDate.split('T')[0] : '');
    setStatusNote('');
    setIsStatusModalOpen(true);
  };

  const handleSaveStatus = async (e) => {
    e.preventDefault();
    if (!selectedApp) return;

    try {
      await applicationService.updateStatus(
        selectedApp.id,
        newStatus,
        statusNote,
        newStatus === 'Jadwal Wawancara' ? interviewDate : null
      );
      notify?.success(`Tahapan pelamar ${selectedApp.applicantName} diperbarui ke "${newStatus}".`);
      setIsStatusModalOpen(false);
      loadData();
    } catch {
      notify?.error('Gagal memperbarui tahapan pelamar.');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Diterima':
        return <Badge variant="success" dot>Diterima</Badge>;
      case 'Jadwal Wawancara':
        return <Badge variant="primary" dot>Wawancara</Badge>;
      case 'Seleksi Berkas':
        return <Badge variant="info" dot>Seleksi Berkas</Badge>;
      case 'Ditolak':
        return <Badge variant="danger" dot>Ditolak</Badge>;
      default:
        return <Badge variant="warning" dot>Terkirim</Badge>;
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a' }}>
            Manajemen Berkas Lamaran Masuk (ATS)
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
            Kelola saluran kandidat (pipeline), jadwalkan wawancara, dan berikan feedback status lamaran.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card mb-6" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ width: '260px' }}>
            <label style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
              PILIH LOWONGAN PEKERJAAN:
            </label>
            <select
              className="form-select"
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
            >
              <option value="Semua">Semua Lowongan</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>
          </div>

          <div style={{ width: '220px' }}>
            <label style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
              TAHAPAN SELEKSI:
            </label>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="Semua">Semua Tahapan</option>
              <option value="Terkirim">Terkirim (Baru)</option>
              <option value="Seleksi Berkas">Seleksi Berkas</option>
              <option value="Jadwal Wawancara">Jadwal Wawancara</option>
              <option value="Diterima">Diterima</option>
              <option value="Ditolak">Ditolak</option>
            </select>
          </div>

          <button onClick={loadData} className="btn btn-primary btn-sm" style={{ marginTop: '18px' }}>
            <Filter size={16} /> Terapkan
          </button>
        </div>
      </div>

      {/* Table */}
      {applications.length === 0 && !loading ? (
        <EmptyState
          title="Tidak Ada Pelamar"
          description="Belum ada berkas pelamar yang memenuhi kriteria filter lowongan yang dipilih."
          icon={Users}
        />
      ) : (
        <div className="table-responsive">
          <table className="table-custom">
            <thead>
              <tr>
                <th>Nama Pelamar</th>
                <th>Lowongan Target</th>
                <th>Skor AI Match</th>
                <th>Status Tahapan</th>
                <th>Tanggal Mengajukan</th>
                <th style={{ textAlign: 'center' }}>Tindakan HR</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: '#1e293b' }}>{app.applicantName}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {app.applicantEmail} • {app.applicantPhone || '-'}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{app.jobTitle}</div>
                  </td>
                  <td>
                    <Badge variant={app.matchScore >= 80 ? 'success' : 'purple'} dot>
                      <Sparkles size={12} /> {app.matchScore}% Match
                    </Badge>
                  </td>
                  <td>{getStatusBadge(app.status)}</td>
                  <td>{formatIndonesianDate(app.appliedAt)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        onClick={() => handleOpenDossier(app)}
                        className="btn btn-secondary btn-sm"
                        title="Lihat Portofolio Lengkap"
                      >
                        <Eye size={14} /> CV
                      </button>
                      <button
                        onClick={() => handleOpenStatusModal(app)}
                        className="btn btn-primary btn-sm"
                        title="Ubah Tahap Seleksi"
                      >
                        Update Tahap
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Status Transition Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title="Pembaruan Tahapan Rekrutmen Kandidat"
      >
        {selectedApp && (
          <form onSubmit={handleSaveStatus}>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '1rem', fontWeight: 700 }}>{selectedApp.applicantName}</div>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Posisi: {selectedApp.jobTitle}</div>
            </div>

            <div className="form-group">
              <label className="form-label">Pilih Tahapan Rekrutmen Baru:</label>
              <select
                className="form-select"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              >
                <option value="Terkirim">Terkirim</option>
                <option value="Seleksi Berkas">Lolos Seleksi Berkas</option>
                <option value="Jadwal Wawancara">Undang Jadwal Wawancara</option>
                <option value="Diterima">Terima Kandidat (Offering Letter)</option>
                <option value="Ditolak">Tolak Lamaran</option>
              </select>
            </div>

            {newStatus === 'Jadwal Wawancara' && (
              <div className="form-group">
                <label className="form-label">Tanggal Pelaksanaan Wawancara:</label>
                <input
                  type="date"
                  className="form-input"
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Catatan untuk Pelamar (Dikirim ke timeline):</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Contoh: Undangan wawancara teknis via Zoom pada tautan..."
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button type="button" onClick={() => setIsStatusModalOpen(false)} className="btn btn-secondary">
                Batal
              </button>
              <button type="submit" className="btn btn-primary">
                Simpan & Notifikasi
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Candidate Profile Dossier Modal */}
      <Modal
        isOpen={isDossierOpen}
        onClose={() => setIsDossierOpen(false)}
        title="Berkas Portofolio & CV Pelamar"
        size="lg"
      >
        {selectedApp && (
          <div>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#eef2ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem' }}>
                {selectedApp.applicantName.charAt(0)}
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{selectedApp.applicantName}</h3>
                <div style={{ color: '#4f46e5', fontSize: '0.88rem', fontWeight: 600 }}>{candidateProfile?.headline || 'Pencari Kerja'}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  {selectedApp.applicantEmail} • {selectedApp.applicantPhone}
                </div>
              </div>
            </div>

            {selectedApp.coverLetter && (
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', marginBottom: '18px' }}>
                <strong style={{ fontSize: '0.84rem', color: '#1e293b' }}>Surat Lamaran (Cover Letter):</strong>
                <p style={{ fontSize: '0.86rem', color: '#475569', marginTop: '4px', lineHeight: 1.5 }}>
                  "{selectedApp.coverLetter}"
                </p>
              </div>
            )}

            {/* Riwayat Pendidikan */}
            <div style={{ marginBottom: '18px' }}>
              <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '8px' }}>Riwayat Pendidikan Formal:</h4>
              {candidateProfile?.educations?.map((edu) => (
                <div key={edu.id} style={{ fontSize: '0.84rem', marginBottom: '6px' }}>
                  <strong>{edu.institution}</strong> ({edu.degree} - {edu.major}) — {edu.startYear} s/d {edu.endYear}
                </div>
              ))}
            </div>

            {/* Pengalaman */}
            <div style={{ marginBottom: '18px' }}>
              <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '8px' }}>Pengalaman Kerja:</h4>
              {candidateProfile?.experiences?.map((exp) => (
                <div key={exp.id} style={{ fontSize: '0.84rem', marginBottom: '8px', background: '#f8fafc', padding: '8px 12px', borderRadius: '6px' }}>
                  <strong>{exp.position}</strong> di {exp.company}
                  <div style={{ color: '#475569', marginTop: '2px' }}>{exp.responsibilities}</div>
                </div>
              ))}
            </div>

            {/* Keahlian */}
            <div>
              <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '8px' }}>Kompetensi & Keahlian:</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {candidateProfile?.skills?.map((s) => (
                  <Badge key={s.id} variant="primary">{s.name}</Badge>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button onClick={() => setIsDossierOpen(false)} className="btn btn-secondary">
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default LamaranMasuk;
