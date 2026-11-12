const assert = require('assert');
const jobService = require('../src/services/jobService');
const jobValidator = require('../src/validators/jobValidator');

async function runJobTests() {
  console.log('--- [TEST] Menjalankan Pengujian Job & Lowongan ---');

  // Test 1: Validator Create Job
  const validJob = jobValidator.validateCreateJob({
    title: 'Senior Node.js Backend Engineer',
    category: 'IT & Software',
    jobType: 'Full Time',
    description: 'Membangun arsitektur microservices terdistribusi dengan skalabilitas tinggi.'
  });
  assert.strictEqual(validJob.isValid, true, 'Validasi lowongan valid harus sukses');

  // Test 2: Get All Jobs
  const allJobs = await jobService.getAllJobs();
  assert.ok(Array.isArray(allJobs), 'Jobs harus berupa array');
  assert.ok(allJobs.length >= 1, 'Minimal harus ada 1 lowongan awal');

  // Test 3: Filter Jobs by Category
  const itJobs = await jobService.getAllJobs({ category: 'IT & Software' });
  assert.ok(itJobs.every(j => j.category === 'IT & Software'), 'Semua hasil harus berbobot IT & Software');

  // Test 4: Job Stats
  const stats = await jobService.getJobStats();
  assert.ok(stats.total >= 1, 'Total job statistik harus >= 1');
  assert.ok(typeof stats.active === 'number', 'Active count harus berupa angka');

  console.log('✅ Semua pengujian Job & Lowongan berhasil lolos!');
}

runJobTests().catch(err => {
  console.error('❌ Pengujian Job Gagal:', err);
  process.exit(1);
});
