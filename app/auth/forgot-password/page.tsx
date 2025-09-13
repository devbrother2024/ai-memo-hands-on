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
import { ArrowLeft, Mail } from 'lucide-react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
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
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">이메일 주소</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="your@email.com"
                        />
                    </div>

                    <Button className="w-full">재설정 링크 보내기</Button>

                    <div className="text-center">
                        <Link
                            href="/signin"
                            className="inline-flex items-center text-sm text-primary hover:underline"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            로그인으로 돌아가기
                        </Link>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-800">
                            <strong>참고:</strong> 이 기능은 현재 개발 중입니다.
                            Epic 1의 스토리 3에서 구현될 예정입니다.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export const metadata = {
    title: '비밀번호 재설정 - AI 메모장',
    description: '비밀번호를 재설정하세요'
}
