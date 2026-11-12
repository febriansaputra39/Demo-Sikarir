import { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { applicationService } from '../../services/applicationService';
import { NotificationContext } from '../../contexts/NotificationContext';
import { formatIndonesianDate, formatRelativeTime } from '../../utils/formatDate';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import { Send, Building2, Eye } from 'lucide-react';

const STATUS_TABS = [
  'Semua',
  'Terkirim',
  'Seleksi Berkas',
  'Jadwal Wawancara',
  'Diterima',
  'Ditolak'
];

export function LamaranSaya() {
  const { user } = useAuth();
  const notify = useContext(NotificationContext);
  const navigate = useNavigate();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Semua');

  // Timeline Modal
  const [selectedApp, setSelectedApp] = useState(null);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);

  const fetchMyApplications = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await applicationService.getMyApplications(user.id);
      setApplications(Array.isArray(data) ? data : []);
    } catch {
      notify?.error('Gagal memuat daftar lamaran.');
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, notify]);

  useEffect(() => {
    if (user?.id) {
      fetchMyApplications();
    } else {
      setLoading(false);
    }
  }, [user?.id, fetchMyApplications]);

  const handleWithdraw = async (appId) => {
    if (window.confirm('Apakah Anda yakin ingin membatalkan lamaran ini?')) {
      try {
        await applicationService.withdrawApplication(appId);
        notify?.info('Lamaran berhasil dibatalkan.');
        fetchMyApplications();
      } catch {
        notify?.error('Gagal membatalkan lamaran.');
      }
    }
  };

  const getTabCount = (tab) => {
    if (tab === 'Semua') return applications.length;
    return applications.filter((a) => a.status === tab).length;
  };

  const filteredApps = applications.filter((a) => {
    if (activeTab === 'Semua') return true;
    return a.status === activeTab;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Diterima':
        return <Badge variant="success" dot>Diterima Bekerja</Badge>;
      case 'Jadwal Wawancara':
        return <Badge variant="primary" dot>Jadwal Wawancara</Badge>;
      case 'Seleksi Berkas':
        return <Badge variant="info" dot>Seleksi Berkas</Badge>;
      case 'Ditolak':
        return <Badge variant="danger" dot>Tidak Lolos</Badge>;
      default:
        return <Badge variant="warning" dot>Terkirim</Badge>;
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a' }}>
          Riwayat & Pemantauan Lamaran Saya
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
          Pantau status seleksi berkas, jadwal wawancara, dan tawaran kerja secara transparan.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 16px',
              border: 'none',
              background: 'transparent',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              color: activeTab === tab ? '#4f46e5' : '#64748b',
              borderBottom: activeTab === tab ? '2px solid #4f46e5' : '2px solid transparent',
              transition: 'all 0.15s ease'
            }}
          >
            {tab} ({getTabCount(tab)})
          </button>
        ))}
      </div>

      {/* Application List */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          Memuat riwayat lamaran...
        </div>
      ) : filteredApps.length === 0 ? (
        <EmptyState
          title="Belum Ada Lamaran"
          description={
            activeTab === 'Semua'
              ? 'Anda belum memiliki riwayat lamaran pekerjaan.'
              : `Anda belum memiliki lamaran pada tahapan "${activeTab}".`
          }
          actionText="Cari Lowongan Sekarang"
          onAction={() => navigate('/pencari-kerja/lowongan')}
          icon={Send}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredApps.map((app) => (
            <div key={app.id} className="card card-hoverable">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>{app.jobTitle}</h3>
                  <div style={{ fontSize: '0.88rem', color: '#4f46e5', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', margin: '4px 0' }}>
                    <Building2 size={15} /> {app.companyName}
                  </div>
                  {app.appliedAt && (
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                      Diajukan pada: {formatIndonesianDate(app.appliedAt)} ({formatRelativeTime(app.appliedAt)})
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  {getStatusBadge(app.status)}
                  <button
                    onClick={() => {
                      setSelectedApp(app);
                      setIsTimelineOpen(true);
                    }}
                    className="btn btn-secondary btn-sm"
                  >
                    <Eye size={15} /> Lihat Timeline
                  </button>
                  {app.status === 'Terkirim' && (
                    <button
                      onClick={() => handleWithdraw(app.id)}
                      className="btn btn-outline btn-sm"
                      style={{ color: '#ef4444', borderColor: '#fca5a5' }}
                    >
                      Batalkan
                    </button>
                  )}
                </div>
              </div>

              {app.coverLetter && (
                <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', marginTop: '14px', fontSize: '0.82rem', color: '#475569' }}>
                  <strong>Cover Letter:</strong> "{app.coverLetter}"
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Timeline Progres */}
      <Modal
        isOpen={isTimelineOpen}
        onClose={() => setIsTimelineOpen(false)}
        title="Jejak Rekrutmen & Progres Lamaran"
      >
        {selectedApp && (
          <div>
            <div style={{ marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid #e2e8f0' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{selectedApp.jobTitle}</h4>
              <div style={{ color: '#4f46e5', fontWeight: 600 }}>{selectedApp.companyName}</div>
            </div>

            {selectedApp.timeline?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative', paddingLeft: '16px' }}>
                {selectedApp.timeline.map((step, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: '#eef2ff',
                        color: '#4f46e5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        flexShrink: 0
                      }}
                    >
                      {idx + 1}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>{step.status}</div>
                      {step.note && <div style={{ fontSize: '0.82rem', color: '#64748b' }}>{step.note}</div>}
                      {step.timestamp && (
                        <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '2px' }}>
                          {formatIndonesianDate(step.timestamp)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#64748b', fontSize: '0.86rem' }}>
                Status saat ini: <strong>{selectedApp.status}</strong>. Belum ada rincian riwayat tahapan tambahan.
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button onClick={() => setIsTimelineOpen(false)} className="btn btn-secondary">
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default LamaranSaya;