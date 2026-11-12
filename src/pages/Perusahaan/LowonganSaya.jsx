import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { jobService } from '../../services/jobService';
import { NotificationContext } from '../../contexts/NotificationContext';
import { formatSalaryRange } from '../../utils/formatNumber';
import { formatIndonesianDate } from '../../utils/formatDate';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import { Briefcase, Plus, Users, Power, Trash2, Edit2, Eye } from 'lucide-react';

export function LowonganSaya() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const notify = useContext(NotificationContext);

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadMyJobs();
    }
  }, [user]);

  const loadMyJobs = async () => {
    setLoading(true);
    try {
      const data = await jobService.getAllJobs({ companyId: user.id });
      setJobs(data);
    } catch {
      notify?.error('Gagal mengambil daftar lowongan perusahaan.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (job) => {
    try {
      await jobService.toggleJobActive(job.id);
      notify?.success(`Status tayang lowongan "${job.title}" diperbarui.`);
      loadMyJobs();
    } catch {
      notify?.error('Gagal mengubah status lowongan.');
    }
  };

  const handleDelete = async (id, title) => {
    if (window.confirm(`Hapus lowongan "${title}"? Seluruh berkas pelamar terkait juga akan diarsipkan.`)) {
      try {
        await jobService.deleteJob(id);
        notify?.success('Lowongan berhasil dihapus.');
        loadMyJobs();
      } catch {
        notify?.error('Gagal menghapus lowongan.');
      }
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Disetujui':
        return <Badge variant="success" dot>Terverifikasi</Badge>;
      case 'Ditolak':
        return <Badge variant="danger" dot>Ditolak</Badge>;
      default:
        return <Badge variant="warning" dot>Menunggu Verifikasi</Badge>;
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a' }}>
            Lowongan Pekerjaan Perusahaan Saya
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
            Kelola publikasi lowongan, pantau jumlah pelamar, dan atur ketersediaan penayangan.
          </p>
        </div>
        <button onClick={() => navigate('/perusahaan/tambah-lowongan')} className="btn btn-primary btn-sm">
          <Plus size={16} /> Pasang Lowongan Baru
        </button>
      </div>

      {jobs.length === 0 && !loading ? (
        <EmptyState
          title="Belum Ada Lowongan Dipasang"
          description="Perusahaan Anda belum menerbitkan lowongan pekerjaan. Mulai pasang lowongan untuk menjaring kandidat."
          actionText="Pasang Lowongan Pertama"
          onAction={() => navigate('/perusahaan/tambah-lowongan')}
          icon={Briefcase}
        />
      ) : (
        <div className="table-responsive">
          <table className="table-custom">
            <thead>
              <tr>
                <th>Judul Lowongan</th>
                <th>Kategori & Tipe</th>
                <th>Rentang Gaji</th>
                <th>Status Verifikasi</th>
                <th>Status Tayang</th>
                <th>Pelamar</th>
                <th style={{ textAlign: 'center' }}>Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: '#1e293b' }}>{job.title}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      Dibuat pada {formatIndonesianDate(job.createdAt)}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{job.category}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {job.jobType} • {job.workplaceType}
                    </div>
                  </td>
                  <td style={{ fontWeight: 600, color: '#059669', fontSize: '0.84rem' }}>
                    {formatSalaryRange(job.salaryMin, job.salaryMax)}
                  </td>
                  <td>{getStatusBadge(job.statusVerifikasi)}</td>
                  <td>
                    <Badge variant={job.isActive ? 'success' : 'danger'}>
                      {job.isActive ? 'Aktif' : 'Non-Aktif'}
                    </Badge>
                  </td>
                  <td>
                    <button
                      onClick={() => navigate(`/perusahaan/lamaran-masuk?jobId=${job.id}`)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontWeight: 700, color: '#4f46e5' }}
                    >
                      <Users size={14} /> {job.applicantCount || 0} Pelamar
                    </button>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      <button
                        onClick={() => handleToggleActive(job)}
                        className={`btn btn-sm ${job.isActive ? 'btn-outline' : 'btn-success'}`}
                        title={job.isActive ? 'Jeda Penayangan' : 'Aktifkan Penayangan'}
                      >
                        <Power size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(job.id, job.title)}
                        className="btn btn-secondary btn-sm"
                        style={{ color: '#ef4444' }}
                        title="Hapus Lowongan"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default LowonganSaya;
