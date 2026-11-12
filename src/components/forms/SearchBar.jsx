/**
 * SearchBar Component - Animated Search Input with Suggestions
 * Features debounced search, recent searches, keyboard navigation,
 * and smooth expand/collapse animation.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, Clock, ArrowRight } from 'lucide-react';

const STORAGE_KEY = 'sikarir_recent_searches';
const MAX_RECENT = 5;

/**
 * @param {Object} props
 * @param {string} [props.value=''] - Controlled search value
 * @param {Function} [props.onChange] - Change handler
 * @param {Function} [props.onSearch] - Triggered on Enter or search button click
 * @param {string} [props.placeholder='Cari lowongan, perusahaan, keterampilan...'] - Placeholder
 * @param {Array<string>} [props.suggestions] - Suggestion list
 * @param {boolean} [props.showRecent=true] - Show recent searches
 * @param {number} [props.debounceMs=300] - Debounce delay for onChange
 * @param {boolean} [props.autoFocus=false] - Auto focus on mount
 * @param {boolean} [props.expandable=false] - Expandable icon-to-full mode
 * @param {string} [props.size='md'] - Size variant: 'sm', 'md', 'lg'
 */
export function SearchBar({
  value: controlledValue,
  onChange,
  onSearch,
  placeholder = 'Cari lowongan, perusahaan, keterampilan...',
  suggestions = [],
  showRecent = true,
  debounceMs = 300,
  autoFocus = false,
  expandable = false,
  size = 'md'
}) {
  const [internalValue, setInternalValue] = useState(controlledValue || '');
  const [isFocused, setIsFocused] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!expandable);
  const [recentSearches, setRecentSearches] = useState([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const debounceRef = useRef(null);

  const displayValue = controlledValue !== undefined ? controlledValue : internalValue;

  // Sizes
  const sizeConfig = {
    sm: { height: '36px', fontSize: '0.82rem', iconSize: 16, padding: '0 10px 0 34px' },
    md: { height: '44px', fontSize: '0.9rem', iconSize: 18, padding: '0 14px 0 42px' },
    lg: { height: '52px', fontSize: '1rem', iconSize: 20, padding: '0 16px 0 48px' }
  };
  const config = sizeConfig[size] || sizeConfig.md;

  // Load recent searches from localStorage
  useEffect(() => {
    if (showRecent) {
      try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        setRecentSearches(stored);
      } catch {
        setRecentSearches([]);
      }
    }
  }, [showRecent]);

  // Auto focus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsFocused(false);
        if (expandable && !displayValue) {
          setIsExpanded(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [expandable, displayValue]);

  // Debounced onChange
  const handleChange = useCallback((e) => {
    const val = e.target.value;
    setInternalValue(val);
    setHighlightedIndex(-1);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onChange && onChange(val);
    }, debounceMs);
  }, [onChange, debounceMs]);

  // Save to recent searches
  const saveToRecent = (query) => {
    if (!query.trim() || !showRecent) return;
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, MAX_RECENT);
    setRecentSearches(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch { /* quota exceeded */ }
  };

  const handleSearch = (query) => {
    const searchQuery = query || displayValue;
    if (searchQuery.trim()) {
      saveToRecent(searchQuery);
      onSearch && onSearch(searchQuery);
    }
    setIsFocused(false);
  };

  const handleClear = () => {
    setInternalValue('');
    onChange && onChange('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    const allSuggestions = [
      ...filteredSuggestions,
      ...(showDropdown && !displayValue ? recentSearches : [])
    ];

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < allSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev > 0 ? prev - 1 : allSuggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && allSuggestions[highlightedIndex]) {
          handleSearch(allSuggestions[highlightedIndex]);
          setInternalValue(allSuggestions[highlightedIndex]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setIsFocused(false);
        inputRef.current?.blur();
        break;
      default:
        break;
    }
  };

  const handleExpandClick = () => {
    setIsExpanded(true);
    setTimeout(() => inputRef.current?.focus(), 200);
  };

  // Filter suggestions based on current input
  const filteredSuggestions = displayValue
    ? suggestions.filter(s => s.toLowerCase().includes(displayValue.toLowerCase())).slice(0, 8)
    : [];

  const showDropdown = isFocused && (
    filteredSuggestions.length > 0 ||
    (showRecent && recentSearches.length > 0 && !displayValue)
  );

  // Expandable icon mode
  if (expandable && !isExpanded) {
    return (
      <button
        onClick={handleExpandClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: config.height,
          height: config.height,
          border: '1.5px solid var(--border-color)',
          borderRadius: 'var(--radius-full)',
          background: 'var(--bg-card)',
          cursor: 'pointer',
          color: 'var(--text-muted)',
          transition: 'all 0.25s ease',
          boxShadow: 'var(--shadow-xs)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--primary-300)';
          e.currentTarget.style.color = 'var(--primary-500)';
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-color)';
          e.currentTarget.style.color = 'var(--text-muted)';
          e.currentTarget.style.boxShadow = 'var(--shadow-xs)';
        }}
        aria-label="Buka pencarian"
      >
        <Search size={config.iconSize} />
      </button>
    );
  }

  return (
    <div
      ref={containerRef}
      className="search-bar-container"
      style={{ position: 'relative', width: '100%' }}
    >
      {/* Search Input */}
      <div style={{ position: 'relative' }}>
        <Search
          size={config.iconSize}
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: isFocused ? 'var(--primary-500)' : 'var(--text-subtle)',
            transition: 'color 0.2s ease',
            pointerEvents: 'none',
            zIndex: 1
          }}
        />

        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          style={{
            width: '100%',
            height: config.height,
            padding: config.padding,
            paddingRight: displayValue ? '80px' : '14px',
            fontSize: config.fontSize,
            fontFamily: 'inherit',
            color: 'var(--text-main)',
            background: 'var(--bg-card)',
            border: `1.5px solid ${isFocused ? 'var(--primary-500)' : 'var(--border-color)'}`,
            borderRadius: 'var(--radius-full)',
            outline: 'none',
            boxShadow: isFocused ? '0 0 0 3px rgba(99, 102, 241, 0.12)' : 'var(--shadow-xs)',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
          }}
        />

        {/* Clear & Search Buttons */}
        {displayValue && (
          <div style={{
            position: 'absolute',
            right: '6px',
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <button
              type="button"
              onClick={handleClear}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '28px',
                height: '28px',
                border: 'none',
                borderRadius: 'var(--radius-full)',
                background: 'transparent',
                color: 'var(--text-subtle)',
                cursor: 'pointer',
                transition: 'background 0.2s, color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--secondary-100)';
                e.currentTarget.style.color = 'var(--text-main)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-subtle)';
              }}
              aria-label="Hapus pencarian"
            >
              <X size={14} />
            </button>
            <button
              type="button"
              onClick={() => handleSearch()}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '30px',
                height: '30px',
                border: 'none',
                borderRadius: 'var(--radius-full)',
                background: 'var(--primary-500)',
                color: '#fff',
                cursor: 'pointer',
                transition: 'background 0.2s ease, transform 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--primary-600)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--primary-500)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              aria-label="Cari"
            >
              <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div style={{
          position: 'absolute',
          top: `calc(${config.height} + 6px)`,
          left: 0,
          right: 0,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 1000,
          maxHeight: '280px',
          overflowY: 'auto',
          animation: 'slideDown 0.15s ease',
          padding: '4px'
        }}>
          {/* Recent Searches */}
          {!displayValue && showRecent && recentSearches.length > 0 && (
            <>
              <div style={{
                padding: '8px 12px 4px',
                fontSize: '0.72rem',
                fontWeight: 600,
                color: 'var(--text-subtle)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Pencarian Terakhir
              </div>
              {recentSearches.map((term, i) => (
                <div
                  key={term}
                  onClick={() => {
                    setInternalValue(term);
                    handleSearch(term);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    fontSize: '0.87rem',
                    color: 'var(--text-main)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    background: highlightedIndex === i + filteredSuggestions.length ? 'var(--secondary-50)' : 'transparent',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={() => setHighlightedIndex(i + filteredSuggestions.length)}
                >
                  <Clock size={14} style={{ color: 'var(--text-subtle)', flexShrink: 0 }} />
                  <span>{term}</span>
                </div>
              ))}
            </>
          )}

          {/* Filtered Suggestions */}
          {filteredSuggestions.length > 0 && (
            <>
              {!displayValue && recentSearches.length > 0 && (
                <div style={{
                  borderTop: '1px solid var(--border-color)',
                  margin: '4px 8px'
                }} />
              )}
              {filteredSuggestions.map((suggestion, i) => (
                <div
                  key={suggestion}
                  onClick={() => {
                    setInternalValue(suggestion);
                    handleSearch(suggestion);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    fontSize: '0.87rem',
                    color: 'var(--text-main)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    background: highlightedIndex === i ? 'var(--secondary-50)' : 'transparent',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={() => setHighlightedIndex(i)}
                >
                  <Search size={14} style={{ color: 'var(--text-subtle)', flexShrink: 0 }} />
                  <span>{suggestion}</span>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default SearchBar;
