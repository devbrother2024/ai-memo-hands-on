import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'

export const notes = pgTable('notes', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull(),
    title: text('title').notNull().default('제목 없음'),
    content: text('content'),
    createdAt: timestamp('created_at', { withTimezone: true })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
        .defaultNow()
        .notNull()
})

// Zod 스키마 자동 생성
export const insertNoteSchema = createInsertSchema(notes, {
    title: z =>
        z
            .min(1, '제목을 입력해주세요')
            .max(200, '제목은 200자 이내로 입력해주세요'),
    content: z => z.max(50000, '내용은 50,000자 이내로 입력해주세요').optional()
})

export const selectNoteSchema = createSelectSchema(notes)

export type Note = typeof notes.$inferSelect
export type NewNote = typeof notes.$inferInsert
