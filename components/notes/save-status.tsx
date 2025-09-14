'use client'

import { Check, Loader2, AlertTriangle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { SaveStatus } from '@/lib/notes/hooks'

interface SaveStatusProps {
    status: SaveStatus
    lastSavedAt?: Date | null
    onRetry?: () => void
    className?: string
}

export function SaveStatus({
    status,
    lastSavedAt,
    onRetry,
    className
}: SaveStatusProps) {
    const getStatusContent = () => {
        switch (status) {
            case 'saving':
                return {
                    icon: <Loader2 className="h-4 w-4 animate-spin" />,
                    text: '저장 중...',
                    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
                    textColor: 'text-blue-700 dark:text-blue-300',
                    borderColor: 'border-blue-200 dark:border-blue-800'
                }
            case 'saved':
                return {
                    icon: <Check className="h-4 w-4" />,
                    text: '저장됨',
                    bgColor: 'bg-green-50 dark:bg-green-950/30',
                    textColor: 'text-green-700 dark:text-green-300',
                    borderColor: 'border-green-200 dark:border-green-800'
                }
            case 'error':
                return {
                    icon: <AlertTriangle className="h-4 w-4" />,
                    text: '저장 실패',
                    bgColor: 'bg-red-50 dark:bg-red-950/30',
                    textColor: 'text-red-700 dark:text-red-300',
                    borderColor: 'border-red-200 dark:border-red-800'
                }
            default:
                return null
        }
    }

    const statusContent = getStatusContent()

    if (!statusContent) {
        // idle 상태에서는 마지막 저장 시간만 표시
        if (lastSavedAt) {
            return (
                <div className={cn('text-xs text-muted-foreground', className)}>
                    마지막 저장: {lastSavedAt.toLocaleTimeString()}
                </div>
            )
        }
        return null
    }

    return (
        <div
            className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-md border text-sm font-medium transition-all',
                statusContent.bgColor,
                statusContent.textColor,
                statusContent.borderColor,
                className
            )}
            role="status"
            aria-live="polite"
        >
            {statusContent.icon}
            <span>{statusContent.text}</span>

            {status === 'error' && onRetry && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRetry}
                    className="h-6 w-6 p-0 ml-2 hover:bg-red-100 dark:hover:bg-red-900/50"
                >
                    <RotateCcw className="h-3 w-3" />
                    <span className="sr-only">다시 시도</span>
                </Button>
            )}
        </div>
    )
}
