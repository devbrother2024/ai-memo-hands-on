'use client'

import { useState, useEffect } from 'react'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Lock, Loader2, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { updatePassword, signOut } from '@/lib/auth/actions'
import { useSearchParams } from 'next/navigation'

export default function ResetPasswordPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    })
    const [validationErrors, setValidationErrors] = useState({
        password: '',
        confirmPassword: ''
    })

    const searchParams = useSearchParams()
    const [hasValidSession, setHasValidSession] = useState(false)
    const [isCheckingSession, setIsCheckingSession] = useState(true)

    useEffect(() => {
        const checkAuth = async () => {
            try {
                // URL에서 에러 파라미터 확인
                const errorParam = searchParams.get('error')
                const errorDescription = searchParams.get('error_description')

                if (errorParam) {
                    let errorMessage = '링크가 유효하지 않거나 만료되었습니다.'

                    if (
                        errorParam === 'access_denied' &&
                        errorDescription?.includes('expired')
                    ) {
                        errorMessage =
                            '이메일 링크가 만료되었습니다. 새로운 재설정 링크를 요청해주세요.'
                    }

                    setError(errorMessage)
                    setIsCheckingSession(false)
                    return
                }

                // Supabase 세션 확인 - URL fragment에서 토큰을 자동으로 처리
                const { createClient } = await import('@/lib/supabase/client')
                const supabase = createClient()

                const {
                    data: { session },
                    error: sessionError
                } = await supabase.auth.getSession()

                if (sessionError) {
                    console.error('Session error:', sessionError)
                    setError('인증 처리 중 오류가 발생했습니다.')
                    setIsCheckingSession(false)
                    return
                }

                if (session) {
                    setHasValidSession(true)
                } else {
                    // 세션이 없으면 토큰이 URL fragment에 있는지 확인
                    const hashParams = new URLSearchParams(
                        window.location.hash.substring(1)
                    )
                    const accessToken = hashParams.get('access_token')

                    if (!accessToken) {
                        // 토큰이 없으면 비밀번호 찾기 페이지로 리다이렉트
                        window.location.href = '/auth/forgot-password'
                        return
                    }

                    setHasValidSession(true)
                }

                setIsCheckingSession(false)
            } catch (err) {
                console.error('Auth check error:', err)
                setError('인증 확인 중 오류가 발생했습니다.')
                setIsCheckingSession(false)
            }
        }

        checkAuth()
    }, [searchParams])

    const validatePassword = (password: string) => {
        if (!password) return '비밀번호를 입력해주세요.'
        if (password.length < 8) return '비밀번호는 최소 8자 이상이어야 합니다.'
        if (!/(?=.*[a-z])/.test(password))
            return '비밀번호에 소문자가 포함되어야 합니다.'
        if (!/(?=.*[A-Z])/.test(password))
            return '비밀번호에 대문자가 포함되어야 합니다.'
        if (!/(?=.*\d)/.test(password))
            return '비밀번호에 숫자가 포함되어야 합니다.'
        return ''
    }

    const validateConfirmPassword = (
        password: string,
        confirmPassword: string
    ) => {
        if (!confirmPassword) return '비밀번호 확인을 입력해주세요.'
        if (password !== confirmPassword) return '비밀번호가 일치하지 않습니다.'
        return ''
    }

    const handleBackToLogin = async () => {
        try {
            await signOut()
        } catch {
            window.location.href = '/signin'
        }
    }

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        setError(null)

        let errorMessage = ''
        switch (field) {
            case 'password':
                errorMessage = validatePassword(value)
                // 비밀번호가 변경되면 확인 비밀번호도 재검증
                if (formData.confirmPassword) {
                    setValidationErrors(prev => ({
                        ...prev,
                        confirmPassword: validateConfirmPassword(
                            value,
                            formData.confirmPassword
                        )
                    }))
                }
                break
            case 'confirmPassword':
                errorMessage = validateConfirmPassword(formData.password, value)
                break
        }

        setValidationErrors(prev => ({ ...prev, [field]: errorMessage }))
    }

    const isFormValid = () => {
        return (
            formData.password &&
            formData.confirmPassword &&
            !validationErrors.password &&
            !validationErrors.confirmPassword
        )
    }

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        const passwordError = validatePassword(formData.password)
        const confirmPasswordError = validateConfirmPassword(
            formData.password,
            formData.confirmPassword
        )

        if (passwordError || confirmPasswordError) {
            setValidationErrors({
                password: passwordError,
                confirmPassword: confirmPasswordError
            })
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            const formDataObj = new FormData()
            formDataObj.append('password', formData.password)
            formDataObj.append('confirmPassword', formData.confirmPassword)

            const result = await updatePassword(formDataObj)

            if (result?.error) {
                setError(result.error)
            }
            // 성공 시 서버 액션에서 리다이렉트가 일어남
        } catch {
            setError('예상치 못한 오류가 발생했습니다. 다시 시도해주세요.')
        } finally {
            setIsLoading(false)
        }
    }

    // 세션 확인 중인 경우 로딩 화면 표시
    if (isCheckingSession) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-4 text-gray-600">인증을 확인하는 중...</p>
                </div>
            </div>
        )
    }

    // 에러가 있거나 유효한 세션이 없는 경우 에러 화면 표시
    if (error || !hasValidSession) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <Card className="w-full max-w-md mx-auto">
                    <CardHeader className="text-center space-y-4">
                        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                            <Lock className="w-8 h-8 text-red-600" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-red-600">
                            링크 오류
                        </CardTitle>
                        <CardDescription className="text-center">
                            {error || '링크가 유효하지 않거나 만료되었습니다.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-red-50 p-4 rounded-lg">
                            <p className="text-sm text-red-800">
                                <strong>해결 방법:</strong>
                            </p>
                            <ul className="text-sm text-red-700 mt-2 space-y-1">
                                <li>
                                    • 새로운 비밀번호 재설정 링크를 요청하세요
                                </li>
                                <li>• 이메일의 링크를 빠르게 클릭하세요</li>
                                <li>• 링크는 보통 1시간 후 만료됩니다</li>
                            </ul>
                        </div>

                        <div className="space-y-3">
                            <Button asChild className="w-full">
                                <Link href="/auth/forgot-password">
                                    새 재설정 링크 요청하기
                                </Link>
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={handleBackToLogin}
                            >
                                로그인 페이지로 돌아가기
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <Card className="w-full max-w-md mx-auto">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                        <Lock className="w-8 h-8 text-blue-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold">
                        새 비밀번호 설정
                    </CardTitle>
                    <CardDescription className="text-center">
                        계정 보안을 위해 강력한 비밀번호를 설정해주세요.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="password">새 비밀번호</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="8자 이상, 대소문자, 숫자 포함"
                                    value={formData.password}
                                    onChange={e =>
                                        handleInputChange(
                                            'password',
                                            e.target.value
                                        )
                                    }
                                    className={
                                        validationErrors.password
                                            ? 'border-red-500 focus:border-red-500 pr-10'
                                            : 'pr-10'
                                    }
                                    disabled={isLoading}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    disabled={isLoading}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4 text-gray-400" />
                                    ) : (
                                        <Eye className="h-4 w-4 text-gray-400" />
                                    )}
                                </Button>
                            </div>
                            {validationErrors.password && (
                                <p className="text-sm text-red-600">
                                    {validationErrors.password}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">
                                비밀번호 확인
                            </Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={
                                        showConfirmPassword
                                            ? 'text'
                                            : 'password'
                                    }
                                    placeholder="비밀번호를 다시 입력해주세요"
                                    value={formData.confirmPassword}
                                    onChange={e =>
                                        handleInputChange(
                                            'confirmPassword',
                                            e.target.value
                                        )
                                    }
                                    className={
                                        validationErrors.confirmPassword
                                            ? 'border-red-500 focus:border-red-500 pr-10'
                                            : 'pr-10'
                                    }
                                    disabled={isLoading}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() =>
                                        setShowConfirmPassword(
                                            !showConfirmPassword
                                        )
                                    }
                                    disabled={isLoading}
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="h-4 w-4 text-gray-400" />
                                    ) : (
                                        <Eye className="h-4 w-4 text-gray-400" />
                                    )}
                                </Button>
                            </div>
                            {validationErrors.confirmPassword && (
                                <p className="text-sm text-red-600">
                                    {validationErrors.confirmPassword}
                                </p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isLoading || !isFormValid()}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    비밀번호 설정 중...
                                </>
                            ) : (
                                '비밀번호 설정 완료'
                            )}
                        </Button>

                        <div className="text-center">
                            <Button
                                variant="link"
                                onClick={handleBackToLogin}
                                className="text-sm"
                            >
                                로그인 페이지로 돌아가기
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
