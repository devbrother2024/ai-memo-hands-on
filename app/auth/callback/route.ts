import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/onboarding'

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            // 인증 성공 시 온보딩 페이지로 리다이렉트
            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    // 인증 실패 시 에러 페이지로 리다이렉트
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
