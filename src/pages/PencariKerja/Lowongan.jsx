import { useState, useEffect, useContext, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { jobService } from '../../services/jobService';
import { applicationService } from '../../services/applicationService';
import { matchingService } from '../../services/matchingService';
import { NotificationContext } from '../../contexts/NotificationContext';
import { formatSalaryRange } from '../../utils/formatNumber';
import JobCard from '../../components/cards/JobCard';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import {
  Search,
  Filter,
  MapPin,
  Send,
  Sparkles,
  Briefcase
} from 'lucide-react';

export function Lowongan() {
  const { user } = useAuth();
  const notify = useContext(NotificationContext);
  const location = useLocation();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState({});

  const [searchTerm, setSearchTerm] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [category, setCategory] = useState('Semua');
  const [jobType, setJobType] = useState('Semua');

  const [selectedJob, setSelectedJob] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const rawData = await jobService.getAllJobs({
        onlyActive: true,
        category,
        jobType,
        search: submittedSearch
      });

      const data = Array.isArray(rawData) ? rawData : [];

      if (user?.id) {
        const bookmarkMap = {};
        const enriched = data.map((job) => {
          const match = matchingService.calculateMatch(user, job);
          bookmarkMap[job.id] = Boolean(jobService.isBookmarked(job.id, user.id));

          return {
            ...job,
            matchScore: match?.score ?? 85,
            matchGrade: match?.grade
          };
        });

        setSavedIds(bookmarkMap);
        setJobs(enriched);
      } else {
        setJobs(data);
      }
    } catch {
      notify?.error('Gagal memuat data lowongan.');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [category, jobType, submittedSearch, user, notify]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Buka modal detail otomatis jika diarahkan dari Dashboard dengan selectedJobId
  useEffect(() => {
    const targetId = location.state?.selectedJobId;
    if (targetId && jobs.length > 0) {
      const found = jobs.find((j) => j.id === targetId);
      if (found) {
        setSelectedJob(found);
        setIsDetailOpen(true);
      }
    }
  }, [location.state, jobs]);

  const handleSearch = (event) => {
    event.preventDefault();
    setSubmittedSearch(searchTerm.trim());
  };

  const handleResetFilter = () => {
    setSearchTerm('');
    setSubmittedSearch('');
    setCategory('Semua');
    setJobType('Semua');
  };

  const handleToggleBookmark = (jobId) => {
    if (!user?.id) {
      notify?.error('Silakan login terlebih dahulu untuk menyimpan lowongan.');
      return;
    }

    const isNowSaved = jobService.toggleBookmark(jobId, user.id);
    setSavedIds((prev) => ({ ...prev, [jobId]: isNowSaved }));

    notify?.info(
      isNowSaved
        ? 'Lowongan disimpan ke daftar favorit.'
        : 'Lowongan dihapus dari tersimpan.'
    );
  };

  const handleOpenApply = (job) => {
    setSelectedJob(job);
    setIsDetailOpen(false);
    setIsApplyOpen(true);
  };

  const handleSubmitApplication = async (event) => {
    event.preventDefault();
    if (!selectedJob || !user?.id) return;

    setSubmitting(true);
    try {
      await applicationService.applyJob({
        jobId: selectedJob.id,
        jobTitle: selectedJob.title,
        companyId: selectedJob.companyId,
        companyName: selectedJob.companyName,
        applicantId: user.id,
        applicantName: user.name,
        applicantEmail: user.email,
        applicantPhone: user.phone,
        matchScore: selectedJob.matchScore || 85,
        coverLetter: coverLetter.trim()
      });

      notify?.success(
        `Lamaran untuk posisi "${selectedJob.title}" berhasil dikirim!`
      );

      setIsApplyOpen(false);
      setCoverLetter('');
    } catch (error) {
      notify?.error(error?.message || 'Gagal mengajukan lamaran.');
    } finally {
      setSubmitting(false);
    }
  };

  const responsibilitiesList = Array.isArray(selectedJob?.responsibilities)
    ? selectedJob.responsibilities
    : typeof selectedJob?.responsibilities === 'string' && selectedJob.responsibilities.trim()
      ? selectedJob.responsibilities.split('\n')
      : [];

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1
          style={{
            fontSize: '1.65rem',
            fontWeight: 800,
            color: '#0f172a'
          }}
        >
          Eksplorasi Lowongan Kerja
        </h1>

        <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
          Temukan lowongan terverifikasi yang cocok dengan kompetensi dan
          preferensi karir Anda.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="card mb-6" style={{ padding: '18px 22px' }}>
        <form
          onSubmit={handleSearch}
          style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            alignItems: 'center'
          }}
        >
          <div
            style={{
              flex: 1,
              minWidth: '240px',
              position: 'relative'
            }}
          >
            <Search
              size={18}
              color="#94a3b8"
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)'
              }}
            />

            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '38px' }}
              placeholder="Cari lowongan berdasarkan posisi, kata kunci, atau perusahaan..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <div style={{ width: '180px' }}>
            <select
              className="form-select"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="Semua">Semua Bidang</option>
              <option value="IT & Software">IT & Software</option>
              <option value="Data & AI">Data & AI</option>
              <option value="Desain Grafis & UI/UX">Desain Grafis</option>
              <option value="Pemasaran">Pemasaran</option>
            </select>
          </div>

          <div style={{ width: '160px' }}>
            <select
              className="form-select"
              value={jobType}
              onChange={(event) => setJobType(event.target.value)}
            >
              <option value="Semua">Semua Tipe</option>
              <option value="Full Time">Full Time</option>
              <option value="Contract">Contract</option>
              <option value="Internship">Internship</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary btn-sm">
            <Filter size={16} />
            Cari Lowongan
          </button>
        </form>
      </div>

      {/* Job List */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>
          Memuat daftar lowongan pekerjaan...
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState
          title="Tidak Ada Lowongan Ditemukan"
          description="Coba ubah kata kunci atau bersihkan filter pencarian Anda."
          actionText="Reset Filter"
          onAction={handleResetFilter}
          icon={Briefcase}
        />
      ) : (
        <div className="grid grid-cols-2">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              isSaved={Boolean(savedIds[job.id])}
              onToggleBookmark={handleToggleBookmark}
              onViewDetail={(selected) => {
                setSelectedJob(selected);
                setIsDetailOpen(true);
              }}
              onApply={handleOpenApply}
            />
          ))}
        </div>
      )}

      {/* Modal Detail Lowongan */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Detail Lengkap Lowongan Pekerjaan"
        size="lg"
      >
        {selectedJob && (
          <div>
            <div
              style={{
                display: 'flex',
                gap: '16px',
                alignItems: 'center',
                marginBottom: '20px'
              }}
            >
              <img
                src={
                  selectedJob.companyLogo ||
                  'https://images.unsplash.com/photo-1549923746-c502d488b3ea?auto=format&fit=crop&w=100&q=80'
                }
                alt={selectedJob.companyName}
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '12px',
                  objectFit: 'cover'
                }}
              />

              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                  {selectedJob.title}
                </h3>

                <div style={{ color: '#4f46e5', fontWeight: 600 }}>
                  {selectedJob.companyName}
                </div>

                <div
                  style={{
                    fontSize: '0.8rem',
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginTop: '2px'
                  }}
                >
                  <MapPin size={13} />
                  <span>{selectedJob.location}</span>
                  <span>•</span>
                  <span>{selectedJob.jobType}</span>
                </div>
              </div>
            </div>

            <div
              style={{
                background: '#f8fafc',
                padding: '14px',
                borderRadius: '8px',
                marginBottom: '18px'
              }}
            >
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Estimasi Gaji yang Ditawarkan:
              </div>

              <div
                style={{
                  fontSize: '1.15rem',
                  fontWeight: 800,
                  color: '#059669'
                }}
              >
                {formatSalaryRange(
                  selectedJob.salaryMin,
                  selectedJob.salaryMax
                )}
              </div>
            </div>

            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '6px' }}>
              Deskripsi Pekerjaan:
            </h4>

            <p
              style={{
                fontSize: '0.86rem',
                color: '#475569',
                lineHeight: 1.6,
                marginBottom: '18px'
              }}
            >
              {selectedJob.description}
            </p>

            {responsibilitiesList.length > 0 && (
              <>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '8px' }}>
                  Tanggung Jawab Utama:
                </h4>

                <ul
                  style={{
                    paddingLeft: '20px',
                    fontSize: '0.86rem',
                    color: '#475569',
                    marginBottom: '18px'
                  }}
                >
                  {responsibilitiesList.map((item, index) => (
                    <li key={index} style={{ marginBottom: '4px' }}>
                      {item}
                    </li>
                  ))}
                </ul>
              </>
            )}

            {selectedJob.requiredSkills?.length > 0 && (
              <>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '8px' }}>
                  Keahlian yang Dibutuhkan:
                </h4>

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                    marginBottom: '24px'
                  }}
                >
                  {selectedJob.requiredSkills.map((skill, index) => (
                    <Badge key={index} variant="primary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </>
            )}

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px'
              }}
            >
              <button
                type="button"
                onClick={() => setIsDetailOpen(false)}
                className="btn btn-secondary"
              >
                Tutup
              </button>

              <button
                type="button"
                onClick={() => handleOpenApply(selectedJob)}
                className="btn btn-primary"
              >
                <Send size={16} />
                Lamar Sekarang
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Konfirmasi Lamaran */}
      <Modal
        isOpen={isApplyOpen}
        onClose={() => !submitting && setIsApplyOpen(false)}
        title="Konfirmasi Pengajuan Lamaran"
      >
        {selectedJob && (
          <form onSubmit={handleSubmitApplication}>
            <div style={{ marginBottom: '16px' }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: '1.05rem',
                  color: '#1e293b'
                }}
              >
                {selectedJob.title}
              </div>

              <div style={{ color: '#4f46e5', fontSize: '0.85rem' }}>
                {selectedJob.companyName}
              </div>
            </div>

            <div
              style={{
                background: '#eef2ff',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '0.84rem',
                color: '#3730a3'
              }}
            >
              <Sparkles
                size={16}
                style={{
                  verticalAlign: 'middle',
                  marginRight: '6px'
                }}
              />
              <strong>
                Skor Kecocokan AI Anda: {selectedJob.matchScore || 85}%
              </strong>
            </div>

            <div className="form-group">
              <label className="form-label">
                Surat Pengantar / Catatan Singkat (Cover Letter):
              </label>

              <textarea
                className="form-textarea"
                rows={4}
                placeholder="Jelaskan secara ringkas mengapa Anda adalah kandidat ideal untuk posisi ini..."
                value={coverLetter}
                onChange={(event) => setCoverLetter(event.target.value)}
              />
            </div>

            <div
              style={{
                fontSize: '0.78rem',
                color: '#64748b',
                marginBottom: '20px'
              }}
            >
              * Berkas profil, riwayat pendidikan, dan portofolio keahlian Anda
              akan otomatis dikirimkan ke tim rekruter {selectedJob.companyName}.
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px'
              }}
            >
              <button
                type="button"
                onClick={() => setIsApplyOpen(false)}
                className="btn btn-secondary"
                disabled={submitting}
              >
                Batal
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
              >
                {submitting ? 'Mengirimkan...' : 'Kirim Lamaran'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

export default Lowongan;