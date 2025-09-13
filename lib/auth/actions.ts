'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signUp(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    // 서버 사이드 유효성 검사
    if (!email || !password) {
        return {
            error: '이메일과 비밀번호를 입력해주세요.'
        }
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
        return {
            error: '올바른 이메일 형식을 입력해주세요.'
        }
    }

    // 비밀번호 강도 검증 (최소 8자)
    if (password.length < 8) {
        return {
            error: '비밀번호는 최소 8자 이상이어야 합니다.'
        }
    }

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${
                process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
            }/auth/callback`
        }
    })

    if (error) {
        // Supabase 에러를 사용자 친화적 메시지로 변환
        let errorMessage = '회원가입 중 오류가 발생했습니다.'

        if (error.message.includes('User already registered')) {
            errorMessage = '이미 등록된 이메일입니다.'
        } else if (error.message.includes('Password should be')) {
            errorMessage = '비밀번호가 요구 조건을 만족하지 않습니다.'
        } else if (error.message.includes('Email rate limit exceeded')) {
            errorMessage =
                '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.'
        }

        return {
            error: errorMessage
        }
    }

    // 회원가입 성공 시 온보딩 페이지로 리다이렉트
    if (data.user && !data.user.email_confirmed_at) {
        // 이메일 인증이 필요한 경우
        redirect('/auth/verify-email')
    } else {
        // 이메일 인증이 완료된 경우 온보딩으로
        redirect('/onboarding')
    }
}

export async function signIn(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password
    })

    if (error) {
        return {
            error: '이메일 또는 비밀번호가 올바르지 않습니다.'
        }
    }

    redirect('/dashboard')
}
