import { useState, useEffect, useContext } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { jobService } from '../../services/jobService';
import { matchingService } from '../../services/matchingService';
import { NotificationContext } from '../../contexts/NotificationContext';
import CandidateCard from '../../components/cards/CandidateCard';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import { Sparkles, Briefcase, UserCheck, Mail, MapPin, GraduationCap } from 'lucide-react';

export function KandidatRekomendasi() {
  const { user } = useAuth();
  const notify = useContext(NotificationContext);

  const [companyJobs, setCompanyJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Invite Modal
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteMessage, setInviteMessage] = useState('');

  // CV Modal
  const [viewedCandidate, setViewedCandidate] = useState(null);
  const [isCVModalOpen, setIsCVModalOpen] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadJobs();
    }
  }, [user]);

  useEffect(() => {
    if (selectedJobId) {
      loadCandidatesForJob(selectedJobId);
    }
  }, [selectedJobId]);

  const loadJobs = async () => {
    try {
      const jobs = await jobService.getAllJobs({ companyId: user.id });
      setCompanyJobs(jobs);
      if (jobs.length > 0) {
        setSelectedJobId(jobs[0].id);
      } else {
        setLoading(false);
      }
    } catch {
      notify?.error('Gagal memuat lowongan.');
      setLoading(false);
    }
  };

  const loadCandidatesForJob = async (jobId) => {
    setLoading(true);
    try {
      const recs = await matchingService.getRecommendationsForJob(jobId);
      setCandidates(recs);
    } catch {
      notify?.error('Gagal mencari kandidat rekomendasi.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenInvite = (cand) => {
    setSelectedCandidate(cand);
    setInviteMessage(
      `Halo ${cand.name}, kami dari ${user.name} terkesan dengan profil kompetensi Anda dan mengundang Anda untuk melamar pada lowongan aktif kami.`
    );
    setIsInviteModalOpen(true);
  };

  const handleSendInvite = () => {
    notify?.success(`Undangan rekrutmen berhasil dikirimkan ke ${selectedCandidate?.name}!`);
    setIsInviteModalOpen(false);
  };

  const handleViewCV = (cand) => {
    setViewedCandidate(cand);
    setIsCVModalOpen(true);
  };

  const currentJob = companyJobs.find((j) => j.id === selectedJobId);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <div style={{ background: '#ecfdf5', padding: '6px', borderRadius: '8px', color: '#059669' }}>
            <Sparkles size={22} />
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a' }}>
            Kandidat Talenta Rekomendasi AI
          </h1>
        </div>
        <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
          Algoritma Smart Matching secara otomatis mengidentifikasi talenta pencari kerja yang paling sesuai dengan lowongan yang Anda buka.
        </p>
      </div>

      {/* Select Job Filter */}
      {companyJobs.length === 0 && !loading ? (
        <EmptyState
          title="Belum Ada Lowongan Aktif"
          description="Pasang lowongan pekerjaan terlebih dahulu untuk mendapatkan rekomendasi talenta yang relevan."
          actionText="Pasang Lowongan Sekarang"
          onAction={() => window.location.href = '/perusahaan/tambah-lowongan'}
        />
      ) : (
        <>
          <div className="card mb-6" style={{ padding: '16px 20px' }}>
            <div style={{ maxWidth: '480px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
                PILIH LOWONGAN ACUAN PENCOCOKAN:
              </label>
              <select
                className="form-select"
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
              >
                {companyJobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title} ({j.category})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Candidates Grid */}
          <div className="grid grid-cols-2">
            {candidates.map((cand) => (
              <CandidateCard
                key={cand.id}
                candidate={cand}
                onInvite={handleOpenInvite}
                onViewProfile={handleViewCV}
              />
            ))}
          </div>
        </>
      )}

      {/* Invite Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Undang Kandidat Melamar Lowongan"
      >
        {selectedCandidate && (
          <div>
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{selectedCandidate.name}</div>
              <div style={{ fontSize: '0.84rem', color: '#64748b' }}>
                Posisi Ditawarkan: <strong>{currentJob?.title}</strong>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Pesan Undangan Resmi:</label>
              <textarea
                className="form-textarea"
                rows={4}
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => setIsInviteModalOpen(false)} className="btn btn-secondary">
                Batal
              </button>
              <button onClick={handleSendInvite} className="btn btn-primary">
                Kirim Undangan
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* View CV Modal */}
      <Modal
        isOpen={isCVModalOpen}
        onClose={() => setIsCVModalOpen(false)}
        title="Pratinjau CV Kandidat"
        size="lg"
      >
        {viewedCandidate && (
          <div>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
              <img
                src={viewedCandidate.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                alt={viewedCandidate.name}
                style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{viewedCandidate.name}</h3>
                <div style={{ color: '#4f46e5', fontWeight: 600 }}>{viewedCandidate.headline}</div>
                <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
                  {viewedCandidate.email} • {viewedCandidate.location}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '6px' }}>Tentang:</h4>
              <p style={{ fontSize: '0.86rem', color: '#475569', lineHeight: 1.5 }}>
                {viewedCandidate.bio || 'Tidak ada ringkasan bio.'}
              </p>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '8px' }}>Riwayat Pendidikan:</h4>
              {viewedCandidate.educations?.map((edu) => (
                <div key={edu.id} style={{ fontSize: '0.84rem' }}>
                  <strong>{edu.institution}</strong> ({edu.degree} - {edu.major}) — {edu.startYear} s/d {edu.endYear}
                </div>
              ))}
            </div>

            <div style={{ marginBottom: '18px' }}>
              <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '8px' }}>Pengalaman Kerja:</h4>
              {viewedCandidate.experiences?.map((exp) => (
                <div key={exp.id} style={{ fontSize: '0.84rem', background: '#f8fafc', padding: '8px 12px', borderRadius: '6px', marginBottom: '6px' }}>
                  <strong>{exp.position}</strong> di {exp.company}
                  <div style={{ color: '#475569' }}>{exp.responsibilities}</div>
                </div>
              ))}
            </div>

            <div>
              <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '8px' }}>Keahlian:</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {viewedCandidate.skills?.map((s, idx) => (
                  <Badge key={idx} variant="primary">
                    {typeof s === 'string' ? s : s.name}
                  </Badge>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button onClick={() => setIsCVModalOpen(false)} className="btn btn-secondary">
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default KandidatRekomendasi;
