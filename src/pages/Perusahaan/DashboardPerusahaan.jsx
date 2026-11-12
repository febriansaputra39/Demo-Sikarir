import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { PerusahaanService } from '../../services/PerusahaanService';
import { applicationService } from '../../services/applicationService';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import { formatIndonesianDate } from '../../utils/formatDate';
import {
  Briefcase,
  Users,
  Calendar,
  CheckCircle,
  PlusCircle,
  ArrowRight,
  UserCheck,
  Building2,
  TrendingUp
} from 'lucide-react';

export function DashboardPerusahaan() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    activeJobs: 0,
    totalJobs: 0,
    totalApplications: 0,
    pendingReview: 0,
    scheduledInterviews: 0,
    acceptedCandidates: 0
  });
  const [recentApplications, setRecentApplications] = useState([]);

  useEffect(() => {
    if (user?.id) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      const data = await PerusahaanService.getDashboardStats(user.id);
      setStats(data);

      const apps = await applicationService.getCompanyApplications(user.id);
      setRecentApplications(apps.slice(0, 5));
    } catch (err) {
      console.error('Failed to load employer stats:', err);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>
            Portal Rekrutmen — {user?.name || 'Perusahaan'}
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '4px' }}>
            Kelola pembukaan lowongan kerja, review kandidat pelamar, dan jadwalkan sesi wawancara terpadu.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => navigate('/perusahaan/tambah-lowongan')} className="btn btn-primary btn-sm">
            <PlusCircle size={16} /> Pasang Lowongan Baru
          </button>
          <button onClick={() => navigate('/perusahaan/kandidat')} className="btn btn-secondary btn-sm">
            <UserCheck size={16} /> Cari Talenta Rekomendasi
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 mb-6">
        <StatCard
          title="Lowongan Aktif"
          value={stats.activeJobs}
          icon={Briefcase}
          subtext={`Dari total ${stats.totalJobs} lowongan`}
          iconBg="#eef2ff"
          iconColor="#4f46e5"
        />
        <StatCard
          title="Total Lamaran Masuk"
          value={stats.totalApplications}
          icon={Users}
          trend="+8 kandidat baru"
          trendType="positive"
          iconBg="#f0fdf4"
          iconColor="#16a34a"
        />
        <StatCard
          title="Jadwal Wawancara"
          value={stats.scheduledInterviews}
          icon={Calendar}
          subtext="Interview terjadwal"
          iconBg="#fffbeb"
          iconColor="#d97706"
        />
        <StatCard
          title="Kandidat Diterima"
          value={stats.acceptedCandidates}
          icon={CheckCircle}
          subtext="Penawaran disetujui"
          iconBg="#fdf2f8"
          iconColor="#db2777"
        />
      </div>

      {/* Action banner */}
      <div
        className="card mb-6"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          padding: '24px 30px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', marginBottom: '4px' }}>
            Temukan Talenta Berkompeten Tinggi dengan Smart Matching
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '0.86rem' }}>
            Sistem kami telah memfilter kandidat yang memiliki keterampilan dan portofolio sesuai kebutuhan perusahaan Anda.
          </p>
        </div>
        <button
          onClick={() => navigate('/perusahaan/kandidat')}
          className="btn btn-primary"
          style={{ background: '#6366f1', borderColor: '#6366f1' }}
        >
          <span>Eksplorasi Rekomendasi AI</span>
          <ArrowRight size={16} />
        </button>
      </div>

      {/* Recent Applications Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <Users size={20} color="#4f46e5" />
            <span>Kandidat Pelamar Terbaru</span>
          </h3>
          <button onClick={() => navigate('/perusahaan/lamaran-masuk')} className="btn btn-secondary btn-sm">
            Buka Pelamar Penuh
          </button>
        </div>

        {recentApplications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 0', color: '#94a3b8', fontSize: '0.88rem' }}>
            Belum ada berkas lamaran yang masuk untuk lowongan perusahaan Anda.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table-custom">
              <thead>
                <tr>
                  <th>Nama Pelamar</th>
                  <th>Posisi yang Dilamar</th>
                  <th>Skor Kecocokan AI</th>
                  <th>Status Lamaran</th>
                  <th>Tanggal Pengajuan</th>
                  <th style={{ textAlign: 'center' }}>Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {recentApplications.map((app) => (
                  <tr key={app.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#1e293b' }}>{app.applicantName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{app.applicantEmail}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{app.jobTitle}</div>
                    </td>
                    <td>
                      <Badge variant={app.matchScore >= 80 ? 'success' : 'purple'} dot>
                        {app.matchScore}% Match
                      </Badge>
                    </td>
                    <td>
                      <Badge variant="info">{app.status}</Badge>
                    </td>
                    <td>{formatIndonesianDate(app.appliedAt)}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => navigate('/perusahaan/lamaran-masuk')}
                        className="btn btn-primary btn-sm"
                      >
                        Tinjau Berkas
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardPerusahaan;
