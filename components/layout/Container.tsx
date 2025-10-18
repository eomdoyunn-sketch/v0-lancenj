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
  
  const getMaxWidthClass = () => {
    if (fluid) return '';

    switch (maxWidth) {
      case 'xs':
        return 'max-w-xl';
      case 'sm':
        return 'max-w-2xl';
      case 'md':
        return 'max-w-4xl';
      case 'lg':
        return 'max-w-6xl';
      case 'xl':
        return 'max-w-7xl';
      case '2xl':
        return 'max-w-8xl';
      default:
        return 'max-w-4xl';
    }
  };
  
  const containerClasses = `${baseClasses} ${getMaxWidthClass()} ${className}`.trim();
  
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

export const WideContainer: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <Container maxWidth="2xl" className={className}>
    {children}
  </Container>
);

export const FullWidthContainer: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = ''
}) => (
  <div className={`w-full px-4 sm:px-6 lg:px-8 ${className}`}>
    {children}
  </div>
);

// 적절한 너비의 컨테이너 (기본값)
export const CenteredContainer: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = ''
}) => (
  <Container maxWidth="md" className={className}>
    {children}
  </Container>
);

// 마이페이지용 컨테이너
export const MyPageContainer: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = ''
}) => (
  <Container maxWidth="lg" className={className}>
    {children}
  </Container>
);
