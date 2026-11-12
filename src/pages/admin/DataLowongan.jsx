import { useState, useEffect, useContext, useCallback } from 'react';
import { jobService } from '../../services/jobService';
import { NotificationContext } from '../../contexts/NotificationContext';
import { formatSalaryRange } from '../../utils/formatNumber';
import { formatIndonesianDate } from '../../utils/formatDate';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import { Search, Eye, Trash2, Power, Briefcase, Filter, Building2, MapPin } from 'lucide-react';

export function DataLowongan() {
  const notify = useContext(NotificationContext);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Semua');
  const [statusFilter, setStatusFilter] = useState('Semua');

  // Detail Modal State
  const [selectedJob, setSelectedJob] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await jobService.getAllJobs({
        category: categoryFilter,
        statusVerifikasi: statusFilter,
        search: submittedSearch
      });
      setJobs(Array.isArray(data) ? data : []);
    } catch {
      notify?.error('Gagal memuat daftar lowongan pekerjaan.');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, statusFilter, submittedSearch, notify]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSubmittedSearch(searchTerm.trim());
  };

  const handleResetFilter = () => {
    setSearchTerm('');
    setSubmittedSearch('');
    setCategoryFilter('Semua');
    setStatusFilter('Semua');
  };

  const handleToggleActive = async (job) => {
    try {
      await jobService.toggleJobActive(job.id);
      notify?.success(`Status lowongan "${job.title}" berhasil diubah.`);
      fetchJobs();
    } catch {
      notify?.error('Gagal memperbarui status lowongan.');
    }
  };

  const handleDelete = async (id, title) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus lowongan "${title}"?`)) {
      try {
        await jobService.deleteJob(id);
        notify?.success('Lowongan berhasil dihapus.');
        fetchJobs();
      } catch {
        notify?.error('Gagal menghapus lowongan.');
      }
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Disetujui':
        return <Badge variant="success" dot>Disetujui</Badge>;
      case 'Ditolak':
        return <Badge variant="danger" dot>Ditolak</Badge>;
      default:
        return <Badge variant="warning" dot>Menunggu</Badge>;
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a' }}>
            Pangkalan Data Lowongan Kerja
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
            Kelola seluruh lowongan yang diterbitkan oleh perusahaan mitra di portal karir.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="card mb-6" style={{ padding: '18px 22px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '38px' }}
              placeholder="Cari lowongan berdasarkan posisi, perusahaan, atau keahlian..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ width: '180px' }}>
            <select
              className="form-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="Semua">Semua Kategori</option>
              <option value="IT & Software">IT & Software</option>
              <option value="Data & AI">Data & AI</option>
              <option value="Desain Grafis & UI/UX">Desain Grafis</option>
              <option value="Pemasaran">Pemasaran</option>
            </select>
          </div>

          <div style={{ width: '180px' }}>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="Semua">Semua Status</option>
              <option value="Disetujui">Disetujui</option>
              <option value="Menunggu">Menunggu</option>
              <option value="Ditolak">Ditolak</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary btn-sm">
            <Filter size={16} /> Filter
          </button>
        </form>
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>
          Memuat pangkalan data lowongan...
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState
          title="Tidak Ada Lowongan"
          description="Tidak ditemukan lowongan pekerjaan yang sesuai dengan kriteria filter Anda."
          actionText="Reset Filter"
          onAction={handleResetFilter}
          icon={Briefcase}
        />
      ) : (
        <div className="table-responsive">
          <table className="table-custom">
            <thead>
              <tr>
                <th>Posisi & Perusahaan</th>
                <th>Kategori & Tipe</th>
                <th>Rentang Gaji</th>
                <th>Status Verifikasi</th>
                <th>Publikasi</th>
                <th>Pelamar</th>
                <th style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: '#1e293b' }}>{job.title}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Building2 size={13} /> {job.companyName}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{job.category}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {job.jobType}{job.workplaceType ? ` • ${job.workplaceType}` : ''}
                    </div>
                  </td>
                  <td style={{ fontWeight: 600, color: '#059669', fontSize: '0.84rem' }}>
                    {formatSalaryRange(job.salaryMin, job.salaryMax)}
                  </td>
                  <td>{getStatusBadge(job.statusVerifikasi)}</td>
                  <td>
                    <Badge variant={job.isActive ? 'success' : 'danger'}>
                      {job.isActive ? 'Aktif Tayang' : 'Ditutup'}
                    </Badge>
                  </td>
                  <td style={{ fontWeight: 700, color: '#4f46e5' }}>
                    {job.applicantCount || 0} orang
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      <button
                        onClick={() => {
                          setSelectedJob(job);
                          setIsDetailOpen(true);
                        }}
                        className="btn btn-secondary btn-sm"
                        title="Lihat Detail"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => handleToggleActive(job)}
                        className={`btn btn-sm ${job.isActive ? 'btn-outline' : 'btn-success'}`}
                        title={job.isActive ? 'Nonaktifkan Lowongan' : 'Aktifkan Lowongan'}
                      >
                        <Power size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(job.id, job.title)}
                        className="btn btn-secondary btn-sm"
                        style={{ color: '#ef4444' }}
                        title="Hapus Lowongan"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Detail Lowongan */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Detail Lowongan Pekerjaan"
        size="lg"
      >
        {selectedJob && (
          <div>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '20px' }}>
              <img
                src={selectedJob.companyLogo || 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?auto=format&fit=crop&w=100&q=80'}
                alt={selectedJob.companyName}
                style={{ width: '56px', height: '56px', borderRadius: '12px', objectFit: 'cover', border: '1px solid #e2e8f0' }}
              />
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{selectedJob.title}</h3>
                <div style={{ color: '#4f46e5', fontWeight: 600 }}>{selectedJob.companyName}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', flexWrap: 'wrap' }}>
                  <MapPin size={13} />
                  <span>{selectedJob.location}</span>
                  {selectedJob.createdAt && (
                    <>
                      <span>•</span>
                      <span>Ditayangkan {formatIndonesianDate(selectedJob.createdAt)}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', marginBottom: '18px' }}>
              <div style={{ fontSize: '0.82rem', color: '#64748b' }}>Estimasi Kompensasi Gaji:</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#059669' }}>
                {formatSalaryRange(selectedJob.salaryMin, selectedJob.salaryMax)}
              </div>
            </div>

            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '8px' }}>Deskripsi Pekerjaan:</h4>
            <p style={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.6, marginBottom: '16px' }}>
              {selectedJob.description}
            </p>

            {selectedJob.requiredSkills?.length > 0 && (
              <>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '8px' }}>Kompetensi & Keahlian yang Diperlukan:</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '18px' }}>
                  {selectedJob.requiredSkills.map((s, i) => (
                    <span key={i} style={{ background: '#e0e7ff', color: '#3730a3', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}>
                      {s}
                    </span>
                  ))}
                </div>
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => setIsDetailOpen(false)} className="btn btn-secondary">
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default DataLowongan;