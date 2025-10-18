import { useMemo } from 'react';
import { AuthService } from '../lib/authService';
import { UserRole } from '../types';
import { PermissionManager, PermissionCheck, BranchPermission } from '../lib/permissionUtils';

/**
 * 권한 관리를 위한 React Hook
 */
export const usePermissions = () => {
  const currentUser = AuthService.getCurrentUser();

  const permissions = useMemo(() => {
    return {
      // 기본 권한 확인
      isAdmin: () => AuthService.isAdmin(),
      isManager: () => AuthService.isManager(),
      isTrainer: () => AuthService.isTrainer(),
      isUnassigned: () => AuthService.isUnassigned(),
      isAuthenticated: () => AuthService.isAuthenticated(),
      isPendingApproval: () => AuthService.isPendingApproval(),
      isApproved: () => AuthService.isApproved(),

      // 역할 확인
      hasRole: (role: UserRole) => AuthService.hasRole(role),
      hasAnyRole: (roles: UserRole[]) => AuthService.hasAnyRole(roles),

      // 지점 접근 권한
      canAccessBranch: (branchId: string) => AuthService.canAccessBranch(branchId),

      // 수업료 조회 권한
      canViewAllRevenue: () => AuthService.canViewAllRevenue(),
      canViewBranchRevenue: (branchId: string) => AuthService.canViewBranchRevenue(branchId),

      // 관리 권한
      canManageMembers: (branchId?: string) => AuthService.canManageMembers(branchId),
      canManageTrainers: () => AuthService.canManageTrainers(),
      canManagePrograms: (branchId?: string) => AuthService.canManagePrograms(branchId),
      canManageSessions: (branchId?: string) => AuthService.canManageSessions(branchId),
      canManageUsers: () => AuthService.canManageUsers(),
      canManageBranches: () => AuthService.canManageBranches(),

      // 페이지 접근 권한
      canAccessDashboard: () => AuthService.canAccessDashboard(),
      canAccessManagement: () => AuthService.canAccessManagement(),
      canViewLogs: () => AuthService.canViewLogs(),

      // 전체 권한 정보 가져오기
      getPermissions: (): PermissionCheck => PermissionManager.getPermissions(currentUser),
      getBranchPermissions: (branchId: string): BranchPermission => 
        PermissionManager.getBranchPermissions(currentUser, branchId),
    };
  }, [currentUser]);

  return permissions;
};

/**
 * 특정 지점의 권한을 확인하는 Hook
 */
export const useBranchPermissions = (branchId: string) => {
  const permissions = usePermissions();
  
  return useMemo(() => ({
    canAccess: permissions.canAccessBranch(branchId),
    canViewRevenue: permissions.canViewBranchRevenue(branchId),
    canManageMembers: permissions.canManageMembers(branchId),
    canManagePrograms: permissions.canManagePrograms(branchId),
    canManageSessions: permissions.canManageSessions(branchId),
    branchPermissions: permissions.getBranchPermissions(branchId),
  }), [permissions, branchId]);
};

/**
 * 사용자 역할에 따른 UI 표시를 위한 Hook
 */
export const useRoleBasedUI = () => {
  const permissions = usePermissions();
  
  return useMemo(() => ({
    // 네비게이션 표시 여부
    showDashboard: permissions.canAccessDashboard(),
    showManagement: permissions.canAccessManagement(),
    showLogs: permissions.canViewLogs(),
    
    // 메뉴 표시 여부
    showMemberManagement: permissions.canManageMembers(),
    showTrainerManagement: permissions.canManageTrainers(),
    showProgramManagement: permissions.canManagePrograms(),
    showUserManagement: permissions.canManageUsers(),
    showBranchManagement: permissions.canManageBranches(),
    
    // 승인 대기 상태
    isPendingApproval: permissions.isPendingApproval(),
    isApproved: permissions.isApproved(),
    
    // 역할별 표시
    isAdmin: permissions.isAdmin(),
    isManager: permissions.isManager(),
    isTrainer: permissions.isTrainer(),
    isUnassigned: permissions.isUnassigned(),
  }), [permissions]);
};
