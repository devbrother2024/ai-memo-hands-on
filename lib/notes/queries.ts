import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db/connection'
import { notes, type Note } from '@/lib/db/schema/notes'
import { eq, desc, asc, count, or, ilike, sql } from 'drizzle-orm'

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

export async function searchUserNotes({
    query,
    page,
    limit,
    sort
}: {
    query: string
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

    // 검색어가 없으면 기본 조회
    if (!query.trim()) {
        return getUserNotesPaginated({ page, limit, sort })
    }

    const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1
    const safeLimit =
        Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 12
    const offset = (safePage - 1) * safeLimit

    const searchPattern = `%${query.trim()}%`

    try {
        // 검색 조건 구성
        const searchCondition = or(
            ilike(notes.title, searchPattern),
            ilike(notes.content, searchPattern)
        )

        // 정렬 조건 - 제목 매치 우선, 그 다음 기존 정렬
        const orderBy = [
            // 제목에 검색어가 있으면 우선순위 1, 아니면 2
            sql`CASE WHEN ${notes.title} ILIKE ${searchPattern} THEN 1 ELSE 2 END`,
            resolveOrderBy(sort)
        ]

        const [rows, total] = await Promise.all([
            db
                .select()
                .from(notes)
                .where(sql`${eq(notes.userId, user.id)} AND ${searchCondition}`)
                .orderBy(...orderBy)
                .limit(safeLimit)
                .offset(offset),
            db
                .select({ value: count() })
                .from(notes)
                .where(sql`${eq(notes.userId, user.id)} AND ${searchCondition}`)
        ])

        const totalCount = Number(total?.[0]?.value ?? 0)
        return { notes: rows, totalCount }
    } catch (error) {
        console.error('노트 검색 실패:', error)
        return { notes: [], totalCount: 0 }
    }
}
