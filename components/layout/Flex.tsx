import React from 'react';

interface FlexProps {
  children: React.ReactNode;
  direction?: 'row' | 'col' | 'row-reverse' | 'col-reverse';
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';
  align?: 'start' | 'end' | 'center' | 'baseline' | 'stretch';
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  responsive?: boolean;
}

export const Flex: React.FC<FlexProps> = ({ 
  children, 
  direction = 'row', 
  wrap = 'nowrap', 
  justify = 'start', 
  align = 'start', 
  gap = 'md', 
  className = '', 
  responsive = true 
}) => {
  const getDirectionClass = () => {
    if (!responsive) {
      return `flex-${direction}`;
    }
    
    switch (direction) {
      case 'row':
        return 'flex-col sm:flex-row';
      case 'col':
        return 'flex-col';
      case 'row-reverse':
        return 'flex-col-reverse sm:flex-row-reverse';
      case 'col-reverse':
        return 'flex-col-reverse';
      default:
        return 'flex-row';
    }
  };
  
  const getWrapClass = () => {
    switch (wrap) {
      case 'nowrap':
        return 'flex-nowrap';
      case 'wrap':
        return 'flex-wrap';
      case 'wrap-reverse':
        return 'flex-wrap-reverse';
      default:
        return 'flex-nowrap';
    }
  };
  
  const getJustifyClass = () => {
    switch (justify) {
      case 'start':
        return 'justify-start';
      case 'end':
        return 'justify-end';
      case 'center':
        return 'justify-center';
      case 'between':
        return 'justify-between';
      case 'around':
        return 'justify-around';
      case 'evenly':
        return 'justify-evenly';
      default:
        return 'justify-start';
    }
  };
  
  const getAlignClass = () => {
    switch (align) {
      case 'start':
        return 'items-start';
      case 'end':
        return 'items-end';
      case 'center':
        return 'items-center';
      case 'baseline':
        return 'items-baseline';
      case 'stretch':
        return 'items-stretch';
      default:
        return 'items-start';
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
  
  const flexClasses = `flex ${getDirectionClass()} ${getWrapClass()} ${getJustifyClass()} ${getAlignClass()} ${getGapClass()} ${className}`.trim();
  
  return (
    <div className={flexClasses}>
      {children}
    </div>
  );
};

// 특화된 플렉스 컴포넌트들
export const ResponsiveFlex: React.FC<{ 
  children: React.ReactNode; 
  className?: string;
  direction?: { mobile?: 'row' | 'col'; desktop?: 'row' | 'col' };
  justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';
  align?: 'start' | 'end' | 'center' | 'baseline' | 'stretch';
}> = ({ 
  children, 
  className = '', 
  direction = { mobile: 'col', desktop: 'row' }, 
  justify = 'start', 
  align = 'start' 
}) => {
  const { mobile = 'col', desktop = 'row' } = direction;
  const directionClass = `flex-${mobile} sm:flex-${desktop}`;
  const justifyClass = `justify-${justify}`;
  const alignClass = `items-${align}`;
  
  const flexClasses = `flex ${directionClass} ${justifyClass} ${alignClass} gap-4 ${className}`.trim();
  
  return (
    <div className={flexClasses}>
      {children}
    </div>
  );
};

export const Stack: React.FC<{ 
  children: React.ReactNode; 
  className?: string;
  spacing?: 'sm' | 'md' | 'lg' | 'xl';
  direction?: 'vertical' | 'horizontal';
}> = ({ children, className = '', spacing = 'md', direction = 'vertical' }) => {
  const directionClass = direction === 'vertical' ? 'flex-col' : 'flex-row';
  const spacingClass = `space-${direction === 'vertical' ? 'y' : 'x'}-${spacing === 'sm' ? '2' : spacing === 'md' ? '4' : spacing === 'lg' ? '6' : '8'}`;
  
  const stackClasses = `flex ${directionClass} ${spacingClass} ${className}`.trim();
  
  return (
    <div className={stackClasses}>
      {children}
    </div>
  );
};

export const Center: React.FC<{ 
  children: React.ReactNode; 
  className?: string;
  axis?: 'both' | 'horizontal' | 'vertical';
}> = ({ children, className = '', axis = 'both' }) => {
  const getCenterClass = () => {
    switch (axis) {
      case 'both':
        return 'flex items-center justify-center';
      case 'horizontal':
        return 'flex justify-center';
      case 'vertical':
        return 'flex items-center';
      default:
        return 'flex items-center justify-center';
    }
  };
  
  const centerClasses = `${getCenterClass()} ${className}`.trim();
  
  return (
    <div className={centerClasses}>
      {children}
    </div>
  );
};

export const SpaceBetween: React.FC<{ 
  children: React.ReactNode; 
  className?: string;
  direction?: 'row' | 'col';
}> = ({ children, className = '', direction = 'row' }) => {
  const directionClass = direction === 'row' ? 'flex-row' : 'flex-col';
  const spaceClasses = `flex ${directionClass} justify-between items-center ${className}`.trim();
  
  return (
    <div className={spaceClasses}>
      {children}
    </div>
  );
};
