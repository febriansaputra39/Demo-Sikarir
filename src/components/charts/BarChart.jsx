/**
 * BarChart Component - Pure CSS Animated Bar Chart
 * Supports vertical bars with animated height transitions,
 * interactive tooltips, color customization, and responsive layout.
 */
import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * @param {Object} props
 * @param {Array<{label: string, value: number, color?: string}>} props.data
 * @param {string} [props.title] - Chart title
 * @param {number} [props.height=280] - Chart container height in px
 * @param {string} [props.barColor] - Default bar color (CSS variable or hex)
 * @param {boolean} [props.showValues=true] - Show value labels on top of bars
 * @param {boolean} [props.showGrid=true] - Show horizontal grid lines
 * @param {string} [props.unit=''] - Unit suffix for values (e.g., '%', 'orang')
 * @param {Function} [props.onBarClick] - Callback when a bar is clicked
 */
export function BarChart({
  data = [],
  title = '',
  height = 280,
  barColor = 'var(--primary-500)',
  showValues = true,
  showGrid = true,
  unit = '',
  onBarClick = null
}) {
  const [animatedData, setAnimatedData] = useState([]);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const chartRef = useRef(null);

  // Determine the maximum value for scaling bars
  const maxValue = Math.max(...data.map(d => d.value), 1);

  // Calculate nice grid line values
  const gridLines = useCallback(() => {
    const lines = [];
    const step = Math.ceil(maxValue / 5);
    for (let i = 0; i <= 5; i++) {
      const val = step * i;
      if (val <= maxValue * 1.1) {
        lines.push(val);
      }
    }
    return lines;
  }, [maxValue]);

  // Animate bars on mount and data change
  useEffect(() => {
    // Start with zero height bars
    setAnimatedData(data.map(d => ({ ...d, animatedValue: 0 })));

    // Trigger animation after a small delay
    const timer = setTimeout(() => {
      setAnimatedData(data.map(d => ({ ...d, animatedValue: d.value })));
    }, 100);

    return () => clearTimeout(timer);
  }, [data]);

  const handleMouseMove = (e, index) => {
    if (chartRef.current) {
      const rect = chartRef.current.getBoundingClientRect();
      setTooltipPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top - 10
      });
    }
    setHoveredIndex(index);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  const handleBarClick = (item, index) => {
    if (onBarClick) {
      onBarClick(item, index);
    }
  };

  if (!data || data.length === 0) {
    return (
      <div className="chart-empty-state" style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        <div style={{ textAlign: 'center' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.5 }}>
            <rect x="3" y="12" width="4" height="9" rx="1" />
            <rect x="10" y="7" width="4" height="14" rx="1" />
            <rect x="17" y="3" width="4" height="18" rx="1" />
          </svg>
          <p style={{ marginTop: '8px', fontSize: '0.875rem' }}>Belum ada data chart</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bar-chart-container" style={{ position: 'relative' }}>
      {title && (
        <h4 className="chart-title" style={{
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

      <div
        ref={chartRef}
        className="bar-chart-area"
        style={{
          position: 'relative',
          height: `${height}px`,
          display: 'flex',
          alignItems: 'flex-end',
          gap: data.length > 10 ? '4px' : '12px',
          paddingBottom: '40px',
          paddingLeft: showGrid ? '50px' : '0',
          paddingTop: '20px'
        }}
      >
        {/* Y-axis Grid Lines */}
        {showGrid && gridLines().map((lineVal, i) => {
          const bottom = (lineVal / (maxValue * 1.1)) * (height - 60) + 40;
          return (
            <div
              key={`grid-${i}`}
              style={{
                position: 'absolute',
                left: '0',
                right: '0',
                bottom: `${bottom}px`,
                borderBottom: lineVal === 0 ? '1px solid var(--border-color)' : '1px dashed var(--secondary-200)',
                zIndex: 0
              }}
            >
              <span style={{
                position: 'absolute',
                left: '0',
                top: '-8px',
                fontSize: '0.7rem',
                color: 'var(--text-subtle)',
                fontVariantNumeric: 'tabular-nums'
              }}>
                {lineVal.toLocaleString('id-ID')}
              </span>
            </div>
          );
        })}

        {/* Bars */}
        {animatedData.map((item, index) => {
          const barHeight = (item.animatedValue / (maxValue * 1.1)) * (height - 60);
          const itemColor = item.color || barColor;
          const isHovered = hoveredIndex === index;

          return (
            <div
              key={index}
              className="bar-column"
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative',
                zIndex: 1,
                cursor: onBarClick ? 'pointer' : 'default'
              }}
              onMouseMove={(e) => handleMouseMove(e, index)}
              onMouseLeave={handleMouseLeave}
              onClick={() => handleBarClick(item, index)}
            >
              {/* Value Label */}
              {showValues && item.animatedValue > 0 && (
                <div style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: isHovered ? itemColor : 'var(--text-muted)',
                  marginBottom: '4px',
                  transition: 'color 0.2s ease',
                  whiteSpace: 'nowrap',
                  fontVariantNumeric: 'tabular-nums'
                }}>
                  {item.animatedValue.toLocaleString('id-ID')}{unit}
                </div>
              )}

              {/* Bar */}
              <div
                className="bar-visual"
                style={{
                  width: '100%',
                  maxWidth: data.length > 12 ? '28px' : '48px',
                  height: `${barHeight}px`,
                  borderRadius: '6px 6px 2px 2px',
                  background: isHovered
                    ? `linear-gradient(180deg, ${itemColor}, ${itemColor}cc)`
                    : `linear-gradient(180deg, ${itemColor}cc, ${itemColor}99)`,
                  transition: 'height 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.25s ease, transform 0.2s ease',
                  transform: isHovered ? 'scaleX(1.1)' : 'scaleX(1)',
                  boxShadow: isHovered ? `0 4px 12px ${itemColor}40` : 'none',
                  minHeight: item.animatedValue > 0 ? '4px' : '0'
                }}
              />

              {/* X-axis Label */}
              <div style={{
                position: 'absolute',
                bottom: '-36px',
                fontSize: '0.7rem',
                color: isHovered ? 'var(--text-main)' : 'var(--text-subtle)',
                fontWeight: isHovered ? 600 : 400,
                textAlign: 'center',
                maxWidth: '70px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                transition: 'color 0.2s ease, font-weight 0.2s ease'
              }}>
                {item.label}
              </div>
            </div>
          );
        })}

        {/* Tooltip */}
        {hoveredIndex !== null && data[hoveredIndex] && (
          <div
            className="chart-tooltip"
            style={{
              position: 'absolute',
              left: `${tooltipPos.x}px`,
              top: `${Math.max(tooltipPos.y - 50, 0)}px`,
              background: 'var(--secondary-800)',
              color: '#fff',
              padding: '8px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8rem',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              zIndex: 100,
              boxShadow: 'var(--shadow-lg)',
              transform: 'translateX(-50%)',
              animation: 'fadeIn 0.15s ease'
            }}
          >
            <div style={{ fontWeight: 600 }}>{data[hoveredIndex].label}</div>
            <div style={{ opacity: 0.85, marginTop: '2px' }}>
              {data[hoveredIndex].value.toLocaleString('id-ID')}{unit}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BarChart;
