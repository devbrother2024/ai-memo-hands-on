'use client'

import { useState, useEffect, useCallback } from 'react'
import { updateNote, type UpdateNoteInput } from './actions'
import { debounce } from '@/lib/utils/debounce'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export interface UseAutoSaveProps {
    noteId: string
    initialTitle: string
    initialContent: string
    delay?: number
}

export function useAutoSave({
    noteId,
    initialTitle,
    initialContent,
    delay = 3000
}: UseAutoSaveProps) {
    const [title, setTitle] = useState(initialTitle)
    const [content, setContent] = useState(initialContent)
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
    const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)

    // 변경사항이 있는지 확인
    const hasChanges = title !== initialTitle || content !== initialContent

    // 저장 함수
    const saveNote = useCallback(
        async (data: UpdateNoteInput) => {
            setSaveStatus('saving')

            try {
                const result = await updateNote(noteId, data)

                if (result.success) {
                    setSaveStatus('saved')
                    setLastSavedAt(new Date())

                    // 2초 후 saved 상태 해제
                    setTimeout(() => {
                        setSaveStatus('idle')
                    }, 2000)
                } else {
                    setSaveStatus('error')
                    console.error('노트 저장 실패:', result.error)
                }
            } catch (error) {
                setSaveStatus('error')
                console.error('노트 저장 오류:', error)
            }
        },
        [noteId]
    )

    // 디바운스된 저장 함수
    const debouncedSave = useCallback(
        debounce((data: UpdateNoteInput) => {
            saveNote(data)
        }, delay),
        [saveNote, delay]
    )

    // 즉시 저장 함수 (Cmd/Ctrl+S 용)
    const saveImmediately = useCallback(() => {
        if (hasChanges) {
            const data: UpdateNoteInput = {}
            if (title !== initialTitle) data.title = title
            if (content !== initialContent) data.content = content
            saveNote(data)
        }
    }, [title, content, initialTitle, initialContent, hasChanges, saveNote])

    // 제목 변경 핸들러
    const handleTitleChange = useCallback(
        (newTitle: string) => {
            setTitle(newTitle)

            if (newTitle !== initialTitle) {
                debouncedSave({ title: newTitle })
            }
        },
        [initialTitle, debouncedSave]
    )

    // 내용 변경 핸들러
    const handleContentChange = useCallback(
        (newContent: string) => {
            setContent(newContent)

            if (newContent !== initialContent) {
                debouncedSave({ content: newContent })
            }
        },
        [initialContent, debouncedSave]
    )

    // 로컬 스토리지 백업
    useEffect(() => {
        if (hasChanges) {
            localStorage.setItem(
                `note-draft-${noteId}`,
                JSON.stringify({
                    title,
                    content,
                    lastModified: Date.now()
                })
            )
        } else {
            localStorage.removeItem(`note-draft-${noteId}`)
        }
    }, [title, content, noteId, hasChanges])

    // 키보드 단축키 핸들러
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 's') {
                event.preventDefault()
                saveImmediately()
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [saveImmediately])

    // 페이지 언로드 시 변경사항 확인
    useEffect(() => {
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            if (hasChanges && saveStatus !== 'saving') {
                event.preventDefault()
                event.returnValue =
                    '저장되지 않은 변경사항이 있습니다. 정말 나가시겠습니까?'
            }
        }

        window.addEventListener('beforeunload', handleBeforeUnload)
        return () =>
            window.removeEventListener('beforeunload', handleBeforeUnload)
    }, [hasChanges, saveStatus])

    return {
        title,
        content,
        saveStatus,
        lastSavedAt,
        hasChanges,
        handleTitleChange,
        handleContentChange,
        saveImmediately
    }
}

// 로컬 스토리지에서 드래프트 복원
export function restoreDraft(noteId: string) {
    try {
        const draftData = localStorage.getItem(`note-draft-${noteId}`)
        if (draftData) {
            const draft = JSON.parse(draftData)
            return {
                title: draft.title || '',
                content: draft.content || '',
                lastModified: new Date(draft.lastModified)
            }
        }
    } catch (error) {
        console.error('드래프트 복원 실패:', error)
    }
    return null
}
