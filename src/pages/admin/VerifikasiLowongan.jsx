import { useState, useEffect, useContext, useCallback } from 'react';
import { jobService } from '../../services/jobService';
import { NotificationContext } from '../../contexts/NotificationContext';
import { formatSalaryRange } from '../../utils/formatNumber';
import { formatIndonesianDate } from '../../utils/formatDate';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import { CheckCircle, XCircle, ShieldAlert, Building2, MapPin } from 'lucide-react';

export function VerifikasiLowongan() {
  const notify = useContext(NotificationContext);
  const [pendingJobs, setPendingJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  // Review & Reject Modal
  const [activeJob, setActiveJob] = useState(null);
  const [rejectNote, setRejectNote] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  const fetchPendingJobs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await jobService.getAllJobs({ statusVerifikasi: 'Menunggu' });
      setPendingJobs(Array.isArray(data) ? data : []);
    } catch {
      notify?.error('Gagal mengambil antrean verifikasi lowongan.');
      setPendingJobs([]);
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    fetchPendingJobs();
  }, [fetchPendingJobs]);

  const handleApprove = async (job) => {
    if (processingId) return;
    setProcessingId(job.id);
    try {
      await jobService.verifyJob(
        job.id,
        'Disetujui',
        'Lowongan telah diverifikasi dan memenuhi standar.'
      );
      notify?.success(`Lowongan "${job.title}" oleh ${job.companyName} berhasil disetujui!`);
      fetchPendingJobs();
    } catch {
      notify?.error('Gagal menyetujui lowongan.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenRejectModal = (job) => {
    setActiveJob(job);
    setRejectNote('');
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!activeJob || processingId) return;
    setProcessingId(activeJob.id);
    try {
      await jobService.verifyJob(
        activeJob.id,
        'Ditolak',
        rejectNote.trim() || 'Kualifikasi atau informasi belum memenuhi standar.'
      );
      notify?.warning(`Lowongan "${activeJob.title}" ditolak.`);
      setIsRejectModalOpen(false);
      setRejectNote('');
      setActiveJob(null);
      fetchPendingJobs();
    } catch {
      notify?.error('Gagal menolak lowongan.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a' }}>
            Antrean Verifikasi Lowongan
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
            Tinjau kepatuhan standar gaji, deskripsi, dan kualifikasi lowongan yang dipasang perusahaan sebelum ditayangkan.
          </p>
        </div>
        <Badge variant="warning" dot>
          {pendingJobs.length} Menunggu Tindakan
        </Badge>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>
          Memuat antrean verifikasi lowongan...
        </div>
      ) : pendingJobs.length === 0 ? (
        <EmptyState
          title="Tidak Ada Antrean Menunggu"
          description="Semua lowongan dari perusahaan mitra telah selesai ditinjau dan diverifikasi."
          icon={CheckCircle}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {pendingJobs.map((job) => {
            const isProcessing = processingId === job.id;

            return (
              <div key={job.id} className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <img
                      src={job.companyLogo || 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?auto=format&fit=crop&w=100&q=80'}
                      alt={job.companyName}
                      style={{ width: '52px', height: '52px', borderRadius: '10px', objectFit: 'cover' }}
                    />
                    <div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>{job.title}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b', fontSize: '0.84rem', flexWrap: 'wrap', marginTop: '4px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#334155' }}>
                          <Building2 size={14} /> <strong>{job.companyName}</strong>
                        </span>
                        {job.location && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={14} /> {job.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => handleOpenRejectModal(job)}
                      disabled={isProcessing}
                      className="btn btn-secondary btn-sm"
                      style={{ color: '#dc2626' }}
                    >
                      <XCircle size={16} /> Tolak Lowongan
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApprove(job)}
                      disabled={isProcessing}
                      className="btn btn-success btn-sm"
                    >
                      <CheckCircle size={16} /> {isProcessing ? 'Memproses...' : 'Setujui & Terbitkan'}
                    </button>
                  </div>
                </div>

                {/* Badges */}
                <div style={{ display: 'flex', gap: '8px', margin: '14px 0', flexWrap: 'wrap' }}>
                  {job.category && <Badge variant="primary">{job.category}</Badge>}
                  {job.jobType && <Badge variant="info">{job.jobType}</Badge>}
                  {job.workplaceType && <Badge variant="purple">{job.workplaceType}</Badge>}
                  <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#059669', alignSelf: 'center', marginLeft: '8px' }}>
                    {formatSalaryRange(job.salaryMin, job.salaryMax)}
                  </span>
                </div>

                {/* Description preview */}
                <p style={{ fontSize: '0.86rem', color: '#475569', lineHeight: 1.6, marginBottom: '14px' }}>
                  {job.description}
                </p>

                {/* Skills required */}
                {job.requiredSkills?.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Kompetensi Wajib:</span>
                    {job.requiredSkills.map((s, idx) => (
                      <span key={idx} style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', color: '#334155' }}>
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '14px', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                  Diajukan pada: {job.createdAt ? formatIndonesianDate(job.createdAt) : '-'}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => !processingId && setIsRejectModalOpen(false)}
        title="Konfirmasi Penolakan Lowongan"
      >
        <div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px', color: '#dc2626' }}>
            <ShieldAlert size={24} />
            <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>
              Berikan catatan penolakan untuk "{activeJob?.title}"
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Alasan Penolakan / Masukan Revisi:</label>
            <textarea
              className="form-textarea"
              rows={4}
              placeholder="Contoh: Deskripsi pekerjaan belum mencantumkan kualifikasi pendidikan yang jelas, atau rentang gaji tidak sesuai UMR..."
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button
              type="button"
              onClick={() => setIsRejectModalOpen(false)}
              disabled={Boolean(processingId)}
              className="btn btn-secondary"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleConfirmReject}
              disabled={Boolean(processingId)}
              className="btn btn-danger"
            >
              {processingId ? 'Memproses...' : 'Tolak Lowongan'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default VerifikasiLowongan;