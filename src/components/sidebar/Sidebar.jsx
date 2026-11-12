import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Building2,
  CheckSquare,
  Cpu,
  Activity,
  BarChart3,
  FileText,
  GraduationCap,
  Award,
  Sparkles,
  Send,
  UserCheck,
  PlusCircle,
  FileSpreadsheet
} from 'lucide-react';

export function Sidebar() {
  const { role } = useAuth();

  const adminNav = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard, end: true },
    { label: 'Data Lowongan', path: '/admin/lowongan', icon: Briefcase },
    { label: 'Data Pencari Kerja', path: '/admin/pencari-kerja', icon: Users },
    { label: 'Data Perusahaan', path: '/admin/perusahaan', icon: Building2 },
    { label: 'Verifikasi Lowongan', path: '/admin/verifikasi', icon: CheckSquare },
    { label: 'Smart Matching AI', path: '/admin/smart-matching', icon: Cpu },
    { label: 'Pemantauan Karir', path: '/admin/pemantauan', icon: Activity },
    { label: 'Laporan & Statistik', path: '/admin/laporan', icon: BarChart3 }
  ];

  const pencariKerjaNav = [
    { label: 'Dashboard', path: '/pencari-kerja', icon: LayoutDashboard, end: true },
    { label: 'Cari Lowongan', path: '/pencari-kerja/lowongan', icon: Briefcase },
    { label: 'Lamaran Saya', path: '/pencari-kerja/lamaran', icon: Send },
    { label: 'Rekomendasi AI', path: '/pencari-kerja/rekomendasi', icon: Sparkles },
    { label: 'Profil Saya', path: '/pencari-kerja/profil', icon: Users },
    { label: 'Pendidikan', path: '/pencari-kerja/pendidikan', icon: GraduationCap },
    { label: 'Pengalaman Kerja', path: '/pencari-kerja/pengalaman', icon: Briefcase },
    { label: 'Keterampilan', path: '/pencari-kerja/keterampilan', icon: Award },
    { label: 'Aktivitas Karir', path: '/pencari-kerja/aktivitas', icon: Activity },
    { label: 'Generator CV ATS', path: '/pencari-kerja/cv', icon: FileText }
  ];

  const perusahaanNav = [
    { label: 'Dashboard', path: '/perusahaan', icon: LayoutDashboard, end: true },
    { label: 'Pasang Lowongan', path: '/perusahaan/tambah-lowongan', icon: PlusCircle },
    { label: 'Lowongan Saya', path: '/perusahaan/lowongan', icon: Briefcase },
    { label: 'Lamaran Masuk', path: '/perusahaan/lamaran-masuk', icon: FileSpreadsheet },
    { label: 'Kandidat Rekomendasi', path: '/perusahaan/kandidat', icon: UserCheck },
    { label: 'Profil Perusahaan', path: '/perusahaan/profil', icon: Building2 }
  ];

  const getNavLinks = () => {
    if (role === 'admin') return adminNav;
    if (role === 'Perusahaan') return perusahaanNav;
    return pencariKerjaNav;
  };

  const links = getNavLinks();

  return (
    <aside className="app-sidebar">
      <div className="sidebar-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              background: '#4f46e5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}
          >
            <Sparkles size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff' }}>SiKarir</div>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Sistem Karir Terpadu</div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <span className="nav-section-title">Menu Utama</span>
        {links.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '0.75rem',
            color: '#94a3b8'
          }}
        >
          <div style={{ color: '#ffffff', fontWeight: 600, marginBottom: '2px' }}>
            KarirKu v2.4 (Enterprise)
          </div>
          <div>Sistem Pemantauan Karir & AI Matching Terintegrasi.</div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
