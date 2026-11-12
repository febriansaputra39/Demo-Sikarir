/**
 * ProgressChart Component - Horizontal Progress Bars with Labels
 * Great for skill levels, completion percentages, comparison charts.
 * Features animated fill, color coding, and interactive hover states.
 */
import { useState, useEffect } from 'react';

/**
 * @param {Object} props
 * @param {Array<{label: string, value: number, maxValue?: number, color?: string, icon?: React.ReactNode}>} props.data
 * @param {string} [props.title] - Chart title
 * @param {boolean} [props.showPercentage=true] - Show percentage label
 * @param {boolean} [props.sorted=false] - Sort by value descending
 * @param {number} [props.barHeight=10] - Height of progress bars
 * @param {string} [props.unit='%'] - Unit suffix
 * @param {Function} [props.onItemClick] - Click handler
 */
export function ProgressChart({
  data = [],
  title = '',
  showPercentage = true,
  sorted = false,
  barHeight = 10,
  unit = '%',
  onItemClick = null
}) {
  const [animatedData, setAnimatedData] = useState([]);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Sort data if needed
  const processedData = sorted
    ? [...data].sort((a, b) => b.value - a.value)
    : data;

  // Determine color based on value percentage
  const getAutoColor = (value, maxVal = 100) => {
    const pct = (value / maxVal) * 100;
    if (pct >= 80) return 'var(--success-500)';
    if (pct >= 60) return 'var(--primary-500)';
    if (pct >= 40) return 'var(--warning-500)';
    return 'var(--danger-500)';
  };

  // Animate on mount
  useEffect(() => {
    setAnimatedData(processedData.map(d => ({ ...d, animatedValue: 0 })));

    const timer = setTimeout(() => {
      setAnimatedData(processedData.map(d => ({ ...d, animatedValue: d.value })));
    }, 100);

    return () => clearTimeout(timer);
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.5, margin: '0 auto' }}>
          <rect x="3" y="4" width="18" height="4" rx="2" />
          <rect x="3" y="10" width="14" height="4" rx="2" />
          <rect x="3" y="16" width="10" height="4" rx="2" />
        </svg>
        <p style={{ marginTop: '8px', fontSize: '0.875rem' }}>Belum ada data progress</p>
      </div>
    );
  }

  return (
    <div className="progress-chart-container">
      {title && (
        <h4 style={{
          fontSize: '0.95rem',
          fontWeight: 600,
          color: 'var(--text-main)',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{
            width: '4px',
            height: '18px',
            borderRadius: 'var(--radius-full)',
            background: 'linear-gradient(180deg, var(--primary-500), var(--primary-700))'
          }} />
          {title}
        </h4>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {animatedData.map((item, index) => {
          const maxVal = item.maxValue || 100;
          const percentage = Math.min((item.animatedValue / maxVal) * 100, 100);
          const color = item.color || getAutoColor(item.value, maxVal);
          const isHovered = hoveredIndex === index;

          return (
            <div
              key={index}
              className="progress-item"
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                background: isHovered ? 'var(--secondary-50)' : 'transparent',
                transition: 'background 0.2s ease',
                cursor: onItemClick ? 'pointer' : 'default'
              }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => onItemClick && onItemClick(item, index)}
            >
              {/* Label Row */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '6px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.85rem',
                  fontWeight: isHovered ? 600 : 500,
                  color: 'var(--text-main)',
                  transition: 'font-weight 0.2s ease'
                }}>
                  {item.icon && <span style={{ display: 'flex', color }}>{item.icon}</span>}
                  <span>{item.label}</span>
                </div>
                {showPercentage && (
                  <span style={{
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: isHovered ? color : 'var(--text-muted)',
                    fontVariantNumeric: 'tabular-nums',
                    transition: 'color 0.2s ease'
                  }}>
                    {item.animatedValue.toLocaleString('id-ID')}{unit}
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              <div style={{
                width: '100%',
                height: `${barHeight}px`,
                borderRadius: 'var(--radius-full)',
                background: 'var(--secondary-100)',
                overflow: 'hidden',
                position: 'relative'
              }}>
                <div style={{
                  width: `${percentage}%`,
                  height: '100%',
                  borderRadius: 'var(--radius-full)',
                  background: `linear-gradient(90deg, ${color}cc, ${color})`,
                  transition: 'width 1s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* Shimmer effect on hover */}
                  {isHovered && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                      animation: 'shimmer 1.5s infinite'
                    }} />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}

export default ProgressChart;
