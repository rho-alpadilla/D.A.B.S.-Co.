import React from 'react';

const sizeClasses = {
  sm: 'max-w-3xl',
  md: 'max-w-4xl',
  wide: 'max-w-6xl',
  full: 'max-w-7xl',
};

/**
 * PageContainer
 * A simple layout wrapper that centres content horizontally and applies
 * consistent max-width + horizontal padding across the site.
 *
 * Props:
 *  - size     : 'sm' | 'md' | 'wide' | 'full'  (default: 'wide')
 *  - className: additional Tailwind classes
 *  - children : any React nodes
 */
const PageContainer = ({ size = 'wide', className = '', children, ...rest }) => {
  const maxWidth = sizeClasses[size] ?? sizeClasses.wide;

  return (
    <div className={`${maxWidth} mx-auto w-full px-5 sm:px-6 lg:px-8 ${className}`} {...rest}>
      {children}
    </div>
  );
};

export default PageContainer;
