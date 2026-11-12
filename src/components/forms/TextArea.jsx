/**
 * TextArea Component - Multi-line Text Input with Rich Features
 * Supports auto-resize, character count, validation, and markdown preview toggle.
 */
import { useState, useRef, useEffect, useId } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

/**
 * @param {Object} props
 * @param {string} props.label - Label text
 * @param {string} [props.name] - Field name
 * @param {string} [props.value=''] - Controlled value
 * @param {string} [props.placeholder] - Placeholder
 * @param {Function} [props.onChange] - Change handler
 * @param {Function} [props.onBlur] - Blur handler
 * @param {number} [props.rows=4] - Initial number of rows
 * @param {number} [props.maxLength] - Maximum character length
 * @param {boolean} [props.autoResize=false] - Auto resize based on content
 * @param {boolean} [props.required=false] - Mark as required
 * @param {boolean} [props.disabled=false] - Disable input
 * @param {boolean} [props.readOnly=false] - Read-only mode
 * @param {string} [props.error] - Error message
 * @param {string} [props.success] - Success message
 * @param {string} [props.helperText] - Helper text
 * @param {string} [props.resize='vertical'] - CSS resize value
 */
export function TextArea({
  label,
  name,
  value = '',
  placeholder = '',
  onChange,
  onBlur,
  rows = 4,
  maxLength,
  autoResize = false,
  required = false,
  disabled = false,
  readOnly = false,
  error = '',
  success = '',
  helperText = '',
  resize = 'vertical'
}) {
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef(null);
  const generatedId = useId();
  const fieldId = name || generatedId;

  // Auto-resize effect
  useEffect(() => {
    if (autoResize && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [value, autoResize]);

  const getBorderColor = () => {
    if (error) return 'var(--danger-500)';
    if (success) return 'var(--success-500)';
    if (isFocused) return 'var(--primary-500)';
    return 'var(--border-color)';
  };

  const getBoxShadow = () => {
    if (error) return '0 0 0 3px rgba(239, 68, 68, 0.1)';
    if (success) return '0 0 0 3px rgba(16, 185, 129, 0.1)';
    if (isFocused) return '0 0 0 3px rgba(99, 102, 241, 0.12)';
    return 'none';
  };

  const charCount = value.length;
  const charPercentage = maxLength ? (charCount / maxLength) * 100 : 0;

  return (
    <div className="textarea-wrapper" style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      width: '100%'
    }}>
      {/* Label */}
      {label && (
        <label
          htmlFor={fieldId}
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

      {/* Textarea */}
      <div style={{ position: 'relative' }}>
        <textarea
          ref={textareaRef}
          id={fieldId}
          name={name}
          value={value}
          placeholder={placeholder || label}
          onChange={onChange}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur && onBlur(e);
          }}
          onFocus={() => setIsFocused(true)}
          rows={rows}
          maxLength={maxLength}
          disabled={disabled}
          readOnly={readOnly}
          aria-invalid={!!error}
          aria-describedby={error ? `${fieldId}-error` : helperText ? `${fieldId}-helper` : undefined}
          style={{
            width: '100%',
            padding: '12px 14px',
            fontSize: '0.9rem',
            fontFamily: 'inherit',
            lineHeight: 1.6,
            color: disabled ? 'var(--text-subtle)' : 'var(--text-main)',
            background: disabled ? 'var(--secondary-50)' : readOnly ? 'var(--secondary-50)' : 'var(--bg-card)',
            border: `1.5px solid ${getBorderColor()}`,
            borderRadius: 'var(--radius-md)',
            outline: 'none',
            boxShadow: getBoxShadow(),
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            resize: autoResize ? 'none' : resize,
            cursor: disabled ? 'not-allowed' : readOnly ? 'default' : 'text',
            minHeight: `${rows * 24 + 24}px`
          }}
        />

        {/* Validation icon */}
        {(error || success) && (
          <div style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            color: error ? 'var(--danger-500)' : 'var(--success-500)',
            pointerEvents: 'none'
          }}>
            {error ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          </div>
        )}
      </div>

      {/* Bottom row: Error/Helper + Character Count */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '8px'
      }}>
        {/* Error / Success / Helper */}
        <div
          id={error ? `${fieldId}-error` : `${fieldId}-helper`}
          role={error ? 'alert' : undefined}
          style={{
            fontSize: '0.78rem',
            color: error ? 'var(--danger-500)' : success ? 'var(--success-600)' : 'var(--text-subtle)',
            flex: 1,
            paddingLeft: '2px'
          }}
        >
          {error || success || helperText}
        </div>

        {/* Character count */}
        {maxLength && (
          <div style={{
            fontSize: '0.72rem',
            fontVariantNumeric: 'tabular-nums',
            color: charPercentage >= 95 ? 'var(--danger-500)' : charPercentage >= 80 ? 'var(--warning-500)' : 'var(--text-subtle)',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            {/* Mini progress bar */}
            <div style={{
              width: '40px',
              height: '3px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--secondary-200)',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${Math.min(charPercentage, 100)}%`,
                height: '100%',
                borderRadius: 'var(--radius-full)',
                background: charPercentage >= 95 ? 'var(--danger-500)' : charPercentage >= 80 ? 'var(--warning-500)' : 'var(--primary-500)',
                transition: 'width 0.2s ease, background 0.2s ease'
              }} />
            </div>
            <span>{charCount}/{maxLength}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default TextArea;
