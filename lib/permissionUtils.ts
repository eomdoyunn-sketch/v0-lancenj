import { User, UserRole } from '../types';

export interface PermissionCheck {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManage: boolean;
}

export interface BranchPermission {
  branchId: string;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManage: boolean;
}

/**
 * 사용자 권한을 검증하는 클래스
 */
export class PermissionManager {
  /**
   * 사용자가 특정 역할을 가지고 있는지 확인
   */
  static hasRole(user: User | null, role: UserRole): boolean {
    if (!user) return false;
    return user.role === role;
  }

  /**
   * 사용자가 여러 역할 중 하나를 가지고 있는지 확인
   */
  static hasAnyRole(user: User | null, roles: UserRole[]): boolean {
    if (!user) return false;
    return roles.includes(user.role);
  }

  /**
   * 사용자가 관리자 권한을 가지고 있는지 확인
   */
  static isAdmin(user: User | null): boolean {
    return this.hasRole(user, 'admin');
  }

  /**
   * 사용자가 매니저 권한을 가지고 있는지 확인
   */
  static isManager(user: User | null): boolean {
    return this.hasRole(user, 'manager');
  }

  /**
   * 사용자가 강사 권한을 가지고 있는지 확인
   */
  static isTrainer(user: User | null): boolean {
    return this.hasRole(user, 'trainer');
  }

  /**
   * 사용자가 할당되지 않은 상태인지 확인
   */
  static isUnassigned(user: User | null): boolean {
    return this.hasRole(user, 'unassigned');
  }

  /**
   * 사용자가 특정 지점에 접근 권한이 있는지 확인
   */
  static canAccessBranch(user: User | null, branchId: string): boolean {
    if (!user) return false;
    
    // 관리자는 모든 지점에 접근 가능
    if (this.isAdmin(user)) return true;
    
    // 사용자가 할당된 지점이 있는지 확인
    return user.assignedBranchIds?.includes(branchId) || false;
  }

  /**
   * 사용자가 여러 지점 중 하나에 접근 권한이 있는지 확인
   */
  static canAccessAnyBranch(user: User | null, branchIds: string[]): boolean {
    if (!user) return false;
    
    // 관리자는 모든 지점에 접근 가능
    if (this.isAdmin(user)) return true;
    
    // 사용자가 할당된 지점 중 하나라도 포함되어 있는지 확인
    return branchIds.some(branchId => 
      user.assignedBranchIds?.includes(branchId)
    );
  }

  /**
   * 사용자의 전체 권한을 확인
   */
  static getPermissions(user: User | null): PermissionCheck {
    if (!user) {
      return {
        canView: false,
        canEdit: false,
        canDelete: false,
        canManage: false
      };
    }

    switch (user.role) {
      case 'admin':
        return {
          canView: true,
          canEdit: true,
          canDelete: true,
          canManage: true
        };
      
      case 'manager':
        return {
          canView: true,
          canEdit: true,
          canDelete: false,
          canManage: true
        };
      
      case 'trainer':
        return {
          canView: true,
          canEdit: true,
          canDelete: false,
          canManage: false
        };
      
      case 'unassigned':
      default:
        return {
          canView: false,
          canEdit: false,
          canDelete: false,
          canManage: false
        };
    }
  }

  /**
   * 사용자의 지점별 권한을 확인
   */
  static getBranchPermissions(user: User | null, branchId: string): BranchPermission {
    const basePermissions = this.getPermissions(user);
    const canAccess = this.canAccessBranch(user, branchId);

    return {
      branchId,
      canView: basePermissions.canView && canAccess,
      canEdit: basePermissions.canEdit && canAccess,
      canDelete: basePermissions.canDelete && canAccess,
      canManage: basePermissions.canManage && canAccess
    };
  }

  /**
   * 사용자가 전체 수업료를 볼 수 있는지 확인
   */
  static canViewAllRevenue(user: User | null): boolean {
    if (!user) return false;
    return this.isAdmin(user) || this.isManager(user);
  }

