import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function OnboardingPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <Card className="w-full max-w-md mx-auto">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold">
                        회원가입 완료!
                    </CardTitle>
                    <CardDescription className="text-center">
                        AI 메모장에 오신 것을 환영합니다.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="text-center space-y-2">
                        <p className="text-sm text-gray-600">
                            이제 AI의 도움을 받아 똑똑하게 메모를 관리할 수
                            있습니다.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <h3 className="font-medium text-blue-900 mb-2">
                                다음 기능들을 사용해보세요:
                            </h3>
                            <ul className="text-sm text-blue-800 space-y-1">
                                <li>• 텍스트 및 음성으로 메모 작성</li>
                                <li>• AI 자동 요약 및 태그 생성</li>
                                <li>• 강력한 검색 및 필터링</li>
                                <li>• 데이터 내보내기</li>
                            </ul>
                        </div>
                    </div>

                    <Button asChild className="w-full">
                        <Link href="/">메모 작성 시작하기</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}

export const metadata = {
    title: '온보딩 - AI 메모장',
    description: 'AI 메모장에 오신 것을 환영합니다'
}
