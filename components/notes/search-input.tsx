'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { debounce } from '@/lib/utils/debounce'
import { cn } from '@/lib/utils'

interface SearchInputProps {
    className?: string
    placeholder?: string
}

const SEARCH_DELAY = 300

export function SearchInput({
    className,
    placeholder = '노트 검색...'
}: SearchInputProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    // 완전히 로컬 상태로 관리하여 깜빡임 방지
    const [searchValue, setSearchValue] = useState('')
    const isInitializedRef = useRef(false)
    const currentSearchRef = useRef('')

    // 컴포넌트 마운트 시 한 번만 URL에서 초기값 가져오기
    useEffect(() => {
        if (!isInitializedRef.current) {
            const urlSearch = searchParams.get('search') || ''
            setSearchValue(urlSearch)
            currentSearchRef.current = urlSearch
            isInitializedRef.current = true
        }
    }, [searchParams])

    // URL 업데이트 함수
    const updateURL = useCallback(
        (query: string) => {
            // 현재 검색어와 같으면 업데이트하지 않음
            if (currentSearchRef.current === query) return

            currentSearchRef.current = query
            const params = new URLSearchParams(searchParams.toString())

            if (query.trim()) {
                params.set('search', query.trim())
            } else {
                params.delete('search')
            }

            params.set('page', '1')
            router.replace(`${pathname}?${params.toString()}`)
        },
        [router, pathname, searchParams]
    )

    // debounced 검색 함수 - 참조 안정성 확보
    const debouncedSearchRef = useRef(
        debounce((query: string) => updateURL(query), SEARCH_DELAY)
    )

    // updateURL이 변경될 때마다 debounced 함수 업데이트
    useEffect(() => {
        debouncedSearchRef.current = debounce(updateURL, SEARCH_DELAY)
    }, [updateURL])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setSearchValue(value) // 즉시 로컬 상태 업데이트
        debouncedSearchRef.current(value) // debounced URL 업데이트
    }

    const handleClear = () => {
        setSearchValue('')
        currentSearchRef.current = ''
        // 즉시 URL 업데이트 (debounce 없이)
        const params = new URLSearchParams(searchParams.toString())
        params.delete('search')
        params.set('page', '1')
        router.replace(`${pathname}?${params.toString()}`)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            handleClear()
        }
    }

    return (
        <div className={cn('relative', className)}>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    type="text"
                    value={searchValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="pl-9 pr-9"
                />
                {searchValue && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
                        onClick={handleClear}
                        title="검색어 지우기"
                    >
                        <X className="h-3 w-3" />
                    </Button>
                )}
            </div>

            {/* 검색 힌트 - 더 부드러운 표시 */}
            {searchValue && (
                <div className="mt-1 text-xs text-muted-foreground">
                    &apos;{searchValue}&apos; 검색 중...
                </div>
            )}
        </div>
    )
}
