import React from 'react';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: boolean;
}

const SIZE_CLASSES = {
  sm: 'max-w-2xl',
  md: 'max-w-4xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  full: 'max-w-full',
};

export const Container: React.FC<ContainerProps> = ({ 
  children, 
  className = '',
  size = 'xl',
  padding = true
}) => {
  const sizeClass = SIZE_CLASSES[size];
  const paddingClass = padding ? 'px-4 sm:px-6 lg:px-8' : '';

  return (
    <div className={`${sizeClass} mx-auto ${paddingClass} ${className}`}>
      {children}
    </div>
  );
};