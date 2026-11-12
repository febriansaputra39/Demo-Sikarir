import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Bell, LogOut, ChevronDown, Sparkles, User, Briefcase, ShieldCheck } from 'lucide-react';

export function Navbar() {
  const { user, role, logout, loginDemo } = useAuth();
  const navigate = useNavigate();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, title: 'Lamaran baru masuk', time: '10 menit lalu', unread: true },
    { id: 2, title: 'Lowongan Anda berhasil diverifikasi', time: '1 jam lalu', unread: true },
    { id: 3, title: 'Hasil Smart Matching diperbarui', time: '1 hari lalu', unread: false }
  ];

  const handleRoleSwitch = async (newRole) => {
    setShowRoleMenu(false);
    await loginDemo(newRole);
    if (newRole === 'admin') navigate('/admin');
    else if (newRole === 'PencariKerja') navigate('/pencari-kerja');
    else if (newRole === 'Perusahaan') navigate('/perusahaan');
  };

  const getRoleBadge = () => {
    switch (role) {
      case 'admin':
        return <span className="navbar-brand-badge" style={{ background: '#fef2f2', color: '#dc2626', borderColor: '#fca5a5' }}>Administrator</span>;
      case 'Perusahaan':
        return <span className="navbar-brand-badge" style={{ background: '#f0fdf4', color: '#16a34a', borderColor: '#86efac' }}>Perusahaan</span>;
      default:
        return <span className="navbar-brand-badge">Pencari Kerja</span>;
    }
  };

  return (
    <header className="app-navbar">
      <div className="flex items-center gap-3">
        <div className="navbar-brand">
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 10px rgba(79, 70, 229, 0.3)'
            }}
          >
            <Sparkles size={20} />
          </div>
          <span>KarirKu</span>
        </div>
        {getRoleBadge()}
      </div>

      <div className="navbar-actions">
        {/* Quick Role Switcher */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Ganti peran untuk pengujian langsung"
          >
            <span>Uji Peran: <strong>{role || 'PencariKerja'}</strong></span>
            <ChevronDown size={14} />
          </button>

          {showRoleMenu && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '6px',
                width: '210px',
                background: '#ffffff',
                borderRadius: '8px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                border: '1px solid #e2e8f0',
                padding: '6px',
                zIndex: 60
              }}
            >
              <div style={{ fontSize: '0.72rem', color: '#64748b', padding: '6px 10px', fontWeight: 700 }}>
                PILIH PERAN DEMO:
              </div>
              <button
                onClick={() => handleRoleSwitch('admin')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '8px 10px',
                  border: 'none',
                  background: role === 'admin' ? '#f1f5f9' : 'transparent',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#1e293b'
                }}
              >
                <ShieldCheck size={16} color="#ef4444" />
                <span>Administrator</span>
              </button>
              <button
                onClick={() => handleRoleSwitch('PencariKerja')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '8px 10px',
                  border: 'none',
                  background: role === 'PencariKerja' ? '#f1f5f9' : 'transparent',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#1e293b'
                }}
              >
                <User size={16} color="#4f46e5" />
                <span>Pencari Kerja</span>
              </button>
              <button
                onClick={() => handleRoleSwitch('Perusahaan')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '8px 10px',
                  border: 'none',
                  background: role === 'Perusahaan' ? '#f1f5f9' : 'transparent',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#1e293b'
                }}
              >
                <Briefcase size={16} color="#10b981" />
                <span>Perusahaan (HRD)</span>
              </button>
            </div>
          )}
        </div>

        {/* Notifications Popover */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748b',
              position: 'relative'
            }}
            aria-label="Notifikasi"
          >
            <Bell size={18} />
            <span
              style={{
                position: 'absolute',
                top: '6px',
                right: '6px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#ef4444'
              }}
            />
          </button>

          {showNotifications && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '8px',
                width: '280px',
                background: '#ffffff',
                borderRadius: '10px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                border: '1px solid #e2e8f0',
                padding: '12px',
                zIndex: 60
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '8px' }}>
                Pemberitahuan
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    style={{
                      padding: '8px',
                      borderRadius: '6px',
                      background: n.unread ? '#f8fafc' : 'transparent',
                      borderLeft: n.unread ? '3px solid #4f46e5' : 'none'
                    }}
                  >
                    <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{n.title}</div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{n.time}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile Pill & Logout */}
        <div className="flex items-center gap-3">
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
            alt={user?.name || 'User'}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid #e2e8f0'
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#1e293b', lineHeight: 1.2 }}>
              {user?.name || 'Tamu'}
            </span>
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
              {user?.email || 'user@example.com'}
            </span>
          </div>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="btn btn-secondary btn-sm"
            style={{ padding: '8px', borderRadius: '8px' }}
            title="Keluar"
          >
            <LogOut size={16} color="#ef4444" />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
