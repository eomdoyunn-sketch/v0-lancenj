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
            } as any)
            .select()
            .single();

          if (insertError) {
            console.error('기본 사용자 프로필 생성 실패:', insertError);
            return;
          }

          if (!newUserData) {
            console.error('사용자 데이터가 생성되지 않았습니다.');
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
        // 이메일 확인 오류인 경우 특별 처리
        if (error.message.includes('Email not confirmed')) {
          // 이메일 확인을 우회하고 사용자 프로필을 직접 로드
          console.log('이메일 확인 우회 시도...');
          
          // 사용자 테이블에서 직접 사용자 정보 조회
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

          if (userError || !userData) {
            return { user: null, error: '사용자 정보를 찾을 수 없습니다.' };
          }

          // 현재 사용자로 설정
          this.currentUser = {
            id: userData.id,
            name: userData.name,
            email: userData.email,
            role: userData.role as any,
            assignedBranchIds: userData.assigned_branch_ids || [],
            trainerProfileId: userData.trainer_profile_id
          };

          return { user: this.currentUser, error: null };
        }
        
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
      console.log('회원가입 시도:', { name, email, password: '***', branchId });
      
      // 1. Supabase Auth에 사용자 생성 (이메일 확인 비활성화)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password
      });

      if (authError) {
        console.error('Supabase Auth 오류:', authError);
        return { user: null, error: authError.message };
      }

      if (!authData.user) {
        return { user: null, error: '회원가입에 실패했습니다.' };
      }

      // 2. 트레이너 프로필 생성 (랜덤 색상 부여)
      const availableColors = [
        'red-500', 'red-600', 'orange-500', 'orange-600', 'amber-500', 'amber-600', 
        'yellow-500', 'yellow-600', 'lime-500', 'lime-600', 'green-500', 'green-600', 
        'emerald-500', 'emerald-600', 'teal-500', 'teal-600', 'cyan-500', 'cyan-600', 
        'sky-500', 'sky-600', 'blue-500', 'blue-600', 'indigo-500', 'indigo-600', 
        'violet-500', 'violet-600', 'purple-500', 'purple-600', 'fuchsia-500', 'fuchsia-600', 
        'pink-500', 'pink-600', 'rose-500', 'rose-600', 'red-400', 'orange-400',
        'yellow-400', 'green-400', 'blue-400', 'indigo-400', 'purple-400', 'pink-400',
        'red-700', 'orange-700', 'yellow-700', 'green-700', 'blue-700', 'indigo-700',
        'purple-700', 'pink-700'
      ];
      
      const randomColor = availableColors[Math.floor(Math.random() * availableColors.length)];
      
      const { data: trainerData, error: trainerError } = await supabase
        .from('trainers')
        .insert({
          name,
          branch_ids: [branchId],
          branch_rates: { [branchId]: { type: 'percentage', value: 0 } },
          color: randomColor,
          is_active: true
        } as any)
        .select()
        .single();

      if (trainerError) {
        console.error('트레이너 프로필 생성 실패:', trainerError);
        return { user: null, error: '트레이너 프로필 생성에 실패했습니다.' };
      }

      if (!trainerData) {
        console.error('트레이너 데이터가 null입니다');
        return { user: null, error: '트레이너 프로필 생성에 실패했습니다.' };
      }


      // 3. users 테이블에 사용자 정보 저장 (트레이너로)
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          name,
          email,
          role: 'trainer',
          assigned_branch_ids: [branchId], // 선택한 지점으로 배정
          trainer_profile_id: trainerData.id
        } as any);

      if (profileError) {
        console.error('사용자 프로필 생성 실패:', profileError);
        return { user: null, error: '사용자 프로필 생성에 실패했습니다.' };
      }

      // 4. 현재 사용자로 설정
      this.currentUser = {
        id: authData.user.id,
        name,
        email,
        role: 'trainer',
        assignedBranchIds: [branchId], // 선택한 지점으로 배정
        trainerProfileId: trainerData.id
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
        assignedBranchIds: data.assigned_branch_ids || [],
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
        } as any)
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