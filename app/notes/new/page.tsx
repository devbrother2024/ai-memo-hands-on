import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NoteForm } from '@/components/notes/note-form'

export default async function NewNotePage() {
    // 로그인 확인
    const supabase = await createClient()
    const {
        data: { user },
        error
    } = await supabase.auth.getUser()

    if (error || !user) {
        redirect('/signin')
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto">
                <NoteForm />
            </div>
        </div>
    )
}

export const metadata = {
    title: '새 노트 작성 - AI 메모장',
    description: '새로운 노트를 작성하세요'
}
