import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserNotes } from '@/lib/notes/queries'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PenTool, Plus } from 'lucide-react'
import Link from 'next/link'

export default async function NotesPage() {
    // 로그인 확인
    const supabase = await createClient()
    const {
        data: { user },
        error
    } = await supabase.auth.getUser()

    if (error || !user) {
        redirect('/signin')
    }

    // 사용자 노트 조회
    const notes = await getUserNotes()

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* 헤더 */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">내 노트</h1>
                        <p className="text-gray-600 mt-1">
                            총 {notes.length}개의 노트
                        </p>
                    </div>
                    <Link href="/notes/new">
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            새 노트 작성
                        </Button>
                    </Link>
                </div>

                {/* 노트 목록 */}
                {notes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {notes.map((note) => (
                            <Card
                                key={note.id}
                                className="hover:shadow-lg transition-shadow cursor-pointer"
                            >
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg line-clamp-2">
                                        {note.title}
                                    </CardTitle>
                                    <p className="text-sm text-gray-500">
                                        {new Date(note.updatedAt).toLocaleDateString('ko-KR', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-700 text-sm line-clamp-3">
                                        {note.content || '내용이 없습니다.'}
                                    </p>
                                </CardContent>
                            </Card>
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
                                    첫 번째 노트를 작성해보세요. AI가 자동으로 요약하고 태그를 생성해드립니다.
                                </p>
                                <Link href="/notes/new">
                                    <Button>
                                        <Plus className="w-4 h-4 mr-2" />
                                        첫 번째 노트 작성하기
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}

export const metadata = {
    title: '노트 목록 - AI 메모장',
    description: '내가 작성한 노트들을 확인하세요'
}
