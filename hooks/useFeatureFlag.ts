import { useState, useEffect, useCallback } from 'react';
import { featureFlagStore, FeatureFlagContext } from '../lib/featureFlags';

/**
 * Feature Flag 훅
 * 컴포넌트에서 Feature Flag 상태를 쉽게 사용할 수 있도록 하는 훅
 */
export const useFeatureFlag = (flagId: string, context?: FeatureFlagContext) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [value, setValue] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkFlag = () => {
      try {
        const enabled = featureFlagStore.isEnabled(flagId, context);
        const flagValue = featureFlagStore.getValue(flagId, null, context);
        
        setIsEnabled(enabled);
        setValue(flagValue);
        setLoading(false);
      } catch (error) {
        console.error(`Error checking feature flag '${flagId}':`, error);
        setIsEnabled(false);
        setValue(null);
        setLoading(false);
      }
    };

    checkFlag();
  }, [flagId, context]);

  return { isEnabled, value, loading };
};

/**
 * 여러 Feature Flag를 한 번에 확인하는 훅
 */
export const useFeatureFlags = (flagIds: string[], context?: FeatureFlagContext) => {
  const [flags, setFlags] = useState<Record<string, { isEnabled: boolean; value: any; loading: boolean }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkFlags = () => {
      try {
        const flagStates: Record<string, { isEnabled: boolean; value: any; loading: boolean }> = {};
        
        flagIds.forEach(flagId => {
          const isEnabled = featureFlagStore.isEnabled(flagId, context);
          const value = featureFlagStore.getValue(flagId, null, context);
          
          flagStates[flagId] = { isEnabled, value, loading: false };
        });
        
        setFlags(flagStates);
        setLoading(false);
      } catch (error) {
        console.error('Error checking feature flags:', error);
        setLoading(false);
      }
    };

    checkFlags();
  }, [flagIds, context]);

  return { flags, loading };
};

/**
 * 반응형 기능 상태를 확인하는 훅
 */
export const useResponsiveFeatures = (context?: FeatureFlagContext) => {
  const responsiveFlags = [
    'responsive-design',
    'mobile-navigation',
    'responsive-tables',
    'responsive-sidebar',
    'responsive-modals',
    'responsive-grid',
    'responsive-typography',
    'responsive-animations',
  ];

  const { flags, loading } = useFeatureFlags(responsiveFlags, context);

  const isResponsiveEnabled = flags['responsive-design']?.isEnabled ?? false;
  const isMobileNavigationEnabled = flags['mobile-navigation']?.isEnabled ?? false;
  const isResponsiveTablesEnabled = flags['responsive-tables']?.isEnabled ?? false;
  const isResponsiveSidebarEnabled = flags['responsive-sidebar']?.isEnabled ?? false;
  const isResponsiveModalsEnabled = flags['responsive-modals']?.isEnabled ?? false;
  const isResponsiveGridEnabled = flags['responsive-grid']?.isEnabled ?? false;
  const isResponsiveTypographyEnabled = flags['responsive-typography']?.isEnabled ?? false;
  const isResponsiveAnimationsEnabled = flags['responsive-animations']?.isEnabled ?? false;

  const areAllEnabled = Object.values(flags).every(flag => flag.isEnabled);

  return {
    loading,
    isResponsiveEnabled,
    isMobileNavigationEnabled,
    isResponsiveTablesEnabled,
    isResponsiveSidebarEnabled,
    isResponsiveModalsEnabled,
    isResponsiveGridEnabled,
    isResponsiveTypographyEnabled,
    isResponsiveAnimationsEnabled,
    areAllEnabled,
    flags,
  };
};

/**
 * Feature Flag 컨텍스트를 관리하는 훅
 */
export const useFeatureFlagContext = () => {
  const [context, setContext] = useState<FeatureFlagContext>({});

  const updateContext = useCallback((newContext: Partial<FeatureFlagContext>) => {
    const updatedContext = { ...context, ...newContext };
    setContext(updatedContext);
    featureFlagStore.setContext(updatedContext);
  }, [context]);

  const setUserContext = useCallback((userId: string, userRole: string, branchId?: string) => {
    updateContext({ userId, userRole, branchId });
  }, [updateContext]);

  const setDeviceContext = useCallback((userAgent: string) => {
    updateContext({ userAgent });
  }, [updateContext]);

  const clearContext = useCallback(() => {
    setContext({});
    featureFlagStore.setContext({});
  }, []);

  return {
    context,
    updateContext,
    setUserContext,
    setDeviceContext,
    clearContext,
  };
};

/**
 * Feature Flag 상태를 실시간으로 모니터링하는 훅
 */
export const useFeatureFlagMonitor = (flagId: string, context?: FeatureFlagContext) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [value, setValue] = useState<any>(null);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  const checkFlag = useCallback(() => {
    try {
      const enabled = featureFlagStore.isEnabled(flagId, context);
      const flagValue = featureFlagStore.getValue(flagId, null, context);
      
      setIsEnabled(enabled);
      setValue(flagValue);
      setLastChecked(new Date());
    } catch (error) {
      console.error(`Error monitoring feature flag '${flagId}':`, error);
    }
  }, [flagId, context]);

  useEffect(() => {
    // 초기 확인
    checkFlag();

    // 주기적으로 확인 (5분마다)
    const interval = setInterval(checkFlag, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [checkFlag]);

  return {
    isEnabled,
    value,
    lastChecked,
    refresh: checkFlag,
  };
};

/**
 * Feature Flag A/B 테스트를 위한 훅
 */
export const useFeatureFlagABTest = (flagId: string, variants: Record<string, any>, context?: FeatureFlagContext) => {
  const { isEnabled, value } = useFeatureFlag(flagId, context);
  
  const getVariant = useCallback(() => {
    if (!isEnabled) {
      return variants.control || null;
    }

    if (value && variants[value]) {
      return variants[value];
    }

    // 기본적으로 A/B 테스트를 위한 랜덤 선택
    const variantKeys = Object.keys(variants);
    const randomIndex = Math.floor(Math.random() * variantKeys.length);
    return variants[variantKeys[randomIndex]];
  }, [isEnabled, value, variants]);

  const [variant, setVariant] = useState(getVariant());

  useEffect(() => {
    setVariant(getVariant());
  }, [getVariant]);

  return {
    isEnabled,
    variant,
    value,
  };
};

/**
 * Feature Flag 상태를 로컬 스토리지에 저장하는 훅
 */
export const useFeatureFlagPersistence = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // 로컬 스토리지에서 Feature Flag 상태 복원
    try {
      const savedFlags = localStorage.getItem('feature-flags');
      if (savedFlags) {
        featureFlagStore.import(savedFlags);
      }
    } catch (error) {
      console.error('Error loading feature flags from localStorage:', error);
    }

    setIsLoaded(true);
  }, []);

  const saveFlags = useCallback(() => {
    try {
      const flagsData = featureFlagStore.export();
      localStorage.setItem('feature-flags', flagsData);
    } catch (error) {
      console.error('Error saving feature flags to localStorage:', error);
    }
  }, []);

  const clearFlags = useCallback(() => {
    try {
      localStorage.removeItem('feature-flags');
      featureFlagStore.reset();
    } catch (error) {
      console.error('Error clearing feature flags from localStorage:', error);
    }
  }, []);

  return {
    isLoaded,
    saveFlags,
    clearFlags,
  };
};