  /**
   * 사용자가 특정 지점의 수업료를 볼 수 있는지 확인
   */
  static canViewBranchRevenue(user: User | null, branchId: string): boolean {
    if (!user) return false;
    
    // 관리자나 매니저는 모든 지점의 수업료를 볼 수 있음
    if (this.isAdmin(user) || this.isManager(user)) return true;
    
    // 강사는 자신이 할당된 지점의 수업료만 볼 수 있음
    if (this.isTrainer(user)) {
      return this.canAccessBranch(user, branchId);
    }
    
    return false;
  }

  /**
   * 사용자가 회원을 관리할 수 있는지 확인
   */
  static canManageMembers(user: User | null, branchId?: string): boolean {
    if (!user) return false;
    
    // 관리자는 모든 회원 관리 가능
    if (this.isAdmin(user)) return true;
    
    // 매니저와 강사는 할당된 지점의 회원 관리 가능
    if (this.isManager(user) || this.isTrainer(user)) {
      if (!branchId) return true; // 지점이 지정되지 않은 경우
      return this.canAccessBranch(user, branchId);
    }
    
    return false;
  }

  /**
   * 사용자가 강사를 관리할 수 있는지 확인
   */
  static canManageTrainers(user: User | null): boolean {
    if (!user) return false;
    return this.isAdmin(user) || this.isManager(user);
  }

  /**
   * 사용자가 프로그램을 관리할 수 있는지 확인
   */
  static canManagePrograms(user: User | null, branchId?: string): boolean {
    if (!user) return false;
    
    // 관리자는 모든 프로그램 관리 가능
    if (this.isAdmin(user)) return true;
    
    // 매니저와 강사는 할당된 지점의 프로그램 관리 가능
    if (this.isManager(user) || this.isTrainer(user)) {
      if (!branchId) return true; // 지점이 지정되지 않은 경우
      return this.canAccessBranch(user, branchId);
    }
    
    return false;
  }

  /**
   * 사용자가 세션을 관리할 수 있는지 확인
   */
  static canManageSessions(user: User | null, branchId?: string): boolean {
    if (!user) return false;
    
    // 관리자는 모든 세션 관리 가능
    if (this.isAdmin(user)) return true;
    
    // 매니저와 강사는 할당된 지점의 세션 관리 가능
    if (this.isManager(user) || this.isTrainer(user)) {
      if (!branchId) return true; // 지점이 지정되지 않은 경우
      return this.canAccessBranch(user, branchId);
    }
    
    return false;
  }

  /**
   * 사용자가 사용자를 관리할 수 있는지 확인
   */
  static canManageUsers(user: User | null): boolean {
    if (!user) return false;
    return this.isAdmin(user);
  }

  /**
   * 사용자가 지점을 관리할 수 있는지 확인
   */
  static canManageBranches(user: User | null): boolean {
    if (!user) return false;
    return this.isAdmin(user);
  }

  /**
   * 사용자가 대시보드에 접근할 수 있는지 확인
   */
  static canAccessDashboard(user: User | null): boolean {
    if (!user) return false;
    return !this.isUnassigned(user);
  }

  /**
   * 사용자가 관리 페이지에 접근할 수 있는지 확인
   */
  static canAccessManagement(user: User | null): boolean {
    if (!user) return false;
    return this.isAdmin(user) || this.isManager(user);
  }

  /**
   * 사용자가 로그를 볼 수 있는지 확인
   */
  static canViewLogs(user: User | null): boolean {
    if (!user) return false;
    return this.isAdmin(user) || this.isManager(user);
  }

  /**
   * 사용자가 승인 대기 상태인지 확인
   */
  static isPendingApproval(user: User | null): boolean {
    if (!user) return false;
    return this.isUnassigned(user);
  }

  /**
   * 사용자가 승인된 상태인지 확인
   */
  static isApproved(user: User | null): boolean {
    if (!user) return false;
    return !this.isUnassigned(user);
  }
}
