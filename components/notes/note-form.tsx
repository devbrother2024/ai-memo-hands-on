'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createNote } from '@/lib/notes/actions'
import { Loader2, Save, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function NoteForm() {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const titleInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()

    // 컴포넌트 마운트 시 제목 필드에 자동 포커스
    useEffect(() => {
        if (titleInputRef.current) {
            titleInputRef.current.focus()
        }
    }, [])

    async function handleSubmit(formData: FormData) {
        setIsSubmitting(true)
        setError(null)

        try {
            await createNote(formData)
            // createNote에서 redirect가 처리되므로 여기서는 추가 작업 불필요
        } catch (err) {
            setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
            setIsSubmitting(false)
        }
    }

    function handleCancel() {
        router.back()
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">새 노트 작성</CardTitle>
                </CardHeader>
                <CardContent>
                    <form action={handleSubmit} className="space-y-6">
                        {/* 제목 입력 */}
                        <div className="space-y-2">
                            <Label htmlFor="title" className="text-sm font-medium">
                                제목
                            </Label>
                            <Input
                                ref={titleInputRef}
                                id="title"
                                name="title"
                                placeholder="노트 제목을 입력하세요"
                                disabled={isSubmitting}
                                className="text-lg"
                                maxLength={200}
                            />
                            <p className="text-xs text-gray-500">
                                제목이 비어있으면 "제목 없음"으로 저장됩니다.
                            </p>
                        </div>

                        {/* 본문 입력 */}
                        <div className="space-y-2">
                            <Label htmlFor="content" className="text-sm font-medium">
                                내용
                            </Label>
                            <Textarea
                                id="content"
                                name="content"
                                placeholder="노트 내용을 입력하세요..."
                                disabled={isSubmitting}
                                className="min-h-[400px] resize-y"
                                maxLength={50000}
                            />
                            <p className="text-xs text-gray-500">
                                최대 50,000자까지 입력 가능합니다.
                            </p>
                        </div>

                        {/* 에러 메시지 */}
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        )}

                        {/* 버튼 영역 */}
                        <div className="flex gap-3 pt-4">
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="min-w-[120px]"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        저장 중...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        저장하기
                                    </>
                                )}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCancel}
                                disabled={isSubmitting}
                            >
                                <X className="w-4 h-4 mr-2" />
                                취소
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
