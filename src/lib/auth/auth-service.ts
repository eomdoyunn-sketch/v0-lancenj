import { createClient } from '@/lib/supabase/server'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { UserRole } from '@/types'

export class AuthService {
  // 서버사이드 사용자 정보 가져오기
  static async getServerUser(): Promise<User | null> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user
  }

  // 클라이언트사이드 로그인
  static async login(email: string, password: string) {
    const supabase = createBrowserClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      return { user: null, error: this.handleAuthError(error) }
    }

    return { user: data.user, error: null }
  }

  // 클라이언트사이드 회원가입
  static async signup(name: string, email: string, password: string, branchId: string) {
    const supabase = createBrowserClient()
    
    try {
      // 1. Supabase Auth에 사용자 생성 (트리거가 자동으로 public.users에 데이터 생성)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name
          }
        }
      })

      if (authError) {
        // 한국어 에러 메시지로 변환
        let errorMessage = authError.message
        if (authError.message.includes('User already registered')) {
          errorMessage = '이미 등록된 이메일입니다.'
        } else if (authError.message.includes('Invalid email')) {
          errorMessage = '올바른 이메일 형식이 아닙니다.'
        } else if (authError.message.includes('Password should be at least')) {
          errorMessage = '비밀번호는 6자 이상이어야 합니다.'
        }
        return { user: null, error: errorMessage }
      }

      if (!authData.user) {
        return { user: null, error: '회원가입에 실패했습니다.' }
      }

      // 2. 트레이너 프로필 생성
      const colors = ['red-500', 'blue-500', 'green-500', 'purple-500', 'orange-500', 'pink-500']
      const randomColor = colors[Math.floor(Math.random() * colors.length)]
      
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
        .single()

      if (trainerError) {
        return { user: null, error: '트레이너 프로필 생성에 실패했습니다.' }
      }

      // 3. public.users 테이블의 사용자 정보 업데이트 (트레이너 정보 추가)
      const { error: updateError } = await supabase
        .from('users')
        .update({
          role: 'trainer',
          assigned_branch_ids: [branchId],
          trainer_profile_id: trainerData.id
        })
        .eq('id', authData.user.id)

      if (updateError) {
        console.error('사용자 프로필 업데이트 실패:', updateError)
        // 트레이너 프로필은 생성되었으므로 계속 진행
        // 하지만 더 구체적인 오류 메시지 제공
        return { user: null, error: `사용자 프로필 업데이트 실패: ${updateError.message}` }
      }

      // 4. 사용자 권한을 바로 승인 상태로 설정
      const { error: permissionError } = await supabase
        .from('user_permissions')
        .upsert({
          user_id: authData.user.id,
          permission_type: 'trainer',
          status: 'approved',
          approved_at: new Date().toISOString()
        })

      if (permissionError) {
        console.error('사용자 권한 설정 실패:', permissionError)
        // 권한 설정 실패해도 회원가입은 계속 진행 (선택적 기능)
      }

      return { user: authData.user, error: null }
    } catch (error) {
      console.error('회원가입 중 오류:', error)
      return { user: null, error: '회원가입 중 오류가 발생했습니다.' }
    }
  }

  // 클라이언트사이드 로그아웃
  static async logout() {
    const supabase = createBrowserClient()
    await supabase.auth.signOut()
  }

  // 에러 처리
  private static handleAuthError(error: any): string {
    switch (error.message) {
      case 'Invalid login credentials':
        return '이메일 또는 비밀번호가 올바르지 않습니다.'
      case 'Email not confirmed':
        return '이메일 인증이 필요합니다.'
      case 'Too many requests':
        return '너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.'
      default:
        return error.message || '로그인에 실패했습니다.'
    }
  }

  // 사용자 프로필 로드 (서버사이드) - 권한 시스템 통합
  static async loadUserProfile(userId: string, userEmail?: string) {
    try {
      if (!userEmail) {
        return null
      }

      const supabase = await createClient()
      
      // 1. 사용자 기본 정보 조회
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error || !userData) {
        // 데이터베이스에 사용자 정보가 없으면 기본 정보로 생성
        console.log('사용자 정보가 데이터베이스에 없습니다. 기본 정보로 생성합니다.')
        
        const role = userEmail === 'lancenj@lancenj.com' || userEmail === 'lancenj1@lancenj.com' ? 'admin' : 'unassigned'
        
        return {
          id: userId,
          name: userEmail.split('@')[0],
          email: userEmail,
          role: role as UserRole,
          assignedBranchIds: [],
          trainerProfileId: null,
          permissionStatus: 'approved',
          isApproved: true
        }
      }

      // 2. 사용자 권한 정보 조회
      const { data: permissionData, error: permissionError } = await supabase
        .from('user_permissions')
        .select('status, approved_at')
        .eq('user_id', userId)
        .eq('permission_type', userData.role)
        .single()

      // 권한 정보가 없으면 기본값 설정 (모든 사용자를 바로 승인된 상태로 처리)
      const permissionStatus = 'approved' // 모든 사용자를 기본적으로 승인된 것으로 처리
      const isApproved = true // 모든 사용자를 승인된 상태로 처리
      
      return {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role as UserRole,
        assignedBranchIds: userData.assigned_branch_ids || [],
        trainerProfileId: userData.trainer_profile_id,
        permissionStatus,
        isApproved
      }
    } catch (error) {
      console.error('사용자 프로필 로드 중 오류:', error)
      return null
    }
  }

  // 사용자 권한 확인
  static async checkUserPermission(userId: string, requiredRole: string) {
    try {
      const supabase = await createClient()
      
      const { data, error } = await supabase
        .from('user_permissions')
        .select('status, permission_type')
        .eq('user_id', userId)
        .eq('permission_type', requiredRole)
        .single()

      if (error) {
        return { hasPermission: false, status: 'pending' }
      }

      return {
        hasPermission: data.status === 'approved',
        status: data.status
      }
    } catch (error) {
      console.error('권한 확인 중 오류:', error)
      return { hasPermission: false, status: 'pending' }
    }
  }

  // 사용자 승인 요청
  static async requestApproval(userId: string, requestedRole: string, branchIds: string[] = []) {
    try {
      const supabase = await createClient()
      
      const { data, error } = await supabase
        .from('user_approval_requests')
        .insert({
          user_id: userId,
          request_type: `${requestedRole}_approval`,
          to_role: requestedRole,
          branch_ids: branchIds,
          status: 'pending'
        })
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, requestId: data.id }
    } catch (error) {
      console.error('승인 요청 중 오류:', error)
      return { success: false, error: '승인 요청 중 오류가 발생했습니다.' }
    }
  }
}
