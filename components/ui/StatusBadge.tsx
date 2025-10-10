interface StatusBadgeProps {
  status: string;
  className?: string;
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const getStatusStyles = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'status-active';
      case 'completed':
        return 'status-completed';
      case 'failed':
        return 'status-failed';
      case 'pending':
        return 'status-pending';
      case 'in_progress':
        return 'status-active';
      case 'paused':
        return 'status-pending';
      case 'cancelled':
        return 'status-failed';
      default:
        return 'status-pending';
    }
  };

  return (
    <span className={`status-badge ${getStatusStyles(status)} ${className}`}>
      {status}
    </span>
  );
}
