import { supabase } from './supabaseClient';
import { User, UserRole } from '../types';
import { PermissionManager } from './permissionUtils';

export class AuthService {
  private static currentUser: User | null = null;
  private static onAuthStateChangeCallback: ((user: User | null) => void) | null = null;
  private static initialized = false;

  // Initialize - 간소화된 초기화
  static initialize() {
    if (this.initialized) return;
    this.initialized = true;
    
    // 세션 복원만 수행 (리스너는 필요시에만 설정)
    this.restoreSession();
  }

  // 세션 상태 변화 리스너 설정 (필요시에만)
  static setupAuthStateListener() {
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      if (event === 'SIGNED_OUT') {
        this.currentUser = null;
        if (this.onAuthStateChangeCallback) {
          this.onAuthStateChangeCallback(null);
        }
      } else if (event === 'SIGNED_IN' && session?.user) {
        await this.loadUserProfile(session.user.id, session.user.email);
        if (this.onAuthStateChangeCallback && this.currentUser) {
          this.onAuthStateChangeCallback(this.currentUser);
        }
      }
    });
  }

  // 인증 상태 변화 콜백 설정
  static setAuthStateChangeCallback(callback: (user: User | null) => void) {
    this.onAuthStateChangeCallback = callback;
  }

  // 세션 복원
  private static async restoreSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('세션 조회 실패:', error);
        this.currentUser = null;
        return;
      }
      
      if (session?.user) {
        // 세션이 유효한 경우에만 사용자 프로필 로드
        await this.loadUserProfile(session.user.id, session.user.email);
      } else {
        // 세션이 없는 경우 사용자 정보 초기화
        this.currentUser = null;
        console.log('유효한 세션이 없습니다. 사용자 정보를 초기화합니다.');
      }
    } catch (error) {
      console.error('세션 복원 실패:', error);
      this.currentUser = null;
    }
  }

  // 사용자 프로필 로드 - 최적화된 버전
  private static async loadUserProfile(userId: string, userEmail?: string) {
    try {
      if (!userEmail) {
        this.currentUser = null;
        return;
      }

      // 데이터베이스에서 사용자 정보 조회
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !userData) {
        // 데이터베이스에 사용자 정보가 없으면 기본 정보로 생성
        console.log('사용자 정보가 데이터베이스에 없습니다. 기본 정보로 생성합니다.');
        
        const role = userEmail === 'lancenj@lancenj.com' || userEmail === 'lancenj1@lancenj.com' ? 'admin' : 'unassigned';
        
        this.currentUser = {
          id: userId,
          name: userEmail.split('@')[0],
          email: userEmail,
          role: role as UserRole,
          assignedBranchIds: [],
          trainerProfileId: null
        } as User;
      } else {
        // 데이터베이스에서 가져온 정보 사용
        this.currentUser = {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          role: userData.role as UserRole,
          assignedBranchIds: userData.assigned_branch_ids || [],
          trainerProfileId: userData.trainer_profile_id
        } as User;
      }
    } catch (error) {
      console.error('사용자 프로필 로드 중 오류:', error);
      this.currentUser = null;
    }
  }

  // 로그인 - 최적화된 버전
  static async login(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });

      if (error) {
        return { user: null, error: error.message };
      }

      if (!data.user) {
        return { user: null, error: '로그인에 실패했습니다.' };
      }

      // 사용자 프로필 로드
      await this.loadUserProfile(data.user.id, data.user.email || undefined);
      
      return { user: this.currentUser, error: null };
    } catch (error) {
      console.error('로그인 중 오류:', error);
      return { user: null, error: '로그인 중 오류가 발생했습니다.' };
    }
  }

  // 회원가입 - 간소화된 버전
  static async signup(name: string, email: string, password: string, branchId: string): Promise<{ user: User | null; error: string | null }> {
    try {
      // 1. Supabase Auth에 사용자 생성
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password
      });

      if (authError) {
        return { user: null, error: authError.message };
      }

      if (!authData.user) {
        return { user: null, error: '회원가입에 실패했습니다.' };
      }

      // 2. 트레이너 프로필 생성
      const colors = ['red-500', 'blue-500', 'green-500', 'purple-500', 'orange-500', 'pink-500'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      const { data: trainerData, error: trainerError } = await supabase
        .from('trainers')
        .insert({
          name,
          branch_ids: [branchId],
          branch_rates: { [branchId]: { type: 'percentage', value: 0 } },
          color: randomColor,
          is_active: true
        })
        .select()
        .single();

      if (trainerError) {
        return { user: null, error: '트레이너 프로필 생성에 실패했습니다.' };
      }

      // 3. 트리거가 자동으로 public.users에 사용자를 생성하므로, 추가 정보만 업데이트
      const { error: profileError } = await supabase
        .from('users')
        .update({
          name,
          role: 'trainer',
          assigned_branch_ids: [branchId],
          trainer_profile_id: trainerData.id
        })
        .eq('id', authData.user.id);

      if (profileError) {
        console.error('사용자 프로필 업데이트 실패:', profileError);
        return { user: null, error: `사용자 프로필 업데이트에 실패했습니다: ${profileError.message}` };
      }

      // 4. 사용자 권한을 바로 승인 상태로 설정 (user_permissions 테이블에 기록)
      const { error: permissionError } = await supabase
        .from('user_permissions')
        .upsert({
          user_id: authData.user.id,
          permission_type: 'trainer',
          status: 'approved',
          approved_at: new Date().toISOString()
        });

      if (permissionError) {
        console.error('사용자 권한 설정 실패:', permissionError);
        // 권한 설정 실패해도 회원가입은 계속 진행
      }

      // 4. 현재 사용자로 설정
      this.currentUser = {
        id: authData.user.id,
        name,
        email,
        role: 'trainer',
        assignedBranchIds: [branchId],
        trainerProfileId: trainerData.id
      };

      return { user: this.currentUser, error: null };
    } catch (error) {
      console.error('회원가입 중 오류:', error);
      return { user: null, error: '회원가입 중 오류가 발생했습니다.' };
    }
  }

  // 현재 사용자 가져오기
  static getCurrentUser(): User | null {
    return this.currentUser;
  }

  // 현재 사용자 설정 (세션 복원용)
  static setCurrentUser(user: User): void {
    this.currentUser = user;
  }

  // 로그아웃
  static async logout(): Promise<void> {
    try {
      await supabase.auth.signOut();
      this.currentUser = null;
    } catch (error) {
      console.error('로그아웃 중 오류:', error);
    }
  }

  // 인증 상태 확인
  static isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  // 권한 검증 메서드들
  static hasRole(role: UserRole): boolean {
    return PermissionManager.hasRole(this.currentUser, role);
  }

  static hasAnyRole(roles: UserRole[]): boolean {
    return PermissionManager.hasAnyRole(this.currentUser, roles);
  }

  static isAdmin(): boolean {
    return PermissionManager.isAdmin(this.currentUser);
  }

  static isManager(): boolean {
    return PermissionManager.isManager(this.currentUser);
  }

  static isTrainer(): boolean {
    return PermissionManager.isTrainer(this.currentUser);
  }

  static isUnassigned(): boolean {
    return PermissionManager.isUnassigned(this.currentUser);
  }

  static canAccessBranch(branchId: string): boolean {
    return PermissionManager.canAccessBranch(this.currentUser, branchId);
  }

  static canViewAllRevenue(): boolean {
    return PermissionManager.canViewAllRevenue(this.currentUser);
  }

  static canViewBranchRevenue(branchId: string): boolean {
    return PermissionManager.canViewBranchRevenue(this.currentUser, branchId);
  }

  static canManageMembers(branchId?: string): boolean {
    return PermissionManager.canManageMembers(this.currentUser, branchId);
  }

  static canManageTrainers(): boolean {
    return PermissionManager.canManageTrainers(this.currentUser);
  }

  static canManagePrograms(branchId?: string): boolean {
    return PermissionManager.canManagePrograms(this.currentUser, branchId);
  }

  static canManageSessions(branchId?: string): boolean {
    return PermissionManager.canManageSessions(this.currentUser, branchId);
  }

  static canManageUsers(): boolean {
    return PermissionManager.canManageUsers(this.currentUser);
  }

  static canManageBranches(): boolean {
    return PermissionManager.canManageBranches(this.currentUser);
  }

  static canAccessDashboard(): boolean {
    return PermissionManager.canAccessDashboard(this.currentUser);
  }

  static canAccessManagement(): boolean {
    return PermissionManager.canAccessManagement(this.currentUser);
  }

  static canViewLogs(): boolean {
    return PermissionManager.canViewLogs(this.currentUser);
  }

  static isPendingApproval(): boolean {
    return PermissionManager.isPendingApproval(this.currentUser);
  }

  static isApproved(): boolean {
    return PermissionManager.isApproved(this.currentUser);
  }

  // 사용자 업데이트
  static async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    try {
      const { data, error } = await (supabase as any)
        .from('users')
        .update({
          name: updates.name,
          email: updates.email,
          role: updates.role,
          assigned_branch_ids: updates.assignedBranchIds,
          trainer_profile_id: updates.trainerProfileId
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('사용자 업데이트 실패:', error);
        return null;
      }
      if (!data) {
        return null;
      }

      const updatedUser = {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role as UserRole,
        assignedBranchIds: data.assigned_branch_ids || [],
        trainerProfileId: data.trainer_profile_id
      } as User;

      // 현재 사용자 업데이트
      if (this.currentUser && this.currentUser.id === userId) {
        this.currentUser = updatedUser;
      }

      return updatedUser;
    } catch (error) {
      console.error('사용자 업데이트 중 오류:', error);
      return null;
    }
  }

  // 사용자 생성 (관리자 전용)
  static async createUser(name: string, email: string, role: UserRole, branchId?: string): Promise<User | null> {
    try {
      // 임시 비밀번호 생성 (실제로는 사용자가 설정해야 함)
      const tempPassword = Math.random().toString(36).slice(-8);
      
      // 1. Supabase Auth에 사용자 생성
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true
      });

      if (authError) {
        console.error('Auth 사용자 생성 실패:', authError);
        return null;
      }

      if (!authData.user) {
        return null;
      }

      // 2. 트리거가 자동으로 public.users에 사용자를 생성하므로, 추가 정보만 업데이트
      const { data, error: profileError } = await (supabase as any)
        .from('users')
        .update({
          name,
          role,
          assigned_branch_ids: (role === 'manager' && branchId ? [branchId] : []) as string[],
          trainer_profile_id: null
        } as any)
        .eq('id', authData.user.id)
        .select()
        .single();

      if (profileError) {
        console.error('사용자 프로필 생성 실패:', profileError);
        return null;
      }

      if (!data) {
        console.error('사용자 데이터가 생성되지 않았습니다.');
        return null;
      }

      const createdUser2: any = data as any;
      return {
        id: createdUser2.id,
        name: createdUser2.name,
        email: createdUser2.email,
        role: createdUser2.role as UserRole,
        assignedBranchIds: (createdUser2.assigned_branch_ids as string[]) || [],
        trainerProfileId: createdUser2.trainer_profile_id
      } as User;
    } catch (error) {
      console.error('사용자 생성 중 오류:', error);
      return null;
    }
  }

  // 사용자 삭제
  static async deleteUser(userId: string): Promise<boolean> {
    try {
      // 1. users 테이블에서 삭제
      const { error: profileError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (profileError) {
        console.error('사용자 프로필 삭제 실패:', profileError);
        return false;
      }

      // 2. Auth에서 사용자 삭제 (관리자 권한 필요)
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      
      if (authError) {
        console.error('Auth 사용자 삭제 실패:', authError);
        // 프로필은 삭제되었지만 Auth는 남아있음
      }

      // 현재 사용자라면 로그아웃
      if (this.currentUser && this.currentUser.id === userId) {
        this.logout();
      }

      return true;
    } catch (error) {
      console.error('사용자 삭제 중 오류:', error);
      return false;
    }
  }

  // 비밀번호 재설정
  static async resetPassword(email: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: '비밀번호 재설정 중 오류가 발생했습니다.' };
    }
  }
}