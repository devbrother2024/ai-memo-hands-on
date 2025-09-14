'use server'

import { db } from '@/lib/db/connection'
import { summaries, notes } from '@/lib/db/schema/notes'
import { eq, and, desc } from 'drizzle-orm'
import { summaryGenerator, SummaryGenerator } from './summary-generator'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Summary, NewSummary } from '@/lib/db/schema/notes'

/**
 * 노트의 요약을 생성하고 저장합니다.
 */
export async function generateNoteSummary(noteId: string): Promise<{
    success: boolean
    summary?: Summary
    error?: string
}> {
    try {
        // 사용자 인증 확인
        const supabase = await createClient()
        const {
            data: { user },
            error: authError
        } = await supabase.auth.getUser()

        if (authError || !user) {
            redirect('/signin')
        }

        // 노트 조회 (사용자 권한 확인 포함)
        const note = await db
            .select()
            .from(notes)
            .where(and(eq(notes.id, noteId), eq(notes.userId, user.id)))
            .limit(1)

        if (note.length === 0) {
            return {
                success: false,
                error: '노트를 찾을 수 없습니다.'
            }
        }

        const noteData = note[0]

        if (!noteData.content || noteData.content.trim().length === 0) {
            return {
                success: false,
                error: '요약할 내용이 없습니다.'
            }
        }

        // 토큰 제한에 맞게 내용 자르기
        const truncatedContent = SummaryGenerator.truncateContentToTokenLimit(
            noteData.content,
            8000
        )

        // AI 요약 생성
        const summaryResult = await summaryGenerator.generateSummary(
            truncatedContent
        )

        // 기존 요약 삭제 (최신 요약만 유지)
        await db.delete(summaries).where(eq(summaries.noteId, noteId))

        // 새 요약 저장
        const newSummary: NewSummary = {
            noteId,
            model: summaryResult.model,
            content: summaryResult.content
        }

        const insertedSummary = await db
            .insert(summaries)
            .values(newSummary)
            .returning()

        return {
            success: true,
            summary: insertedSummary[0]
        }
    } catch (error) {
        console.error('요약 생성 오류:', error)

        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : '요약 생성 중 오류가 발생했습니다.'
        }
    }
}

/**
 * 노트의 최신 요약을 조회합니다.
 */
export async function getNoteSummary(noteId: string): Promise<{
    success: boolean
    summary?: Summary
    error?: string
}> {
    try {
        // 사용자 인증 확인
        const supabase = await createClient()
        const {
            data: { user },
            error: authError
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return {
                success: false,
                error: '인증되지 않은 사용자입니다.'
            }
        }

        // 노트 소유권 확인
        const note = await db
            .select({ id: notes.id })
            .from(notes)
            .where(and(eq(notes.id, noteId), eq(notes.userId, user.id)))
            .limit(1)

        if (note.length === 0) {
            return {
                success: false,
                error: '노트를 찾을 수 없습니다.'
            }
        }

        // 최신 요약 조회
        const summary = await db
            .select()
            .from(summaries)
            .where(eq(summaries.noteId, noteId))
            .orderBy(desc(summaries.createdAt))
            .limit(1)

        return {
            success: true,
            summary: summary[0] || undefined
        }
    } catch (error) {
        console.error('요약 조회 오류:', error)

        return {
            success: false,
            error: '요약 조회 중 오류가 발생했습니다.'
        }
    }
}

/**
 * 요약을 수동으로 편집합니다.
 */
export async function updateNoteSummary(
    summaryId: string,
    content: string
): Promise<{
    success: boolean
    summary?: Summary
    error?: string
}> {
    try {
        // 사용자 인증 확인
        const supabase = await createClient()
        const {
            data: { user },
            error: authError
        } = await supabase.auth.getUser()

        if (authError || !user) {
            redirect('/signin')
        }

        // 입력 검증
        if (!content || content.trim().length === 0) {
            return {
                success: false,
                error: '요약 내용을 입력해주세요.'
            }
        }

        // 요약 소유권 확인 (노트 소유자와 매칭)
        const existingSummary = await db
            .select({
                id: summaries.id,
                noteId: summaries.noteId
            })
            .from(summaries)
            .innerJoin(notes, eq(summaries.noteId, notes.id))
            .where(and(eq(summaries.id, summaryId), eq(notes.userId, user.id)))
            .limit(1)

        if (existingSummary.length === 0) {
            return {
                success: false,
                error: '요약을 찾을 수 없습니다.'
            }
        }

        // 요약 업데이트
        const updatedSummary = await db
            .update(summaries)
            .set({ content: content.trim() })
            .where(eq(summaries.id, summaryId))
            .returning()

        return {
            success: true,
            summary: updatedSummary[0]
        }
    } catch (error) {
        console.error('요약 수정 오류:', error)

        return {
            success: false,
            error: '요약 수정 중 오류가 발생했습니다.'
        }
    }
}

/**
 * 요약을 삭제합니다.
 */
export async function deleteNoteSummary(summaryId: string): Promise<{
    success: boolean
    error?: string
}> {
    try {
        // 사용자 인증 확인
        const supabase = await createClient()
        const {
            data: { user },
            error: authError
        } = await supabase.auth.getUser()

        if (authError || !user) {
            redirect('/signin')
        }

        // 요약 소유권 확인
        const existingSummary = await db
            .select({ id: summaries.id })
            .from(summaries)
            .innerJoin(notes, eq(summaries.noteId, notes.id))
            .where(and(eq(summaries.id, summaryId), eq(notes.userId, user.id)))
            .limit(1)

        if (existingSummary.length === 0) {
            return {
                success: false,
                error: '요약을 찾을 수 없습니다.'
            }
        }

        // 요약 삭제
        await db.delete(summaries).where(eq(summaries.id, summaryId))

        return {
            success: true
        }
    } catch (error) {
        console.error('요약 삭제 오류:', error)

        return {
            success: false,
            error: '요약 삭제 중 오류가 발생했습니다.'
        }
    }
}
