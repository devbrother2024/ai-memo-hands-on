'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card'
import { signUp } from '@/lib/auth/actions'
import { Loader2, Eye, EyeOff } from 'lucide-react'

export function SignUpForm() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: ''
    })
    const [validationErrors, setValidationErrors] = useState({
        email: '',
        password: '',
        confirmPassword: ''
    })

    // 클라이언트 사이드 유효성 검사
    const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!email) return '이메일을 입력해주세요.'
        if (!emailRegex.test(email)) return '올바른 이메일 형식을 입력해주세요.'
        return ''
    }

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

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        setError(null)

        // 실시간 유효성 검사
        let errorMessage = ''
        switch (field) {
            case 'email':
                errorMessage = validateEmail(value)
                break
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
            formData.email &&
            formData.password &&
            formData.confirmPassword &&
            !validationErrors.email &&
            !validationErrors.password &&
            !validationErrors.confirmPassword
        )
    }

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        // 최종 유효성 검사
        const emailError = validateEmail(formData.email)
        const passwordError = validatePassword(formData.password)
        const confirmPasswordError = validateConfirmPassword(
            formData.password,
            formData.confirmPassword
        )

        if (emailError || passwordError || confirmPasswordError) {
            setValidationErrors({
                email: emailError,
                password: passwordError,
                confirmPassword: confirmPasswordError
            })
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            const formDataObj = new FormData()
            formDataObj.append('email', formData.email)
            formDataObj.append('password', formData.password)

            const result = await signUp(formDataObj)

            if (result?.error) {
                setError(result.error)
            }
        } catch (err) {
            setError('예상치 못한 오류가 발생했습니다. 다시 시도해주세요.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold text-center">
                    회원가입
                </CardTitle>
                <CardDescription className="text-center">
                    AI 메모장에 오신 것을 환영합니다
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
                        <Label htmlFor="email">이메일</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="your@email.com"
                            value={formData.email}
                            onChange={e =>
                                handleInputChange('email', e.target.value)
                            }
                            className={
                                validationErrors.email
                                    ? 'border-red-500 focus:border-red-500'
                                    : ''
                            }
                            disabled={isLoading}
                        />
                        {validationErrors.email && (
                            <p className="text-sm text-red-600">
                                {validationErrors.email}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">비밀번호</Label>
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
                                onClick={() => setShowPassword(!showPassword)}
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
                        <Label htmlFor="confirmPassword">비밀번호 확인</Label>
                        <div className="relative">
                            <Input
                                id="confirmPassword"
                                type={showConfirmPassword ? 'text' : 'password'}
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
                                    setShowConfirmPassword(!showConfirmPassword)
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
                                회원가입 중...
                            </>
                        ) : (
                            '회원가입'
                        )}
                    </Button>

                    <div className="text-center text-sm text-gray-600">
                        이미 계정이 있으신가요?{' '}
                        <a
                            href="/signin"
                            className="text-primary hover:underline font-medium"
                        >
                            로그인
                        </a>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
