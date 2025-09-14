import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail } from 'lucide-react'
import Link from 'next/link'

export default function VerifyEmailPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <Card className="w-full max-w-md mx-auto">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                        <Mail className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold">
                        이메일을 확인해주세요
                    </CardTitle>
                    <CardDescription className="text-center">
                        회원가입을 완료하기 위해 이메일 인증이 필요합니다.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-sm text-gray-600 text-center space-y-2">
                        <p>입력하신 이메일 주소로 인증 링크를 발송했습니다.</p>
                        <p>이메일의 링크를 클릭하여 계정을 활성화해주세요.</p>
                    </div>

                    <div className="space-y-3">
                        <p className="text-sm font-medium text-gray-700">
                            이메일이 오지 않았나요?
                        </p>
                        <ul className="text-sm text-gray-600 space-y-1 ml-4">
                            <li>• 스팸/정크 메일함을 확인해보세요</li>
                            <li>• 이메일 주소가 정확한지 확인해보세요</li>
                            <li>• 몇 분 후에 다시 확인해보세요</li>
                        </ul>
                    </div>

                    <div className="pt-4 space-y-3">
                        <Button asChild className="w-full">
                            <Link href="/signin">로그인 페이지로 돌아가기</Link>
                        </Button>
                        <Button variant="outline" asChild className="w-full">
                            <Link href="/signup">다른 이메일로 가입하기</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export const metadata = {
    title: '이메일 인증 - AI 메모장',
    description: '이메일 인증을 완료해주세요'
}
