import React from 'react';
import { useResponsive } from '../../hooks/useResponsive';

interface ResponsiveTableProps {
  children: React.ReactNode;
  className?: string;
  mobileView?: React.ReactNode;
  tabletView?: React.ReactNode;
  desktopView?: React.ReactNode;
}

export const ResponsiveTable: React.FC<ResponsiveTableProps> = ({
  children,
  className = '',
  mobileView,
  tabletView,
  desktopView
}) => {
  const { isMobile, isTablet } = useResponsive();

  return (
    <div className={`bg-white rounded-lg shadow-sm overflow-hidden ${className}`}>
      {/* 데스크톱 뷰 */}
      <div className="hidden lg:block">
        {desktopView || children}
      </div>
      
      {/* 태블릿 뷰 */}
      <div className="hidden sm:block lg:hidden">
        {tabletView || children}
      </div>
      
      {/* 모바일 뷰 */}
      <div className="sm:hidden">
        {mobileView || children}
      </div>
    </div>
  );
};

interface ResponsiveCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  children,
  className = '',
  onClick
}) => {
  return (
    <div 
      className={`p-4 border-b border-slate-100 hover:bg-slate-50 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: 'sm' | 'md' | 'lg' | 'xl';
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  className = '',
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 'md'
}) => {
  const { mobile = 1, tablet = 2, desktop = 3 } = cols;
  
  const getGapClass = () => {
    switch (gap) {
      case 'sm': return 'gap-2';
      case 'md': return 'gap-4';
      case 'lg': return 'gap-6';
      case 'xl': return 'gap-8';
      default: return 'gap-4';
    }
  };
  
  const gridClasses = `grid grid-cols-${mobile} sm:grid-cols-${tablet} lg:grid-cols-${desktop} ${getGapClass()} ${className}`.trim();
  
  return (
    <div className={gridClasses}>
      {children}
    </div>
  );
};
