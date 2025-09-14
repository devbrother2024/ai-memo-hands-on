'use client'

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, AlertTriangle } from 'lucide-react'

interface DeleteConfirmDialogProps {
    isOpen: boolean
    noteTitle: string
    onConfirm: () => void
    onCancel: () => void
    isLoading?: boolean
}

export function DeleteConfirmDialog({
    isOpen,
    noteTitle,
    onConfirm,
    onCancel,
    isLoading = false
}: DeleteConfirmDialogProps) {
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            e.preventDefault()
            onCancel()
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={open => !open && onCancel()}>
            <DialogContent
                className="sm:max-w-[425px]"
                onKeyDown={handleKeyDown}
                showCloseButton={!isLoading}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        노트 삭제
                    </DialogTitle>
                    <DialogDescription className="text-left">
                        <span className="font-medium">
                            &apos;{noteTitle}&apos;
                        </span>
                        을(를) 정말 삭제하시겠습니까?
                        <br />
                        <span className="text-red-600">
                            삭제된 노트는 복구할 수 없습니다.
                        </span>
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="outline"
                        onClick={onCancel}
                        disabled={isLoading}
                        autoFocus
                    >
                        취소
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                삭제 중...
                            </>
                        ) : (
                            '삭제'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
