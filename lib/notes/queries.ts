import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db/connection'
import { notes } from '@/lib/db/schema/notes'
import { eq, desc } from 'drizzle-orm'

export async function getUserNotes() {
    const supabase = await createClient()
    
    const {
        data: { user },
        error
    } = await supabase.auth.getUser()

    if (error || !user) {
        return []
    }

    try {
        const userNotes = await db
            .select()
            .from(notes)
            .where(eq(notes.userId, user.id))
            .orderBy(desc(notes.updatedAt))

        return userNotes
    } catch (error) {
        console.error('노트 조회 실패:', error)
        return []
    }
}

export async function getNoteById(noteId: string) {
    const supabase = await createClient()
    
    const {
        data: { user },
        error
    } = await supabase.auth.getUser()

    if (error || !user) {
        return null
    }

    try {
        const [note] = await db
            .select()
            .from(notes)
            .where(eq(notes.id, noteId))
            .limit(1)

        // 노트가 존재하고 사용자 소유인지 확인
        if (!note || note.userId !== user.id) {
            return null
        }

        return note
    } catch (error) {
        console.error('노트 조회 실패:', error)
        return null
    }
}
