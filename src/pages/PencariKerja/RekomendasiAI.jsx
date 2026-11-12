import { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { matchingService } from '../../services/matchingService';
import { applicationService } from '../../services/applicationService';
import { NotificationContext } from '../../contexts/NotificationContext';
import { formatSalaryRange } from '../../utils/formatNumber';
import EmptyState from '../../components/common/EmptyState';
import { Sparkles, Building2, MapPin, CheckCircle, Send } from 'lucide-react';

export function RekomendasiAI() {
  const { user } = useAuth();
  const notify = useContext(NotificationContext);
  const navigate = useNavigate();

  const [recommendations, setRecommendations] = useState([]);
  const [appliedJobIds, setAppliedJobIds] = useState(new Set());
  const [applyingId, setApplyingId] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadRecommendations = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [recData, myApps] = await Promise.all([
        matchingService.getRecommendationsForCandidate(user.id),
        applicationService.getMyApplications(user.id).catch(() => [])
      ]);

      setRecommendations(Array.isArray(recData) ? recData : []);

      const appliedSet = new Set(
        (Array.isArray(myApps) ? myApps : []).map((app) => app.jobId)
      );
      setAppliedJobIds(appliedSet);
    } catch {
      notify?.error('Gagal menghitung rekomendasi AI.');
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, notify]);

  useEffect(() => {
    if (user?.id) {
      loadRecommendations();
    } else {
      setLoading(false);
    }
  }, [user?.id, loadRecommendations]);

  const handleApply = async (job) => {
    if (!user?.id || applyingId || appliedJobIds.has(job.id)) return;

    setApplyingId(job.id);
    try {
      await applicationService.applyJob({
        jobId: job.id,
        jobTitle: job.title,
        companyId: job.companyId,
        companyName: job.companyName,
        applicantId: user.id,
        applicantName: user.name,
        applicantEmail: user.email,
        applicantPhone: user.phone,
        matchScore: job.matchScore || 85,
        coverLetter: 'Mengajukan lamaran melalui rekomendasi cerdas AI Smart Matching KarirKu.'
      });

      setAppliedJobIds((prev) => new Set(prev).add(job.id));
      notify?.success(`Lamaran untuk ${job.title} berhasil diajukan!`);
    } catch (err) {
      notify?.error(err?.message || 'Gagal mengajukan lamaran.');
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <div style={{ background: '#eef2ff', padding: '6px', borderRadius: '8px', color: '#4f46e5' }}>
            <Sparkles size={22} />
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a' }}>
            Rekomendasi Cerdas AI (Smart Matching)
          </h1>
        </div>
        <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
          Daftar lowongan kerja yang diurutkan secara matematis berdasarkan tingkat kecocokan profil kompetensi, pendidikan, dan pengalaman Anda.
        </p>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>
          Menganalisis kecocokan profil Anda dengan lowongan aktif...
        </div>
      ) : recommendations.length === 0 ? (
        <EmptyState
          title="Belum Ada Rekomendasi"
          description="Lengkapi riwayat pendidikan dan keahlian pada menu profil Anda untuk mengaktifkan kalkulasi smart matching."
          actionText="Lengkapi Keahlian"
          onAction={() => navigate('/pencari-kerja/keterampilan')}
          icon={Sparkles}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {recommendations.map((job) => {
            const score = Math.min(100, Math.max(0, Number(job.matchScore) || 0));
            const isHighMatch = score >= 85;
            const isApplied = appliedJobIds.has(job.id);
            const isSubmittingThis = applyingId === job.id;

            return (
              <div
                key={job.id}
                className="card card-hoverable"
                style={{ borderLeft: isHighMatch ? '4px solid #10b981' : '4px solid #8b5cf6' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <img
                      src={job.companyLogo || 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?auto=format&fit=crop&w=100&q=80'}
                      alt={job.companyName}
                      style={{ width: '56px', height: '56px', borderRadius: '12px', objectFit: 'cover' }}
                    />
                    <div>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>{job.title}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b', fontSize: '0.85rem', flexWrap: 'wrap', marginTop: '4px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#334155' }}>
                          <Building2 size={14} /> <strong>{job.companyName}</strong>
                        </span>
                        {job.location && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={14} /> {job.location}
                            {job.workplaceType ? ` (${job.workplaceType})` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: isHighMatch ? '#059669' : '#4f46e5', lineHeight: 1 }}>
                        {score}%
                      </div>
                      {job.matchGrade && (
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>
                          {job.matchGrade}
                        </div>
                      )}
                    </div>

                    {isApplied ? (
                      <button type="button" disabled className="btn btn-secondary btn-sm" style={{ color: '#059669' }}>
                        <CheckCircle size={15} /> Sudah Dilamar
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleApply(job)}
                        disabled={isSubmittingThis}
                        className="btn btn-primary btn-sm"
                      >
                        <Send size={15} /> {isSubmittingThis ? 'Mengirim...' : 'Lamar Posisi'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="match-progress-bar" style={{ margin: '14px 0 10px', height: '8px' }}>
                  <div
                    className={`match-progress-fill ${isHighMatch ? 'high' : ''}`}
                    style={{ width: `${score}%` }}
                  />
                </div>

                {/* Salary & Details */}
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#059669', marginBottom: '12px' }}>
                  Estimasi Gaji: {formatSalaryRange(job.salaryMin, job.salaryMax)}
                </div>

                {/* Matched vs Missing Skills */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#f8fafc', padding: '14px', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '0.82rem' }}>
                    <span style={{ color: '#059669', fontWeight: 700 }}>
                      ✓ Keahlian Cocok ({job.matchedSkills?.length || 0}):
                    </span>
                    {job.matchedSkills?.length > 0 ? (
                      job.matchedSkills.map((s, idx) => (
                        <span key={idx} style={{ background: '#ecfdf5', color: '#047857', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                          {s}
                        </span>
                      ))
                    ) : (
                      <span style={{ color: '#64748b' }}>Belum ada keahlian spesifik yang cocok</span>
                    )}
                  </div>

                  {job.missingSkills && job.missingSkills.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '0.82rem' }}>
                      <span style={{ color: '#d97706', fontWeight: 700 }}>
                        Saran Upskilling ({job.missingSkills.length}):
                      </span>
                      {job.missingSkills.map((s, idx) => (
                        <span key={idx} style={{ background: '#fffbeb', color: '#b45309', padding: '2px 8px', borderRadius: '4px' }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default RekomendasiAI;