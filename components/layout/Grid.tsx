import React from 'react';

interface GridProps {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  responsive?: boolean;
}

export const Grid: React.FC<GridProps> = ({ 
  children, 
  cols = 1, 
  gap = 'md', 
  className = '', 
  responsive = true 
}) => {
  const getColsClass = () => {
    if (!responsive) {
      return `grid-cols-${cols}`;
    }
    
    switch (cols) {
      case 1:
        return 'grid-cols-1';
      case 2:
        return 'grid-cols-1 sm:grid-cols-2';
      case 3:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
      case 4:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
      case 5:
        return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5';
      case 6:
        return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6';
      case 12:
        return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-12';
      default:
        return 'grid-cols-1';
    }
  };
  
  const getGapClass = () => {
    switch (gap) {
      case 'sm':
        return 'gap-2';
      case 'md':
        return 'gap-4';
      case 'lg':
        return 'gap-6';
      case 'xl':
        return 'gap-8';
      default:
        return 'gap-4';
    }
  };
  
  const gridClasses = `grid ${getColsClass()} ${getGapClass()} ${className}`.trim();
  
  return (
    <div className={gridClasses}>
      {children}
    </div>
  );
};

// 특화된 그리드 컴포넌트들
export const ResponsiveGrid: React.FC<{ 
  children: React.ReactNode; 
  className?: string;
  cols?: { mobile?: number; tablet?: number; desktop?: number };
}> = ({ children, className = '', cols = {} }) => {
  const { mobile = 1, tablet = 2, desktop = 3 } = cols;
  
  const colsClass = `grid-cols-${mobile} sm:grid-cols-${tablet} lg:grid-cols-${desktop}`;
  const gridClasses = `grid ${colsClass} gap-4 ${className}`.trim();
  
  return (
    <div className={gridClasses}>
      {children}
    </div>
  );
};

export const AutoGrid: React.FC<{ 
  children: React.ReactNode; 
  className?: string;
  minWidth?: string;
}> = ({ children, className = '', minWidth = '250px' }) => {
  const gridClasses = `grid gap-4 ${className}`.trim();
  const gridStyle = {
    gridTemplateColumns: `repeat(auto-fit, minmax(${minWidth}, 1fr))`
  };
  
  return (
    <div className={gridClasses} style={gridStyle}>
      {children}
    </div>
  );
};

export const MasonryGrid: React.FC<{ 
  children: React.ReactNode; 
  className?: string;
  columns?: number;
}> = ({ children, className = '', columns = 3 }) => {
  const gridClasses = `grid gap-4 ${className}`.trim();
  const gridStyle = {
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gridAutoRows: 'masonry'
  };
  
  return (
    <div className={gridClasses} style={gridStyle}>
      {children}
    </div>
  );
};
