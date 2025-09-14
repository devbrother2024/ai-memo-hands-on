import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserNotesPaginated, type NotesSort } from '@/lib/notes/queries'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PenTool, Plus } from 'lucide-react'
import Link from 'next/link'
import { formatRelativeDate, getContentPreview } from '@/lib/notes/utils'
import { NotesSortControl } from '@/components/notes/notes-sort'

export default async function NotesPage({
    searchParams
}: {
    searchParams: Promise<{ page?: string; sort?: string }>
}) {
    // 로그인 확인
    const supabase = await createClient()
    const {
        data: { user },
        error
    } = await supabase.auth.getUser()

    if (error || !user) {
        redirect('/signin')
    }

    // URL 파라미터 파싱
    const PAGE_SIZE = 12
    const params = await searchParams
    const currentPage = Math.max(1, parseInt(params?.page || '1', 10) || 1)
    const sortParam = (params?.sort || 'newest') as NotesSort

    // 사용자 노트 페이지네이션 조회
    const { notes, totalCount } = await getUserNotesPaginated({
        page: currentPage,
        limit: PAGE_SIZE,
        sort: ['newest', 'oldest', 'title'].includes(sortParam)
            ? sortParam
            : 'newest'
    })

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* 헤더 */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            내 노트
                        </h1>
                        <p className="text-gray-600 mt-1">
                            총 {totalCount}개의 노트
                        </p>
                    </div>
                    <Link href="/notes/new">
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />새 노트 작성
                        </Button>
                    </Link>
                </div>

                {/* 정렬 컨트롤 */}
                <div className="flex items-center justify-end mb-4">
                    <NotesSortControl currentSort={sortParam} />
                </div>

                {/* 노트 목록 */}
                {notes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {notes.map(note => (
                            <Link href={`/notes/${note.id}`} key={note.id}>
                                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-lg line-clamp-2">
                                            {note.title}
                                        </CardTitle>
                                        <p className="text-sm text-gray-500">
                                            {formatRelativeDate(note.updatedAt)}
                                        </p>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-gray-700 text-sm line-clamp-3">
                                            {getContentPreview(note.content)}
                                        </p>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                ) : (
                    /* 빈 상태 */
                    <Card>
                        <CardContent className="py-16">
                            <div className="text-center">
                                <PenTool className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    아직 작성된 노트가 없습니다
                                </h3>
                                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                                    첫 번째 노트를 작성해보세요. AI가 자동으로
                                    요약하고 태그를 생성해드립니다.
                                </p>
                                <Link href="/notes/new">
                                    <Button>
                                        <Plus className="w-4 h-4 mr-2" />첫 번째
                                        노트 작성하기
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* 페이지네이션 */}
                {totalCount > PAGE_SIZE && (
                    <div className="flex items-center justify-center mt-8 gap-2">
                        <Link
                            href={`/notes?page=${Math.max(
                                1,
                                currentPage - 1
                            )}&sort=${sortParam}`}
                        >
                            <Button
                                variant="outline"
                                disabled={currentPage === 1}
                            >
                                이전
                            </Button>
                        </Link>
                        {Array.from(
                            {
                                length: Math.max(
                                    1,
                                    Math.ceil(totalCount / PAGE_SIZE)
                                )
                            },
                            (_, idx) => idx + 1
                        ).map(pageNum => {
                            const href = `/notes?page=${pageNum}&sort=${sortParam}`
                            const isActive = pageNum === currentPage
                            return (
                                <Link key={pageNum} href={href}>
                                    <Button
                                        variant={
                                            isActive ? 'default' : 'outline'
                                        }
                                        className="min-w-10"
                                    >
                                        {pageNum}
                                    </Button>
                                </Link>
                            )
                        })}
                        <Link
                            href={`/notes?page=${
                                currentPage + 1
                            }&sort=${sortParam}`}
                        >
                            <Button
                                variant="outline"
                                disabled={
                                    currentPage >=
                                    Math.ceil(totalCount / PAGE_SIZE)
                                }
                            >
                                다음
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}

export const metadata = {
    title: '노트 목록 - AI 메모장',
    description: '내가 작성한 노트들을 확인하세요'
}
