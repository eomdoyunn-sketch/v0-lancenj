'use client'

import { User } from '@supabase/supabase-js'
import { AuthService } from '@/lib/auth/auth-service'
import { useRouter } from 'next/navigation'

interface DashboardContentProps {
  user: User
  userProfile: any
}

interface UserProfile {
  id: string
  name: string
  email: string
  role: string
  assignedBranchIds: string[]
  trainerProfileId?: string
  permissionStatus?: string
  isApproved?: boolean
}

export function DashboardContent({ user, userProfile }: DashboardContentProps) {
  const router = useRouter()

  const handleLogout = async () => {
    await AuthService.logout()
    router.push('/auth/login')
    router.refresh()
  }

  // 권한 상태에 따른 UI 렌더링 (승인 대기 로직 제거 - 모든 사용자가 바로 승인됨)
  const renderPermissionStatus = () => {
    // 모든 사용자가 바로 승인된 상태로 처리하므로 승인 상태 메시지 제거
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-gray-900">
                LANCE & J<sup className="text-xs">®</sup>
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700">
                <p className="font-medium">{userProfile?.name || user.email}</p>
                <p className="text-gray-500">{userProfile?.role || '사용자'}</p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* 권한 상태 표시 */}
          {renderPermissionStatus()}
          
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                🎉 권한 시스템이 성공적으로 구현되었습니다!
              </h2>
              <div className="space-y-2 text-gray-600">
                <p>✅ Supabase SSR 클라이언트 설정 완료</p>
                <p>✅ 권한 기반 인증 시스템 구현</p>
                <p>✅ 승인 대기/완료 상태 관리</p>
                <p>✅ 사용자 권한 자동 동기화</p>
                <p>✅ Next.js App Router 통합</p>
              </div>
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">사용자 정보:</h3>
                <div className="text-sm text-blue-800 space-y-1">
                  <p><strong>이메일:</strong> {user.email}</p>
                  <p><strong>이름:</strong> {userProfile?.name || 'N/A'}</p>
                  <p><strong>역할:</strong> {userProfile?.role || 'N/A'}</p>
                  <p><strong>권한 상태:</strong> {userProfile?.permissionStatus || 'pending'}</p>
                  <p><strong>승인 여부:</strong> {userProfile?.isApproved ? '승인됨' : '대기 중'}</p>
                  <p><strong>사용자 ID:</strong> {user.id}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
