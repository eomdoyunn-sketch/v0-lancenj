import { useState, useEffect } from 'react';
import { breakpoints } from '../lib/designTokens';

// 브레이크포인트 타입 정의
type Breakpoint = keyof typeof breakpoints;

// 현재 화면 크기 상태
interface ScreenSize {
  width: number;
  height: number;
  breakpoint: Breakpoint;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isWide: boolean;
}

// 반응형 훅
export const useResponsive = (): ScreenSize => {
  const [screenSize, setScreenSize] = useState<ScreenSize>(() => {
    // 초기값 설정 (SSR 대응)
    if (typeof window === 'undefined') {
      return {
        width: 1024,
        height: 768,
        breakpoint: 'lg',
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isWide: false,
      };
    }
    
    return getScreenSize(window.innerWidth);
  });

  useEffect(() => {
    const handleResize = () => {
      setScreenSize(getScreenSize(window.innerWidth));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return screenSize;
};

// 화면 크기에 따른 브레이크포인트 계산
const getScreenSize = (width: number): ScreenSize => {
  let breakpoint: Breakpoint = 'xs';
  
  if (width >= parseInt(breakpoints.wide)) {
    breakpoint = '2xl';
  } else if (width >= parseInt(breakpoints.desktop)) {
    breakpoint = 'xl';
  } else if (width >= parseInt(breakpoints.tablet)) {
    breakpoint = 'lg';
  } else if (width >= parseInt(breakpoints.sm)) {
    breakpoint = 'md';
  } else if (width >= parseInt(breakpoints.xs)) {
    breakpoint = 'sm';
  }

  return {
    width,
    height: window.innerHeight,
    breakpoint,
    isMobile: width < parseInt(breakpoints.tablet),
    isTablet: width >= parseInt(breakpoints.tablet) && width < parseInt(breakpoints.desktop),
    isDesktop: width >= parseInt(breakpoints.desktop),
    isWide: width >= parseInt(breakpoints.wide),
  };
};

// 특정 브레이크포인트 이상인지 확인하는 훅
export const useBreakpoint = (breakpoint: Breakpoint): boolean => {
  const { width } = useResponsive();
  return width >= parseInt(breakpoints[breakpoint]);
};

// 모바일 여부 확인 훅
export const useIsMobile = (): boolean => {
  return useBreakpoint('tablet') === false;
};

// 태블릿 여부 확인 훅
export const useIsTablet = (): boolean => {
  const { isTablet } = useResponsive();
  return isTablet;
};

// 데스크톱 여부 확인 훅
export const useIsDesktop = (): boolean => {
  return useBreakpoint('desktop');
};

// 화면 크기별 조건부 렌더링을 위한 훅
export const useResponsiveRender = () => {
  const screenSize = useResponsive();
  
  return {
    // 모바일에서만 렌더링
    mobile: (component: React.ReactNode) => screenSize.isMobile ? component : null,
    
    // 태블릿에서만 렌더링
    tablet: (component: React.ReactNode) => screenSize.isTablet ? component : null,
    
    // 데스크톱에서만 렌더링
    desktop: (component: React.ReactNode) => screenSize.isDesktop ? component : null,
    
    // 모바일과 태블릿에서 렌더링
    mobileAndTablet: (component: React.ReactNode) => !screenSize.isDesktop ? component : null,
    
    // 태블릿과 데스크톱에서 렌더링
    tabletAndDesktop: (component: React.ReactNode) => !screenSize.isMobile ? component : null,
    
    // 특정 브레이크포인트 이상에서 렌더링
    above: (breakpoint: Breakpoint, component: React.ReactNode) => 
      screenSize.width >= parseInt(breakpoints[breakpoint]) ? component : null,
    
    // 특정 브레이크포인트 미만에서 렌더링
    below: (breakpoint: Breakpoint, component: React.ReactNode) => 
      screenSize.width < parseInt(breakpoints[breakpoint]) ? component : null,
  };
};

// 반응형 값 선택을 위한 훅
export const useResponsiveValue = <T>(values: {
  mobile?: T;
  tablet?: T;
  desktop?: T;
  default: T;
}): T => {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  
  if (isMobile && values.mobile !== undefined) {
    return values.mobile;
  }
  
  if (isTablet && values.tablet !== undefined) {
    return values.tablet;
  }
  
  if (isDesktop && values.desktop !== undefined) {
    return values.desktop;
  }
  
  return values.default;
};

// 반응형 스타일 객체 생성 훅
export const useResponsiveStyle = () => {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  
  return {
    // 반응형 패딩
    padding: (mobile: string, tablet?: string, desktop?: string) => {
      if (isMobile) return mobile;
      if (isTablet && tablet) return tablet;
      if (isDesktop && desktop) return desktop;
      return mobile;
    },
    
    // 반응형 마진
    margin: (mobile: string, tablet?: string, desktop?: string) => {
      if (isMobile) return mobile;
      if (isTablet && tablet) return tablet;
      if (isDesktop && desktop) return desktop;
      return mobile;
    },
    
    // 반응형 폰트 크기
    fontSize: (mobile: string, tablet?: string, desktop?: string) => {
      if (isMobile) return mobile;
      if (isTablet && tablet) return tablet;
      if (isDesktop && desktop) return desktop;
      return mobile;
    },
    
    // 반응형 너비
    width: (mobile: string, tablet?: string, desktop?: string) => {
      if (isMobile) return mobile;
      if (isTablet && tablet) return tablet;
      if (isDesktop && desktop) return desktop;
      return mobile;
    },
    
    // 반응형 높이
    height: (mobile: string, tablet?: string, desktop?: string) => {
      if (isMobile) return mobile;
      if (isTablet && tablet) return tablet;
      if (isDesktop && desktop) return desktop;
      return mobile;
    },
  };
};
