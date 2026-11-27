const userModel = require('../models/userModel');
const jobModel = require('../models/jobModel');
const applicationModel = require('../models/applicationModel');

const createHttpError = (message, statusCode = 400) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

/**
 * Mengamankan nilai sel CSV dari karakter pemisah (koma/newline/kutip)
 * serta mencegah CSV Formula Injection (=, +, -, @, tab, CR).
 */
const escapeCsvCell = (value) => {
  if (value === null || value === undefined) return '';
  let str = String(value);

  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
};

/**
 * Mengurai string periode ('all', '2026', '2026-Q1', '2026-03') menjadi rentang waktu [start, end).
 */
const parsePeriodRange = (period) => {
  if (!period || typeof period !== 'string') return null;
  const clean = period.trim().toUpperCase();
  if (!clean || clean === 'ALL' || clean === 'SEMUA') return null;

  const quarterMatch = clean.match(/^(\d{4})-Q([1-4])$/);
  if (quarterMatch) {
    const year = Number(quarterMatch[1]);
    const quarter = Number(quarterMatch[2]);
    const startMonth = (quarter - 1) * 3;
    return {
      start: new Date(Date.UTC(year, startMonth, 1)),
      end: new Date(Date.UTC(year, startMonth + 3, 1))
    };
  }

  const monthMatch = clean.match(/^(\d{4})-(0[1-9]|1[0-2])$/);
  if (monthMatch) {
    const year = Number(monthMatch[1]);
    const monthIndex = Number(monthMatch[2]) - 1;
    return {
      start: new Date(Date.UTC(year, monthIndex, 1)),
      end: new Date(Date.UTC(year, monthIndex + 1, 1))
    };
  }

  const yearMatch = clean.match(/^(\d{4})$/);
  if (yearMatch) {
    const year = Number(yearMatch[1]);
    return {
      start: new Date(Date.UTC(year, 0, 1)),
      end: new Date(Date.UTC(year + 1, 0, 1))
    };
  }

  throw createHttpError(
    'Format periode tidak valid. Gunakan format YYYY-Q1..Q4, YYYY-MM, YYYY, atau "all".',
    400
  );
};

const isWithinPeriod = (dateStr, range) => {
  if (!range) return true;
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;
  return d >= range.start && d < range.end;
};

const reportService = {
  getSummaryReport(period = 'all') {
    const cleanPeriod = typeof period === 'string' && period.trim() ? period.trim() : 'all';
    const range = parsePeriodRange(cleanPeriod);

    const allUsers = userModel.findAll().filter((u) => isWithinPeriod(u.createdAt, range));
    const pk = allUsers.filter((u) => u.role === 'PencariKerja');
    const pt = allUsers.filter((u) => u.role === 'Perusahaan');
    const jobs = jobModel.findAll().filter((j) => isWithinPeriod(j.createdAt, range));
    const applications = applicationModel
      .findAll()
      .filter((a) => isWithinPeriod(a.appliedAt || a.createdAt, range));

    const absorbed = pk.filter((u) =>
      ['Bekerja', 'Wirausaha', 'Magang'].includes(u.statusKarir)
    ).length;
    const absorptionRate = pk.length > 0 ? Math.round((absorbed / pk.length) * 100) : 0;

    // Rincian sektor industri lowongan
    const sectors = {};
    jobs.forEach((j) => {
      const cat = typeof j.category === 'string' && j.category.trim() ? j.category.trim() : 'Lainnya';
      sectors[cat] = (sectors[cat] || 0) + 1;
    });

    const sectorBreakdown = Object.keys(sectors)
      .map((cat) => ({
        category: cat,
        count: sectors[cat],
        percentage: jobs.length > 0 ? Math.round((sectors[cat] / jobs.length) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);

    // Rincian status lamaran
    const applicationStatusBreakdown = {
      Terkirim: applications.filter((a) => a.status === 'Terkirim').length,
      Ditinjau: applications.filter((a) => a.status === 'Ditinjau').length,
      Wawancara: applications.filter((a) => a.status === 'Wawancara').length,
      Diterima: applications.filter((a) => a.status === 'Diterima').length,
      Ditolak: applications.filter((a) => a.status === 'Ditolak').length,
      Ditarik: applications.filter((a) => a.status === 'Ditarik').length
    };

    // Rata-rata skor kecocokan nyata dari data lamaran
    const validScores = applications
      .map((a) => Number(a.matchScore))
      .filter((score) => !Number.isNaN(score));
    const avgMatchScore =
      validScores.length > 0
        ? Math.round(validScores.reduce((acc, curr) => acc + curr, 0) / validScores.length)
        : 0;

    return {
      period: cleanPeriod,
      generatedAt: new Date().toISOString(),
      totalUsers: allUsers.length,
      totalPencariKerja: pk.length,
      totalPerusahaan: pt.length,
      verifiedPerusahaan: pt.filter((c) => Boolean(c.verified)).length,
      totalLowongan: jobs.length,
      activeLowongan: jobs.filter((j) => j.isActive && j.statusVerifikasi === 'Disetujui').length,
      totalLamaran: applications.length,
      absorptionRate,
      avgMatchScore,
      applicationStatusBreakdown,
      sectorBreakdown
    };
  },

  generateCSV(period = 'all') {
    const report = this.getSummaryReport(period);
    const rows = [
      ['Indikator Laporan Karir & Ketenagakerjaan', 'Nilai'],
      ['Periode', report.period],
      ['Waktu Dibuat (ISO)', report.generatedAt],
      ['Total Pengguna Terdaftar', report.totalUsers],
      ['Total Pencari Kerja Aktif', report.totalPencariKerja],
      ['Total Perusahaan Mitra', report.totalPerusahaan],
      ['Perusahaan Terverifikasi', report.verifiedPerusahaan],
      ['Total Lowongan Dibuka', report.totalLowongan],
      ['Lowongan Aktif & Disetujui', report.activeLowongan],
      ['Total Lamaran Diproses', report.totalLamaran],
      ['Tingkat Penyerapan Kerja', `${report.absorptionRate}%`],
      ['Rata-Rata Skor Kecocokan AI', `${report.avgMatchScore}%`],
      ['', ''],
      ['Status Lamaran', 'Jumlah'],
      ['Terkirim', report.applicationStatusBreakdown.Terkirim],
      ['Ditinjau', report.applicationStatusBreakdown.Ditinjau],
      ['Wawancara', report.applicationStatusBreakdown.Wawancara],
      ['Diterima', report.applicationStatusBreakdown.Diterima],
      ['Ditolak', report.applicationStatusBreakdown.Ditolak],
      ['Ditarik', report.applicationStatusBreakdown.Ditarik],
      ['', ''],
      ['Kategori Sektor Industri', 'Jumlah Lowongan', 'Persentase']
    ];

    if (report.sectorBreakdown.length === 0) {
      rows.push(['Belum ada data lowongan pada periode ini', 0, '0%']);
    } else {
      report.sectorBreakdown.forEach((s) => {
        rows.push([s.category, s.count, `${s.percentage}%`]);
      });
    }

    const csvContent = rows
      .map((row) => row.map((cell) => escapeCsvCell(cell)).join(','))
      .join('\n');

    // Tambahkan UTF-8 BOM agar Excel membaca karakter & pemisah kolom dengan benar
    return `\uFEFF${csvContent}`;
  }
};

module.exports = reportService;