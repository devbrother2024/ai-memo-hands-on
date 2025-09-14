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

    // 서버 사이드 유효성 검사
    if (!email || !password) {
        return {
            error: '이메일과 비밀번호를 입력해주세요.'
        }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    })

    if (error) {
        // Supabase 에러를 사용자 친화적 메시지로 변환
        let errorMessage = '로그인 중 오류가 발생했습니다.'

        if (error.message.includes('Invalid login credentials')) {
            errorMessage = '이메일 또는 비밀번호가 올바르지 않습니다.'
        } else if (error.message.includes('Email not confirmed')) {
            errorMessage =
                '이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요.'
        } else if (error.message.includes('Too many requests')) {
            errorMessage =
                '너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.'
        }

        return {
            error: errorMessage
        }
    }

    // 이메일 인증 확인
    if (data.user && !data.user.email_confirmed_at) {
        return {
            error: '이메일 인증이 완료되지 않았습니다. 이메일을 확인하신 후 인증 링크를 클릭해주세요.'
        }
    }

    redirect('/')
}

export async function signOut() {
    const supabase = await createClient()

    const { error } = await supabase.auth.signOut()

    if (error) {
        return {
            error: '로그아웃 중 오류가 발생했습니다. 다시 시도해주세요.'
        }
    }

    redirect('/signin')
}

export async function resetPasswordForEmail(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string

    // 서버 사이드 유효성 검사
    if (!email) {
        return {
            error: '이메일을 입력해주세요.'
        }
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
        return {
            error: '올바른 이메일 형식을 입력해주세요.'
        }
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`
    })

    if (error) {
        let errorMessage = '비밀번호 재설정 링크 발송 중 오류가 발생했습니다.'

        if (error.message.includes('Email rate limit exceeded')) {
            errorMessage =
                '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.'
        }

        return {
            error: errorMessage
        }
    }

    return {
        success: true,
        message: '비밀번호 재설정 링크가 이메일로 발송되었습니다.'
    }
}

export async function updatePassword(formData: FormData) {
    const supabase = await createClient()

    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    // 서버 사이드 유효성 검사
    if (!password || !confirmPassword) {
        return {
            error: '비밀번호와 비밀번호 확인을 입력해주세요.'
        }
    }

    if (password !== confirmPassword) {
        return {
            error: '비밀번호가 일치하지 않습니다.'
        }
    }

    // 비밀번호 강도 검증
    if (password.length < 8) {
        return {
            error: '비밀번호는 최소 8자 이상이어야 합니다.'
        }
    }

    if (!/(?=.*[a-z])/.test(password)) {
        return {
            error: '비밀번호에 소문자가 포함되어야 합니다.'
        }
    }

    if (!/(?=.*[A-Z])/.test(password)) {
        return {
            error: '비밀번호에 대문자가 포함되어야 합니다.'
        }
    }

    if (!/(?=.*\d)/.test(password)) {
        return {
            error: '비밀번호에 숫자가 포함되어야 합니다.'
        }
    }

    const { error } = await supabase.auth.updateUser({
        password: password
    })

    if (error) {
        return {
            error: '비밀번호 업데이트 중 오류가 발생했습니다. 다시 시도해주세요.'
        }
    }

    redirect('/signin?message=password-updated')
}
