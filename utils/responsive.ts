import { breakpoints } from '../lib/designTokens';

// 브레이크포인트 타입 정의
type Breakpoint = keyof typeof breakpoints;

// 미디어 쿼리 생성 유틸리티
export const createMediaQuery = {
  // 특정 브레이크포인트 이상
  up: (breakpoint: Breakpoint): string => 
    `@media (min-width: ${breakpoints[breakpoint]})`,
  
  // 특정 브레이크포인트 미만
  down: (breakpoint: Breakpoint): string => 
    `@media (max-width: ${breakpoints[breakpoint]})`,
  
  // 특정 브레이크포인트 범위
  between: (min: Breakpoint, max: Breakpoint): string => 
    `@media (min-width: ${breakpoints[min]}) and (max-width: ${breakpoints[max]})`,
  
  // 모바일 전용
  mobile: (): string => 
    `@media (max-width: ${breakpoints.tablet})`,
  
  // 태블릿 전용
  tablet: (): string => 
    `@media (min-width: ${breakpoints.tablet}) and (max-width: ${breakpoints.desktop})`,
  
  // 데스크톱 전용
  desktop: (): string => 
    `@media (min-width: ${breakpoints.desktop})`,
  
  // 터치 디바이스
  touch: (): string => 
    `@media (hover: none) and (pointer: coarse)`,
  
  // 호버 가능한 디바이스
  hover: (): string => 
    `@media (hover: hover) and (pointer: fine)`,
  
  // 다크 모드
  dark: (): string => 
    `@media (prefers-color-scheme: dark)`,
  
  // 라이트 모드
  light: (): string => 
    `@media (prefers-color-scheme: light)`,
  
  // 고해상도 디스플레이
  retina: (): string => 
    `@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)`,
};

// 반응형 클래스 생성 유틸리티
export const createResponsiveClasses = {
  // 반응형 그리드 컬럼
  gridCols: (mobile: number, tablet?: number, desktop?: number): string => {
    let classes = `grid-cols-${mobile}`;
    if (tablet) classes += ` sm:grid-cols-${tablet}`;
    if (desktop) classes += ` lg:grid-cols-${desktop}`;
    return classes;
  },
  
  // 반응형 플렉스 방향
  flexDirection: (mobile: 'row' | 'col', desktop?: 'row' | 'col'): string => {
    let classes = `flex-${mobile}`;
    if (desktop && desktop !== mobile) classes += ` sm:flex-${desktop}`;
    return classes;
  },
  
  // 반응형 텍스트 크기
  textSize: (mobile: string, tablet?: string, desktop?: string): string => {
    let classes = `text-${mobile}`;
    if (tablet) classes += ` sm:text-${tablet}`;
    if (desktop) classes += ` lg:text-${desktop}`;
    return classes;
  },
  
  // 반응형 패딩
  padding: (mobile: string, tablet?: string, desktop?: string): string => {
    let classes = `p-${mobile}`;
    if (tablet) classes += ` sm:p-${tablet}`;
    if (desktop) classes += ` lg:p-${desktop}`;
    return classes;
  },
  
  // 반응형 마진
  margin: (mobile: string, tablet?: string, desktop?: string): string => {
    let classes = `m-${mobile}`;
    if (tablet) classes += ` sm:m-${tablet}`;
    if (desktop) classes += ` lg:m-${desktop}`;
    return classes;
  },
  
  // 반응형 너비
  width: (mobile: string, tablet?: string, desktop?: string): string => {
    let classes = `w-${mobile}`;
    if (tablet) classes += ` sm:w-${tablet}`;
    if (desktop) classes += ` lg:w-${desktop}`;
    return classes;
  },
  
  // 반응형 높이
  height: (mobile: string, tablet?: string, desktop?: string): string => {
    let classes = `h-${mobile}`;
    if (tablet) classes += ` sm:h-${tablet}`;
    if (desktop) classes += ` lg:h-${desktop}`;
    return classes;
  },
  
  // 반응형 간격
  gap: (mobile: string, tablet?: string, desktop?: string): string => {
    let classes = `gap-${mobile}`;
    if (tablet) classes += ` sm:gap-${tablet}`;
    if (desktop) classes += ` lg:gap-${desktop}`;
    return classes;
  },
  
  // 반응형 숨김/표시
  visibility: (mobile: 'hidden' | 'block', tablet?: 'hidden' | 'block', desktop?: 'hidden' | 'block'): string => {
    let classes = mobile === 'hidden' ? 'hidden' : 'block';
    if (tablet) classes += tablet === 'hidden' ? ' sm:hidden' : ' sm:block';
    if (desktop) classes += desktop === 'hidden' ? ' lg:hidden' : ' lg:block';
    return classes;
  },
};

