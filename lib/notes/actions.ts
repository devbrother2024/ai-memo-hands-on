'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db/connection'
import { notes, insertNoteSchema } from '@/lib/db/schema/notes'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export async function createNote(formData: FormData) {
    const supabase = await createClient()

    // 사용자 인증 확인
    const {
        data: { user },
        error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
        redirect('/signin')
    }

    // 폼 데이터 추출
    const title = formData.get('title') as string
    const content = formData.get('content') as string

    // 데이터 검증
    const validatedData = insertNoteSchema.parse({
        userId: user.id,
        title: title.trim() || '제목 없음',
        content: content.trim() || null
    })

    try {
        // 노트 생성
        await db.insert(notes).values(validatedData)

        // 캐시 무효화
        revalidatePath('/notes')
    } catch (error) {
        console.error('노트 생성 실패:', error)
        throw new Error('노트 저장에 실패했습니다. 다시 시도해주세요.')
    }

    // 성공 시 노트 목록 페이지로 리다이렉트
    redirect('/notes')
}

// 노트 업데이트 스키마
const updateNoteSchema = z.object({
    title: z.string().min(1, '제목은 필수입니다').optional(),
    content: z.string().optional()
})

export type UpdateNoteInput = z.infer<typeof updateNoteSchema>

export async function updateNote(
    noteId: string,
    data: UpdateNoteInput
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    // 사용자 인증 확인
    const {
        data: { user },
        error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
        return { success: false, error: '인증이 필요합니다' }
    }

    try {
        // 데이터 검증
        const validatedData = updateNoteSchema.parse(data)

        // 노트 소유자 확인
        const [existingNote] = await db
            .select()
            .from(notes)
            .where(eq(notes.id, noteId))
            .limit(1)

        if (!existingNote || existingNote.userId !== user.id) {
            return {
                success: false,
                error: '노트를 찾을 수 없거나 권한이 없습니다'
            }
        }

        // 업데이트할 데이터 준비
        const updateData: {
            updatedAt: Date
            title?: string
            content?: string | null
        } = {
            updatedAt: new Date()
        }

        if (validatedData.title !== undefined) {
            updateData.title = validatedData.title.trim() || '제목 없음'
        }

        if (validatedData.content !== undefined) {
            updateData.content = validatedData.content.trim() || null
        }

        // 노트 업데이트
        await db.update(notes).set(updateData).where(eq(notes.id, noteId))

        // 캐시 무효화
        revalidatePath('/notes')
        revalidatePath(`/notes/${noteId}`)

        return { success: true }
    } catch (error) {
        console.error('노트 업데이트 실패:', error)

        if (error instanceof z.ZodError) {
            return { success: false, error: '입력 데이터가 올바르지 않습니다' }
        }

        return { success: false, error: '노트 저장에 실패했습니다' }
    }
}

export async function deleteNote(noteId: string): Promise<{
    success: boolean
    error?: string
}> {
    const supabase = await createClient()

    // 사용자 인증 확인
    const {
        data: { user },
        error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
        return { success: false, error: '인증이 필요합니다' }
    }

    try {
        // 노트 소유자 확인
        const [existingNote] = await db
            .select()
            .from(notes)
            .where(eq(notes.id, noteId))
            .limit(1)

        if (!existingNote) {
            return { success: false, error: '노트를 찾을 수 없습니다' }
        }

        if (existingNote.userId !== user.id) {
            return { success: false, error: '이 노트를 삭제할 권한이 없습니다' }
        }

        // 노트 삭제
        await db.delete(notes).where(eq(notes.id, noteId))

        // 캐시 무효화
        revalidatePath('/notes')
        revalidatePath(`/notes/${noteId}`)

        return { success: true }
    } catch (error) {
        console.error('노트 삭제 실패:', error)
        return { success: false, error: '노트 삭제에 실패했습니다' }
    }
}
