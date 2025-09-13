import { SignUpForm } from '@/components/auth/signup-form'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function SignUpPage() {
    // 이미 로그인된 사용자는 대시보드로 리다이렉트
    const supabase = await createClient()
    const {
        data: { user },
        error
    } = await supabase.auth.getUser()

    if (user && !error) {
        redirect('/')
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        AI 메모장
                    </h1>
                    <p className="text-gray-600">똑똑한 메모 관리의 시작</p>
                </div>
                <SignUpForm />
            </div>
        </div>
    )
}

export const metadata = {
    title: '회원가입 - AI 메모장',
    description: 'AI 메모장에 새 계정을 만들어보세요'
}
