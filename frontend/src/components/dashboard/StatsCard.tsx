import React from 'react';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'gray';
  subtitle?: string;
}

const COLOR_CLASSES = {
  blue: 'bg-blue-50 text-blue-700',
  green: 'bg-green-50 text-green-700', 
  yellow: 'bg-yellow-50 text-yellow-700',
  red: 'bg-red-50 text-red-700',
  gray: 'bg-gray-50 text-gray-700',
};

export const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  value, 
  icon, 
  color = 'gray',
  subtitle 
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center">
        {icon && (
          <div className={`flex-shrink-0 p-3 rounded-md ${COLOR_CLASSES[color]}`}>
            <span className="text-lg">{icon}</span>
          </div>
        )}
        <div className={`${icon ? 'ml-4' : ''} flex-1`}>
          <div className="text-sm font-medium text-gray-500">{title}</div>
          <div className="text-2xl font-semibold text-gray-900">{value}</div>
          {subtitle && (
            <div className="text-sm text-gray-500">{subtitle}</div>
          )}
        </div>
      </div>
    </div>
  );
};