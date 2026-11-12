import { useState, useEffect, useContext, useCallback } from 'react';
import { PerusahaanService } from '../../services/PerusahaanService';
import { api } from '../../services/api';
import { NotificationContext } from '../../contexts/NotificationContext';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import { Search, Building2, CheckCircle, XCircle, Globe, MapPin, Briefcase, Eye } from 'lucide-react';

export function DataPerusahaan() {
  const notify = useContext(NotificationContext);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companyJobs, setCompanyJobs] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const data = await PerusahaanService.getAllCompanies();
      setCompanies(Array.isArray(data) ? data : []);
    } catch {
      notify?.error('Gagal memuat data perusahaan mitra.');
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleToggleVerify = async (company) => {
    const newStatus = !company.verified;
    try {
      await PerusahaanService.verifyCompany(company.id, newStatus);
      notify?.success(`Status verifikasi ${company.name} berhasil diubah.`);
      fetchCompanies();
    } catch {
      notify?.error('Gagal memperbarui status verifikasi.');
    }
  };

  const handleViewDetail = (company) => {
    setSelectedCompany(company);
    const rawJobs = api.getCollection('jobs');
    const jobs = Array.isArray(rawJobs) ? rawJobs.filter((j) => j.companyId === company.id) : [];
    setCompanyJobs(jobs);
    setIsModalOpen(true);
  };

  const formatWebsiteUrl = (url) => {
    if (!url) return '#';
    return /^https?:\/\//i.test(url) ? url : `https://${url}`;
  };

  const filtered = companies.filter(
    (c) =>
      (c.name && c.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.industry && c.industry.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.location && c.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a' }}>
            Data Mitra Perusahaan
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
            Daftar korporasi dan perusahaan penyedia lowongan kerja yang terhubung dengan sistem pemantauan.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="card mb-6" style={{ padding: '16px 20px' }}>
        <div style={{ position: 'relative', maxWidth: '460px' }}>
          <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '38px' }}
            placeholder="Cari perusahaan berdasarkan nama, sektor industri, atau kota..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>
          Memuat data mitra perusahaan...
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Perusahaan Tidak Ditemukan"
          description="Tidak ada perusahaan yang cocok dengan pencarian Anda."
          actionText={searchTerm ? 'Reset Pencarian' : undefined}
          onAction={searchTerm ? () => setSearchTerm('') : undefined}
          icon={Building2}
        />
      ) : (
        <div className="table-responsive">
          <table className="table-custom">
            <thead>
              <tr>
                <th>Perusahaan</th>
                <th>Sektor Industri</th>
                <th>Domisili / Alamat</th>
                <th>Situs Resmi</th>
                <th>Lowongan Aktif</th>
                <th>Status Verifikasi</th>
                <th style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((comp) => (
                <tr key={comp.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img
                        src={comp.avatar || 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?auto=format&fit=crop&w=100&q=80'}
                        alt={comp.name}
                        style={{ width: '42px', height: '42px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #e2e8f0' }}
                      />
                      <div>
                        <div style={{ fontWeight: 700, color: '#1e293b' }}>{comp.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{comp.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{comp.industry || 'Teknologi'}</div>
                  </td>
                  <td style={{ fontSize: '0.84rem', color: '#475569' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={13} color="#94a3b8" />
                      <span>{comp.location || 'Indonesia'}</span>
                    </div>
                  </td>
                  <td>
                    {comp.website ? (
                      <a href={formatWebsiteUrl(comp.website)} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Globe size={13} /> Kunjungi
                      </a>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>-</span>
                    )}
                  </td>
                  <td style={{ fontWeight: 700, color: '#4f46e5' }}>
                    {comp.activeJobsCount || 0} lowongan
                  </td>
                  <td>
                    <Badge variant={comp.verified ? 'success' : 'warning'} dot>
                      {comp.verified ? 'Terverifikasi Resmi' : 'Menunggu Validasi'}
                    </Badge>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      <button
                        onClick={() => handleViewDetail(comp)}
                        className="btn btn-secondary btn-sm"
                        title="Lihat Detail Profil"
                      >
                        <Eye size={15} /> Detail
                      </button>
                      <button
                        onClick={() => handleToggleVerify(comp)}
                        className={`btn btn-sm ${comp.verified ? 'btn-outline' : 'btn-success'}`}
                        title={comp.verified ? 'Batalkan Verifikasi' : 'Verifikasi Resmi Perusahaan'}
                      >
                        {comp.verified ? <XCircle size={15} /> : <CheckCircle size={15} />}
                        <span>{comp.verified ? 'Cabut' : 'Verifikasi'}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Detail Perusahaan */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Profil Mitra Perusahaan"
        size="lg"
      >
        {selectedCompany && (
          <div>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
              <img
                src={selectedCompany.avatar || 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?auto=format&fit=crop&w=150&q=80'}
                alt={selectedCompany.name}
                style={{ width: '64px', height: '64px', borderRadius: '12px', objectFit: 'cover' }}
              />
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{selectedCompany.name}</h3>
                <div style={{ color: '#4f46e5', fontWeight: 600 }}>{selectedCompany.industry || 'Mitra Industri'}</div>
                <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '4px' }}>
                  {selectedCompany.location || 'Indonesia'} • {selectedCompany.email}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '6px' }}>Tentang Perusahaan:</h4>
              <p style={{ fontSize: '0.86rem', color: '#475569', lineHeight: 1.6 }}>
                {selectedCompany.description || 'Deskripsi belum dilengkapi oleh perusahaan.'}
              </p>
            </div>

            <div>
              <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Briefcase size={16} color="#4f46e5" /> Lowongan yang Sedang Ditayangkan ({companyJobs.length})
              </h4>
              {companyJobs.length === 0 ? (
                <div style={{ fontSize: '0.84rem', color: '#94a3b8' }}>Belum ada lowongan terdaftar untuk perusahaan ini.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {companyJobs.map((j) => (
                    <div key={j.id} style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{j.title}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {j.jobType}{j.category ? ` • ${j.category}` : ''}
                        </div>
                      </div>
                      <Badge variant={j.statusVerifikasi === 'Disetujui' ? 'success' : 'warning'}>
                        {j.statusVerifikasi}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default DataPerusahaan;