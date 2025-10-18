import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AuthService } from '@/lib/auth/auth-service'
import { DashboardContent } from '@/components/dashboard/DashboardContent'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // 사용자 프로필 로드
  const userProfile = await AuthService.loadUserProfile(user.id, user.email)

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardContent user={user} userProfile={userProfile} />
    </div>
  )
}
