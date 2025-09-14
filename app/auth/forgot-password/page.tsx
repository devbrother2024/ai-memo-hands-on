'use client'

import { useState } from 'react'
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
import { ArrowLeft, Mail, Loader2, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { resetPasswordForEmail } from '@/lib/auth/actions'

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [email, setEmail] = useState('')
    const [emailError, setEmailError] = useState('')

    const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!email) return '이메일을 입력해주세요.'
        if (!emailRegex.test(email)) return '올바른 이메일 형식을 입력해주세요.'
        return ''
    }

    const handleEmailChange = (value: string) => {
        setEmail(value)
        setError(null)
        setSuccess(null)
        setEmailError(validateEmail(value))
    }

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        const emailValidation = validateEmail(email)
        if (emailValidation) {
            setEmailError(emailValidation)
            return
        }

        setIsLoading(true)
        setError(null)
        setSuccess(null)

        try {
            const formData = new FormData()
            formData.append('email', email)

            const result = await resetPasswordForEmail(formData)

            if (result?.error) {
                setError(result.error)
            } else if (result?.success) {
                setSuccess(
                    result.message || '비밀번호 재설정 링크가 전송되었습니다.'
                )
            }
        } catch {
            setError('예상치 못한 오류가 발생했습니다. 다시 시도해주세요.')
        } finally {
            setIsLoading(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <Card className="w-full max-w-md mx-auto">
                    <CardHeader className="text-center space-y-4">
                        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <CardTitle className="text-2xl font-bold">
                            링크 전송 완료
                        </CardTitle>
                        <CardDescription className="text-center">
                            {success}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-green-50 p-4 rounded-lg">
                            <p className="text-sm text-green-800">
                                <strong>다음 단계:</strong>
                            </p>
                            <ul className="text-sm text-green-700 mt-2 space-y-1">
                                <li>• 이메일함을 확인해주세요</li>
                                <li>• 재설정 링크를 클릭해주세요</li>
                                <li>• 새 비밀번호를 설정해주세요</li>
                                <li>• 스팸함도 확인해보세요</li>
                            </ul>
                        </div>

                        <div className="space-y-3">
                            <Button asChild className="w-full">
                                <Link href="/signin">
                                    로그인 페이지로 돌아가기
                                </Link>
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => {
                                    setSuccess(null)
                                    setEmail('')
                                }}
                            >
                                다른 이메일로 다시 시도
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
                        <Mail className="w-8 h-8 text-blue-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold">
                        비밀번호 재설정
                    </CardTitle>
                    <CardDescription className="text-center">
                        등록하신 이메일 주소를 입력해주세요. 비밀번호 재설정
                        링크를 보내드립니다.
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
                            <Label htmlFor="email">이메일 주소</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="your@email.com"
                                value={email}
                                onChange={e =>
                                    handleEmailChange(e.target.value)
                                }
                                className={
                                    emailError
                                        ? 'border-red-500 focus:border-red-500'
                                        : ''
                                }
                                disabled={isLoading}
                            />
                            {emailError && (
                                <p className="text-sm text-red-600">
                                    {emailError}
                                </p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isLoading || !!emailError || !email}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    전송 중...
                                </>
                            ) : (
                                '재설정 링크 보내기'
                            )}
                        </Button>

                        <div className="text-center">
                            <Link
                                href="/signin"
                                className="inline-flex items-center text-sm text-primary hover:underline"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                로그인으로 돌아가기
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
