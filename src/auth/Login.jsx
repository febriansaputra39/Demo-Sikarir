import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { NotificationContext } from '../contexts/NotificationContext';
import { Sparkles, Mail, Lock, Eye, EyeOff, ShieldCheck, User, Building2, ArrowRight } from 'lucide-react';

export function Login() {
  const navigate = useNavigate();
  const { login, loginDemo } = useAuth();
  const notify = useContext(NotificationContext);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      notify?.error('Mohon isi alamat email dan kata sandi Anda.');
      return;
    }

    setLoading(true);
    try {
      const user = await login(email, password);
      notify?.success(`Selamat datang kembali, ${user.name}!`);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'Perusahaan') navigate('/perusahaan');
      else navigate('/pencari-kerja');
    } catch (err) {
      notify?.error(err.message || 'Gagal masuk. Periksa email dan password.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role) => {
    setLoading(true);
    try {
      const user = await loginDemo(role);
      notify?.success(`Login demo sebagai ${role} berhasil!`);
      if (role === 'admin') navigate('/admin');
      else if (role === 'Perusahaan') navigate('/perusahaan');
      else navigate('/pencari-kerja');
    } catch (err) {
      notify?.error(err.message || 'Gagal login demo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#0f172a' }}>
      {/* Left Branding Showcase */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px 48px',
          background: 'linear-gradient(145deg, #1e1b4b 0%, #312e81 50%, #0f172a 100%)',
          position: 'relative',
          overflow: 'hidden'
        }}
        className="hide-mobile"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}
          >
            <Sparkles size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>SiKarir</h2>
            <div style={{ fontSize: '0.78rem', color: '#c7d2fe' }}>Sistem Pemantauan Karir & Smart Matching</div>
          </div>
        </div>

        <div style={{ maxWidth: '520px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '999px',
              background: 'rgba(99, 102, 241, 0.2)',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              color: '#c7d2fe',
              fontSize: '0.8rem',
              fontWeight: 600,
              marginBottom: '20px'
            }}
          >
            <Sparkles size={14} /> Solusi Penyerapan Tenaga Kerja Nasional
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.2, marginBottom: '18px' }}>
            Akselerasi Karir & Temukan Talenta Terbaik dengan AI.
          </h1>
          <p style={{ color: '#cbd5e1', fontSize: '1.02rem', lineHeight: 1.6 }}>
            Pantau penyerapan kerja, sinkronisasi profil kompetensi, dan temukan kecocokan lowongan secara akurat dengan algoritma pencocokan multi-faktor.
          </p>
        </div>

        <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
          © 2026 Sistem Pemantauan Karir. Seluruh Hak Cipta Dilindungi.
        </div>
      </div>

      {/* Right Login Card */}
      <div
        style={{
          flex: 1,
          maxWidth: '560px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '48px 40px',
          background: '#ffffff'
        }}
      >
        <div style={{ maxWidth: '420px', width: '100%', margin: '0 auto' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
            Masuk ke Akun
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '28px' }}>
            Masukkan kredensial akun Anda untuk mengakses dashboard.
          </p>

          {/* Quick Demo Logins */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
              Masuk Cepat (Akses Demo 1-Klik):
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleDemoLogin('admin')}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem', padding: '8px 4px', display: 'flex', flexDirection: 'column', gap: '4px' }}
              >
                <ShieldCheck size={18} color="#ef4444" />
                <span>Admin</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('PencariKerja')}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem', padding: '8px 4px', display: 'flex', flexDirection: 'column', gap: '4px' }}
              >
                <User size={18} color="#4f46e5" />
                <span>Pencari Kerja</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('Perusahaan')}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem', padding: '8px 4px', display: 'flex', flexDirection: 'column', gap: '4px' }}
              >
                <Building2 size={18} color="#10b981" />
                <span>Perusahaan</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '20px 0', color: '#cbd5e1' }}>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>atau dengan formulir</span>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Alamat Email</label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={18}
                  color="#94a3b8"
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type="email"
                  className="form-input"
                  style={{ paddingLeft: '40px' }}
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">Kata Sandi</label>
                <Link to="/lupa-password" style={{ fontSize: '0.78rem', color: '#4f46e5', fontWeight: 600 }}>
                  Lupa kata sandi?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={18}
                  color="#94a3b8"
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  style={{ paddingLeft: '40px', paddingRight: '40px' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94a3b8'
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg w-full mt-4"
              style={{ fontWeight: 700 }}
            >
              <span>{loading ? 'Memverifikasi...' : 'Masuk ke Sistem'}</span>
              <ArrowRight size={18} />
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.88rem', color: '#64748b' }}>
            Belum memiliki akun?{' '}
            <Link to="/register" style={{ fontWeight: 700, color: '#4f46e5' }}>
              Daftar Sekarang
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
