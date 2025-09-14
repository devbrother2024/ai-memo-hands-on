'use server'

import { db } from '@/lib/db/connection'
import { notes, tags, noteTags, NewTag, Tag, Note } from '@/lib/db/schema/notes'
import { eq, and, desc } from 'drizzle-orm'
import { NoteTagGenerator } from './tag-generator'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface ActionResponse<T> {
    success: boolean
    data?: T
    error?: string
    tags?: Tag[] // For tag generation/retrieval actions
}

const tagGenerator = new NoteTagGenerator()

/**
 * 특정 노트에 대한 태그를 생성하고 저장합니다.
 * @param noteId 노트 ID
 * @returns 생성된 태그 목록 또는 에러 메시지
 */
export async function generateNoteTags(
    noteId: string
): Promise<ActionResponse<Tag[]>> {
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

        // 노트 내용 가져오기 및 소유권 확인
        const note = await db.query.notes.findFirst({
            where: and(eq(notes.id, noteId), eq(notes.userId, user.id))
        })

        if (!note || !note.content) {
            return {
                success: false,
                error: '태그를 생성할 노트 내용을 찾을 수 없습니다.'
            }
        }

        // 토큰 제한에 맞춰 내용 자르기
        const truncatedContent = NoteTagGenerator.truncateContentToTokenLimit(
            note.content
        )

        const { tags: generatedTags } = await tagGenerator.generateTags(
            truncatedContent
        )

        // 기존 태그 삭제 (재생성)
        await db.delete(noteTags).where(eq(noteTags.noteId, noteId))

        // 새 태그들을 생성/조회하고 노트와 연결
        const resultTags: Tag[] = []

        for (const tagName of generatedTags) {
            // 기존 태그 확인
            let existingTag = await db.query.tags.findFirst({
                where: eq(tags.name, tagName)
            })

            // 태그가 없으면 생성
            if (!existingTag) {
                const newTag: NewTag = {
                    name: tagName,
                    color: generateTagColor(tagName) // 태그 이름 기반 색상 생성
                }

                const [created] = await db
                    .insert(tags)
                    .values(newTag)
                    .returning()
                existingTag = created
            }

            // 노트-태그 관계 생성
            await db.insert(noteTags).values({
                noteId,
                tagId: existingTag.id
            })

            resultTags.push(existingTag)
        }

        revalidatePath(`/notes/${noteId}`)
        return { success: true, tags: resultTags }
    } catch (error: unknown) {
        console.error('태그 생성 서버 액션 오류:', error)
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : '태그 생성에 실패했습니다.'
        }
    }
}

/**
 * 특정 노트의 태그 목록을 조회합니다.
 * @param noteId 노트 ID
 * @returns 태그 목록 또는 에러 메시지
 */
export async function getNoteTags(
    noteId: string
): Promise<ActionResponse<Tag[]>> {
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
        const note = await db.query.notes.findFirst({
            where: and(eq(notes.id, noteId), eq(notes.userId, user.id))
        })

        if (!note) {
            return {
                success: false,
                error: '노트를 찾을 수 없습니다.'
            }
        }

        // 노트의 태그 조회
        const noteTagsResult = await db
            .select({
                tag: tags
            })
            .from(noteTags)
            .innerJoin(tags, eq(noteTags.tagId, tags.id))
            .where(eq(noteTags.noteId, noteId))
            .orderBy(desc(noteTags.createdAt))

        const tagList = noteTagsResult.map(item => item.tag)

        return { success: true, tags: tagList }
    } catch (error: unknown) {
        console.error('태그 조회 서버 액션 오류:', error)
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : '태그 조회에 실패했습니다.'
        }
    }
}

/**
 * 노트에서 특정 태그를 제거합니다.
 * @param noteId 노트 ID
 * @param tagId 태그 ID
 * @returns 성공 여부 또는 에러 메시지
 */
