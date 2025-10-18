import React from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { UserRole } from '../types';

interface PermissionGuardProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requiredRoles?: UserRole[];
  requiredPermission?: () => boolean;
  branchId?: string;
  fallback?: React.ReactNode;
  showFallback?: boolean;
}

/**
 * 권한에 따라 컴포넌트를 조건부로 렌더링하는 가드 컴포넌트
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  requiredRole,
  requiredRoles,
  requiredPermission,
  branchId,
  fallback = null,
  showFallback = false
}) => {
  const permissions = usePermissions();

  // 권한 확인 로직
  const hasPermission = () => {
    // 특정 권한 함수가 제공된 경우
    if (requiredPermission) {
      return requiredPermission();
    }

    // 특정 역할이 필요한 경우
    if (requiredRole) {
      return permissions.hasRole(requiredRole);
    }

    // 여러 역할 중 하나가 필요한 경우
    if (requiredRoles && requiredRoles.length > 0) {
      return permissions.hasAnyRole(requiredRoles);
    }

    // 기본적으로 인증된 사용자만 허용
    return permissions.isAuthenticated();
  };

  if (!hasPermission()) {
    return showFallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
};

/**
 * 관리자만 접근 가능한 컴포넌트
 */
export const AdminOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback = null
}) => (
  <PermissionGuard requiredRole="admin" fallback={fallback}>
    {children}
  </PermissionGuard>
);

/**
 * 매니저 이상만 접근 가능한 컴포넌트
 */
export const ManagerOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback = null
}) => (
  <PermissionGuard requiredRoles={['admin', 'manager']} fallback={fallback}>
    {children}
  </PermissionGuard>
);

/**
 * 강사 이상만 접근 가능한 컴포넌트
 */
export const TrainerOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback = null
}) => (
  <PermissionGuard requiredRoles={['admin', 'manager', 'trainer']} fallback={fallback}>
    {children}
  </PermissionGuard>
);

/**
 * 승인된 사용자만 접근 가능한 컴포넌트
 */
export const ApprovedOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback = null
}) => {
  const permissions = usePermissions();
  
  return (
    <PermissionGuard requiredPermission={() => permissions.isApproved()} fallback={fallback}>
      {children}
    </PermissionGuard>
  );
};

/**
 * 특정 지점에 접근 권한이 있는 사용자만 접근 가능한 컴포넌트
 */
export const BranchAccessOnly: React.FC<{
  children: React.ReactNode;
  branchId: string;
  fallback?: React.ReactNode;
}> = ({ children, branchId, fallback = null }) => {
  const permissions = usePermissions();
  
  return (
    <PermissionGuard 
      requiredPermission={() => permissions.canAccessBranch(branchId)} 
      fallback={fallback}
    >
      {children}
    </PermissionGuard>
  );
};

/**
 * 수업료 조회 권한이 있는 사용자만 접근 가능한 컴포넌트
 */
export const RevenueAccessOnly: React.FC<{
  children: React.ReactNode;
  branchId?: string;
  fallback?: React.ReactNode;
}> = ({ children, branchId, fallback = null }) => {
  const permissions = usePermissions();
  
  return (
    <PermissionGuard 
      requiredPermission={() => 
        branchId 
          ? permissions.canViewBranchRevenue(branchId)
          : permissions.canViewAllRevenue()
      } 
      fallback={fallback}
    >
      {children}
    </PermissionGuard>
  );
};
