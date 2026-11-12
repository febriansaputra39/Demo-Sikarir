export function Badge({ children, variant = 'primary', className = '', dot = false }) {
  const getVariantClass = () => {
    switch (variant) {
      case 'success':
        return 'badge-success';
      case 'warning':
        return 'badge-warning';
      case 'danger':
        return 'badge-danger';
      case 'info':
        return 'badge-info';
      case 'purple':
        return 'badge-purple';
      default:
        return 'badge-primary';
    }
  };

  return (
    <span className={`badge ${getVariantClass()} ${className}`}>
      {dot && (
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: 'currentColor',
            display: 'inline-block'
          }}
        />
      )}
      {children}
    </span>
  );
}

export default Badge;
