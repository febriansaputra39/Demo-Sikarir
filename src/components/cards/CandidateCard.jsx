import { MapPin, Sparkles, GraduationCap, Briefcase, Mail } from 'lucide-react';
import Badge from '../common/Badge';

export function CandidateCard({ candidate, onInvite, onViewProfile, showInvite = true }) {
  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'Bekerja':
        return 'success';
      case 'Magang':
        return 'info';
      case 'Pelatihan':
        return 'purple';
      default:
        return 'warning';
    }
  };

  return (
    <div className="card card-hoverable" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          <img
            src={candidate.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
            alt={candidate.name}
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid #e2e8f0'
            }}
          />
          <div>
            <h4 style={{ fontSize: '1.02rem', fontWeight: 700, color: '#1e293b' }}>
              {candidate.name}
            </h4>
            <div style={{ fontSize: '0.82rem', color: '#6366f1', fontWeight: 600 }}>
              {candidate.headline || 'Pencari Kerja'}
            </div>
          </div>
        </div>

        {candidate.matchScore !== undefined && (
          <Badge variant={candidate.matchScore >= 80 ? 'success' : 'purple'} dot>
            <Sparkles size={12} />
            {candidate.matchScore}% Match
          </Badge>
        )}
      </div>

      <div style={{ display: 'flex', gap: '8px', margin: '14px 0 10px', flexWrap: 'wrap' }}>
        <Badge variant={getStatusBadgeVariant(candidate.statusKarir)}>
          Status: {candidate.statusKarir || 'Menganggur'}
        </Badge>
        {candidate.educationLevel && (
          <Badge variant="info">
            <GraduationCap size={12} />
            {candidate.educationLevel}
          </Badge>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.82rem', color: '#64748b', margin: '6px 0 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MapPin size={14} color="#94a3b8" />
          <span>{candidate.location || 'Indonesia'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Mail size={14} color="#94a3b8" />
          <span>{candidate.email}</span>
        </div>
        {candidate.experiences && candidate.experiences.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Briefcase size={14} color="#94a3b8" />
            <span>{candidate.experiences[0]?.position} di {candidate.experiences[0]?.company}</span>
          </div>
        )}
      </div>

      {/* Skills tags */}
      {candidate.skills && candidate.skills.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
          {candidate.skills.slice(0, 4).map((s, idx) => (
            <span
              key={idx}
              style={{
                fontSize: '0.74rem',
                padding: '2px 8px',
                borderRadius: '6px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#334155'
              }}
            >
              {typeof s === 'string' ? s : s.name}
            </span>
          ))}
          {candidate.skills.length > 4 && (
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', alignSelf: 'center' }}>
              +{candidate.skills.length - 4} lainnya
            </span>
          )}
        </div>
      )}

      {/* Footer Actions */}
      <div style={{ marginTop: 'auto', display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
        {onViewProfile && (
          <button onClick={() => onViewProfile(candidate)} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
            Lihat CV
          </button>
        )}
        {showInvite && onInvite && (
          <button onClick={() => onInvite(candidate)} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
            Undang Rekrut
          </button>
        )}
      </div>
    </div>
  );
}

export default CandidateCard;
