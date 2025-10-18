/**
 * Feature Flag 시스템
 * 반응형 기능의 점진적 배포를 위한 플래그 관리
 */

import React from 'react';

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  targetUsers?: string[];
  targetRoles?: string[];
  targetBranches?: string[];
  startDate?: Date;
  endDate?: Date;
  metadata?: Record<string, any>;
}

export interface FeatureFlagContext {
  userId?: string;
  userRole?: string;
  branchId?: string;
  userAgent?: string;
  timestamp?: Date;
}

// 기본 Feature Flag 설정
const defaultFeatureFlags: FeatureFlag[] = [
  {
    id: 'responsive-design',
    name: 'Responsive Design',
    description: 'Enable responsive design across the application',
    enabled: true,
    rolloutPercentage: 100,
    targetRoles: ['admin', 'manager', 'trainer'],
    startDate: new Date('2024-01-01'),
    metadata: {
      version: '1.0.0',
      components: ['Header', 'Sidebar', 'Modal', 'Dashboard', 'MemberManagement'],
    },
  },
  {
    id: 'mobile-navigation',
    name: 'Mobile Navigation',
    description: 'Enable mobile hamburger menu navigation',
    enabled: true,
    rolloutPercentage: 100,
    targetRoles: ['admin', 'manager', 'trainer'],
    metadata: {
      version: '1.0.0',
      components: ['Header'],
    },
  },
  {
    id: 'responsive-tables',
    name: 'Responsive Tables',
    description: 'Enable responsive table layouts with mobile cards',
    enabled: true,
    rolloutPercentage: 100,
    targetRoles: ['admin', 'manager', 'trainer'],
    metadata: {
      version: '1.0.0',
      components: ['MemberManagement', 'Dashboard'],
    },
  },
  {
    id: 'responsive-sidebar',
    name: 'Responsive Sidebar',
    description: 'Enable responsive sidebar with mobile overlay',
    enabled: true,
    rolloutPercentage: 100,
    targetRoles: ['admin', 'manager', 'trainer'],
    metadata: {
      version: '1.0.0',
      components: ['Sidebar'],
    },
  },
  {
    id: 'responsive-modals',
    name: 'Responsive Modals',
    description: 'Enable responsive modal sizing and mobile optimizations',
    enabled: true,
    rolloutPercentage: 100,
    targetRoles: ['admin', 'manager', 'trainer'],
    metadata: {
      version: '1.0.0',
      components: ['Modal'],
    },
  },
  {
    id: 'responsive-grid',
    name: 'Responsive Grid System',
    description: 'Enable responsive grid layouts and utilities',
    enabled: true,
    rolloutPercentage: 100,
    targetRoles: ['admin', 'manager', 'trainer'],
    metadata: {
      version: '1.0.0',
      components: ['Grid', 'Container', 'Flex'],
    },
  },
  {
    id: 'responsive-typography',
    name: 'Responsive Typography',
    description: 'Enable responsive text sizing and spacing',
    enabled: true,
    rolloutPercentage: 100,
    targetRoles: ['admin', 'manager', 'trainer'],
    metadata: {
      version: '1.0.0',
      components: ['All'],
    },
  },
  {
    id: 'responsive-animations',
    name: 'Responsive Animations',
    description: 'Enable responsive animations and transitions',
    enabled: true,
    rolloutPercentage: 100,
    targetRoles: ['admin', 'manager', 'trainer'],
    metadata: {
      version: '1.0.0',
      components: ['All'],
    },
  },
];

// Feature Flag 저장소
class FeatureFlagStore {
  private flags: Map<string, FeatureFlag> = new Map();
  private context: FeatureFlagContext = {};

  constructor() {
    this.loadDefaultFlags();
  }

  private loadDefaultFlags() {
    defaultFeatureFlags.forEach(flag => {
      this.flags.set(flag.id, flag);
    });
  }

