import { useState, useEffect, useContext, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { NotificationContext } from '../../contexts/NotificationContext';
import { parseRupiahInput, formatRupiah } from '../../utils/formatNumber';
import { formatIndonesianDate } from '../../utils/formatDate';
import Badge from '../../components/common/Badge';
import {
  Save,
  Upload,
  FileText,
  Download,
  Trash2,
  Eye,
  FolderOpen
} from 'lucide-react';

const DOCUMENT_TYPES = [
  'CV / Resume',
  'KTP / Identitas',
  'Ijazah & Transkrip Nilai',
  'Sertifikat Kompetensi',
  'Portofolio',
  'Surat Referensi / Lainnya'
];

const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'];
const MAX_FILE_SIZE_MB = 2;

export function Profil() {
  const { user, updateProfile } = useAuth();
  const notify = useContext(NotificationContext);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    headline: '',
    location: '',
    bio: '',
    targetGaji: '',
    statusKarir: 'Bekerja'
  });

  const [documents, setDocuments] = useState([]);
  const [selectedDocType, setSelectedDocType] = useState('CV / Resume');
  const [docLabel, setDocLabel] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        headline: user.headline || '',
        location: user.location || '',
        bio: user.bio || '',
        targetGaji: user.targetGaji || '',
        statusKarir: user.statusKarir || 'Bekerja'
      });
      setDocuments(Array.isArray(user.documents) ? user.documents : []);
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSalaryChange = (e) => {
    const numeric = parseRupiahInput(e.target.value);
    setFormData((prev) => ({ ...prev, targetGaji: numeric }));
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      notify?.error('Format file tidak didukung. Gunakan PDF, DOC, DOCX, JPG, atau PNG.');
      e.target.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      notify?.error(`Ukuran file maksimal ${MAX_FILE_SIZE_MB} MB.`);
      e.target.value = '';
      return;
    }

    setUploading(true);
    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const newDoc = {
          id: `doc-${Date.now()}`,
          title: docLabel.trim() || file.name,
          fileName: file.name,
          docType: selectedDocType,
          fileSize: file.size,
          mimeType: file.type,
          dataUrl: reader.result,
          uploadedAt: new Date().toISOString()
        };

        const updatedDocs = [newDoc, ...documents];
        setDocuments(updatedDocs);
        await updateProfile({ ...formData, documents: updatedDocs });

        setDocLabel('');
        notify?.success(`Berkas "${newDoc.title}" berhasil diunggah dan disimpan!`);
      } catch {
        notify?.error('Gagal menyimpan berkas. Pastikan ukuran file tidak terlalu besar.');
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.onerror = () => {
      setUploading(false);
      notify?.error('Gagal membaca file yang dipilih.');
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    reader.readAsDataURL(file);
  };

  const handlePreviewDoc = (doc) => {
    if (!doc.dataUrl) {
      notify?.error('Pratinjau berkas tidak tersedia.');
      return;
    }
    const win = window.open();
    if (win) {
      win.document.write(
        `<iframe src="${doc.dataUrl}" frameborder="0" style="border:0; top:0; left:0; bottom:0; right:0; width:100%; height:100%;" allowfullscreen></iframe>`
      );
    }
  };

  const handleDownloadDoc = (doc) => {
    if (!doc.dataUrl) {
      notify?.error('File tidak tersedia untuk diunduh.');
      return;
    }
    const link = document.createElement('a');
    link.href = doc.dataUrl;
    link.download = doc.fileName || `${doc.title}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteDoc = async (docId, docTitle) => {
    if (!window.confirm(`Hapus berkas "${docTitle}"?`)) return;
    try {
      const updatedDocs = documents.filter((d) => d.id !== docId);
      setDocuments(updatedDocs);
      await updateProfile({ ...formData, documents: updatedDocs });
      notify?.success('Berkas berhasil dihapus.');
    } catch {
      notify?.error('Gagal menghapus berkas.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile({ ...formData, documents });
      notify?.success('Profil pribadi Anda berhasil diperbarui!');
    } catch {
      notify?.error('Gagal memperbarui profil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a' }}>
          Profil Saya
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
          Informasi ini digunakan dalam resume CV ATS dan kalkulasi kecocokan algoritma Smart Matching.
        </p>
      </div>

      {/* Form Informasi Pribadi */}
      <div className="card" style={{ marginBottom: '24px' }}>
        {/* Avatar banner */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '28px', paddingBottom: '20px', borderBottom: '1px solid #e2e8f0' }}>
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
            alt="Avatar"
            style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #e0e7ff' }}
          />
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{formData.name || 'Nama Kandidat'}</h3>
            <div style={{ color: '#4f46e5', fontWeight: 600, fontSize: '0.9rem' }}>{formData.headline || 'Spesialisasi Karir'}</div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>{formData.email}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2">
            <div className="form-group">
              <label className="form-label">Nama Lengkap & Gelar</label>
              <input
                type="text"
                name="name"
                className="form-input"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Headline Profesional</label>
              <input
                type="text"
                name="headline"
                className="form-input"
                placeholder="Contoh: Frontend Developer & UI Specialist"
                value={formData.headline}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-2">
            <div className="form-group">
              <label className="form-label">Nomor WhatsApp / HP</label>
              <input
                type="text"
                name="phone"
                className="form-input"
                placeholder="08123456789"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Kota Domisili</label>
              <input
                type="text"
                name="location"
                className="form-input"
                placeholder="Jakarta Selatan, DKI Jakarta"
                value={formData.location}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-2">
            <div className="form-group">
              <label className="form-label">Status Penyerapan Karir Saat Ini</label>
              <select
                name="statusKarir"
                className="form-select"
                value={formData.statusKarir}
                onChange={handleChange}
              >
                <option value="Bekerja">Sudah Bekerja</option>
                <option value="Magang">Program Magang</option>
                <option value="Pelatihan">Sedang Pelatihan</option>
                <option value="Menganggur">Belum Bekerja / Mencari Peluang</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Ekspektasi Gaji Bulanan</label>
              <input
                type="text"
                className="form-input"
                placeholder="Contoh: Rp 9.000.000"
                value={formData.targetGaji ? formatRupiah(formData.targetGaji) : ''}
                onChange={handleSalaryChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Ringkasan Pribadi (Bio Profesional)</label>
            <textarea
              name="bio"
              className="form-textarea"
              rows={4}
              placeholder="Ceritakan latar belakang kompetensi, keahlian utama, dan motivasi karir Anda..."
              value={formData.bio}
              onChange={handleChange}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button type="submit" disabled={loading} className="btn btn-primary">
              <Save size={16} />
              <span>{loading ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Bagian Brankas / Upload Berkas Pelamar */}
      <div className="card">
        <div style={{ marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FolderOpen size={20} color="#4f46e5" />
            <span>Berkas & Dokumen Pelamar</span>
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.84rem', marginTop: '4px' }}>
            Simpan dokumen penting Anda (CV PDF, Ijazah, KTP, Sertifikat) agar siap digunakan sewaktu-waktu saat melamar pekerjaan.
          </p>
        </div>

        {/* Form Upload Berkas */}
        <div
          style={{
            background: '#f8fafc',
            border: '1px dashed #cbd5e1',
            borderRadius: '10px',
            padding: '18px',
            marginBottom: '20px'
          }}
        >
          <div className="grid grid-cols-2" style={{ marginBottom: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Jenis Berkas</label>
              <select
                className="form-select"
                value={selectedDocType}
                onChange={(e) => setSelectedDocType(e.target.value)}
              >
                {DOCUMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Keterangan / Nama Berkas (Opsional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Contoh: CV Terbaru 2026 / Ijazah S1"
                value={docLabel}
                onChange={(e) => setDocLabel(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Format: PDF, DOC, DOCX, JPG, PNG (Maks. {MAX_FILE_SIZE_MB} MB)
            </span>

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-primary btn-sm"
              >
                <Upload size={15} />
                <span>{uploading ? 'Mengunggah...' : 'Pilih & Unggah Berkas'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Daftar Berkas Tersimpan */}
        {documents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '28px 16px', color: '#94a3b8', fontSize: '0.86rem' }}>
            Belum ada berkas yang diunggah. Unggah berkas Anda di atas agar siap dipakai kapan saja.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {documents.map((doc) => (
              <div
                key={doc.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                  padding: '14px 16px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  background: '#ffffff'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      background: '#eef2ff',
                      color: '#4f46e5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <FileText size={20} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a', wordBreak: 'break-word' }}>
                      {doc.title}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '4px', fontSize: '0.78rem', color: '#64748b' }}>
                      <Badge variant="info">{doc.docType}</Badge>
                      <span>{formatFileSize(doc.fileSize)}</span>
                      {doc.uploadedAt && <span>• Diunggah {formatIndonesianDate(doc.uploadedAt)}</span>}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {(doc.mimeType?.includes('pdf') || doc.mimeType?.startsWith('image/')) && (
                    <button
                      type="button"
                      onClick={() => handlePreviewDoc(doc)}
                      className="btn btn-secondary btn-sm"
                      title="Lihat Berkas"
                    >
                      <Eye size={14} /> Lihat
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDownloadDoc(doc)}
                    className="btn btn-secondary btn-sm"
                    title="Unduh Berkas"
                  >
                    <Download size={14} /> Unduh
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteDoc(doc.id, doc.title)}
                    className="btn btn-secondary btn-sm"
                    style={{ color: '#ef4444' }}
                    title="Hapus Berkas"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Profil;