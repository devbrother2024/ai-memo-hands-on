'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Loader2,
    Sparkles,
    RefreshCw,
    Edit3,
    Trash2,
    Save,
    X
} from 'lucide-react'
import {
    generateNoteSummary,
    updateNoteSummary,
    deleteNoteSummary,
    getNoteSummary
} from '@/lib/notes/summary-actions'
import { toast } from 'sonner'
import { AutoResizeTextarea } from './auto-resize-textarea'
import type { Summary } from '@/lib/db/schema/notes'

interface SummaryGeneratorProps {
    noteId: string
    initialSummary?: Summary
    onSummaryUpdate?: (summary: Summary | undefined) => void
}

export function SummaryGenerator({
    noteId,
    initialSummary,
    onSummaryUpdate
}: SummaryGeneratorProps) {
    const [summary, setSummary] = useState<Summary | null>(
        initialSummary || null
    )
    const [isGenerating, setIsGenerating] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [editContent, setEditContent] = useState('')

    // 요약 데이터 로딩
    useEffect(() => {
        const loadSummary = async () => {
            try {
                console.log('SummaryGenerator - 요약 로딩 시작:', noteId)
                const result = await getNoteSummary(noteId)
                console.log('SummaryGenerator - 요약 로딩 결과:', result)

                if (result.success && result.summary) {
                    console.log('SummaryGenerator - 요약 설정:', result.summary)
                    setSummary(result.summary)
                    setEditContent(result.summary.content)
                    onSummaryUpdate?.(result.summary)
                } else if (result.error) {
                    console.warn(
                        'SummaryGenerator - 요약 로딩 실패:',
                        result.error
                    )
                }
            } catch (error) {
                console.error('SummaryGenerator - 요약 로딩 오류:', error)
            }
        }

        // initialSummary가 있으면 사용하고, 없으면 로딩
        if (initialSummary) {
            console.log(
                'SummaryGenerator - initialSummary 사용:',
                initialSummary
            )
            setSummary(initialSummary)
            setEditContent(initialSummary.content)
        } else {
            loadSummary()
        }
    }, [noteId, initialSummary, onSummaryUpdate])

    const handleGenerate = async () => {
        setIsGenerating(true)

        try {
            const result = await generateNoteSummary(noteId)

            if (result.success && result.summary) {
                setSummary(result.summary)
                onSummaryUpdate?.(result.summary)
                toast.success('요약이 생성되었습니다!')
            } else {
                toast.error(result.error || '요약 생성에 실패했습니다.')
            }
        } catch (error) {
            console.error('요약 생성 오류:', error)
            toast.error('요약 생성 중 오류가 발생했습니다.')
        } finally {
            setIsGenerating(false)
        }
    }

    const handleEdit = () => {
        if (summary) {
            setEditContent(summary.content)
            setIsEditing(true)
        }
    }

    const handleSaveEdit = async () => {
        if (!summary) return

        try {
            const result = await updateNoteSummary(summary.id, editContent)

            if (result.success && result.summary) {
                setSummary(result.summary)
                onSummaryUpdate?.(result.summary)
                setIsEditing(false)
                toast.success('요약이 수정되었습니다!')
            } else {
                toast.error(result.error || '요약 수정에 실패했습니다.')
            }
        } catch (error) {
            console.error('요약 수정 오류:', error)
            toast.error('요약 수정 중 오류가 발생했습니다.')
        }
    }

    const handleCancelEdit = () => {
        setIsEditing(false)
        setEditContent('')
    }

    const handleDelete = async () => {
        if (!summary) return

        if (!confirm('요약을 삭제하시겠습니까?')) {
            return
        }

        try {
            const result = await deleteNoteSummary(summary.id)

            if (result.success) {
                setSummary(null)
                onSummaryUpdate?.(undefined)
                toast.success('요약이 삭제되었습니다!')
            } else {
                toast.error(result.error || '요약 삭제에 실패했습니다.')
            }
        } catch (error) {
            console.error('요약 삭제 오류:', error)
            toast.error('요약 삭제 중 오류가 발생했습니다.')
        }
    }

    return (
        <Card className="w-full">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-blue-500" />
                        AI 요약
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        {summary && !isEditing && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleEdit}
                                    disabled={isGenerating}
                                >
                                    <Edit3 className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleDelete}
                                    disabled={isGenerating}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </>
                        )}
                        {summary && !isGenerating ? (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleGenerate}
                                disabled={isEditing}
                            >
                                <RefreshCw className="h-4 w-4 mr-1" />
                                재생성
                            </Button>
                        ) : (
                            <Button
                                onClick={handleGenerate}
                                disabled={isGenerating || isEditing}
                                size="sm"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                        생성 중...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="h-4 w-4 mr-1" />
                                        요약 생성
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pt-0">
                {summary ? (
                    <div className="space-y-3">
                        {isEditing ? (
                            <div className="space-y-3">
                                <AutoResizeTextarea
                                    value={editContent}
                                    onChange={setEditContent}
                                    placeholder="요약 내용을 수정하세요..."
                                    className="text-sm leading-relaxed"
                                    minRows={3}
                                    maxRows={10}
                                />
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        onClick={handleSaveEdit}
                                        disabled={!editContent.trim()}
                                    >
                                        <Save className="h-4 w-4 mr-1" />
                                        저장
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleCancelEdit}
                                    >
                                        <X className="h-4 w-4 mr-1" />
                                        취소
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="prose prose-sm max-w-none">
                                <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                                    {summary.content}
                                </div>
                            </div>
                        )}

                        {!isEditing && (
                            <div className="text-xs text-muted-foreground border-t pt-2">
                                {summary.model} •{' '}
                                {new Date(summary.createdAt).toLocaleString(
                                    'ko-KR'
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-6 text-muted-foreground">
                        <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">
                            AI가 이 노트의 핵심 내용을 요약해드립니다.
                        </p>
                        <p className="text-xs mt-1">
                            3-6개의 중요한 포인트로 정리됩니다.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
