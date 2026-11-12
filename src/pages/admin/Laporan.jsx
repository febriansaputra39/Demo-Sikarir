import { useState, useEffect, useContext, useCallback } from 'react';
import { api } from '../../services/api';
import { NotificationContext } from '../../contexts/NotificationContext';
import { formatNumber } from '../../utils/formatNumber';
import Badge from '../../components/common/Badge';
import { Printer, Download, BarChart3 } from 'lucide-react';

export function Laporan() {
  const notify = useContext(NotificationContext);
  const [period, setPeriod] = useState('2026-Q4');
  const [reportData, setReportData] = useState({
    totalUsers: 0,
    totalPencariKerja: 0,
    totalPerusahaan: 0,
    totalLowongan: 0,
    totalLamaran: 0,
    avgMatchScore: 0,
    absorptionRate: 0,
    sectorBreakdown: []
  });

  const generateReport = useCallback(() => {
    try {
      const rawUsers = api.getCollection('users');
      const rawJobs = api.getCollection('jobs');
      const rawApplications = api.getCollection('applications');

      const users = Array.isArray(rawUsers) ? rawUsers : [];
      const jobs = Array.isArray(rawJobs) ? rawJobs : [];
      const applications = Array.isArray(rawApplications) ? rawApplications : [];

      const pk = users.filter((u) => u.role === 'PencariKerja');
      const pt = users.filter((u) => u.role === 'Perusahaan');
      const bekerja = pk.filter(
        (u) => u.statusKarir === 'Bekerja' || u.statusKarir === 'Magang'
      ).length;
      const rate = pk.length ? Math.round((bekerja / pk.length) * 100) : 0;

      // Hitung rata-rata skor kecocokan secara dinamis dari data lamaran
      const validScores = applications
        .map((a) => Number(a.matchScore))
        .filter((s) => !Number.isNaN(s) && s > 0);
      const avgScore =
        validScores.length > 0
          ? Math.round(validScores.reduce((sum, val) => sum + val, 0) / validScores.length)
          : 0;

      // Sector breakdown
      const sectors = {};
      jobs.forEach((j) => {
        const cat = j.category || 'Lainnya';
        sectors[cat] = (sectors[cat] || 0) + 1;
      });

      const sectorList = Object.keys(sectors)
        .map((cat) => ({
          category: cat,
          count: sectors[cat],
          percentage: jobs.length ? Math.round((sectors[cat] / jobs.length) * 100) : 0
        }))
        .sort((a, b) => b.count - a.count);

      setReportData({
        totalUsers: users.length,
        totalPencariKerja: pk.length,
        totalPerusahaan: pt.length,
        totalLowongan: jobs.length,
        totalLamaran: applications.length,
        avgMatchScore: avgScore,
        absorptionRate: rate,
        sectorBreakdown: sectorList
      });
    } catch {
      notify?.error('Gagal memproses data laporan.');
    }
  }, [notify]);

  useEffect(() => {
    generateReport();
  }, [period, generateReport]);

  const handleExportCSV = () => {
    const rows = [
      ['Periode Laporan', period],
      [],
      ['Ringkasan KPI', 'Nilai'],
      ['Total Pencari Kerja', reportData.totalPencariKerja],
      ['Total Mitra Perusahaan', reportData.totalPerusahaan],
      ['Total Lowongan Tersedia', reportData.totalLowongan],
      ['Total Lamaran Terkirim', reportData.totalLamaran],
      ['Tingkat Penyerapan Kerja', `${reportData.absorptionRate}%`],
      ['Rata-rata Akurasi Smart Match', `${reportData.avgMatchScore}%`],
      [],
      ['Sektor Industri', 'Jumlah Lowongan', 'Pangsa Kebutuhan (%)'],
      ...reportData.sectorBreakdown.map((sec) => [
        `"${sec.category}"`,
        sec.count,
        `${sec.percentage}%`
      ])
    ];

    const csvString = '\uFEFF' + rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Laporan_Penyerapan_Karir_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    notify?.success('File laporan CSV berhasil diunduh!');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a' }}>
            Laporan Kinerja & Analisis Karir
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
            Rekapitulasi statistik ketenagakerjaan, penyerapan kerja, dan tren kebutuhan industri.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }} className="no-print">
          <button onClick={handleExportCSV} className="btn btn-secondary btn-sm">
            <Download size={16} /> Ekspor CSV
          </button>
          <button onClick={handlePrint} className="btn btn-primary btn-sm">
            <Printer size={16} /> Cetak Laporan
          </button>
        </div>
      </div>

      {/* Filter Period */}
      <div className="card mb-6 no-print" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.86rem', fontWeight: 600, color: '#475569' }}>
            Pilih Periode Laporan:
          </span>
          <select
            className="form-select"
            style={{ width: '240px' }}
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="2026-Q4">Kuartal 4 (Okt - Des 2026)</option>
            <option value="2026-Q3">Kuartal 3 (Jul - Sep 2026)</option>
            <option value="2026-Q2">Kuartal 2 (Apr - Jun 2026)</option>
            <option value="2026-Q1">Kuartal 1 (Jan - Mar 2026)</option>
            <option value="2026-Tahunan">Laporan Tahunan 2026</option>
          </select>
          <Badge variant="primary">Laporan Terverifikasi</Badge>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-4 mb-6">
        <div className="card text-center">
          <div style={{ fontSize: '0.82rem', color: '#64748b' }}>Pencari Kerja Aktif</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#4f46e5', margin: '6px 0' }}>
            {formatNumber(reportData.totalPencariKerja)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10b981' }}>+15% dari kuartal lalu</div>
        </div>

        <div className="card text-center">
          <div style={{ fontSize: '0.82rem', color: '#64748b' }}>Mitra Industri</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#059669', margin: '6px 0' }}>
            {formatNumber(reportData.totalPerusahaan)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Korporasi terdaftar</div>
        </div>

        <div className="card text-center">
          <div style={{ fontSize: '0.82rem', color: '#64748b' }}>Tingkat Penyerapan</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0ea5e9', margin: '6px 0' }}>
            {reportData.absorptionRate}%
          </div>
          <div style={{ fontSize: '0.75rem', color: reportData.absorptionRate >= 70 ? '#10b981' : '#d97706' }}>
            {reportData.absorptionRate >= 70 ? 'Di atas target 70%' : 'Target minimal 70%'}
          </div>
        </div>

        <div className="card text-center">
          <div style={{ fontSize: '0.82rem', color: '#64748b' }}>Rata-rata Smart Match</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#8b5cf6', margin: '6px 0' }}>
            {reportData.avgMatchScore}%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Kesesuaian kualifikasi</div>
        </div>
      </div>

      {/* Sector Breakdown Table */}
      <div className="card mb-6">
        <div className="card-header">
          <h3 className="card-title">
            <BarChart3 size={20} color="#4f46e5" />
            <span>Distribusi Kebutuhan Tenaga Kerja per Sektor Industri</span>
          </h3>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Periode: {period}</span>
        </div>

        <div className="table-responsive">
          <table className="table-custom">
            <thead>
              <tr>
                <th>Sektor / Bidang Industri</th>
                <th>Jumlah Lowongan Dibuka</th>
                <th>Pangsa Kebutuhan (%)</th>
                <th>Status Permintaan</th>
              </tr>
            </thead>
            <tbody>
              {reportData.sectorBreakdown.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                    Belum ada data distribusi lowongan per sektor industri.
                  </td>
                </tr>
              ) : (
                reportData.sectorBreakdown.map((sec, idx) => (
                  <tr key={idx}>
                    <td><strong>{sec.category}</strong></td>
                    <td style={{ fontWeight: 600 }}>{sec.count} lowongan</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="match-progress-bar" style={{ width: '120px' }}>
                          <div className="match-progress-fill" style={{ width: `${sec.percentage}%` }} />
                        </div>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>{sec.percentage}%</span>
                      </div>
                    </td>
                    <td>
                      <Badge variant={sec.percentage >= 30 ? 'success' : 'primary'}>
                        {sec.percentage >= 30 ? 'Tinggi' : 'Normal'}
                      </Badge>
                    </td>
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

export default Laporan;