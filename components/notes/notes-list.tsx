'use client'

import { useState, useEffect } from 'react'
import { NoteCard } from './note-card'
import { PenTool, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import type { Note } from '@/lib/db/schema/notes'

interface NotesListProps {
    initialNotes: Note[]
    searchQuery?: string
}

export function NotesList({ initialNotes, searchQuery = '' }: NotesListProps) {
    const [notes, setNotes] = useState(initialNotes)

    // initialNotes가 변경될 때마다 notes 상태 업데이트
    useEffect(() => {
        setNotes(initialNotes)
    }, [initialNotes])

    const handleNoteDelete = (noteId: string) => {
        // 낙관적 업데이트: 즉시 UI에서 노트 제거
        setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId))
    }

    return (
        <>
            {/* 노트 목록 */}
            {notes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {notes.map(note => (
                        <NoteCard
                            key={note.id}
                            note={note}
                            onDelete={handleNoteDelete}
                            searchQuery={searchQuery}
                        />
                    ))}
                </div>
            ) : (
                /* 빈 상태 */
                <Card>
                    <CardContent className="py-16">
                        <div className="text-center">
                            {searchQuery ? (
                                // 검색 결과 없음
                                <>
                                    <PenTool className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        검색 결과가 없습니다
                                    </h3>
                                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                                        &apos;{searchQuery}&apos;와 일치하는
                                        노트를 찾을 수 없습니다.
                                        <br />
                                        다른 검색어를 시도해보세요.
                                    </p>
                                </>
                            ) : (
                                // 노트 없음
                                <>
                                    <PenTool className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        아직 작성된 노트가 없습니다
                                    </h3>
                                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                                        첫 번째 노트를 작성해보세요. AI가
                                        자동으로 요약하고 태그를 생성해드립니다.
                                    </p>
                                    <Link href="/notes/new">
                                        <Button>
                                            <Plus className="w-4 h-4 mr-2" />첫
                                            번째 노트 작성하기
                                        </Button>
                                    </Link>
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </>
    )
}
