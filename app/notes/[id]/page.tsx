import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getNoteById } from '@/lib/notes/queries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function NoteDetailPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const supabase = await createClient()
    const {
        data: { user },
        error
    } = await supabase.auth.getUser()

    if (error || !user) {
        redirect('/signin')
    }

    const { id } = await params
    const note = await getNoteById(id)
    if (!note) {
        notFound()
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold">
                            {note.title}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="prose whitespace-pre-wrap">
                            {note.content || '내용이 없습니다.'}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export const metadata = {
    title: '노트 상세 - AI 메모장',
    description: '노트 상세 보기'
}