// 반응형 값 선택 유틸리티
export const getResponsiveValue = <T>(
  values: {
    mobile: T;
    tablet?: T;
    desktop?: T;
  },
  currentBreakpoint: Breakpoint
): T => {
  const breakpointOrder: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
  const currentIndex = breakpointOrder.indexOf(currentBreakpoint);
  
  // 현재 브레이크포인트 이상에서 사용 가능한 값 중 가장 큰 값 선택
  if (currentIndex >= breakpointOrder.indexOf('xl') && values.desktop !== undefined) {
    return values.desktop;
  }
  
  if (currentIndex >= breakpointOrder.indexOf('lg') && values.tablet !== undefined) {
    return values.tablet;
  }
  
  return values.mobile;
};

// 반응형 스타일 객체 생성 유틸리티
export const createResponsiveStyle = (
  styles: {
    mobile: React.CSSProperties;
    tablet?: React.CSSProperties;
    desktop?: React.CSSProperties;
  },
  currentBreakpoint: Breakpoint
): React.CSSProperties => {
  return getResponsiveValue(styles, currentBreakpoint);
};

// 반응형 이미지 소스 생성 유틸리티
export const createResponsiveImageSrc = (
  baseSrc: string,
  sizes: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  } = {}
): string => {
  const { mobile = '400w', tablet = '800w', desktop = '1200w' } = sizes;
  
  return `${baseSrc}?w=${mobile},${tablet},${desktop}&fit=crop&auto=format`;
};

// 반응형 이미지 srcSet 생성 유틸리티
export const createResponsiveSrcSet = (
  baseSrc: string,
  sizes: { width: number; descriptor: string }[]
): string => {
  return sizes
    .map(({ width, descriptor }) => `${baseSrc}?w=${width} ${descriptor}`)
    .join(', ');
};

// 반응형 이미지 sizes 속성 생성 유틸리티
export const createResponsiveSizes = (
  sizes: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  }
): string => {
  const { mobile = '100vw', tablet = '50vw', desktop = '33vw' } = sizes;
  
  return `(max-width: ${breakpoints.tablet}) ${mobile}, (max-width: ${breakpoints.desktop}) ${tablet}, ${desktop}`;
};

// 반응형 컨테이너 클래스 생성 유틸리티
export const createContainerClass = (
  maxWidth?: Breakpoint,
  padding?: 'sm' | 'md' | 'lg'
): string => {
  let classes = 'w-full mx-auto';
  
  if (maxWidth) {
    classes += ` max-w-${maxWidth}`;
  }
  
  switch (padding) {
    case 'sm':
      classes += ' px-2 sm:px-4';
      break;
    case 'md':
      classes += ' px-4 sm:px-6 lg:px-8';
      break;
    case 'lg':
      classes += ' px-6 sm:px-8 lg:px-12';
      break;
    default:
      classes += ' px-4 sm:px-6 lg:px-8';
  }
  
  return classes;
};

// 반응형 네비게이션 클래스 생성 유틸리티
export const createNavigationClass = (
  type: 'header' | 'sidebar' | 'footer' = 'header'
): string => {
  switch (type) {
    case 'header':
      return 'flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4';
    case 'sidebar':
      return 'flex flex-col space-y-4';
    case 'footer':
      return 'flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0';
    default:
      return 'flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4';
  }
};

// 반응형 폼 클래스 생성 유틸리티
export const createFormClass = (
  type: 'input' | 'label' | 'group' | 'container' = 'input'
): string => {
  switch (type) {
    case 'input':
      return 'w-full px-3 py-2 border border-slate-300 rounded-md text-sm sm:text-base';
    case 'label':
      return 'text-sm sm:text-base font-medium text-slate-700';
    case 'group':
      return 'flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4';
    case 'container':
      return 'space-y-4 sm:space-y-6';
    default:
      return '';
  }
};
