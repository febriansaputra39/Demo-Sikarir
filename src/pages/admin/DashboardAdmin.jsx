import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import { formatIndonesianDate } from '../../utils/formatDate';
import {
  Users,
  Briefcase,
  Building2,
  TrendingUp,
  CheckCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Activity
} from 'lucide-react';

export function DashboardAdmin() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalPencariKerja: 0,
    totalLowongan: 0,
    totalPerusahaan: 0,
    penyerapanRate: 0,
    bekerjaCount: 0,
    magangCount: 0,
    menganggurCount: 0,
    pelatihanCount: 0
  });
  const [pendingJobs, setPendingJobs] = useState([]);
  const [pendingTotalCount, setPendingTotalCount] = useState(0);
  const [recentApplications, setRecentApplications] = useState([]);

  const loadDashboardData = useCallback(() => {
    try {
      const rawUsers = api.getCollection('users');
      const rawJobs = api.getCollection('jobs');
      const rawApplications = api.getCollection('applications');

      const users = Array.isArray(rawUsers) ? rawUsers : [];
      const jobs = Array.isArray(rawJobs) ? rawJobs : [];
      const applications = Array.isArray(rawApplications) ? rawApplications : [];

      const pencariKerjaList = users.filter((u) => u.role === 'PencariKerja');
      const perusahaanList = users.filter((u) => u.role === 'Perusahaan');

      const bekerja = pencariKerjaList.filter((u) => u.statusKarir === 'Bekerja').length;
      const magang = pencariKerjaList.filter((u) => u.statusKarir === 'Magang').length;
      const menganggur = pencariKerjaList.filter((u) => u.statusKarir === 'Menganggur').length;
      const pelatihan = pencariKerjaList.filter((u) => u.statusKarir === 'Pelatihan').length;

      const totalPk = pencariKerjaList.length;
      const rate = totalPk > 0 ? Math.round(((bekerja + magang) / totalPk) * 100) : 0;

      setStats({
        totalPencariKerja: totalPk,
        totalLowongan: jobs.length,
        totalPerusahaan: perusahaanList.length,
        penyerapanRate: rate,
        bekerjaCount: bekerja,
        magangCount: magang,
        menganggurCount: menganggur,
        pelatihanCount: pelatihan
      });

      const allPending = jobs.filter((j) => j.statusVerifikasi === 'Menunggu');
      setPendingTotalCount(allPending.length);
      setPendingJobs(allPending.slice(0, 5));

      const sortedApps = [...applications].sort(
        (a, b) => new Date(b.appliedAt || 0) - new Date(a.appliedAt || 0)
      );
      setRecentApplications(sortedApps.slice(0, 5));
    } catch (err) {
      console.error('Gagal memuat data dashboard admin:', err);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'Diterima':
        return 'success';
      case 'Jadwal Wawancara':
        return 'primary';
      case 'Seleksi Berkas':
        return 'info';
      case 'Ditolak':
        return 'danger';
      default:
        return 'warning';
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>
            Pusat Kendali Administrator
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '4px' }}>
            Pantau arus ketenagakerjaan, verifikasi mitra perusahaan, dan analisa smart matching secara real-time.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => navigate('/admin/verifikasi')} className="btn btn-primary btn-sm">
            <ShieldCheck size={16} /> Verifikasi Lowongan
          </button>
          <button onClick={() => navigate('/admin/laporan')} className="btn btn-secondary btn-sm">
            <Activity size={16} /> Lihat Laporan
          </button>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-4 mb-6">
        <StatCard
          title="Total Pencari Kerja"
          value={stats.totalPencariKerja}
          icon={Users}
          trend="+12% bulan ini"
          trendType="positive"
          iconBg="#eef2ff"
          iconColor="#4f46e5"
        />
        <StatCard
          title="Total Lowongan Kerja"
          value={stats.totalLowongan}
          icon={Briefcase}
          trend="+8 lowongan baru"
          trendType="positive"
          iconBg="#f0fdf4"
          iconColor="#16a34a"
        />
        <StatCard
          title="Mitra Perusahaan"
          value={stats.totalPerusahaan}
          icon={Building2}
          subtext="Perusahaan terverifikasi"
          iconBg="#fdf2f8"
          iconColor="#db2777"
        />
        <StatCard
          title="Tingkat Penyerapan Karir"
          value={`${stats.penyerapanRate}%`}
          icon={TrendingUp}
          trend="+5.4% YoY"
          trendType="positive"
          iconBg="#fffbeb"
          iconColor="#d97706"
        />
      </div>

      {/* Career Trajectory Breakdown Panel */}
      <div className="grid grid-cols-3 mb-6">
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="card-header">
            <h3 className="card-title">
              <Activity size={20} color="#4f46e5" />
              <span>Status Distribusi Penyerapan Tenaga Kerja</span>
            </h3>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Data Sinkronisasi Terbaru</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.86rem', fontWeight: 600 }}>
                <span style={{ color: '#059669' }}>Sudah Bekerja (Full Time / Kontrak)</span>
                <span>{stats.bekerjaCount} orang ({stats.totalPencariKerja ? Math.round((stats.bekerjaCount / stats.totalPencariKerja) * 100) : 0}%)</span>
              </div>
              <div className="match-progress-bar">
                <div
                  className="match-progress-fill high"
                  style={{ width: `${stats.totalPencariKerja ? (stats.bekerjaCount / stats.totalPencariKerja) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.86rem', fontWeight: 600 }}>
                <span style={{ color: '#0284c7' }}>Program Magang / Internship</span>
                <span>{stats.magangCount} orang ({stats.totalPencariKerja ? Math.round((stats.magangCount / stats.totalPencariKerja) * 100) : 0}%)</span>
              </div>
              <div className="match-progress-bar">
                <div
                  className="match-progress-fill"
                  style={{ width: `${stats.totalPencariKerja ? (stats.magangCount / stats.totalPencariKerja) * 100 : 0}%`, background: '#0ea5e9' }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.86rem', fontWeight: 600 }}>
                <span style={{ color: '#7c3aed' }}>Pelatihan & Upskilling Kompetensi</span>
                <span>{stats.pelatihanCount} orang ({stats.totalPencariKerja ? Math.round((stats.pelatihanCount / stats.totalPencariKerja) * 100) : 0}%)</span>
              </div>
              <div className="match-progress-bar">
                <div
                  className="match-progress-fill"
                  style={{ width: `${stats.totalPencariKerja ? (stats.pelatihanCount / stats.totalPencariKerja) * 100 : 0}%`, background: '#8b5cf6' }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.86rem', fontWeight: 600 }}>
                <span style={{ color: '#d97706' }}>Belum Bekerja / Mencari Peluang</span>
                <span>{stats.menganggurCount} orang ({stats.totalPencariKerja ? Math.round((stats.menganggurCount / stats.totalPencariKerja) * 100) : 0}%)</span>
              </div>
              <div className="match-progress-bar">
                <div
                  className="match-progress-fill medium"
                  style={{ width: `${stats.totalPencariKerja ? (stats.menganggurCount / stats.totalPencariKerja) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Audit / Attention Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="card-header">
              <h3 className="card-title">
                <ShieldCheck size={20} color="#ef4444" />
                <span>Antrean Verifikasi</span>
              </h3>
              <Badge variant="warning">{pendingTotalCount} Menunggu</Badge>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '16px' }}>
              Lowongan pekerjaan yang dipasang oleh perusahaan mitra memerlukan peninjauan kualifikasi sebelum dapat diakses oleh publik.
            </p>

            {pendingJobs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#10b981', fontSize: '0.86rem' }}>
                <CheckCircle size={32} style={{ margin: '0 auto 8px' }} />
                <div>Semua antrean lowongan sudah terverifikasi!</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {pendingJobs.map((job) => (
                  <div
                    key={job.id}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: '#fffbeb',
                      border: '1px solid #fef3c7',
                      fontSize: '0.82rem'
                    }}
                  >
                    <div style={{ fontWeight: 700, color: '#92400e' }}>{job.title}</div>
                    <div style={{ color: '#b45309' }}>{job.companyName}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => navigate('/admin/verifikasi')}
            className="btn btn-outline btn-sm w-full mt-4"
          >
            <span>Buka Halaman Verifikasi</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Recent Applications Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <Clock size={20} color="#4f46e5" />
            <span>Aktivitas Lamaran Terbaru di Sistem</span>
          </h3>
          <button onClick={() => navigate('/admin/pemantauan')} className="btn btn-secondary btn-sm">
            Lihat Pemantauan Penuh
          </button>
        </div>

        <div className="table-responsive">
          <table className="table-custom">
            <thead>
              <tr>
                <th>Nama Pelamar</th>
                <th>Lowongan & Perusahaan</th>
                <th>Kecocokan AI</th>
                <th>Status Tahapan</th>
                <th>Tanggal Pengajuan</th>
              </tr>
            </thead>
            <tbody>
              {recentApplications.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                    Belum ada aktivitas lamaran tercatat di sistem.
                  </td>
                </tr>
              ) : (
                recentApplications.map((app) => (
                  <tr key={app.id}>
                    <td>
                      <strong>{app.applicantName}</strong>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{app.applicantEmail}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{app.jobTitle}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{app.companyName}</div>
                    </td>
                    <td>
                      <Badge variant={(app.matchScore || 0) >= 80 ? 'success' : 'purple'} dot>
                        {app.matchScore || 0}% Match
                      </Badge>
                    </td>
                    <td>
                      <Badge variant={getStatusBadgeVariant(app.status)}>{app.status}</Badge>
                    </td>
                    <td>{app.appliedAt ? formatIndonesianDate(app.appliedAt) : '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default DashboardAdmin;