  // Feature Flag 활성화 상태 확인
  isEnabled(flagId: string, context?: FeatureFlagContext): boolean {
    const flag = this.flags.get(flagId);
    if (!flag) {
      console.warn(`Feature flag '${flagId}' not found`);
      return false;
    }

    const currentContext = { ...this.context, ...context };
    
    // 기본 활성화 상태 확인
    if (!flag.enabled) {
      return false;
    }

    // 날짜 범위 확인
    if (flag.startDate && new Date() < flag.startDate) {
      return false;
    }

    if (flag.endDate && new Date() > flag.endDate) {
      return false;
    }

    // 사용자 역할 확인
    if (flag.targetRoles && currentContext.userRole) {
      if (!flag.targetRoles.includes(currentContext.userRole)) {
        return false;
      }
    }

    // 특정 사용자 확인
    if (flag.targetUsers && currentContext.userId) {
      if (!flag.targetUsers.includes(currentContext.userId)) {
        return false;
      }
    }

    // 특정 지점 확인
    if (flag.targetBranches && currentContext.branchId) {
      if (!flag.targetBranches.includes(currentContext.branchId)) {
        return false;
      }
    }

    // 롤아웃 퍼센티지 확인
    if (flag.rolloutPercentage < 100 && currentContext.userId) {
      const hash = this.hashString(currentContext.userId);
      const percentage = (hash % 100) + 1;
      if (percentage > flag.rolloutPercentage) {
        return false;
      }
    }

    return true;
  }

  // Feature Flag 값 가져오기
  getValue<T>(flagId: string, defaultValue: T, context?: FeatureFlagContext): T {
    if (this.isEnabled(flagId, context)) {
      const flag = this.flags.get(flagId);
      return (flag?.metadata?.value as T) ?? defaultValue;
    }
    return defaultValue;
  }

  // Feature Flag 설정
  setFlag(flag: FeatureFlag) {
    this.flags.set(flag.id, flag);
  }

  // Feature Flag 제거
  removeFlag(flagId: string) {
    this.flags.delete(flagId);
  }

  // 모든 Feature Flag 가져오기
  getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  // 활성화된 Feature Flag 가져오기
  getEnabledFlags(context?: FeatureFlagContext): FeatureFlag[] {
    const currentContext = { ...this.context, ...context };
    return this.getAllFlags().filter(flag => this.isEnabled(flag.id, currentContext));
  }

  // 컨텍스트 설정
  setContext(context: FeatureFlagContext) {
    this.context = { ...this.context, ...context };
  }

  // 컨텍스트 가져오기
  getContext(): FeatureFlagContext {
    return { ...this.context };
  }

  // 문자열 해시 함수
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32bit integer로 변환
    }
    return Math.abs(hash);
  }

  // Feature Flag 상태 리셋
  reset() {
    this.flags.clear();
    this.context = {};
    this.loadDefaultFlags();
  }

  // Feature Flag 내보내기
  export(): string {
    return JSON.stringify({
      flags: Array.from(this.flags.entries()),
      context: this.context,
    }, null, 2);
  }

  // Feature Flag 가져오기
  import(data: string) {
    try {
      const parsed = JSON.parse(data);
      this.flags = new Map(parsed.flags);
      this.context = parsed.context;
    } catch (error) {
      console.error('Failed to import feature flags:', error);
    }
  }
}

// 전역 Feature Flag 저장소 인스턴스
export const featureFlagStore = new FeatureFlagStore();

// Feature Flag 훅
export const useFeatureFlag = (flagId: string, context?: FeatureFlagContext) => {
  const [isEnabled, setIsEnabled] = React.useState(false);
  const [value, setValue] = React.useState<any>(null);

  React.useEffect(() => {
    const enabled = featureFlagStore.isEnabled(flagId, context);
    const flagValue = featureFlagStore.getValue(flagId, null, context);

    // Only update state when something actually changed to avoid render thrash
    setIsEnabled(prev => (prev !== enabled ? enabled : prev));
    setValue(prev => (prev !== flagValue ? flagValue : prev));
  }, [flagId, JSON.stringify(context)]);

  return { isEnabled, value };
};

