import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// Layouts
import AdminLayout from '../layouts/AdminLayout';
import PencariKerjaLayout from '../layouts/PencariKerjaLayout';
import PerusahaanLayout from '../layouts/PerusahaanLayout';

// Guards
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';

// Auth Pages
import Login from '../auth/Login';
import Register from '../auth/Register';
import LupaPassword from '../auth/LupaPassword';

// Admin Pages
import DashboardAdmin from '../pages/admin/DashboardAdmin';
import DataLowongan from '../pages/admin/DataLowongan';
import DataPencariKerja from '../pages/admin/DataPencariKerja';
import DataPerusahaan from '../pages/admin/DataPerusahaan';
import VerifikasiLowongan from '../pages/admin/VerifikasiLowongan';
import SmartMatching from '../pages/admin/SmartMatching';
import PemantauanKarir from '../pages/admin/PemantauanKarir';
import Laporan from '../pages/admin/Laporan';

// Pencari Kerja Pages
import DashboardPencariKerja from '../pages/PencariKerja/DashboardPencariKerja';
import Lowongan from '../pages/PencariKerja/Lowongan';
import LamaranSaya from '../pages/PencariKerja/LamaranSaya';
import RekomendasiAI from '../pages/PencariKerja/RekomendasiAI';
import Profil from '../pages/PencariKerja/Profil';
import Pendidikan from '../pages/PencariKerja/Pendidikan';
import PengalamanKerja from '../pages/PencariKerja/PengalamanKerja';
import Keterampilan from '../pages/PencariKerja/Keterampilan';
import AktivitasKarir from '../pages/PencariKerja/AktivitasKarir';
import CV from '../pages/PencariKerja/CV';

// Perusahaan Pages
import DashboardPerusahaan from '../pages/Perusahaan/DashboardPerusahaan';
import TambahLowongan from '../pages/Perusahaan/TambahLowongan';
import LowonganSaya from '../pages/Perusahaan/LowonganSaya';
import LamaranMasuk from '../pages/Perusahaan/LamaranMasuk';
import KandidatRekomendasi from '../pages/Perusahaan/KandidatRekomendasi';
import ProfilPerusahaan from '../pages/Perusahaan/ProfilPerusahaan';

// Smart Root Redirect based on active role
function RootRedirect() {
  const { role, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (role === 'admin') return <Navigate to="/admin" replace />;
  if (role === 'Perusahaan') return <Navigate to="/perusahaan" replace />;
  return <Navigate to="/pencari-kerja" replace />;
}

// 404 Fallback
function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '24px' }}>
      <div className="card text-center" style={{ maxWidth: '440px', padding: '40px' }}>
        <h1 style={{ fontSize: '3.5rem', fontWeight: 800, color: '#4f46e5', marginBottom: '8px' }}>404</h1>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
          Halaman Tidak Ditemukan
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: '20px' }}>
          Tautan halaman yang Anda tuju mungkin sudah dipindahkan atau tidak tersedia.
        </p>
        <a href="/" className="btn btn-primary btn-sm">
          Kembali ke Dashboard
        </a>
      </div>
    </div>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      {/* Root Redirection */}
      <Route path="/" element={<RootRedirect />} />

      {/* Public Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/lupa-password" element={<LupaPassword />} />

      {/* Admin Protected Routes */}
      <Route
        path="/admin"
        element={
          <RoleRoute allowedRole="admin">
            <AdminLayout />
          </RoleRoute>
        }
      >
        <Route index element={<DashboardAdmin />} />
        <Route path="lowongan" element={<DataLowongan />} />
        <Route path="pencari-kerja" element={<DataPencariKerja />} />
        <Route path="perusahaan" element={<DataPerusahaan />} />
        <Route path="verifikasi" element={<VerifikasiLowongan />} />
        <Route path="smart-matching" element={<SmartMatching />} />
        <Route path="pemantauan" element={<PemantauanKarir />} />
        <Route path="laporan" element={<Laporan />} />
      </Route>

      {/* Pencari Kerja Protected Routes */}
      <Route
        path="/pencari-kerja"
        element={
          <RoleRoute allowedRole="PencariKerja">
            <PencariKerjaLayout />
          </RoleRoute>
        }
      >
        <Route index element={<DashboardPencariKerja />} />
        <Route path="lowongan" element={<Lowongan />} />
        <Route path="lamaran" element={<LamaranSaya />} />
        <Route path="rekomendasi" element={<RekomendasiAI />} />
        <Route path="profil" element={<Profil />} />
        <Route path="pendidikan" element={<Pendidikan />} />
        <Route path="pengalaman" element={<PengalamanKerja />} />
        <Route path="keterampilan" element={<Keterampilan />} />
        <Route path="aktivitas" element={<AktivitasKarir />} />
        <Route path="cv" element={<CV />} />
      </Route>

      {/* Perusahaan Protected Routes */}
      <Route
        path="/perusahaan"
        element={
          <RoleRoute allowedRole="Perusahaan">
            <PerusahaanLayout />
          </RoleRoute>
        }
      >
        <Route index element={<DashboardPerusahaan />} />
        <Route path="tambah-lowongan" element={<TambahLowongan />} />
        <Route path="lowongan" element={<LowonganSaya />} />
        <Route path="lamaran-masuk" element={<LamaranMasuk />} />
        <Route path="kandidat" element={<KandidatRekomendasi />} />
        <Route path="profil" element={<ProfilPerusahaan />} />
      </Route>

      {/* 404 Not Found Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default AppRoutes;
