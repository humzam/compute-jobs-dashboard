import React from 'react';

interface StatusBadgeProps {
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const STATUS_STYLES = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  RUNNING: 'bg-blue-100 text-blue-800 border-blue-200',
  COMPLETED: 'bg-green-100 text-green-800 border-green-200',
  FAILED: 'bg-red-100 text-red-800 border-red-200',
  CANCELLED: 'bg-gray-100 text-gray-800 border-gray-200',
};

const STATUS_LABELS = {
  PENDING: 'Pending',
  RUNNING: 'Running',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
};

const STATUS_ICONS = {
  PENDING: '⏳',
  RUNNING: '🔄',
  COMPLETED: '✅',
  FAILED: '❌',
  CANCELLED: '⏹️',
};

const SIZE_CLASSES = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-xs',
  lg: 'px-3 py-1 text-sm',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  className = '',
  showIcon = true,
  size = 'md'
}) => {
  const sizeClass = SIZE_CLASSES[size];
  
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium border ${STATUS_STYLES[status]} ${sizeClass} ${className}`}
    >
      {showIcon && (
        <span className="flex-shrink-0">
          {STATUS_ICONS[status]}
        </span>
      )}
      <span>{STATUS_LABELS[status]}</span>
    </span>
  );
};