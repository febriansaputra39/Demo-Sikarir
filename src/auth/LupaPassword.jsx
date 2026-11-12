import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { NotificationContext } from '../contexts/NotificationContext';
import { Mail, Lock, ArrowLeft, CheckCircle2, KeyRound } from 'lucide-react';

export function LupaPassword() {
  const navigate = useNavigate();
  const notify = useContext(NotificationContext);

  const [step, setStep] = useState(1); // 1 = Request, 2 = Enter OTP & New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      notify?.error('Mohon masukkan alamat email Anda.');
      return;
    }

    setLoading(true);
    try {
      await authService.requestPasswordReset(email);
      notify?.success('Kode verifikasi reset kata sandi telah dikirimkan ke email Anda.');
      setStep(2);
    } catch (err) {
      notify?.error(err.message || 'Gagal mengirim instruksi reset kata sandi.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otp || !newPassword) {
      notify?.error('Mohon masukkan kode OTP dan kata sandi baru.');
      return;
    }
    if (newPassword !== confirmPassword) {
      notify?.error('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(email, newPassword);
      notify?.success('Kata sandi berhasil diperbarui! Silakan masuk dengan kata sandi baru.');
      navigate('/login');
    } catch (err) {
      notify?.error(err.message || 'Gagal mereset kata sandi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '24px' }}>
      <div className="card" style={{ maxWidth: '460px', width: '100%', padding: '36px' }}>
        <Link
          to="/login"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.85rem',
            color: '#64748b',
            marginBottom: '20px'
          }}
        >
          <ArrowLeft size={16} /> Kembali ke Halaman Masuk
        </Link>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              backgroundColor: '#eef2ff',
              color: '#4f46e5',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '14px'
            }}
          >
            <KeyRound size={26} />
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a' }}>
            {step === 1 ? 'Pemulihan Kata Sandi' : 'Buat Kata Sandi Baru'}
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.86rem', marginTop: '6px' }}>
            {step === 1
              ? 'Masukkan alamat email yang terdaftar untuk menerima kode verifikasi pemulihan.'
              : `Masukkan kode verifikasi 6 digit yang dikirimkan ke ${email}`}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleRequestOtp}>
            <div className="form-group">
              <label className="form-label">Alamat Email Terdaftar</label>
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
                  required
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary btn-lg w-full mt-4">
              {loading ? 'Mengirim Instruksi...' : 'Kirim Kode Verifikasi'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
            <div className="form-group">
              <label className="form-label">Kode Verifikasi (OTP Demo: bebas isi 6 digit)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Contoh: 123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Kata Sandi Baru</label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={18}
                  color="#94a3b8"
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type="password"
                  className="form-input"
                  style={{ paddingLeft: '40px' }}
                  placeholder="Minimal 6 karakter"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Konfirmasi Kata Sandi Baru</label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={18}
                  color="#94a3b8"
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type="password"
                  className="form-input"
                  style={{ paddingLeft: '40px' }}
                  placeholder="Ulangi kata sandi"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary btn-lg w-full mt-4">
              {loading ? 'Menyimpan Kata Sandi...' : 'Simpan Kata Sandi Baru'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default LupaPassword;