// Feature Flag 컴포넌트
export const FeatureFlag: React.FC<{
  flagId: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  context?: FeatureFlagContext;
}> = ({ flagId, children, fallback = null, context }) => {
  const { isEnabled } = useFeatureFlag(flagId, context);
  
  return isEnabled ? <>{children}</> : <>{fallback}</>;
};

// Feature Flag 값 컴포넌트
export const FeatureFlagValue: React.FC<{
  flagId: string;
  defaultValue: any;
  children: (value: any) => React.ReactNode;
  context?: FeatureFlagContext;
}> = ({ flagId, defaultValue, children, context }) => {
  const { value } = useFeatureFlag(flagId, context);
  
  return <>{children(value ?? defaultValue)}</>;
};

// Feature Flag 관리 유틸리티
export const featureFlagUtils = {
  // 반응형 기능 활성화 확인
  isResponsiveEnabled: (context?: FeatureFlagContext) => 
    featureFlagStore.isEnabled('responsive-design', context),
  
  // 모바일 네비게이션 활성화 확인
  isMobileNavigationEnabled: (context?: FeatureFlagContext) => 
    featureFlagStore.isEnabled('mobile-navigation', context),
  
  // 반응형 테이블 활성화 확인
  isResponsiveTablesEnabled: (context?: FeatureFlagContext) => 
    featureFlagStore.isEnabled('responsive-tables', context),
  
  // 반응형 사이드바 활성화 확인
  isResponsiveSidebarEnabled: (context?: FeatureFlagContext) => 
    featureFlagStore.isEnabled('responsive-sidebar', context),
  
  // 반응형 모달 활성화 확인
  isResponsiveModalsEnabled: (context?: FeatureFlagContext) => 
    featureFlagStore.isEnabled('responsive-modals', context),
  
  // 반응형 그리드 활성화 확인
  isResponsiveGridEnabled: (context?: FeatureFlagContext) => 
    featureFlagStore.isEnabled('responsive-grid', context),
  
  // 반응형 타이포그래피 활성화 확인
  isResponsiveTypographyEnabled: (context?: FeatureFlagContext) => 
    featureFlagStore.isEnabled('responsive-typography', context),
  
  // 반응형 애니메이션 활성화 확인
  isResponsiveAnimationsEnabled: (context?: FeatureFlagContext) => 
    featureFlagStore.isEnabled('responsive-animations', context),
  
  // 모든 반응형 기능 활성화 확인
  areAllResponsiveFeaturesEnabled: (context?: FeatureFlagContext) => {
    const flags = [
      'responsive-design',
      'mobile-navigation',
      'responsive-tables',
      'responsive-sidebar',
      'responsive-modals',
      'responsive-grid',
      'responsive-typography',
      'responsive-animations',
    ];
    
    return flags.every(flag => featureFlagStore.isEnabled(flag, context));
  },
  
  // 반응형 기능 상태 가져오기
  getResponsiveFeatureStatus: (context?: FeatureFlagContext) => {
    return {
      responsiveDesign: featureFlagStore.isEnabled('responsive-design', context),
      mobileNavigation: featureFlagStore.isEnabled('mobile-navigation', context),
      responsiveTables: featureFlagStore.isEnabled('responsive-tables', context),
      responsiveSidebar: featureFlagStore.isEnabled('responsive-sidebar', context),
      responsiveModals: featureFlagStore.isEnabled('responsive-modals', context),
      responsiveGrid: featureFlagStore.isEnabled('responsive-grid', context),
      responsiveTypography: featureFlagStore.isEnabled('responsive-typography', context),
      responsiveAnimations: featureFlagStore.isEnabled('responsive-animations', context),
    };
  },
};

