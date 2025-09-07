import { supabase } from './supabaseClient';
import { User, UserRole } from '../types';

export class AuthService {
  private static currentUser: User | null = null;

  // Initialize - Supabase는 자동으로 초기화됨
  static initialize() {
    // Supabase 세션 복원
    this.restoreSession();
  }

  // 세션 복원
  private static async restoreSession() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await this.loadUserProfile(session.user.id, session.user.email);
      }
    } catch (error) {
      console.error('세션 복원 실패:', error);
    }
  }

  // 사용자 프로필 로드
  private static async loadUserProfile(userId: string, userEmail?: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) {
        console.log('사용자 프로필이 없음. 기본 프로필 생성 중...');
        
        // 사용자 프로필이 없으면 기본 프로필 생성
        if (userEmail) {
          // lancenj@lancenj.com만 admin, 나머지는 unassigned로 설정
          const role = userEmail === 'lancenj@lancenj.com' ? 'admin' : 'unassigned';
          
          const { data: newUserData, error: insertError } = await supabase
            .from('users')
            .insert({
              id: userId,
              name: userEmail.split('@')[0], // 이메일의 @ 앞부분을 이름으로 사용
              email: userEmail,
              role: role,
              assigned_branch_ids: [],
              trainer_profile_id: null
            })
            .select()
            .single();

          if (insertError) {
            console.error('기본 사용자 프로필 생성 실패:', insertError);
            return;
          }

          this.currentUser = {
            id: newUserData.id,
            name: newUserData.name,
            email: newUserData.email,
            role: newUserData.role as any,
            assignedBranchIds: newUserData.assigned_branch_ids,
            trainerProfileId: newUserData.trainer_profile_id
          };
        }
        return;
      }

      this.currentUser = {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role as any,
        assignedBranchIds: data.assigned_branch_ids,
        trainerProfileId: data.trainer_profile_id
      };
    } catch (error) {
      console.error('사용자 프로필 로드 중 오류:', error);
    }
  }

  // 로그인
  static async login(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { user: null, error: error.message };
      }

      if (data.user) {
        await this.loadUserProfile(data.user.id, data.user.email);
        return { user: this.currentUser, error: null };
      }

      return { user: null, error: '로그인에 실패했습니다.' };
    } catch (error) {
      return { user: null, error: '로그인 중 오류가 발생했습니다.' };
    }
  }

  // 회원가입
  static async signup(name: string, email: string, password: string, branchId: string): Promise<{ user: User | null; error: string | null }> {
    try {
      // 1. Supabase Auth에 사용자 생성
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        return { user: null, error: authError.message };
      }

      if (!authData.user) {
        return { user: null, error: '회원가입에 실패했습니다.' };
      }

      // 2. users 테이블에 사용자 정보 저장
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          name,
          email,
          role: 'unassigned',
          assigned_branch_ids: [],
          trainer_profile_id: null
        });

      if (profileError) {
        console.error('사용자 프로필 생성 실패:', profileError);
        return { user: null, error: '사용자 프로필 생성에 실패했습니다.' };
      }

      // 3. 현재 사용자로 설정
      this.currentUser = {
        id: authData.user.id,
        name,
        email,
        role: 'unassigned',
        assignedBranchIds: [],
        trainerProfileId: null
      };

      return { user: this.currentUser, error: null };
    } catch (error) {
      return { user: null, error: '회원가입 중 오류가 발생했습니다.' };
    }
  }

  // 현재 사용자 가져오기
  static getCurrentUser(): User | null {
    return this.currentUser;
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

  // 사용자 업데이트
  static async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    try {
      const { data, error } = await supabase
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

      const updatedUser = {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role as any,
        assignedBranchIds: data.assigned_branch_ids,
        trainerProfileId: data.trainer_profile_id
      };

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

      // 2. users 테이블에 사용자 정보 저장
      const { data, error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          name,
          email,
          role,
          assigned_branch_ids: role === 'manager' && branchId ? [branchId] : [],
          trainer_profile_id: null
        })
        .select()
        .single();

      if (profileError) {
        console.error('사용자 프로필 생성 실패:', profileError);
        return null;
      }

      return {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role as any,
        assignedBranchIds: data.assigned_branch_ids,
        trainerProfileId: data.trainer_profile_id
      };
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