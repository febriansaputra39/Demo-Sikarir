const assert = require('assert');
const matchingService = require('../src/services/matchingService');
const userModel = require('../src/models/userModel');
const jobModel = require('../src/models/jobModel');

async function runMatchingTests() {
  console.log('--- [TEST] Menjalankan Pengujian Smart Matching Engine ---');

  const mockCandidate = {
    id: 'cand_test',
    educationLevel: 'S1',
    location: 'Jakarta',
    skills: ['React', 'JavaScript', 'Node.js', 'CSS3', 'REST API'],
    experiences: [{ company: 'Startup Tech', position: 'Developer' }]
  };

  const mockJob = {
    id: 'job_test',
    title: 'Frontend React Engineer',
    educationLevel: 'S1',
    location: 'Jakarta',
    workplaceType: 'Hybrid',
    experienceLevel: '1-3 tahun',
    requiredSkills: ['React', 'JavaScript', 'REST API']
  };

  // Test 1: Calculate match score (Kandidat Sangat Cocok)
  const matchResult = matchingService.calculateMatch(mockCandidate, mockJob);
  assert.ok(matchResult.score >= 80, `Skor kecocokan harus tinggi (aktual: ${matchResult.score})`);
  assert.strictEqual(matchResult.grade, 'Sangat Cocok');
  assert.strictEqual(matchResult.matchedSkills.length, 3, 'Semua 3 required skills harus cocok');
  assert.strictEqual(matchResult.missingSkills.length, 0, 'Tidak boleh ada missing skills');
  assert.ok(matchResult.breakdown && typeof matchResult.breakdown.skillsScore === 'number');

  // Test 2: Calculate match with missing skills & pencegahan false-positive skill pendek
  const mockCandidate2 = {
    id: 'cand_test_2',
    educationLevel: 'SMA / SMK',
    location: 'Surabaya',
    skills: ['Photoshop', 'C', 'R'], // 'C' dan 'R' tidak boleh salah cocok dengan 'React' / 'REST API'
    experiences: []
  };

  const matchResult2 = matchingService.calculateMatch(mockCandidate2, mockJob);
  assert.ok(matchResult2.score < 60, `Skor harus lebih rendah (aktual: ${matchResult2.score})`);
  assert.strictEqual(matchResult2.grade, 'Perlu Peningkatan');
  assert.strictEqual(matchResult2.matchedSkills.length, 0, 'Skill pendek tidak boleh memicu false-positive');
  assert.strictEqual(matchResult2.missingSkills.length, 3, 'Semua skill lowongan harus tercatat missing');

  // Test 3: Normalisasi customWeights & proteksi skor maksimal 100
  const manipulatedWeightResult = matchingService.calculateMatch(mockCandidate, mockJob, {
    skills: 500,
    experience: 200,
    education: 150,
    location: 150
  });
  assert.ok(
    manipulatedWeightResult.score >= 0 && manipulatedWeightResult.score <= 100,
    `Skor harus tetap berada di rentang 0-100 meski customWeights besar (aktual: ${manipulatedWeightResult.score})`
  );

  // Test 4: Remote workplace memberikan skor lokasi maksimal
  const remoteJob = { ...mockJob, location: 'Batam', workplaceType: 'Remote' };
  const remoteMatch = matchingService.calculateMatch(mockCandidate, remoteJob);
  assert.strictEqual(remoteMatch.breakdown.locationScore, 100, 'Lowongan Remote harus menghasilkan locationScore 100');

  // Test 5: Integrasi rekomendasi kandidat & lowongan dari database
  const jobseekers = userModel.findAll((u) => u.role === 'PencariKerja');
  if (jobseekers.length > 0) {
    const jobRecs = await matchingService.getRecommendationsForCandidate(jobseekers[0].id);
    assert.ok(Array.isArray(jobRecs), 'Rekomendasi lowongan harus berupa array');
    for (let i = 1; i < jobRecs.length; i += 1) {
      assert.ok(
        jobRecs[i - 1].matchScore >= jobRecs[i].matchScore,
        'Daftar rekomendasi lowongan harus terurut menurun berdasarkan matchScore'
      );
    }
  }

  const activeJobs = jobModel.findAll({ isActive: true, statusVerifikasi: 'Disetujui' });
  if (activeJobs.length > 0) {
    const candidateRecs = await matchingService.getRecommendationsForJob(activeJobs[0].id);
    assert.ok(Array.isArray(candidateRecs), 'Rekomendasi kandidat harus berupa array');
    assert.ok(
      candidateRecs.every((c) => c.password === undefined),
      'Data sensitif password kandidat tidak boleh bocor pada hasil rekomendasi'
    );
  }

  console.log('✅ Semua pengujian Smart Matching Engine berhasil lolos!');
}

runMatchingTests().catch((err) => {
  console.error('❌ Pengujian Smart Matching Gagal:', err);
  process.exit(1);
});