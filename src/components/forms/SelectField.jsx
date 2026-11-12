/**
 * SelectField Component - Styled Dropdown Select with Search, Multi-Select, and Custom Options
 * Features searchable options, multi-select with tags, custom rendering,
 * keyboard navigation, and accessibility compliance.
 */
import { useState, useRef, useEffect, useCallback, useId } from 'react';
import { ChevronDown, X, Search, Check } from 'lucide-react';

/**
 * @param {Object} props
 * @param {string} props.label - Select label
 * @param {Array<{value: string, label: string, icon?: React.ReactNode, disabled?: boolean}>} props.options
 * @param {string|string[]} [props.value] - Selected value(s)
 * @param {Function} [props.onChange] - Change handler: (value) => void
 * @param {string} [props.placeholder='Pilih...'] - Placeholder text
 * @param {boolean} [props.searchable=false] - Enable search filtering
 * @param {boolean} [props.multiple=false] - Enable multi-select
 * @param {boolean} [props.required=false] - Mark as required
 * @param {boolean} [props.disabled=false] - Disable select
 * @param {string} [props.error] - Error message
 * @param {string} [props.helperText] - Helper text
 * @param {boolean} [props.clearable=false] - Show clear button
 * @param {string} [props.name] - Form field name
 */
export function SelectField({
  label,
  options = [],
  value = '',
  onChange,
  placeholder = 'Pilih...',
  searchable = false,
  multiple = false,
  required = false,
  disabled = false,
  error = '',
  helperText = '',
  clearable = false,
  name
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const searchRef = useRef(null);
  const listRef = useRef(null);
  const generatedId = useId();
  const selectId = name || generatedId;

  // Filter options based on search
  const filteredOptions = searchable && searchQuery
    ? options.filter(opt =>
      opt.label.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : options;

  // Get selected option labels
  const getSelectedLabels = useCallback(() => {
    if (multiple && Array.isArray(value)) {
      return value.map(v => options.find(o => o.value === v)?.label || v);
    }
    const selected = options.find(o => o.value === value);
    return selected ? [selected.label] : [];
  }, [value, options, multiple]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen, searchable]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.children;
      if (items[highlightedIndex]) {
        items[highlightedIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      setHighlightedIndex(-1);
      setSearchQuery('');
    }
  };

  const handleSelect = (optionValue) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      const newValues = currentValues.includes(optionValue)
        ? currentValues.filter(v => v !== optionValue)
        : [...currentValues, optionValue];
      onChange && onChange(newValues);
    } else {
      onChange && onChange(optionValue);
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange && onChange(multiple ? [] : '');
  };

  const handleRemoveTag = (tagValue, e) => {
    e.stopPropagation();
    if (multiple && Array.isArray(value)) {
      onChange && onChange(value.filter(v => v !== tagValue));
    }
  };

  const handleKeyDown = (e) => {
    if (!isOpen && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown')) {
      e.preventDefault();
      setIsOpen(true);
      return;
    }

    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex].value);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchQuery('');
        break;
      default:
        break;
    }
  };

  const isSelected = (optionValue) => {
    if (multiple && Array.isArray(value)) {
      return value.includes(optionValue);
    }
    return value === optionValue;
  };

  const selectedLabels = getSelectedLabels();
  const hasValue = multiple ? (Array.isArray(value) && value.length > 0) : !!value;

  return (
    <div
      className="select-field-wrapper"
      ref={containerRef}
      style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', position: 'relative' }}
    >
      {/* Label */}
      {label && (
        <label
          htmlFor={selectId}
          style={{
            fontSize: '0.85rem',
            fontWeight: 500,
            color: error ? 'var(--danger-600)' : 'var(--text-main)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          {label}
          {required && <span style={{ color: 'var(--danger-500)' }}>*</span>}
        </label>
      )}

      {/* Select Trigger */}
      <div
        id={selectId}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        tabIndex={disabled ? -1 : 0}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        style={{
          minHeight: '44px',
          padding: multiple && hasValue ? '6px 40px 6px 10px' : '0 40px 0 14px',
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '4px',
          border: `1.5px solid ${error ? 'var(--danger-500)' : isOpen ? 'var(--primary-500)' : 'var(--border-color)'}`,
          borderRadius: 'var(--radius-md)',
          background: disabled ? 'var(--secondary-50)' : 'var(--bg-card)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          boxShadow: isOpen ? '0 0 0 3px rgba(99, 102, 241, 0.12)' : 'none',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          position: 'relative',
          outline: 'none'
        }}
      >
        {/* Multiple Tags */}
        {multiple && hasValue && selectedLabels.map((lbl, i) => (
          <span
            key={i}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              fontSize: '0.78rem',
              fontWeight: 500,
              color: 'var(--primary-700)',
              background: 'var(--primary-50)',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--primary-200)',
              whiteSpace: 'nowrap',
              maxWidth: '150px',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {lbl}
            <button
              type="button"
              onClick={(e) => handleRemoveTag(value[i], e)}
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'none',
                border: 'none',
                color: 'var(--primary-400)',
                cursor: 'pointer',
                padding: 0,
                flexShrink: 0
              }}
            >
              <X size={12} />
            </button>
          </span>
        ))}

        {/* Single Value Display or Placeholder */}
        {!multiple && (
          <span style={{
            fontSize: '0.9rem',
            color: hasValue ? 'var(--text-main)' : 'var(--text-subtle)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {hasValue ? selectedLabels[0] : placeholder}
          </span>
        )}
        {multiple && !hasValue && (
          <span style={{ fontSize: '0.9rem', color: 'var(--text-subtle)' }}>{placeholder}</span>
        )}

        {/* Right Icons */}
        <div style={{
          position: 'absolute',
          right: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          {clearable && hasValue && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'none',
                border: 'none',
                color: 'var(--text-subtle)',
                cursor: 'pointer',
                padding: '2px',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              <X size={14} />
            </button>
          )}
          <ChevronDown
            size={16}
            style={{
              color: 'var(--text-subtle)',
              transition: 'transform 0.2s ease',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0)'
            }}
          />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '4px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 1000,
          maxHeight: '260px',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideDown 0.15s ease'
        }}>
          {/* Search Input */}
          {searchable && (
            <div style={{
              padding: '8px',
              borderBottom: '1px solid var(--border-color)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0 10px',
                height: '36px',
                background: 'var(--secondary-50)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)'
              }}>
                <Search size={14} style={{ color: 'var(--text-subtle)', flexShrink: 0 }} />
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Cari..."
                  style={{
                    flex: 1,
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    fontSize: '0.85rem',
                    color: 'var(--text-main)',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
            </div>
          )}

          {/* Options List */}
          <div ref={listRef} role="listbox" style={{ overflowY: 'auto', padding: '4px' }}>
            {filteredOptions.length === 0 ? (
              <div style={{
                padding: '16px',
                textAlign: 'center',
                fontSize: '0.85rem',
                color: 'var(--text-subtle)'
              }}>
                {searchQuery ? 'Tidak ditemukan' : 'Tidak ada pilihan'}
              </div>
            ) : (
              filteredOptions.map((opt, i) => {
                const selected = isSelected(opt.value);
                const highlighted = highlightedIndex === i;

                return (
                  <div
                    key={opt.value}
                    role="option"
                    aria-selected={selected}
                    onClick={() => !opt.disabled && handleSelect(opt.value)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      fontSize: '0.87rem',
                      color: opt.disabled ? 'var(--text-subtle)' : 'var(--text-main)',
                      background: highlighted
                        ? 'var(--primary-50)'
                        : selected
                          ? 'var(--secondary-50)'
                          : 'transparent',
                      borderRadius: 'var(--radius-sm)',
                      cursor: opt.disabled ? 'not-allowed' : 'pointer',
                      transition: 'background 0.15s ease',
                      opacity: opt.disabled ? 0.5 : 1
                    }}
                    onMouseEnter={() => setHighlightedIndex(i)}
                  >
                    {/* Multi-select checkbox indicator */}
                    {multiple && (
                      <div style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '4px',
                        border: `2px solid ${selected ? 'var(--primary-500)' : 'var(--secondary-300)'}`,
                        background: selected ? 'var(--primary-500)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'all 0.15s ease'
                      }}>
                        {selected && <Check size={12} color="#fff" strokeWidth={3} />}
                      </div>
                    )}

                    {/* Option Icon */}
                    {opt.icon && <span style={{ display: 'flex', flexShrink: 0 }}>{opt.icon}</span>}

                    {/* Option Label */}
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {opt.label}
                    </span>

                    {/* Single select check */}
                    {!multiple && selected && (
                      <Check size={16} style={{ color: 'var(--primary-500)', flexShrink: 0 }} />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Error / Helper Text */}
      {(error || helperText) && (
        <div style={{
          fontSize: '0.78rem',
          color: error ? 'var(--danger-500)' : 'var(--text-subtle)',
          paddingLeft: '2px'
        }}>
          {error || helperText}
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

export default SelectField;
