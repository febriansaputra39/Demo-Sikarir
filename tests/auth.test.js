const assert = require('assert');
const authService = require('../src/services/authService');
const userModel = require('../src/models/userModel');
const { verifyToken } = require('../src/utils/generateToken');
const authValidator = require('../src/validators/authValidator');

async function runAuthTests() {
  console.log('--- [TEST] Menjalankan Pengujian Auth ---');

  const testEmail = `test.budi.${Date.now()}@karir.test`;
  const initialPassword = 'Password123';
  const updatedPassword = 'NewPassword456';
  let createdUserId = null;

  try {
    // Test 1: Validator Register (Data Valid)
    const validReg = authValidator.validateRegister({
      name: 'Budi Santoso',
      email: testEmail,
      password: initialPassword,
      role: 'PencariKerja'
    });
    assert.strictEqual(validReg.isValid, true, 'Validasi register data valid harus sukses');

    // Test 2: Validator Register (Data Tidak Valid - 4 Kesalahan)
    const invalidReg = authValidator.validateRegister({
      name: '',
      email: 'budi-bukan-email',
      password: '123',
      role: 'invalidRole'
    });
    assert.strictEqual(invalidReg.isValid, false, 'Validasi register data tidak valid harus gagal');
    assert.strictEqual(invalidReg.errors.length, 4, 'Harus mendeteksi 4 kesalahan');

    // Test 3: Validator Register (Kata Sandi Lemah Tanpa Huruf Besar & Type Confusion)
    const weakPassReg = authValidator.validateRegister({
      name: 'Budi Santoso',
      email: testEmail,
      password: 'password123',
      role: 'PencariKerja'
    });
    assert.strictEqual(weakPassReg.isValid, false, 'Kata sandi tanpa huruf besar harus ditolak');

    const typeConfusionReg = authValidator.validateRegister({
      name: ['Budi'],
      email: ['budi@test.com'],
      password: initialPassword,
      role: 'admin'
    });
    assert.strictEqual(typeConfusionReg.isValid, false, 'Payload array / role admin harus ditolak');

    // Test 4: Registrasi Pengguna Baru & Validasi Token JWT
    const registered = await authService.register({
      name: 'Budi Santoso',
      email: testEmail,
      password: initialPassword,
      role: 'PencariKerja'
    });
    createdUserId = registered.user.id;
    assert.strictEqual(registered.user.email, testEmail.toLowerCase());
    assert.strictEqual(registered.user.role, 'PencariKerja');
    assert.strictEqual(registered.user.password, undefined, 'Password tidak boleh dikembalikan pada respons');
    assert.ok(registered.token, 'Token JWT harus dihasilkan saat registrasi');

    const decodedReg = verifyToken(registered.token);
    assert.strictEqual(decodedReg.id, registered.user.id);
    assert.strictEqual(decodedReg.role, 'PencariKerja');

    // Test 5: Standard Login & Penolakan Kredensial Salah
    const loginResult = await authService.login(testEmail, initialPassword);
    assert.strictEqual(loginResult.user.email, testEmail.toLowerCase());
    assert.strictEqual(loginResult.user.password, undefined, 'Password tidak boleh bocor saat login');
    assert.ok(loginResult.token, 'Token JWT harus dihasilkan saat login');

    await assert.rejects(
      async () => authService.login(testEmail, 'WrongPassword999'),
      (err) => err.statusCode === 401,
      'Login dengan kata sandi salah harus ditolak dengan status 401'
    );

    // Test 6: Login Demo Admin
    const demoAdmin = await authService.loginDemo('admin');
    assert.strictEqual(demoAdmin.user.role, 'admin');
    assert.strictEqual(demoAdmin.user.password, undefined);
    assert.ok(demoAdmin.token, 'Token JWT demo admin harus dihasilkan');

    const decodedAdmin = verifyToken(demoAdmin.token);
    assert.strictEqual(decodedAdmin.id, demoAdmin.user.id);
    assert.strictEqual(decodedAdmin.role, 'admin');

    // Test 7: Alur Permintaan & Reset Kata Sandi
    const forgotRes = await authService.requestPasswordReset(testEmail);
    assert.strictEqual(forgotRes.success, true);
    if (forgotRes.resetToken) {
      const resetRes = await authService.resetPassword(testEmail, updatedPassword, forgotRes.resetToken);
      assert.strictEqual(resetRes.success, true);

      const loginAfterReset = await authService.login(testEmail, updatedPassword);
      assert.strictEqual(loginAfterReset.user.id, createdUserId);
    }

    console.log('✅ Semua pengujian Auth berhasil lolos!');
  } finally {
    // Bersihkan akun uji coba agar database tetap bersih
    if (createdUserId && typeof userModel.delete === 'function') {
      try {
        userModel.delete(createdUserId);
      } catch (_) {
        // Abaikan jika model tidak mendukung penghapusan langsung
      }
    }
  }
}

runAuthTests().catch((err) => {
  console.error('❌ Pengujian Auth Gagal:', err);
  process.exit(1);
});