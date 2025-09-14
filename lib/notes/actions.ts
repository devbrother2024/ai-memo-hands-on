'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db/connection'
import { notes, insertNoteSchema } from '@/lib/db/schema/notes'

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
        const [newNote] = await db
            .insert(notes)
            .values(validatedData)
            .returning()

        // 캐시 무효화
        revalidatePath('/notes')
    } catch (error) {
        console.error('노트 생성 실패:', error)
        throw new Error('노트 저장에 실패했습니다. 다시 시도해주세요.')
    }

    // 성공 시 노트 목록 페이지로 리다이렉트
    redirect('/notes')
}
