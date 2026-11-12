/**
 * InputField Component - Styled Form Input with Label, Validation, and Icons
 * Supports text, email, password, number, date, tel, url input types.
 * Features floating labels effect, validation states, helper text, and prefix/suffix icons.
 */
import { useState, useRef, useId } from 'react';
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';

/**
 * @param {Object} props
 * @param {string} props.label - Input label text
 * @param {string} [props.name] - Input name attribute
 * @param {string} [props.type='text'] - Input type
 * @param {string} [props.value] - Controlled value
 * @param {string} [props.placeholder] - Placeholder text
 * @param {Function} [props.onChange] - Change handler
 * @param {Function} [props.onBlur] - Blur handler
 * @param {string} [props.error] - Error message
 * @param {string} [props.success] - Success message
 * @param {string} [props.helperText] - Helper text below input
 * @param {boolean} [props.required=false] - Mark as required
 * @param {boolean} [props.disabled=false] - Disable input
 * @param {boolean} [props.readOnly=false] - Read-only mode
 * @param {React.ReactNode} [props.prefixIcon] - Icon before input
 * @param {React.ReactNode} [props.suffixIcon] - Icon after input
 * @param {number} [props.maxLength] - Max character length
 * @param {string} [props.autoComplete] - Autocomplete attribute
 * @param {Object} [props.inputProps] - Additional props for input element
 */
export function InputField({
  label,
  name,
  type = 'text',
  value = '',
  placeholder = '',
  onChange,
  onBlur,
  error = '',
  success = '',
  helperText = '',
  required = false,
  disabled = false,
  readOnly = false,
  prefixIcon: PrefixIcon = null,
  suffixIcon: SuffixIcon = null,
  maxLength,
  autoComplete,
  inputProps = {}
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);
  const generatedId = useId();
  const inputId = name || generatedId;

  const isPassword = type === 'password';
  const actualType = isPassword && showPassword ? 'text' : type;

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

  return (
    <div className="input-field-wrapper" style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      width: '100%'
    }}>
      {/* Label */}
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: '0.85rem',
            fontWeight: 500,
            color: error ? 'var(--danger-600)' : 'var(--text-main)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'color 0.2s ease'
          }}
        >
          {label}
          {required && (
            <span style={{ color: 'var(--danger-500)', fontSize: '0.9rem' }}>*</span>
          )}
        </label>
      )}

      {/* Input Container */}
      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center'
      }}>
        {/* Prefix Icon */}
        {PrefixIcon && (
          <div style={{
            position: 'absolute',
            left: '12px',
            display: 'flex',
            alignItems: 'center',
            color: isFocused ? 'var(--primary-500)' : 'var(--text-subtle)',
            transition: 'color 0.2s ease',
            pointerEvents: 'none',
            zIndex: 1
          }}>
            {typeof PrefixIcon === 'function'
              ? <PrefixIcon size={18} />
              : PrefixIcon}
          </div>
        )}

        {/* Input */}
        <input
          ref={inputRef}
          id={inputId}
          name={name}
          type={actualType}
          value={value}
          placeholder={placeholder || label}
          onChange={onChange}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur && onBlur(e);
          }}
          onFocus={() => setIsFocused(true)}
          disabled={disabled}
          readOnly={readOnly}
          maxLength={maxLength}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          {...inputProps}
          style={{
            width: '100%',
            height: '44px',
            padding: `0 ${isPassword || SuffixIcon ? '44px' : '14px'} 0 ${PrefixIcon ? '40px' : '14px'}`,
            fontSize: '0.9rem',
            fontFamily: 'inherit',
            color: disabled ? 'var(--text-subtle)' : 'var(--text-main)',
            background: disabled ? 'var(--secondary-50)' : readOnly ? 'var(--secondary-50)' : 'var(--bg-card)',
            border: `1.5px solid ${getBorderColor()}`,
            borderRadius: 'var(--radius-md)',
            outline: 'none',
            boxShadow: getBoxShadow(),
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease',
            cursor: disabled ? 'not-allowed' : readOnly ? 'default' : 'text',
            ...(inputProps.style || {})
          }}
        />

        {/* Password Toggle */}
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
            style={{
              position: 'absolute',
              right: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '30px',
              height: '30px',
              border: 'none',
              background: 'transparent',
              color: 'var(--text-subtle)',
              cursor: 'pointer',
              borderRadius: 'var(--radius-sm)',
              transition: 'color 0.2s ease, background 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--primary-500)';
              e.currentTarget.style.background = 'var(--primary-50)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-subtle)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}

        {/* Suffix Icon (non-password) */}
        {!isPassword && SuffixIcon && (
          <div style={{
            position: 'absolute',
            right: '12px',
            display: 'flex',
            alignItems: 'center',
            color: error ? 'var(--danger-500)' : success ? 'var(--success-500)' : 'var(--text-subtle)',
            pointerEvents: 'none'
          }}>
            {typeof SuffixIcon === 'function'
              ? <SuffixIcon size={18} />
              : SuffixIcon}
          </div>
        )}

        {/* Validation Icon */}
        {!SuffixIcon && !isPassword && (error || success) && (
          <div style={{
            position: 'absolute',
            right: '12px',
            display: 'flex',
            alignItems: 'center',
            color: error ? 'var(--danger-500)' : 'var(--success-500)',
            pointerEvents: 'none'
          }}>
            {error ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          </div>
        )}
      </div>

      {/* Error / Success / Helper Text */}
      {(error || success || helperText) && (
        <div
          id={error ? `${inputId}-error` : `${inputId}-helper`}
          role={error ? 'alert' : undefined}
          style={{
            fontSize: '0.78rem',
            color: error ? 'var(--danger-500)' : success ? 'var(--success-600)' : 'var(--text-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            paddingLeft: '2px'
          }}
        >
          {error || success || helperText}
        </div>
      )}

      {/* Character Count */}
      {maxLength && (
        <div style={{
          fontSize: '0.72rem',
          color: value.length >= maxLength ? 'var(--danger-500)' : 'var(--text-subtle)',
          textAlign: 'right',
          fontVariantNumeric: 'tabular-nums'
        }}>
          {value.length}/{maxLength}
        </div>
      )}
    </div>
  );
}

export default InputField;
