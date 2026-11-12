import { FolderOpen } from 'lucide-react';

export function EmptyState({
  title = 'Tidak Ada Data',
  description = 'Belum ada rekaman data yang dapat ditampilkan untuk kategori ini.',
  actionText,
  onAction,
  icon: Icon = FolderOpen
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        textAlign: 'center',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px dashed #cbd5e1',
        margin: '16px 0'
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: '#f1f5f9',
          color: '#64748b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px'
        }}
      >
        <Icon size={28} />
      </div>
      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
        {title}
      </h4>
      <p style={{ fontSize: '0.86rem', color: '#64748b', maxWidth: '380px', marginBottom: '18px' }}>
        {description}
      </p>
      {actionText && onAction && (
        <button onClick={onAction} className="btn btn-primary btn-sm">
          {actionText}
        </button>
      )}
    </div>
  );
}

export default EmptyState;
