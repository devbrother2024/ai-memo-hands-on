'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog'
import { signOut } from '@/lib/auth/actions'
import { Loader2, LogOut } from 'lucide-react'

interface LogoutDialogProps {
    trigger?: React.ReactNode
}

export function LogoutDialog({ trigger }: LogoutDialogProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [open, setOpen] = useState(false)

    const handleLogout = async () => {
        setIsLoading(true)
        setError(null)

        try {
            const result = await signOut()

            if (result?.error) {
                setError(result.error)
                setIsLoading(false)
            }
            // 성공 시 서버 액션에서 리다이렉트가 일어남
        } catch {
            setError('예상치 못한 오류가 발생했습니다. 다시 시도해주세요.')
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm">
                        <LogOut className="w-4 h-4 mr-2" />
                        로그아웃
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>로그아웃 확인</DialogTitle>
                    <DialogDescription>
                        정말로 로그아웃하시겠습니까? 현재 세션이 종료되고 로그인
                        페이지로 이동합니다.
                    </DialogDescription>
                </DialogHeader>

                {error && (
                    <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                        {error}
                    </div>
                )}

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={isLoading}
                    >
                        취소
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleLogout}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                로그아웃 중...
                            </>
                        ) : (
                            <>
                                <LogOut className="mr-2 h-4 w-4" />
                                로그아웃
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
