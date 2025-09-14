'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

export function NotesSortControl({ currentSort }: { currentSort: string }) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const onChange = useCallback(
        (event: React.ChangeEvent<HTMLSelectElement>) => {
            const nextSort = event.target.value
            const params = new URLSearchParams(searchParams?.toString())
            params.set('sort', nextSort)
            params.set('page', '1')
            router.replace(`${pathname}?${params.toString()}`)
        },
        [router, pathname, searchParams]
    )

    return (
        <label className="text-sm text-gray-700 inline-flex items-center gap-2">
            정렬:
            <select
                className="border rounded-md px-2 py-1 text-sm"
                value={currentSort}
                onChange={onChange}
            >
                <option value="newest">최신순</option>
                <option value="oldest">오래된순</option>
                <option value="title">제목순</option>
            </select>
        </label>
    )
}
