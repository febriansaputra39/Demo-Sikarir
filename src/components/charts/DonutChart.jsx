/**
 * DonutChart Component - Pure CSS Animated Donut/Ring Chart
 * Features animated segments with hover effects, legend, center label,
 * and responsive layout using SVG for crisp rendering at any size.
 */
import { useState, useEffect, useMemo } from 'react';

const CHART_COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#0ea5e9', '#ec4899', '#14b8a6',
  '#f97316', '#06b6d4', '#a855f7', '#84cc16'
];

/**
 * @param {Object} props
 * @param {Array<{label: string, value: number, color?: string}>} props.data
 * @param {string} [props.title] - Chart title
 * @param {number} [props.size=200] - Chart diameter in px
 * @param {number} [props.thickness=28] - Ring thickness
 * @param {string} [props.centerLabel] - Main center label
 * @param {string} [props.centerSubLabel] - Sub label below center
 * @param {boolean} [props.showLegend=true] - Show legend
 * @param {boolean} [props.showPercentages=true] - Show percentage in legend
 * @param {Function} [props.onSegmentClick] - Click handler for segments
 */
export function DonutChart({
  data = [],
  title = '',
  size = 200,
  thickness = 28,
  centerLabel = '',
  centerSubLabel = '',
  showLegend = true,
  showPercentages = true,
  onSegmentClick = null
}) {
  const [animationProgress, setAnimationProgress] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const total = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data]);

  // Assign colors to data items
  const coloredData = useMemo(() =>
    data.map((item, i) => ({
      ...item,
      color: item.color || CHART_COLORS[i % CHART_COLORS.length],
      percentage: total > 0 ? ((item.value / total) * 100).toFixed(1) : 0
    })),
    [data, total]
  );

  // Animation on mount
  useEffect(() => {
    let frame;
    let start = null;
    const duration = 1200;

    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimationProgress(eased);

      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [data]);

  // Calculate SVG path segments
  const segments = useMemo(() => {
    if (!coloredData.length || total === 0) return [];

    const center = size / 2;
    const radius = (size - thickness) / 2;
    const circumference = 2 * Math.PI * radius;
    let currentAngle = -90; // Start from top

    return coloredData.map((item, i) => {
      const angle = (item.value / total) * 360 * animationProgress;
      const startAngle = currentAngle;
      currentAngle += angle;

      const dashLength = (item.value / total) * circumference * animationProgress;
      const dashOffset = coloredData
        .slice(0, i)
        .reduce((sum, d) => sum + (d.value / total) * circumference * animationProgress, 0);

      return {
        ...item,
        startAngle,
        angle,
        dashLength,
        dashOffset,
        center,
        radius,
        circumference
      };
    });
  }, [coloredData, total, size, thickness, animationProgress]);

  if (!data || data.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: size, color: 'var(--text-muted)' }}>
        <div style={{ textAlign: 'center' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.5 }}>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a10 10 0 0 1 10 10" />
          </svg>
          <p style={{ marginTop: '8px', fontSize: '0.875rem' }}>Belum ada data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="donut-chart-container">
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

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        {/* SVG Donut */}
        <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            style={{ transform: 'rotate(-90deg)' }}
          >
            {/* Background ring */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={(size - thickness) / 2}
              fill="none"
              stroke="var(--secondary-100)"
              strokeWidth={thickness}
            />

            {/* Data segments */}
            {segments.map((seg, i) => (
              <circle
                key={i}
                cx={seg.center}
                cy={seg.center}
                r={seg.radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={hoveredIndex === i ? thickness + 6 : thickness}
                strokeDasharray={`${seg.dashLength} ${seg.circumference - seg.dashLength}`}
                strokeDashoffset={-seg.dashOffset}
                strokeLinecap="round"
                style={{
                  transition: 'stroke-width 0.25s ease, opacity 0.25s ease',
                  cursor: onSegmentClick ? 'pointer' : 'default',
                  opacity: hoveredIndex !== null && hoveredIndex !== i ? 0.5 : 1,
                  filter: hoveredIndex === i ? `drop-shadow(0 0 6px ${seg.color}60)` : 'none'
                }}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => onSegmentClick && onSegmentClick(seg, i)}
              />
            ))}
          </svg>

          {/* Center Label */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            pointerEvents: 'none'
          }}>
            <div style={{
              fontSize: hoveredIndex !== null ? '1.5rem' : '1.75rem',
              fontWeight: 700,
              color: hoveredIndex !== null ? coloredData[hoveredIndex]?.color : 'var(--text-main)',
              transition: 'all 0.25s ease',
              lineHeight: 1.2
            }}>
              {hoveredIndex !== null
                ? `${coloredData[hoveredIndex]?.percentage}%`
                : (centerLabel || total.toLocaleString('id-ID'))}
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              marginTop: '2px',
              transition: 'all 0.25s ease'
            }}>
              {hoveredIndex !== null
                ? coloredData[hoveredIndex]?.label
                : (centerSubLabel || 'Total')}
            </div>
          </div>
        </div>

        {/* Legend */}
        {showLegend && (
          <div className="donut-legend" style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            minWidth: '140px'
          }}>
            {coloredData.map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  background: hoveredIndex === i ? 'var(--secondary-50)' : 'transparent',
                  transition: 'background 0.2s ease'
                }}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <span style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '3px',
                  background: item.color,
                  flexShrink: 0,
                  boxShadow: hoveredIndex === i ? `0 0 8px ${item.color}60` : 'none',
                  transition: 'box-shadow 0.2s ease'
                }} />
                <span style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-main)',
                  flex: 1,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {item.label}
                </span>
                {showPercentages && (
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: hoveredIndex === i ? item.color : 'var(--text-muted)',
                    fontVariantNumeric: 'tabular-nums',
                    transition: 'color 0.2s ease'
                  }}>
                    {item.percentage}%
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default DonutChart;
