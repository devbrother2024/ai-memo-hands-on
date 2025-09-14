import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db/connection'
import { notes, type Note } from '@/lib/db/schema/notes'
import { eq, desc, asc, count } from 'drizzle-orm'

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

export type NotesSort = 'newest' | 'oldest' | 'title'

function resolveOrderBy(sort: NotesSort) {
    switch (sort) {
        case 'oldest':
            return asc(notes.updatedAt)
        case 'title':
            return asc(notes.title)
        case 'newest':
        default:
            return desc(notes.updatedAt)
    }
}

export async function getUserNotesPaginated({
    page,
    limit,
    sort
}: {
    page: number
    limit: number
    sort: NotesSort
}): Promise<{ notes: Note[]; totalCount: number }> {
    const supabase = await createClient()

    const {
        data: { user },
        error
    } = await supabase.auth.getUser()

    if (error || !user) {
        return { notes: [], totalCount: 0 }
    }

    const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1
    const safeLimit =
        Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 12
    const offset = (safePage - 1) * safeLimit

    try {
        const [rows, total] = await Promise.all([
            db
                .select()
                .from(notes)
                .where(eq(notes.userId, user.id))
                .orderBy(resolveOrderBy(sort))
                .limit(safeLimit)
                .offset(offset),
            db
                .select({ value: count() })
                .from(notes)
                .where(eq(notes.userId, user.id))
        ])

        const totalCount = Number(total?.[0]?.value ?? 0)
        return { notes: rows, totalCount }
    } catch (error) {
        console.error('노트 페이지네이션 조회 실패:', error)
        return { notes: [], totalCount: 0 }
    }
}
