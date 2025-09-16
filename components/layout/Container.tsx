import React from 'react';
import { breakpoints, containerMaxWidths } from '../../lib/designTokens';

interface ContainerProps {
  children: React.ReactNode;
  maxWidth?: keyof typeof containerMaxWidths;
  className?: string;
  fluid?: boolean;
}

export const Container: React.FC<ContainerProps> = ({ 
  children, 
  maxWidth = 'xl', 
  className = '', 
  fluid = false 
}) => {
  const baseClasses = 'w-full mx-auto px-4 sm:px-6 lg:px-8';
  
  const maxWidthClass = fluid ? '' : `max-w-${maxWidth}`;
  
  const containerClasses = `${baseClasses} ${maxWidthClass} ${className}`.trim();
  
  return (
    <div className={containerClasses}>
      {children}
    </div>
  );
};

// 특화된 컨테이너 컴포넌트들
export const MobileContainer: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <Container maxWidth="sm" className={className}>
    {children}
  </Container>
);

export const TabletContainer: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <Container maxWidth="lg" className={className}>
    {children}
  </Container>
);

export const DesktopContainer: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <Container maxWidth="2xl" className={className}>
    {children}
  </Container>
);

export const FluidContainer: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <Container fluid className={className}>
    {children}
  </Container>
);
