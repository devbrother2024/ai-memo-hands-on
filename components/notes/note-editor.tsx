'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { AutoResizeTextarea } from './auto-resize-textarea'
import { SaveStatus } from './save-status'
import { BackButton } from '@/components/ui/back-button'
import { DeleteNoteButton } from './delete-note-button'
import { useAutoSave } from '@/lib/notes/hooks'
import { cn } from '@/lib/utils'
import type { Note } from '@/lib/db/schema/notes'

interface NoteEditorProps {
    note: Note
    className?: string
}

export function NoteEditor({ note, className }: NoteEditorProps) {
    const [isEditingTitle, setIsEditingTitle] = useState(false)

    const {
        title,
        content,
        saveStatus,
        lastSavedAt,
        hasChanges,
        handleTitleChange,
        handleContentChange,
        saveImmediately
    } = useAutoSave({
        noteId: note.id,
        initialTitle: note.title,
        initialContent: note.content || ''
    })

    const handleTitleClick = () => {
        setIsEditingTitle(true)
    }

    const handleTitleBlur = () => {
        setIsEditingTitle(false)
    }

    const handleTitleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            setIsEditingTitle(false)
        } else if (e.key === 'Escape') {
            setIsEditingTitle(false)
        }
    }

    return (
        <div
            className={cn(
                'min-h-screen bg-gray-50 dark:bg-gray-900',
                className
            )}
        >
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* 헤더 영역 */}
                <div className="flex items-center justify-between mb-6">
                    <BackButton />
                    <div className="flex items-center gap-3">
                        <DeleteNoteButton
                            noteId={note.id}
                            noteTitle={note.title}
                            variant="outline"
                            size="sm"
                            redirectAfterDelete={true}
                        />
                        <SaveStatus
                            status={saveStatus}
                            lastSavedAt={lastSavedAt}
                            onRetry={saveImmediately}
                        />
                    </div>
                </div>

                {/* 편집 영역 */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {/* 제목 영역 */}
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        {isEditingTitle ? (
                            <Input
                                value={title}
                                onChange={e =>
                                    handleTitleChange(e.target.value)
                                }
                                onBlur={handleTitleBlur}
                                onKeyDown={handleTitleKeyDown}
                                className="text-2xl font-bold border-none p-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                                placeholder="제목을 입력하세요"
                                autoFocus
                            />
                        ) : (
                            <h1
                                onClick={handleTitleClick}
                                className="text-2xl font-bold cursor-text p-2 -m-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                role="button"
                                tabIndex={0}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        setIsEditingTitle(true)
                                    }
                                }}
                            >
                                {title || '제목을 클릭하여 편집하세요'}
                            </h1>
                        )}
                    </div>

                    {/* 내용 영역 */}
                    <div className="p-6">
                        <AutoResizeTextarea
                            value={content}
                            onChange={handleContentChange}
                            placeholder="내용을 입력하세요..."
                            className="border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 text-base leading-relaxed"
                            minRows={10}
                            maxRows={50}
                        />
                    </div>
                </div>

                {/* 키보드 단축키 안내 */}
                <div className="mt-6 text-sm text-muted-foreground text-center">
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                        {navigator.platform.toLowerCase().includes('mac')
                            ? 'Cmd'
                            : 'Ctrl'}
                    </kbd>
                    {' + '}
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                        S
                    </kbd>{' '}
                    로 즉시 저장 • 변경사항은 3초 후 자동 저장됩니다
                </div>

                {/* 변경사항 표시 */}
                {hasChanges && saveStatus === 'idle' && (
                    <div className="mt-4 text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800 rounded-md text-sm">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                            저장되지 않은 변경사항이 있습니다
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
