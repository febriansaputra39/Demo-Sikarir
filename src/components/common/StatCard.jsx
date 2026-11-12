import { TrendingUp, TrendingDown } from 'lucide-react';

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendType = 'positive',
  subtext,
  iconBg = '#eef2ff',
  iconColor = '#4f46e5'
}) {
  return (
    <div className="stat-card card-hoverable">
      <div>
        <span className="stat-label">{title}</span>
        <div className="stat-value mt-2">{value}</div>
        {trend && (
          <div className={`stat-trend ${trendType}`}>
            {trendType === 'positive' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span>{trend}</span>
          </div>
        )}
        {subtext && <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>{subtext}</div>}
      </div>
      {Icon && (
        <div className="stat-icon-wrapper" style={{ backgroundColor: iconBg, color: iconColor }}>
          <Icon size={26} />
        </div>
      )}
    </div>
  );
}

export default StatCard;
