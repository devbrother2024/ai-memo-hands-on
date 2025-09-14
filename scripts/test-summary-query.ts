#!/usr/bin/env tsx

import { config } from 'dotenv'
config({ path: '.env.local' })

import { db } from '../lib/db/connection'
import { summaries, notes } from '../lib/db/schema/notes'
import { eq, desc } from 'drizzle-orm'

async function testSummaryQuery() {
    try {
        console.log('🔍 DB 연결 테스트 중...')
        console.log(
            'DATABASE_URL:',
            process.env.DATABASE_URL ? 'loaded' : 'NOT FOUND'
        )

        // 모든 요약 데이터 조회
        const allSummaries = await db.select().from(summaries)
        console.log('📊 전체 요약 개수:', allSummaries.length)

        if (allSummaries.length > 0) {
            console.log('📝 첫 번째 요약 데이터:')
            console.log(JSON.stringify(allSummaries[0], null, 2))

            const noteId = allSummaries[0].noteId
            console.log(`\n🔎 noteId ${noteId}로 요약 조회 테스트:`)

            // 특정 노트의 최신 요약 조회 (summary-actions.ts와 동일한 로직)
            const specificSummary = await db
                .select()
                .from(summaries)
                .where(eq(summaries.noteId, noteId))
                .orderBy(desc(summaries.createdAt))
                .limit(1)

            console.log(
                '🎯 조회 결과:',
                specificSummary.length > 0 ? specificSummary[0] : '없음'
            )
        } else {
            console.log('⚠️ 요약 데이터가 없습니다.')
        }
    } catch (error) {
        console.error('❌ 오류:', error)
    }
}

testSummaryQuery()
