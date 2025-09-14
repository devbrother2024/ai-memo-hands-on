'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Tags, RefreshCw, Edit3, X, Save, Hash } from 'lucide-react'
import {
    generateNoteTags,
    getNoteTags,
    removeNoteTag,
    updateTag
} from '@/lib/notes/tag-actions'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import type { Tag } from '@/lib/db/schema/notes'

interface TagGeneratorProps {
    noteId: string
    onTagUpdate?: (tags: Tag[]) => void
}

export function TagGenerator({ noteId, onTagUpdate }: TagGeneratorProps) {
    const [tags, setTags] = useState<Tag[]>([])
    const [isGenerating, setIsGenerating] = useState(false)
    const [editingTagId, setEditingTagId] = useState<string | null>(null)
    const [editingValue, setEditingValue] = useState('')

    // 태그 데이터 로딩
    useEffect(() => {
        const loadTags = async () => {
            try {
                console.log('TagGenerator - 태그 로딩 시작:', noteId)
                const result = await getNoteTags(noteId)
                console.log('TagGenerator - 태그 로딩 결과:', result)

                if (result.success && result.tags) {
                    console.log('TagGenerator - 태그 설정:', result.tags)
                    setTags(result.tags)
                    onTagUpdate?.(result.tags)
                } else if (result.error) {
                    console.warn('TagGenerator - 태그 로딩 실패:', result.error)
                }
            } catch (error) {
                console.error('TagGenerator - 태그 로딩 오류:', error)
            }
        }

        loadTags()
    }, [noteId, onTagUpdate])

    const handleGenerate = async () => {
        setIsGenerating(true)

        try {
            const result = await generateNoteTags(noteId)

            if (result.success && result.tags) {
                setTags(result.tags)
                onTagUpdate?.(result.tags)
                toast.success('태그가 생성되었습니다!')
            } else {
                toast.error(result.error || '태그 생성에 실패했습니다.')
            }
        } catch (error) {
            console.error('태그 생성 오류:', error)
            toast.error('태그 생성 중 오류가 발생했습니다.')
        } finally {
            setIsGenerating(false)
        }
    }

    const handleEdit = (tag: Tag) => {
        setEditingTagId(tag.id)
        setEditingValue(tag.name)
    }

    const handleSaveEdit = async () => {
        if (!editingTagId) return

        setIsGenerating(true) // 편집도 로딩 상태 사용

        try {
            const result = await updateTag(editingTagId, editingValue)

            if (result.success && result.data) {
                setTags(prev =>
                    prev.map(tag =>
                        tag.id === editingTagId ? result.data! : tag
                    )
                )
                onTagUpdate?.(tags)
                setEditingTagId(null)
                toast.success('태그가 수정되었습니다!')
            } else {
                toast.error(result.error || '태그 수정에 실패했습니다.')
            }
        } catch (error) {
            console.error('태그 수정 오류:', error)
            toast.error('태그 수정 중 오류가 발생했습니다.')
        } finally {
            setIsGenerating(false)
        }
    }

    const handleCancelEdit = () => {
        setEditingTagId(null)
        setEditingValue('')
    }

    const handleRemove = async (tagId: string) => {
        if (!window.confirm('이 태그를 제거하시겠습니까?')) {
            return
        }

        setIsGenerating(true)

        try {
            const result = await removeNoteTag(noteId, tagId)

            if (result.success) {
                const updatedTags = tags.filter(tag => tag.id !== tagId)
                setTags(updatedTags)
                onTagUpdate?.(updatedTags)
                toast.success('태그가 제거되었습니다!')
            } else {
                toast.error(result.error || '태그 제거에 실패했습니다.')
            }
        } catch (error) {
            console.error('태그 제거 오류:', error)
            toast.error('태그 제거 중 오류가 발생했습니다.')
        } finally {
            setIsGenerating(false)
        }
    }

    const handleTagClick = (tag: Tag) => {
        // 태그 클릭 시 검색 페이지로 이동 (미래 구현)
        console.log('태그 클릭:', tag.name)
        // window.location.href = `/search?tag=${encodeURIComponent(tag.name)}`
    }

    return (
        <Card className="bg-white dark:bg-gray-800">
            <CardHeader className="flex-row items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                    <Hash className="w-5 h-5 text-green-500" />
                    AI 태그
                </CardTitle>
                <div className="flex items-center gap-2">
                    {tags.length > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleGenerate}
                            disabled={isGenerating}
                        >
                            {isGenerating ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <RefreshCw className="w-4 h-4 mr-2" />
                            )}
                            재생성
                        </Button>
                    )}
                    {tags.length === 0 && (
                        <Button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            size="sm"
                        >
                            {isGenerating ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Tags className="w-4 h-4 mr-2" />
                            )}
                            태그 생성
                        </Button>
                    )}
                </div>
            </CardHeader>

            <CardContent className="pt-4">
                {tags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {tags.map(tag => (
                            <div key={tag.id} className="group relative">
                                {editingTagId === tag.id ? (
                                    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-full px-3 py-1">
                                        <Input
                                            value={editingValue}
                                            onChange={e =>
                                                setEditingValue(e.target.value)
                                            }
                                            className="h-6 text-xs border-0 bg-transparent p-0 focus-visible:ring-0"
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') {
                                                    handleSaveEdit()
                                                } else if (e.key === 'Escape') {
                                                    handleCancelEdit()
                                                }
                                            }}
                                            autoFocus
                                        />
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-4 w-4 p-0"
                                            onClick={handleSaveEdit}
                                            disabled={isGenerating}
                                        >
                                            <Save className="w-3 h-3" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-4 w-4 p-0"
                                            onClick={handleCancelEdit}
                                            disabled={isGenerating}
                                        >
                                            <X className="w-3 h-3" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div
                                        className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full px-3 py-1 text-sm cursor-pointer transition-colors"
                                        style={{
                                            backgroundColor: tag.color
                                                ? tag.color + '20'
                                                : undefined
                                        }}
                                    >
                                        <span
                                            onClick={() => handleTagClick(tag)}
                                            className="text-gray-700 dark:text-gray-300"
                                            style={{
                                                color: tag.color || undefined
                                            }}
                                        >
                                            #{tag.name}
                                        </span>
                                        <div className="hidden group-hover:flex items-center gap-1 ml-1">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-4 w-4 p-0"
                                                onClick={() => handleEdit(tag)}
                                                disabled={isGenerating}
                                            >
                                                <Edit3 className="w-3 h-3" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-4 w-4 p-0 text-red-500 hover:text-red-700"
                                                onClick={() =>
                                                    handleRemove(tag.id)
                                                }
                                                disabled={isGenerating}
                                            >
                                                <X className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">
                        {isGenerating
                            ? 'AI가 태그를 생성 중입니다...'
                            : 'AI가 이 노트의 내용을 분석하여 관련 태그를 생성해드립니다.'}
                    </p>
                )}

                {tags.length > 0 && (
                    <div className="text-xs text-muted-foreground mt-3 pt-2 border-t">
                        {tags.length}개 태그 • 클릭하여 관련 노트 검색
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
