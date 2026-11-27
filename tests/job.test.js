const assert = require('assert');
const jobService = require('../src/services/jobService');
const jobValidator = require('../src/validators/jobValidator');
const userModel = require('../src/models/userModel');

async function runJobTests() {
  console.log('--- [TEST] Menjalankan Pengujian Job & Lowongan ---');

  let createdJobId = null;

  try {
    // Test 1: Validator Create Job (Data Valid & Tidak Valid)
    const validJob = jobValidator.validateCreateJob({
      title: 'Senior Node.js Backend Engineer',
      category: 'IT & Software',
      jobType: 'Full Time',
      workplaceType: 'Hybrid',
      location: 'Bontang',
      salaryMin: 8000000,
      salaryMax: 12000000,
      requiredSkills: ['Node.js', 'Express', 'PostgreSQL'],
      description: 'Membangun arsitektur microservices terdistribusi dengan skalabilitas tinggi.'
    });
    assert.strictEqual(validJob.isValid, true, 'Validasi lowongan valid harus sukses');

    const invalidJob = jobValidator.validateCreateJob({
      title: 'IT',
      category: '',
      jobType: 'InvalidType',
      salaryMin: 15000000,
      salaryMax: 10000000,
      description: 'Pendek'
    });
    assert.strictEqual(invalidJob.isValid, false, 'Validasi lowongan tidak valid harus gagal');
    assert.ok(invalidJob.errors.length >= 4, 'Harus mendeteksi kesalahan judul, kategori, tipe, gaji, dan deskripsi');

    const invalidUpdate = jobValidator.validateUpdateJob({
      requiredSkills: 'bukan-array'
    });
    assert.strictEqual(invalidUpdate.isValid, false, 'requiredSkills non-array pada update harus ditolak');

    // Test 2: Get All Jobs (Visibilitas Publik)
    const allJobs = await jobService.getAllJobs();
    assert.ok(Array.isArray(allJobs), 'Jobs harus berupa array');
    assert.ok(allJobs.length >= 1, 'Minimal harus ada 1 lowongan aktif & terverifikasi');
    assert.ok(
      allJobs.every((j) => j.isActive && j.statusVerifikasi === 'Disetujui'),
      'Query publik hanya boleh mengembalikan lowongan yang aktif dan disetujui'
    );

    // Test 3: Filter Jobs by Category
    const itJobs = await jobService.getAllJobs({ category: 'IT & Software' });
    assert.ok(
      itJobs.every((j) => j.category === 'IT & Software'),
      'Semua hasil filter harus berkategori IT & Software'
    );

    // Test 4: Siklus Hidup Lowongan & Proteksi RBAC / IDOR
    const companies = userModel.findAll((u) => u.role === 'Perusahaan');
    const companyOwner = companies[0] || {
      id: 'comp-test-owner',
      name: 'PT Kaltim Teknologi Uji',
      role: 'Perusahaan',
      avatar: ''
    };
    const otherCompany = {
      id: 'comp-test-intruder',
      name: 'PT Kompetitor Uji',
      role: 'Perusahaan'
    };

    const created = await jobService.createJob(companyOwner, {
      title: 'Full Stack Developer Uji Coba',
      category: 'IT & Software',
      jobType: 'Full Time',
      workplaceType: 'On-site',
      location: 'Bontang',
      requiredSkills: ['React', 'Node.js'],
      description: 'Mengembangkan aplikasi portal karir dan integrasi API internal.',
      statusVerifikasi: 'Disetujui', // Percobaan spoofing harus diabaikan oleh service
      companyId: 'spoofed-id'
    });

    createdJobId = created.id;
    assert.strictEqual(created.companyId, companyOwner.id, 'companyId harus berasal dari akun pembuat yang sah');
    assert.strictEqual(created.statusVerifikasi, 'Menunggu', 'Lowongan baru harus berstatus Menunggu');

    // Cegah perusahaan lain mengubah lowongan (Anti-IDOR)
    await assert.rejects(
      async () => jobService.updateJob(createdJobId, { title: 'Judul Dibajak' }, otherCompany),
      (err) => err.statusCode === 403,
      'Perusahaan lain tidak boleh mengubah lowongan milik perusahaan pembuat'
    );

    // Verifikasi lowongan oleh admin
    const verified = await jobService.verifyJob(createdJobId, 'Disetujui', 'Memenuhi kriteria verifikasi.');
    assert.strictEqual(verified.statusVerifikasi, 'Disetujui');

    // Toggle active oleh pemilik sah
    const toggledOff = await jobService.toggleJobActive(createdJobId, companyOwner);
    assert.strictEqual(toggledOff.isActive, false);

    const toggledOn = await jobService.toggleJobActive(createdJobId, companyOwner);
    assert.strictEqual(toggledOn.isActive, true);

    // Test 5: Job Stats
    const stats = await jobService.getJobStats();
    assert.ok(stats.total >= 1, 'Total job statistik harus >= 1');
    assert.ok(typeof stats.active === 'number', 'Active count harus berupa angka');
    assert.ok(typeof stats.pending === 'number', 'Pending count harus berupa angka');
    assert.ok(typeof stats.rejected === 'number', 'Rejected count harus berupa angka');

    console.log('✅ Semua pengujian Job & Lowongan berhasil lolos!');
  } finally {
    if (createdJobId) {
      try {
        await jobService.deleteJob(createdJobId, { id: 'admin-cleanup', role: 'admin' });
      } catch (_) {
        // Abaikan jika sudah terhapus
      }
    }
  }
}

runJobTests().catch((err) => {
  console.error('❌ Pengujian Job Gagal:', err);
  process.exit(1);
});