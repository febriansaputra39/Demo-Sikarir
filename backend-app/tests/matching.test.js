const assert = require('assert');
const matchingService = require('../src/services/matchingService');

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

  // Test 1: Calculate match score
  const matchResult = matchingService.calculateMatch(mockCandidate, mockJob);
  assert.ok(matchResult.score >= 80, `Skor kecocokan harus tinggi (aktual: ${matchResult.score})`);
  assert.strictEqual(matchResult.grade, 'Sangat Cocok');
  assert.strictEqual(matchResult.matchedSkills.length, 3, 'Semua 3 required skills harus cocok');
  assert.strictEqual(matchResult.missingSkills.length, 0, 'Tidak boleh ada missing skills');

  // Test 2: Calculate match with missing skills
  const mockCandidate2 = {
    id: 'cand_test_2',
    educationLevel: 'SMA / SMK',
    location: 'Surabaya',
    skills: ['Photoshop'],
    experiences: []
  };

  const matchResult2 = matchingService.calculateMatch(mockCandidate2, mockJob);
  assert.ok(matchResult2.score < 60, `Skor harus lebih rendah (aktual: ${matchResult2.score})`);
  assert.strictEqual(matchResult2.grade, 'Perlu Peningkatan');
  assert.strictEqual(matchResult2.missingSkills.length, 3, 'Semua skill lowongan harus tercatat missing');

  console.log('✅ Semua pengujian Smart Matching Engine berhasil lolos!');
}

runMatchingTests().catch(err => {
  console.error('❌ Pengujian Smart Matching Gagal:', err);
  process.exit(1);
});
