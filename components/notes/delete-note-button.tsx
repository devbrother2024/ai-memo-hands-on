'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { DeleteConfirmDialog } from './delete-confirm-dialog'
import { deleteNote } from '@/lib/notes/actions'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface DeleteNoteButtonProps {
    noteId: string
    noteTitle: string
    size?: 'sm' | 'default' | 'lg' | 'icon'
    variant?:
        | 'default'
        | 'destructive'
        | 'outline'
        | 'secondary'
        | 'ghost'
        | 'link'
    className?: string
    onDelete?: () => void // 삭제 성공 시 호출되는 콜백
    redirectAfterDelete?: boolean // 삭제 후 리다이렉트 여부
}

export function DeleteNoteButton({
    noteId,
    noteTitle,
    size = 'sm',
    variant = 'outline',
    className,
    onDelete,
    redirectAfterDelete = false
}: DeleteNoteButtonProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDialogOpen(true)
        setError(null)
    }

    const handleConfirmDelete = async () => {
        setIsDeleting(true)
        setError(null)

        try {
            const result = await deleteNote(noteId)

            if (result.success) {
                setIsDialogOpen(false)

                // 성공 콜백 실행
                if (onDelete) {
                    onDelete()
                }

                // 리다이렉트 처리
                if (redirectAfterDelete) {
                    router.push('/notes')
                }
            } else {
                setError(result.error || '삭제에 실패했습니다')
            }
        } catch (error) {
            console.error('삭제 오류:', error)
            setError('삭제 중 오류가 발생했습니다')
        } finally {
            setIsDeleting(false)
        }
    }

    const handleCancel = () => {
        setIsDialogOpen(false)
        setError(null)
    }

    return (
        <>
            <Button
                variant={variant}
                size={size}
                className={cn(
                    'text-red-600 hover:text-red-700 hover:bg-red-50',
                    className
                )}
                onClick={handleDeleteClick}
                title={`${noteTitle} 삭제`}
            >
                <Trash2 className="h-4 w-4" />
                {size !== 'icon' && <span className="ml-2">삭제</span>}
            </Button>

            <DeleteConfirmDialog
                isOpen={isDialogOpen}
                noteTitle={noteTitle}
                onConfirm={handleConfirmDelete}
                onCancel={handleCancel}
                isLoading={isDeleting}
            />

            {/* 에러 표시 */}
            {error && (
                <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md shadow-lg z-50">
                    <p className="text-sm">{error}</p>
                </div>
            )}
        </>
    )
}
