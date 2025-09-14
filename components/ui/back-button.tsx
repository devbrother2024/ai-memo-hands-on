'use client'

import { useRouter } from 'next/navigation'
import { Button } from './button'
import { ArrowLeft } from 'lucide-react'

interface BackButtonProps {
    fallbackUrl?: string
    className?: string
}

export function BackButton({
    fallbackUrl = '/notes',
    className
}: BackButtonProps) {
    const router = useRouter()

    const handleBack = () => {
        // history가 있으면 뒤로가기, 없으면 fallback URL로 이동
        if (window.history.length > 1) {
            router.back()
        } else {
            router.push(fallbackUrl)
        }
    }

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className={className}
        >
            <ArrowLeft className="h-4 w-4" />
            돌아가기
        </Button>
    )
}
