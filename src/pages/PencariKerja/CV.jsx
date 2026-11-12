import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { PencariKerjaService } from '../../services/PencariKerjaService';
import { formatIndonesianDate, formatPeriod } from '../../utils/formatDate';
import { Printer } from 'lucide-react';

export function CV() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [theme, setTheme] = useState('ats'); // 'ats' | 'modern'

  const loadFullProfile = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(false);
    try {
      const data = await PencariKerjaService.getFullProfile(user.id);
      setProfile(data);
    } catch (err) {
      console.error('Failed to load profile:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      loadFullProfile();
    } else {
      setLoading(false);
    }
  }, [user?.id, loadFullProfile]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
        Membuat Pratinjau CV ATS...
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '48px 24px', color: '#64748b' }}>
        <p style={{ marginBottom: '12px' }}>Gagal memuat data profil untuk CV.</p>
        <button onClick={loadFullProfile} className="btn btn-primary btn-sm">
          Coba Lagi
        </button>
      </div>
    );
  }

  const isModern = theme === 'modern';
  const accentColor = isModern ? '#4f46e5' : '#0f172a';

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Action Bar (Hidden during printing) */}
      <div
        className="card mb-6 no-print"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 24px',
          flexWrap: 'wrap',
          gap: '14px',
          marginBottom: '24px'
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
            Generator CV ATS Profesional
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.84rem' }}>
            Format ramah Applicant Tracking System (ATS) siap cetak dan diekspor ke PDF.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ display: 'flex', border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
            <button
              type="button"
              onClick={() => setTheme('ats')}
              style={{
                padding: '6px 12px',
                border: 'none',
                background: !isModern ? '#4f46e5' : '#ffffff',
                color: !isModern ? '#ffffff' : '#64748b',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Standar ATS
            </button>
            <button
              type="button"
              onClick={() => setTheme('modern')}
              style={{
                padding: '6px 12px',
                border: 'none',
                background: isModern ? '#4f46e5' : '#ffffff',
                color: isModern ? '#ffffff' : '#64748b',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Modern Minimalist
            </button>
          </div>

          <button type="button" onClick={handlePrint} className="btn btn-primary btn-sm">
            <Printer size={16} /> Cetak / Simpan PDF
          </button>
        </div>
      </div>

      {/* CV Paper Preview */}
      <div
        className="card cv-paper"
        style={{
          background: '#ffffff',
          padding: '48px 56px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          border: '1px solid #e2e8f0',
          color: '#1e293b'
        }}
      >
        {/* Header Name & Contact */}
        <div
          style={{
            borderBottom: `2px solid ${accentColor}`,
            paddingBottom: '18px',
            marginBottom: '22px',
            textAlign: isModern ? 'left' : 'center'
          }}
        >
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '4px' }}>
            {profile.name}
          </h1>
          {profile.headline && (
            <div style={{ fontSize: '1.05rem', color: isModern ? '#4f46e5' : '#334155', fontWeight: 700, marginBottom: '10px' }}>
              {profile.headline}
            </div>
          )}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: isModern ? 'flex-start' : 'center',
              gap: '12px',
              fontSize: '0.86rem',
              color: '#475569'
            }}
          >
            {profile.email && <span>{profile.email}</span>}
            {profile.phone && (
              <>
                <span>•</span>
                <span>{profile.phone}</span>
              </>
            )}
            {profile.location && (
              <>
                <span>•</span>
                <span>{profile.location}</span>
              </>
            )}
          </div>
        </div>

        {/* Ringkasan Profil */}
        {profile.bio && (
          <div style={{ marginBottom: '24px' }}>
            <h3
              style={{
                fontSize: '1rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: accentColor,
                marginBottom: '8px',
                borderBottom: '1px solid #cbd5e1',
                paddingBottom: '4px'
              }}
            >
              Ringkasan Profesional
            </h3>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: '#334155' }}>
              {profile.bio}
            </p>
          </div>
        )}

        {/* Pengalaman Kerja */}
        <div style={{ marginBottom: '24px' }}>
          <h3
            style={{
              fontSize: '1rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: accentColor,
              marginBottom: '12px',
              borderBottom: '1px solid #cbd5e1',
              paddingBottom: '4px'
            }}
          >
            Pengalaman Kerja
          </h3>
          {profile.experiences?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {profile.experiences.map((exp) => (
                <div key={exp.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '12px' }}>
                    <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>{exp.position}</strong>
                    <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {formatPeriod(exp.startDate, exp.endDate, exp.isCurrent)}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.88rem', color: isModern ? '#4f46e5' : '#475569', fontWeight: 600, marginBottom: '6px' }}>
                    {exp.company}{exp.location ? ` — ${exp.location}` : ''}
                  </div>
                  {exp.responsibilities && (
                    <div style={{ fontSize: '0.88rem', color: '#334155', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                      {exp.responsibilities}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '0.86rem', color: '#64748b' }}>Belum ada data pengalaman kerja.</div>
          )}
        </div>

        {/* Pendidikan */}
        <div style={{ marginBottom: '24px' }}>
          <h3
            style={{
              fontSize: '1rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: accentColor,
              marginBottom: '12px',
              borderBottom: '1px solid #cbd5e1',
              paddingBottom: '4px'
            }}
          >
            Pendidikan Formal
          </h3>
          {profile.educations?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {profile.educations.map((edu) => (
                <div key={edu.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '12px' }}>
                    <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>{edu.institution}</strong>
                    <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {edu.startYear} - {edu.endYear || 'Sekarang'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.88rem', color: '#475569' }}>
                    {[edu.degree, edu.major].filter(Boolean).join(' ')}
                    {edu.gpa ? ` • IPK: ${edu.gpa}` : ''}
                  </div>
                  {edu.description && (
                    <div style={{ fontSize: '0.84rem', color: '#64748b', marginTop: '2px' }}>
                      {edu.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '0.86rem', color: '#64748b' }}>Belum ada data pendidikan.</div>
          )}
        </div>

        {/* Keahlian & Kompetensi */}
        <div style={{ marginBottom: profile.activities?.length > 0 ? '24px' : '0' }}>
          <h3
            style={{
              fontSize: '1rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: accentColor,
              marginBottom: '10px',
              borderBottom: '1px solid #cbd5e1',
              paddingBottom: '4px'
            }}
          >
            Keahlian & Kompetensi Teknis
          </h3>
          {profile.skills?.length > 0 ? (
            isModern ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {profile.skills.map((s) => (
                  <span
                    key={s.id}
                    style={{
                      fontSize: '0.82rem',
                      padding: '3px 10px',
                      borderRadius: '4px',
                      background: '#eef2ff',
                      border: '1px solid #c7d2fe',
                      color: '#3730a3',
                      fontWeight: 600
                    }}
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.88rem', color: '#334155', lineHeight: 1.6 }}>
                {profile.skills.map((s) => s.name).join(' • ')}
              </p>
            )
          ) : (
            <div style={{ fontSize: '0.86rem', color: '#64748b' }}>Belum ada data keahlian.</div>
          )}
        </div>

        {/* Sertifikasi & Pelatihan */}
        {profile.activities?.length > 0 && (
          <div>
            <h3
              style={{
                fontSize: '1rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: accentColor,
                marginBottom: '10px',
                borderBottom: '1px solid #cbd5e1',
                paddingBottom: '4px'
              }}
            >
              Sertifikasi & Lisensi
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem' }}>
              {profile.activities.map((act) => (
                <div key={act.id}>
                  <strong>{act.title}</strong> — {act.provider}
                  {act.date ? ` (${formatIndonesianDate(act.date)})` : ''}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CV;