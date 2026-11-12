import { useState, useEffect, useContext, useCallback } from 'react';
import { api } from '../../services/api';
import { PencariKerjaService } from '../../services/PencariKerjaService';
import { NotificationContext } from '../../contexts/NotificationContext';
import { formatRupiah } from '../../utils/formatNumber';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import {
  Search,
  Eye,
  Filter,
  MapPin,
  Briefcase,
  GraduationCap,
  Award,
  FileText,
  Download
} from 'lucide-react';

export function DataPencariKerja() {
  const notify = useContext(NotificationContext);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');

  // Modal Dossier
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [dossierData, setDossierData] = useState(null);
  const [loadingDossier, setLoadingDossier] = useState(false);
  const [isDossierOpen, setIsDossierOpen] = useState(false);

  const fetchCandidates = useCallback(() => {
    setLoading(true);
    try {
      const rawUsers = api.getCollection('users');
      const users = Array.isArray(rawUsers) ? rawUsers : [];
      let pkList = users.filter((u) => u.role === 'PencariKerja');

      if (statusFilter !== 'Semua') {
        pkList = pkList.filter((u) => u.statusKarir === statusFilter);
      }

      if (submittedSearch) {
        const q = submittedSearch.toLowerCase();
        pkList = pkList.filter(
          (u) =>
            (u.name && u.name.toLowerCase().includes(q)) ||
            (u.email && u.email.toLowerCase().includes(q)) ||
            (u.headline && u.headline.toLowerCase().includes(q))
        );
      }

      setCandidates(pkList);
    } catch {
      notify?.error('Gagal memuat data pencari kerja.');
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, submittedSearch, notify]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSubmittedSearch(searchTerm.trim());
  };

  const handleResetFilter = () => {
    setSearchTerm('');
    setSubmittedSearch('');
    setStatusFilter('Semua');
  };

  const handleOpenDossier = async (candidate) => {
    setSelectedCandidate(candidate);
    setDossierData(null);
    setIsDossierOpen(true);
    setLoadingDossier(true);
    try {
      const full = await PencariKerjaService.getFullProfile(candidate.id);
      setDossierData(full);
    } catch {
      notify?.error('Gagal mengambil rincian portofolio kandidat.');
    } finally {
      setLoadingDossier(false);
    }
  };

  const handleChangeStatus = async (candidateId, newStatus) => {
    try {
      await PencariKerjaService.updateCareerStatus(candidateId, newStatus);
      notify?.success(`Status karir berhasil diperbarui menjadi ${newStatus}`);
      fetchCandidates();
      if (selectedCandidate && selectedCandidate.id === candidateId) {
        setSelectedCandidate((prev) => ({ ...prev, statusKarir: newStatus }));
      }
    } catch {
      notify?.error('Gagal memperbarui status karir.');
    }
  };

  const handleDownloadDoc = (doc) => {
    if (!doc.dataUrl) {
      notify?.error('File tidak tersedia untuk diunduh.');
      return;
    }
    const link = document.createElement('a');
    link.href = doc.dataUrl;
    link.download = doc.fileName || `${doc.title}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const candidateDocs = Array.isArray(dossierData?.documents)
    ? dossierData.documents
    : Array.isArray(selectedCandidate?.documents)
      ? selectedCandidate.documents
      : [];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a' }}>
            Data Terpadu Pencari Kerja
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
            Daftar lengkap talenta pencari kerja terdaftar, status serapan, dan jejak kompetensi.
          </p>
        </div>
      </div>

      {/* Filter Card */}
      <div className="card mb-6" style={{ padding: '18px 22px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '38px' }}
              placeholder="Cari berdasarkan nama, email, atau bidang keahlian..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ width: '220px' }}>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="Semua">Semua Status Karir</option>
              <option value="Bekerja">Sudah Bekerja</option>
              <option value="Magang">Program Magang</option>
              <option value="Pelatihan">Sedang Pelatihan</option>
              <option value="Menganggur">Belum Bekerja</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary btn-sm">
            <Filter size={16} /> Terapkan Filter
          </button>
        </form>
      </div>

      {/* Table */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>
          Memuat data pencari kerja...
        </div>
      ) : candidates.length === 0 ? (
        <EmptyState
          title="Pencari Kerja Tidak Ditemukan"
          description="Tidak ada profil kandidat yang cocok dengan kriteria pencarian Anda."
          actionText="Reset Filter"
          onAction={handleResetFilter}
        />
      ) : (
        <div className="table-responsive">
          <table className="table-custom">
            <thead>
              <tr>
                <th>Kandidat</th>
                <th>Bidang & Minat</th>
                <th>Lokasi Domisili</th>
                <th>Ekspektasi Gaji</th>
                <th>Status Penyerapan</th>
                <th style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((cand) => (
                <tr key={cand.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img
                        src={cand.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                        alt={cand.name}
                        style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <div>
                        <div style={{ fontWeight: 700, color: '#1e293b' }}>{cand.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{cand.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{cand.headline || 'Pencari Kerja'}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Telp: {cand.phone || '-'}</div>
                  </td>
                  <td style={{ fontSize: '0.84rem', color: '#475569' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={13} color="#94a3b8" />
                      <span>{cand.location || 'Indonesia'}</span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 600, color: '#059669', fontSize: '0.84rem' }}>
                    {cand.targetGaji ? formatRupiah(cand.targetGaji) : 'Negosiasi'}
                  </td>
                  <td>
                    <select
                      value={cand.statusKarir || 'Menganggur'}
                      onChange={(e) => handleChangeStatus(cand.id, e.target.value)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        background: '#ffffff',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="Bekerja">Bekerja</option>
                      <option value="Magang">Magang</option>
                      <option value="Pelatihan">Pelatihan</option>
                      <option value="Menganggur">Menganggur</option>
                    </select>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => handleOpenDossier(cand)}
                      className="btn btn-secondary btn-sm"
                      title="Lihat CV & Berkas Portofolio"
                    >
                      <Eye size={15} /> Portofolio
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Dossier / Portfolio View */}
      <Modal
        isOpen={isDossierOpen}
        onClose={() => setIsDossierOpen(false)}
        title="Dossier & Profil Lengkap Pencari Kerja"
        size="lg"
      >
        {selectedCandidate && (
          <div>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
              <img
                src={selectedCandidate.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                alt={selectedCandidate.name}
                style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{selectedCandidate.name}</h3>
                <div style={{ color: '#4f46e5', fontWeight: 600 }}>{selectedCandidate.headline || 'Pencari Kerja'}</div>
                <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '4px' }}>
                  {selectedCandidate.email} {selectedCandidate.phone ? `• ${selectedCandidate.phone}` : ''}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '6px' }}>Tentang Singkat:</h4>
              <p style={{ fontSize: '0.86rem', color: '#475569', lineHeight: 1.6 }}>
                {selectedCandidate.bio || 'Belum mengisi biodata ringkas.'}
              </p>
            </div>

            {loadingDossier ? (
              <div style={{ textAlign: 'center', padding: '24px', color: '#64748b', fontSize: '0.86rem' }}>
                Memuat rincian pendidikan, pengalaman, dan keahlian...
              </div>
            ) : (
              <>
                {/* Riwayat Pendidikan */}
                <div style={{ marginBottom: '18px' }}>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <GraduationCap size={16} color="#4f46e5" /> Riwayat Pendidikan
                  </h4>
                  {dossierData?.educations?.length ? (
                    dossierData.educations.map((edu) => (
                      <div key={edu.id} style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', marginBottom: '6px', fontSize: '0.84rem' }}>
                        <strong>{edu.institution}</strong> ({edu.degree} — {edu.major})
                        <div style={{ color: '#64748b', fontSize: '0.78rem' }}>
                          Tahun {edu.startYear} - {edu.endYear || 'Sekarang'}
                          {edu.gpa ? ` • IPK: ${edu.gpa}` : ''}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Belum ada data pendidikan tercatat.</div>
                  )}
                </div>

                {/* Pengalaman Kerja */}
                <div style={{ marginBottom: '18px' }}>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Briefcase size={16} color="#4f46e5" /> Pengalaman Kerja & Proyek
                  </h4>
                  {dossierData?.experiences?.length ? (
                    dossierData.experiences.map((exp) => (
                      <div key={exp.id} style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', marginBottom: '6px', fontSize: '0.84rem' }}>
                        <strong>{exp.position}</strong> di {exp.company}
                        <div style={{ color: '#64748b', fontSize: '0.78rem' }}>{exp.startDate} s/d {exp.endDate || 'Sekarang'}</div>
                        {exp.responsibilities && <div style={{ marginTop: '4px', color: '#475569' }}>{exp.responsibilities}</div>}
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Belum ada pengalaman kerja tercatat.</div>
                  )}
                </div>

                {/* Keahlian */}
                <div style={{ marginBottom: '18px' }}>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Award size={16} color="#4f46e5" /> Keahlian & Kompetensi
                  </h4>
                  {dossierData?.skills?.length ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {dossierData.skills.map((s) => (
                        <Badge key={s.id} variant="primary">
                          {s.name} (Tingkat {s.level}/5)
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Belum ada keahlian tercatat.</div>
                  )}
                </div>

                {/* Berkas Pelamar */}
                <div>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileText size={16} color="#4f46e5" /> Berkas & Dokumen Pelamar
                  </h4>
                  {candidateDocs.length ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {candidateDocs.map((doc) => (
                        <div
                          key={doc.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: '#f8fafc',
                            padding: '10px 14px',
                            borderRadius: '8px',
                            fontSize: '0.84rem'
                          }}
                        >
                          <div>
                            <strong>{doc.title}</strong>
                            <span style={{ color: '#64748b', marginLeft: '8px', fontSize: '0.78rem' }}>
                              ({doc.docType})
                            </span>
                          </div>
                          {doc.dataUrl && (
                            <button
                              type="button"
                              onClick={() => handleDownloadDoc(doc)}
                              className="btn btn-secondary btn-sm"
                            >
                              <Download size={14} /> Unduh
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Belum ada berkas dokumen yang diunggah.</div>
                  )}
                </div>
              </>
            )}

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

export default DataPencariKerja;