/**
 * LineChart Component - Pure CSS/SVG Animated Line Chart
 * Features animated drawing, area fill, interactive data points,
 * tooltips, multi-line support, and responsive grid.
 */
import { useState, useEffect, useMemo, useRef } from 'react';

const LINE_COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#0ea5e9', '#ec4899', '#14b8a6'
];

/**
 * @param {Object} props
 * @param {Array<{label: string, values: number[]}> | Array<{label: string, value: number}>} props.data
 * @param {string[]} [props.seriesNames] - Names of each data series (for multi-line)
 * @param {string} [props.title] - Chart title
 * @param {number} [props.height=260] - Chart height in px
 * @param {boolean} [props.showArea=true] - Show area fill under line
 * @param {boolean} [props.showDots=true] - Show data point dots
 * @param {boolean} [props.showGrid=true] - Show grid lines
 * @param {boolean} [props.curved=true] - Use curved lines
 * @param {string} [props.unit=''] - Unit suffix
 * @param {Function} [props.onPointClick] - Click handler for data points
 */
export function LineChart({
  data = [],
  seriesNames = [],
  title = '',
  height = 260,
  showArea = true,
  showDots = true,
  showGrid = true,
  curved = true,
  unit = '',
  onPointClick = null
}) {
  const [animationProgress, setAnimationProgress] = useState(0);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const containerRef = useRef(null);
  const [chartWidth, setChartWidth] = useState(600);

  // Responsive width
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setChartWidth(containerRef.current.offsetWidth);
      }
    };
    updateWidth();
    const resizeObserver = new ResizeObserver(updateWidth);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    return () => resizeObserver.disconnect();
  }, []);

  // Normalize data to multi-series format
  const normalizedData = useMemo(() => {
    if (!data.length) return { labels: [], series: [] };

    // Check if data has 'values' array (multi-series) or 'value' (single series)
    if (data[0].values) {
      return {
        labels: data.map(d => d.label),
        series: data[0].values.map((_, seriesIdx) =>
          data.map(d => d.values[seriesIdx] || 0)
        )
      };
    }
    return {
      labels: data.map(d => d.label),
      series: [data.map(d => d.value)]
    };
  }, [data]);

  // Calculate bounds
  const { labels, series } = normalizedData;
  const allValues = series.flat();
  const maxValue = Math.max(...allValues, 1);
  const minValue = Math.min(...allValues, 0);
  const valueRange = maxValue - Math.min(minValue, 0);

  // Chart padding
  const padding = { top: 20, right: 20, bottom: 40, left: showGrid ? 50 : 10 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Animation
  useEffect(() => {
    let frame;
    let start = null;
    const duration = 1000;

    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimationProgress(eased);
      if (progress < 1) frame = requestAnimationFrame(animate);
    };

    setAnimationProgress(0);
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [data]);

  // Generate point coordinates
  const getPoint = (seriesIdx, pointIdx) => {
    const x = padding.left + (pointIdx / Math.max(labels.length - 1, 1)) * plotWidth;
    const value = series[seriesIdx][pointIdx] * animationProgress;
    const y = padding.top + plotHeight - ((value - Math.min(minValue, 0)) / valueRange) * plotHeight;
    return { x, y };
  };

  // Generate SVG path
  const generatePath = (seriesIdx) => {
    const points = labels.map((_, i) => getPoint(seriesIdx, i));
    if (points.length < 2) return '';

    if (curved) {
      // Catmull-Rom to Bezier conversion for smooth curves
      let path = `M ${points[0].x} ${points[0].y}`;
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[Math.max(i - 1, 0)];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[Math.min(i + 2, points.length - 1)];

        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;

        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
      }
      return path;
    }

    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  };

  // Generate area path
  const generateAreaPath = (seriesIdx) => {
    const linePath = generatePath(seriesIdx);
    if (!linePath) return '';

    const points = labels.map((_, i) => getPoint(seriesIdx, i));
    const lastPoint = points[points.length - 1];
    const firstPoint = points[0];
    const baseY = padding.top + plotHeight;

    return `${linePath} L ${lastPoint.x} ${baseY} L ${firstPoint.x} ${baseY} Z`;
  };

  // Grid lines
  const gridLineValues = useMemo(() => {
    const lines = [];
    const step = Math.ceil(valueRange / 5);
    for (let i = 0; i <= 5; i++) {
      const val = Math.min(minValue, 0) + step * i;
      if (val <= maxValue * 1.1) {
        lines.push(val);
      }
    }
    return lines;
  }, [maxValue, minValue, valueRange]);

  if (!data || data.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height, color: 'var(--text-muted)' }}>
        <div style={{ textAlign: 'center' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.5 }}>
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          <p style={{ marginTop: '8px', fontSize: '0.875rem' }}>Belum ada data tren</p>
        </div>
      </div>
    );
  }

  return (
    <div className="line-chart-container" ref={containerRef}>
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

      {/* Series Legend */}
      {seriesNames.length > 1 && (
        <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', flexWrap: 'wrap' }}>
          {seriesNames.map((name, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
              <span style={{
                width: '12px',
                height: '3px',
                borderRadius: '2px',
                background: LINE_COLORS[i % LINE_COLORS.length]
              }} />
              <span style={{ color: 'var(--text-muted)' }}>{name}</span>
            </div>
          ))}
        </div>
      )}

      <svg width={chartWidth} height={height} style={{ overflow: 'visible' }}>
        <defs>
          {series.map((_, i) => (
            <linearGradient key={`grad-${i}`} id={`area-grad-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={LINE_COLORS[i % LINE_COLORS.length]} stopOpacity="0.3" />
              <stop offset="100%" stopColor={LINE_COLORS[i % LINE_COLORS.length]} stopOpacity="0.02" />
            </linearGradient>
          ))}
        </defs>

        {/* Grid Lines */}
        {showGrid && gridLineValues.map((val, i) => {
          const y = padding.top + plotHeight - ((val - Math.min(minValue, 0)) / valueRange) * plotHeight;
          return (
            <g key={`grid-${i}`}>
              <line
                x1={padding.left}
                y1={y}
                x2={chartWidth - padding.right}
                y2={y}
                stroke="var(--secondary-200)"
                strokeDasharray={val === 0 ? 'none' : '4 4'}
                strokeWidth="1"
              />
              <text
                x={padding.left - 8}
                y={y + 4}
                textAnchor="end"
                fontSize="10"
                fill="var(--text-subtle)"
              >
                {val.toLocaleString('id-ID')}
              </text>
            </g>
          );
        })}

        {/* X-axis labels */}
        {labels.map((label, i) => {
          const x = padding.left + (i / Math.max(labels.length - 1, 1)) * plotWidth;
          // Skip some labels if too many
          const shouldShow = labels.length <= 12 || i % Math.ceil(labels.length / 10) === 0;
          return shouldShow ? (
            <text
              key={`label-${i}`}
              x={x}
              y={height - 8}
              textAnchor="middle"
              fontSize="10"
              fill="var(--text-subtle)"
            >
              {label}
            </text>
          ) : null;
        })}

        {/* Area fills */}
        {showArea && series.map((_, i) => (
          <path
            key={`area-${i}`}
            d={generateAreaPath(i)}
            fill={`url(#area-grad-${i})`}
            style={{ transition: 'opacity 0.3s ease' }}
          />
        ))}

        {/* Lines */}
        {series.map((_, i) => (
          <path
            key={`line-${i}`}
            d={generatePath(i)}
            fill="none"
            stroke={LINE_COLORS[i % LINE_COLORS.length]}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              filter: hoveredPoint?.series === i
                ? `drop-shadow(0 0 4px ${LINE_COLORS[i % LINE_COLORS.length]}60)`
                : 'none'
            }}
          />
        ))}

        {/* Data Points */}
        {showDots && series.map((seriesData, si) =>
          seriesData.map((val, pi) => {
            const point = getPoint(si, pi);
            const isHovered = hoveredPoint?.series === si && hoveredPoint?.point === pi;
            return (
              <g key={`dot-${si}-${pi}`}>
                {/* Larger invisible hitbox */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={12}
                  fill="transparent"
                  style={{ cursor: onPointClick ? 'pointer' : 'default' }}
                  onMouseEnter={() => setHoveredPoint({ series: si, point: pi })}
                  onMouseLeave={() => setHoveredPoint(null)}
                  onClick={() => onPointClick && onPointClick({ seriesIdx: si, pointIdx: pi, value: val, label: labels[pi] })}
                />
                {/* Visible dot */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={isHovered ? 6 : 3.5}
                  fill={isHovered ? LINE_COLORS[si % LINE_COLORS.length] : '#fff'}
                  stroke={LINE_COLORS[si % LINE_COLORS.length]}
                  strokeWidth="2"
                  style={{
                    transition: 'r 0.15s ease, fill 0.15s ease',
                    filter: isHovered ? `drop-shadow(0 0 6px ${LINE_COLORS[si % LINE_COLORS.length]}80)` : 'none'
                  }}
                />
              </g>
            );
          })
        )}

        {/* Tooltip */}
        {hoveredPoint && (() => {
          const { series: si, point: pi } = hoveredPoint;
          const point = getPoint(si, pi);
          const value = series[si][pi];
          const tooltipWidth = 120;
          const tooltipX = Math.min(Math.max(point.x - tooltipWidth / 2, 5), chartWidth - tooltipWidth - 5);
          const tooltipY = point.y - 55;

          return (
            <g style={{ pointerEvents: 'none' }}>
              {/* Vertical line */}
              <line
                x1={point.x}
                y1={padding.top}
                x2={point.x}
                y2={padding.top + plotHeight}
                stroke="var(--secondary-300)"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              {/* Tooltip box */}
              <foreignObject x={tooltipX} y={Math.max(tooltipY, 0)} width={tooltipWidth} height="48">
                <div style={{
                  background: 'var(--secondary-800)',
                  color: '#fff',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  textAlign: 'center',
                  boxShadow: 'var(--shadow-lg)'
                }}>
                  <div style={{ fontWeight: 600 }}>{labels[pi]}</div>
                  <div style={{ opacity: 0.85 }}>
                    {seriesNames[si] ? `${seriesNames[si]}: ` : ''}{value.toLocaleString('id-ID')}{unit}
                  </div>
                </div>
              </foreignObject>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}

export default LineChart;
