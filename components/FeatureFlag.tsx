import React from 'react';
import { FeatureFlag, FeatureFlagValue, useFeatureFlag } from '../lib/featureFlags';

// Feature Flag 컴포넌트 래퍼
export const FeatureFlagWrapper: React.FC<{
  flagId: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  context?: any;
}> = ({ flagId, children, fallback = null, context }) => {
  return (
    <FeatureFlag flagId={flagId} fallback={fallback} context={context}>
      {children}
    </FeatureFlag>
  );
};

// Feature Flag 값 컴포넌트 래퍼
export const FeatureFlagValueWrapper: React.FC<{
  flagId: string;
  defaultValue: any;
  children: (value: any) => React.ReactNode;
  context?: any;
}> = ({ flagId, defaultValue, children, context }) => {
  return (
    <FeatureFlagValue flagId={flagId} defaultValue={defaultValue} context={context}>
      {children}
    </FeatureFlagValue>
  );
};

// 반응형 기능 활성화 확인 컴포넌트
export const ResponsiveFeature: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  context?: any;
}> = ({ children, fallback = null, context }) => {
  return (
    <FeatureFlagWrapper flagId="responsive-design" fallback={fallback} context={context}>
      {children}
    </FeatureFlagWrapper>
  );
};

// 모바일 네비게이션 활성화 확인 컴포넌트
export const MobileNavigationFeature: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  context?: any;
}> = ({ children, fallback = null, context }) => {
  return (
    <FeatureFlagWrapper flagId="mobile-navigation" fallback={fallback} context={context}>
      {children}
    </FeatureFlagWrapper>
  );
};

// 반응형 테이블 활성화 확인 컴포넌트
export const ResponsiveTableFeature: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  context?: any;
}> = ({ children, fallback = null, context }) => {
  return (
    <FeatureFlagWrapper flagId="responsive-tables" fallback={fallback} context={context}>
      {children}
    </FeatureFlagWrapper>
  );
};

// 반응형 사이드바 활성화 확인 컴포넌트
export const ResponsiveSidebarFeature: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  context?: any;
}> = ({ children, fallback = null, context }) => {
  return (
    <FeatureFlagWrapper flagId="responsive-sidebar" fallback={fallback} context={context}>
      {children}
    </FeatureFlagWrapper>
  );
};

// 반응형 모달 활성화 확인 컴포넌트
export const ResponsiveModalFeature: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  context?: any;
}> = ({ children, fallback = null, context }) => {
  return (
    <FeatureFlagWrapper flagId="responsive-modals" fallback={fallback} context={context}>
      {children}
    </FeatureFlagWrapper>
  );
};

// 반응형 그리드 활성화 확인 컴포넌트
export const ResponsiveGridFeature: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  context?: any;
}> = ({ children, fallback = null, context }) => {
  return (
    <FeatureFlagWrapper flagId="responsive-grid" fallback={fallback} context={context}>
      {children}
    </FeatureFlagWrapper>
  );
};

// 반응형 타이포그래피 활성화 확인 컴포넌트
export const ResponsiveTypographyFeature: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  context?: any;
}> = ({ children, fallback = null, context }) => {
  return (
    <FeatureFlagWrapper flagId="responsive-typography" fallback={fallback} context={context}>
      {children}
    </FeatureFlagWrapper>
  );
};

// 반응형 애니메이션 활성화 확인 컴포넌트
export const ResponsiveAnimationFeature: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  context?: any;
}> = ({ children, fallback = null, context }) => {
  return (
    <FeatureFlagWrapper flagId="responsive-animations" fallback={fallback} context={context}>
      {children}
    </FeatureFlagWrapper>
  );
};

// Feature Flag 상태 표시 컴포넌트
export const FeatureFlagStatus: React.FC<{
  flagId: string;
  context?: any;
}> = ({ flagId, context }) => {
  const { isEnabled, value } = useFeatureFlag(flagId, context);
  
  return (
    <div className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium">
      <div className={`w-2 h-2 rounded-full ${isEnabled ? 'bg-green-500' : 'bg-red-500'}`} />
      <span className={isEnabled ? 'text-green-700' : 'text-red-700'}>
        {flagId}: {isEnabled ? 'ON' : 'OFF'}
      </span>
      {value && (
        <span className="text-slate-600">
          ({JSON.stringify(value)})
        </span>
      )}
    </div>
  );
};

// 모든 반응형 기능 상태 표시 컴포넌트
export const ResponsiveFeatureStatus: React.FC<{
  context?: any;
}> = ({ context }) => {
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
  
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-slate-700">Responsive Features Status</h3>
      <div className="flex flex-wrap gap-2">
        {flags.map(flagId => (
          <FeatureFlagStatus key={flagId} flagId={flagId} context={context} />
        ))}
      </div>
    </div>
  );
};

// Feature Flag 디버그 컴포넌트 (개발 환경에서만 사용)
export const FeatureFlagDebug: React.FC<{
  context?: any;
}> = ({ context }) => {
  const [isVisible, setIsVisible] = React.useState(false);
  
  // 개발 환경에서만 표시
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-slate-800 text-white p-2 rounded-full shadow-lg hover:bg-slate-700 transition-colors"
        title="Feature Flag Debug"
      >
        🚩
      </button>
      
      {isVisible && (
        <div className="absolute bottom-12 right-0 bg-white border border-slate-200 rounded-lg shadow-lg p-4 w-80 max-h-96 overflow-y-auto">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-medium text-slate-700">Feature Flags</h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>
          
          <ResponsiveFeatureStatus context={context} />
          
          <div className="mt-4 pt-3 border-t border-slate-200">
            <h4 className="text-xs font-medium text-slate-600 mb-2">Context</h4>
            <pre className="text-xs text-slate-500 bg-slate-50 p-2 rounded overflow-x-auto">
              {JSON.stringify(context, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
