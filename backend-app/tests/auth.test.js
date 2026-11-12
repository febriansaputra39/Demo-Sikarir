const assert = require('assert');
const authService = require('../src/services/authService');
const { verifyToken } = require('../src/utils/generateToken');
const authValidator = require('../src/validators/authValidator');

async function runAuthTests() {
  console.log('--- [TEST] Menjalankan Pengujian Auth ---');

  // Test 1: Validator Register
  const validReg = authValidator.validateRegister({
    name: 'Budi Santoso',
    email: 'budi@test.com',
    password: 'password123',
    role: 'PencariKerja'
  });
  assert.strictEqual(validReg.isValid, true, 'Validasi register data valid harus sukses');

  const invalidReg = authValidator.validateRegister({
    name: '',
    email: 'budi-bukan-email',
    password: '123',
    role: 'invalidRole'
  });
  assert.strictEqual(invalidReg.isValid, false, 'Validasi register data tidak valid harus gagal');
  assert.strictEqual(invalidReg.errors.length, 4, 'Harus mendeteksi 4 kesalahan');

  // Test 2: Login Demo Admin
  const demoAdmin = await authService.loginDemo('admin');
  assert.strictEqual(demoAdmin.user.role, 'admin');
  assert.ok(demoAdmin.token, 'Token JWT harus dihasilkan');

  const decoded = verifyToken(demoAdmin.token);
  assert.strictEqual(decoded.id, demoAdmin.user.id);
  assert.strictEqual(decoded.role, 'admin');

  // Test 3: Standard Login
  const loginResult = await authService.login('admin@karir.go.id', 'password123');
  assert.strictEqual(loginResult.user.email, 'admin@karir.go.id');
  assert.strictEqual(loginResult.user.role, 'admin');

  console.log('✅ Semua pengujian Auth berhasil lolos!');
}

runAuthTests().catch(err => {
  console.error('❌ Pengujian Auth Gagal:', err);
  process.exit(1);
});