export async function removeNoteTag(
    noteId: string,
    tagId: string
): Promise<ActionResponse<null>> {
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
        const note = await db.query.notes.findFirst({
            where: and(eq(notes.id, noteId), eq(notes.userId, user.id))
        })

        if (!note) {
            return {
                success: false,
                error: '노트를 찾을 수 없습니다.'
            }
        }

        // 노트-태그 관계 삭제
        const [deleted] = await db
            .delete(noteTags)
            .where(and(eq(noteTags.noteId, noteId), eq(noteTags.tagId, tagId)))
            .returning()

        if (deleted) {
            revalidatePath(`/notes/${noteId}`)
            return { success: true }
        } else {
            return {
                success: false,
                error: '태그를 찾을 수 없거나 삭제 권한이 없습니다.'
            }
        }
    } catch (error: unknown) {
        console.error('태그 삭제 서버 액션 오류:', error)
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : '태그 삭제에 실패했습니다.'
        }
    }
}

/**
 * 태그를 편집합니다 (태그명 변경).
 * @param tagId 태그 ID
 * @param newName 새로운 태그명
 * @returns 업데이트된 태그 또는 에러 메시지
 */
export async function updateTag(
    tagId: string,
    newName: string
): Promise<ActionResponse<Tag>> {
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

        // 태그명 검증
        if (!newName || newName.trim().length === 0) {
            return {
                success: false,
                error: '태그명을 입력해주세요.'
            }
        }

        if (newName.length > 50) {
            return {
                success: false,
                error: '태그명은 50자 이내로 입력해주세요.'
            }
        }

        // 중복 태그명 확인
        const existingTag = await db.query.tags.findFirst({
            where: and(eq(tags.name, newName.trim()), eq(tags.id, tagId))
        })

        if (existingTag) {
            return {
                success: false,
                error: '이미 존재하는 태그명입니다.'
            }
        }

        // 태그 업데이트
        const [updated] = await db
            .update(tags)
            .set({ name: newName.trim() })
            .where(eq(tags.id, tagId))
            .returning()

        if (updated) {
            // 해당 태그를 사용하는 모든 노트 페이지 재검증
            const relatedNotes = await db
                .select({ noteId: noteTags.noteId })
                .from(noteTags)
                .where(eq(noteTags.tagId, tagId))

            for (const { noteId } of relatedNotes) {
                revalidatePath(`/notes/${noteId}`)
            }

            return { success: true, data: updated }
        } else {
            return {
                success: false,
                error: '태그를 찾을 수 없거나 업데이트 권한이 없습니다.'
            }
        }
    } catch (error: unknown) {
        console.error('태그 업데이트 서버 액션 오류:', error)
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : '태그 업데이트에 실패했습니다.'
        }
    }
}

/**
 * 특정 태그를 가진 노트들을 검색합니다.
 * @param tagId 태그 ID
 * @returns 노트 목록 또는 에러 메시지
 */
export async function searchNotesByTag(
    tagId: string
): Promise<ActionResponse<{ note: Note; tag: Tag }[]>> {
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

        // 태그가 포함된 노트들 검색
        const results = await db
            .select({
                note: notes,
                tag: tags
            })
            .from(noteTags)
            .innerJoin(notes, eq(noteTags.noteId, notes.id))
            .innerJoin(tags, eq(noteTags.tagId, tags.id))
            .where(and(eq(noteTags.tagId, tagId), eq(notes.userId, user.id)))
            .orderBy(desc(notes.updatedAt))

        return { success: true, data: results }
    } catch (error: unknown) {
        console.error('태그별 노트 검색 서버 액션 오류:', error)
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : '태그별 노트 검색에 실패했습니다.'
        }
    }
}

/**
 * 태그 이름을 기반으로 색상을 생성합니다.
 * @param tagName 태그 이름
 * @returns CSS 색상 값
 */
function generateTagColor(tagName: string): string {
    const colors = [
        '#3B82F6', // blue
        '#EF4444', // red
        '#10B981', // emerald
        '#F59E0B', // amber
        '#8B5CF6', // violet
        '#EC4899', // pink
        '#06B6D4', // cyan
        '#84CC16', // lime
        '#F97316', // orange
        '#6366F1' // indigo
    ]

    // 태그 이름의 해시를 기반으로 색상 선택
    let hash = 0
    for (let i = 0; i < tagName.length; i++) {
        hash = tagName.charCodeAt(i) + ((hash << 5) - hash)
    }

    return colors[Math.abs(hash) % colors.length]
}
