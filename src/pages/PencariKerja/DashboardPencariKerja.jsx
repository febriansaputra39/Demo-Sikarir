import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { applicationService } from '../../services/applicationService';
import { matchingService } from '../../services/matchingService';
import { PencariKerjaService } from '../../services/PencariKerjaService';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import JobCard from '../../components/cards/JobCard';
import { formatIndonesianDate } from '../../utils/formatDate';
import {
  Send,
  Calendar,
  Sparkles,
  CheckCircle2,
  Circle,
  Briefcase,
  UserCheck,
  FileText
} from 'lucide-react';

export function DashboardPencariKerja() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [applications, setApplications] = useState([]);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [highMatchCount, setHighMatchCount] = useState(0);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileStatus, setProfileStatus] = useState({
    percentage: 0,
    hasBio: false,
    hasEducation: false,
    hasExperience: false,
    hasSkills: false
  });

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [myAppsRaw, recJobsRaw, fullProfile] = await Promise.all([
        applicationService.getMyApplications(user.id),
        matchingService.getRecommendationsForCandidate(user.id),
        PencariKerjaService.getFullProfile(user.id).catch(() => null)
      ]);

      const myApps = Array.isArray(myAppsRaw) ? myAppsRaw : [];
      setApplications(myApps);

      const interviewList = myApps.filter(
        (application) => application.status === 'Jadwal Wawancara'
      );
      setInterviews(interviewList);

      const recJobs = Array.isArray(recJobsRaw) ? recJobsRaw : [];
      const goodMatches = recJobs.filter((job) => (job.matchScore ?? 100) >= 80);
      setHighMatchCount(goodMatches.length);
      setRecommendedJobs(recJobs.slice(0, 3));

      if (fullProfile) {
        const hasBio = Boolean(fullProfile.name && fullProfile.phone && fullProfile.bio);
        const hasEducation = Boolean(fullProfile.educations?.length > 0);
        const hasExperience = Boolean(fullProfile.experiences?.length > 0);
        const hasSkills = Boolean(fullProfile.skills?.length > 0);

        const completedSteps = [hasBio, hasEducation, hasExperience, hasSkills].filter(Boolean).length;
        const percentage = Math.round((completedSteps / 4) * 100);

        setProfileStatus({
          percentage,
          hasBio,
          hasEducation,
          hasExperience,
          hasSkills
        });
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [user?.id, loadData]);

  return (
    <div>
      {/* Welcome Hero Banner */}
      <div
        className="card mb-6"
        style={{
          background: 'linear-gradient(135deg, #312e81 0%, #4338ca 50%, #4f46e5 100%)',
          color: '#ffffff',
          padding: '32px',
          border: 'none',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ maxWidth: '640px', position: 'relative', zIndex: 2 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '999px',
              background: 'rgba(255, 255, 255, 0.15)',
              fontSize: '0.78rem',
              fontWeight: 600,
              marginBottom: '14px'
            }}
          >
            <Sparkles size={14} />
            AI Smart Career Navigator
          </div>

          <h1
            style={{
              fontSize: '1.85rem',
              fontWeight: 800,
              color: '#ffffff',
              marginBottom: '8px'
            }}
          >
            Halo, {user?.name || 'Pencari Kerja'}!
          </h1>

          <p
            style={{
              color: '#e0e7ff',
              fontSize: '0.94rem',
              lineHeight: 1.5,
              marginBottom: '20px'
            }}
          >
            Profil Anda saat ini memiliki kecocokan tinggi dengan lowongan di sektor
            teknologi dan rekayasa perangkat lunak.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/pencari-kerja/lowongan')}
              className="btn btn-secondary btn-sm"
              style={{
                background: '#ffffff',
                color: '#4338ca',
                fontWeight: 700
              }}
            >
              <Briefcase size={16} />
              Eksplorasi Lowongan
            </button>

            <button
              onClick={() => navigate('/pencari-kerja/cv')}
              className="btn btn-outline btn-sm"
              style={{
                color: '#ffffff',
                borderColor: 'rgba(255,255,255,0.4)'
              }}
            >
              <FileText size={16} />
              Pratinjau CV ATS
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 mb-6">
        <StatCard
          title="Lamaran Terkirim"
          value={applications.length}
          icon={Send}
          subtext="Total riwayat pengajuan"
          iconBg="#eef2ff"
          iconColor="#4f46e5"
        />

        <StatCard
          title="Jadwal Wawancara"
          value={interviews.length}
          icon={Calendar}
          subtext="Undangan tahap lanjut"
          iconBg="#ecfdf5"
          iconColor="#10b981"
        />

        <StatCard
          title="Rekomendasi AI Cocok"
          value={highMatchCount}
          icon={Sparkles}
          subtext="Match score ≥ 80%"
          iconBg="#f5f3ff"
          iconColor="#8b5cf6"
        />

        <StatCard
          title="Kelengkapan Profil"
          value={`${profileStatus.percentage}%`}
          icon={UserCheck}
          trend={profileStatus.percentage === 100 ? 'Lengkap' : 'Perlu Dilengkapi'}
          trendType={profileStatus.percentage === 100 ? 'positive' : 'warning'}
          iconBg="#fffbeb"
          iconColor="#f59e0b"
        />
      </div>

      {/* Main Sections Grid */}
      <div className="grid grid-cols-3 mb-6">
        {/* Recommended Jobs */}
        <div
          style={{
            gridColumn: 'span 2',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <h3
              style={{
                fontSize: '1.2rem',
                fontWeight: 800,
                color: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Sparkles size={20} color="#6366f1" />
              <span>Lowongan Rekomendasi AI Terbaik untuk Anda</span>
            </h3>

            <button
              onClick={() => navigate('/pencari-kerja/rekomendasi')}
              className="btn btn-secondary btn-sm"
            >
              Lihat Semua
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
          >
            {loading ? (
              <div className="card" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                Memuat rekomendasi lowongan...
              </div>
            ) : recommendedJobs.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                Belum ada rekomendasi lowongan. Lengkapi keahlian dan profil Anda agar AI dapat mencocokkan lowongan terbaik.
              </div>
            ) : (
              recommendedJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onViewDetail={() => navigate('/pencari-kerja/lowongan', { state: { selectedJobId: job.id } })}
                  onApply={() => navigate('/pencari-kerja/lowongan', { state: { selectedJobId: job.id } })}
                />
              ))
            )}
          </div>
        </div>

        {/* Interviews & Profile Progress */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}
        >
          {/* Upcoming Interviews */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <Calendar size={18} color="#10b981" />
                <span>Undangan Wawancara</span>
              </h3>

              <Badge variant="success">
                {interviews.length} Jadwal
              </Badge>
            </div>

            {interviews.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '24px 0',
                  color: '#94a3b8',
                  fontSize: '0.86rem'
                }}
              >
                Belum ada jadwal wawancara aktif.
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                {interviews.map((application) => (
                  <div
                    key={application.id}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      background: '#ecfdf5',
                      border: '1px solid #a7f3d0'
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        color: '#065f46',
                        fontSize: '0.9rem'
                      }}
                    >
                      {application.jobTitle}
                    </div>

                    <div
                      style={{
                        fontSize: '0.8rem',
                        color: '#047857'
                      }}
                    >
                      {application.companyName}
                    </div>

                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: '#059669',
                        marginTop: '6px',
                        fontWeight: 600
                      }}
                    >
                      Waktu:{' '}
                      {formatIndonesianDate(
                        application.interviewDate || application.appliedAt
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Profile Completeness Checklist */}
          <div className="card">
            <h4
              style={{
                fontSize: '1rem',
                fontWeight: 700,
                marginBottom: '14px'
              }}
            >
              Checklist Kesiapan Karir
            </h4>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                fontSize: '0.85rem'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: profileStatus.hasBio ? '#059669' : '#64748b'
                }}
              >
                {profileStatus.hasBio ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                <span>Biodata & Kontak Terisi Lengkap</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: profileStatus.hasEducation ? '#059669' : '#64748b'
                }}
              >
                {profileStatus.hasEducation ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                <span>Riwayat Pendidikan Formal</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: profileStatus.hasExperience ? '#059669' : '#64748b'
                }}
              >
                {profileStatus.hasExperience ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                <span>Pengalaman Kerja Terlampir</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: profileStatus.hasSkills ? '#059669' : '#d97706'
                }}
              >
                {profileStatus.hasSkills ? <CheckCircle2 size={16} /> : <Sparkles size={16} />}
                <span>Daftar Keahlian & Kompetensi</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/pencari-kerja/profil')}
              className="btn btn-outline btn-sm w-full mt-4"
            >
              Perbarui Kelengkapan Profil
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPencariKerja;