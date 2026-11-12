/**
 * FileUpload Component - Drag & Drop File Upload with Preview
 * Supports drag-and-drop, file type filtering, size limits,
 * image preview, progress animation, and multi-file upload.
 */
import { useState, useRef, useCallback } from 'react';
import { Upload, X, File, Image, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';

/**
 * @param {Object} props
 * @param {string} [props.label] - Upload label
 * @param {string} [props.accept] - Accepted file types (e.g., '.pdf,.doc,.docx')
 * @param {number} [props.maxSize=5] - Max file size in MB
 * @param {boolean} [props.multiple=false] - Allow multiple files
 * @param {Function} [props.onChange] - Callback with file(s)
 * @param {string} [props.error] - Error message
 * @param {string} [props.helperText] - Helper text
 * @param {boolean} [props.disabled=false] - Disable upload
 * @param {boolean} [props.showPreview=true] - Show file preview
 * @param {number} [props.maxFiles=5] - Max number of files (when multiple)
 */
export function FileUpload({
  label,
  accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png',
  maxSize = 5,
  multiple = false,
  onChange,
  error: externalError = '',
  helperText = '',
  disabled = false,
  showPreview = true,
  maxFiles = 5
}) {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [internalError, setInternalError] = useState('');
  const inputRef = useRef(null);

  const error = externalError || internalError;

  // Format file size
  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Get file icon
  const getFileIcon = (file) => {
    if (file.type.startsWith('image/')) return Image;
    if (file.type.includes('pdf')) return FileText;
    return File;
  };

  // Validate file
  const validateFile = useCallback((file) => {
    // Check size
    if (file.size > maxSize * 1024 * 1024) {
      return `File "${file.name}" melebihi batas ukuran ${maxSize}MB`;
    }

    // Check type
    if (accept) {
      const acceptedTypes = accept.split(',').map(t => t.trim().toLowerCase());
      const fileExt = '.' + file.name.split('.').pop().toLowerCase();
      const isAccepted = acceptedTypes.some(type => {
        if (type.startsWith('.')) return fileExt === type;
        if (type.includes('*')) return file.type.startsWith(type.replace('*', ''));
        return file.type === type;
      });

      if (!isAccepted) {
        return `File "${file.name}" bukan format yang diizinkan`;
      }
    }

    return null;
  }, [accept, maxSize]);

  // Process files
  const processFiles = useCallback((fileList) => {
    if (disabled) return;
    setInternalError('');

    const newFiles = Array.from(fileList);

    // Check max files
    if (multiple && files.length + newFiles.length > maxFiles) {
      setInternalError(`Maksimal ${maxFiles} file yang diizinkan`);
      return;
    }

    const validFiles = [];
    for (const file of newFiles) {
      const validationError = validateFile(file);
      if (validationError) {
        setInternalError(validationError);
        return;
      }

      // Create preview URL for images
      const preview = file.type.startsWith('image/')
        ? URL.createObjectURL(file)
        : null;

      validFiles.push({
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        preview,
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      });
    }

    const updated = multiple ? [...files, ...validFiles] : validFiles;
    setFiles(updated);
    onChange && onChange(multiple ? updated.map(f => f.file) : updated[0]?.file || null);
  }, [disabled, files, maxFiles, multiple, onChange, validateFile]);

  // Drag handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files.length) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveFile = (fileId) => {
    const updated = files.filter(f => f.id !== fileId);
    // Revoke preview URL
    const removedFile = files.find(f => f.id === fileId);
    if (removedFile?.preview) {
      URL.revokeObjectURL(removedFile.preview);
    }
    setFiles(updated);
    setInternalError('');
    onChange && onChange(multiple ? updated.map(f => f.file) : updated[0]?.file || null);
  };

  const handleClick = () => {
    if (!disabled) {
      inputRef.current?.click();
    }
  };

  const acceptedFormats = accept
    .split(',')
    .map(t => t.trim().replace('.', '').toUpperCase())
    .join(', ');

  return (
    <div className="file-upload-wrapper" style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      width: '100%'
    }}>
      {/* Label */}
      {label && (
        <label style={{
          fontSize: '0.85rem',
          fontWeight: 500,
          color: error ? 'var(--danger-600)' : 'var(--text-main)'
        }}>
          {label}
        </label>
      )}

      {/* Hidden File Input */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(e) => processFiles(e.target.files)}
        style={{ display: 'none' }}
        disabled={disabled}
      />

      {/* Drop Zone */}
      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${isDragging ? 'var(--primary-400)' : error ? 'var(--danger-300)' : 'var(--secondary-300)'}`,
          borderRadius: 'var(--radius-lg)',
          padding: '32px 24px',
          textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          background: isDragging
            ? 'var(--primary-50)'
            : error
              ? 'var(--danger-50)'
              : 'var(--secondary-50)',
          transition: 'all 0.25s ease',
          opacity: disabled ? 0.5 : 1,
          position: 'relative',
          overflow: 'hidden'
        }}
        onMouseEnter={(e) => {
          if (!disabled && !isDragging) {
            e.currentTarget.style.borderColor = 'var(--primary-300)';
            e.currentTarget.style.background = 'var(--primary-50)';
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled && !isDragging) {
            e.currentTarget.style.borderColor = error ? 'var(--danger-300)' : 'var(--secondary-300)';
            e.currentTarget.style.background = error ? 'var(--danger-50)' : 'var(--secondary-50)';
          }
        }}
      >
        {/* Animated ring background on drag */}
        {isDragging && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: 'var(--primary-100)',
            opacity: 0.5,
            animation: 'pulse 1s ease infinite'
          }} />
        )}

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: 'var(--radius-lg)',
            background: isDragging ? 'var(--primary-100)' : 'var(--secondary-100)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            transition: 'background 0.25s ease, transform 0.25s ease',
            transform: isDragging ? 'scale(1.1)' : 'scale(1)'
          }}>
            <Upload
              size={24}
              style={{
                color: isDragging ? 'var(--primary-500)' : 'var(--text-subtle)',
                transition: 'color 0.25s ease'
              }}
            />
          </div>

          <p style={{
            fontSize: '0.9rem',
            fontWeight: 500,
            color: 'var(--text-main)',
            marginBottom: '4px'
          }}>
            {isDragging ? 'Lepaskan file di sini' : 'Klik untuk unggah atau seret file ke sini'}
          </p>

          <p style={{
            fontSize: '0.78rem',
            color: 'var(--text-subtle)'
          }}>
            {acceptedFormats} • Maks. {maxSize}MB{multiple ? ` • Maks. ${maxFiles} file` : ''}
          </p>
        </div>
      </div>

      {/* File Previews */}
      {showPreview && files.length > 0 && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          marginTop: '4px'
        }}>
          {files.map((fileData) => {
            const FileIcon = getFileIcon(fileData.file);
            return (
              <div
                key={fileData.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  background: 'var(--secondary-50)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  animation: 'slideDown 0.2s ease'
                }}
              >
                {/* Image Preview or File Icon */}
                {fileData.preview ? (
                  <img
                    src={fileData.preview}
                    alt={fileData.name}
                    style={{
                      width: '40px',
                      height: '40px',
                      objectFit: 'cover',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--primary-50)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <FileIcon size={20} style={{ color: 'var(--primary-500)' }} />
                  </div>
                )}

                {/* File Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    color: 'var(--text-main)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {fileData.name}
                  </p>
                  <p style={{
                    fontSize: '0.72rem',
                    color: 'var(--text-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span>{formatSize(fileData.size)}</span>
                    <CheckCircle2 size={12} style={{ color: 'var(--success-500)' }} />
                    <span style={{ color: 'var(--success-600)' }}>Siap</span>
                  </p>
                </div>

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile(fileData.id);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '28px',
                    height: '28px',
                    borderRadius: 'var(--radius-full)',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-subtle)',
                    cursor: 'pointer',
                    flexShrink: 0,
                    transition: 'background 0.2s, color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--danger-50)';
                    e.currentTarget.style.color = 'var(--danger-500)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-subtle)';
                  }}
                  aria-label={`Hapus ${fileData.name}`}
                >
                  <X size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Error / Helper Text */}
      {(error || helperText) && (
        <div style={{
          fontSize: '0.78rem',
          color: error ? 'var(--danger-500)' : 'var(--text-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          paddingLeft: '2px'
        }}>
          {error && <AlertCircle size={13} />}
          {error || helperText}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
          50% { transform: translate(-50%, -50%) scale(1.3); opacity: 0.2; }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default FileUpload;
