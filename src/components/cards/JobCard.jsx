import { MapPin, DollarSign, Briefcase, Bookmark, Sparkles, Building } from 'lucide-react';
import { formatSalaryRange } from '../../utils/formatNumber';
import { formatRelativeTime } from '../../utils/formatDate';
import Badge from '../common/Badge';

export function JobCard({ job, onApply, onViewDetail, isSaved, onToggleBookmark, showMatch = true }) {
  return (
    <div className="card card-hoverable" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          <img
            src={job.companyLogo || 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?auto=format&fit=crop&w=100&q=80'}
            alt={job.companyName}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '10px',
              objectFit: 'cover',
              border: '1px solid #e2e8f0'
            }}
          />
          <div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e293b', marginBottom: '2px' }}>
              {job.title}
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', color: '#64748b' }}>
              <Building size={14} />
              <span>{job.companyName}</span>
            </div>
          </div>
        </div>

        {onToggleBookmark && (
          <button
            onClick={() => onToggleBookmark(job.id)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: isSaved ? '#4f46e5' : '#94a3b8',
              padding: '6px'
            }}
            title={isSaved ? 'Hapus dari tersimpan' : 'Simpan lowongan'}
          >
            <Bookmark size={20} fill={isSaved ? '#4f46e5' : 'none'} />
          </button>
        )}
      </div>

      {/* Meta tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', margin: '16px 0 12px' }}>
        <Badge variant="primary">{job.jobType || 'Full Time'}</Badge>
        <Badge variant="info">{job.workplaceType || 'On-site'}</Badge>
        <Badge variant="warning">{job.category}</Badge>
        {showMatch && job.matchScore !== undefined && (
          <Badge variant={job.matchScore >= 80 ? 'success' : 'purple'} dot>
            <Sparkles size={12} />
            {job.matchScore}% Match
          </Badge>
        )}
      </div>

      {/* Details info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.83rem', color: '#475569', margin: '8px 0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MapPin size={15} color="#94a3b8" />
          <span>{job.location}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', fontWeight: 600 }}>
          <span>{formatSalaryRange(job.salaryMin, job.salaryMax)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
          <Briefcase size={15} color="#94a3b8" />
          <span>Pengalaman: {job.experienceLevel || 'Minimal 1 tahun'}</span>
        </div>
      </div>

      {/* Skills tags */}
      {job.requiredSkills && job.requiredSkills.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '18px' }}>
          {job.requiredSkills.slice(0, 4).map((skill, idx) => (
            <span
              key={idx}
              style={{
                fontSize: '0.74rem',
                padding: '2px 8px',
                borderRadius: '6px',
                background: '#f1f5f9',
                color: '#475569',
                fontWeight: 500
              }}
            >
              {skill}
            </span>
          ))}
          {job.requiredSkills.length > 4 && (
            <span style={{ fontSize: '0.74rem', color: '#94a3b8', alignSelf: 'center' }}>
              +{job.requiredSkills.length - 4} lainnya
            </span>
          )}
        </div>
      )}

      {/* Footer / Buttons */}
      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
          Tayang {formatRelativeTime(job.createdAt)}
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          {onViewDetail && (
            <button onClick={() => onViewDetail(job)} className="btn btn-secondary btn-sm">
              Detail
            </button>
          )}
          {onApply && (
            <button onClick={() => onApply(job)} className="btn btn-primary btn-sm">
              Lamar Cepat
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default JobCard;
