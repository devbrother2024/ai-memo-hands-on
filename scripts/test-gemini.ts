/**
 * Gemini API 테스트 스크립트
 *
 * 사용법:
 * 1. .env.local 파일에 GEMINI_API_KEY 설정
 * 2. pnpm tsx scripts/test-gemini.ts 실행
 */

import { GeminiClient, validateEnvironment } from '../lib/ai'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

async function testGeminiAPI() {
    console.log('🚀 Gemini API 테스트 시작...\n')

    try {
        // 환경변수 검증
        console.log('1. 환경변수 검증 중...')
        validateEnvironment()
        console.log('✅ 환경변수 검증 완료\n')

        // 클라이언트 초기화
        console.log('2. Gemini 클라이언트 초기화 중...')
        const client = new GeminiClient()
        console.log('✅ 클라이언트 초기화 완료\n')

        // 설정 확인
        console.log('3. 클라이언트 설정 확인...')
        const config = client.getConfig()
        console.log('📋 설정 정보:')
        console.log(`   - 모델: ${config.model}`)
        console.log(`   - 최대 토큰: ${config.maxTokens}`)
        console.log(`   - 타임아웃: ${config.timeout}ms`)
        console.log(`   - Rate Limit: ${config.rateLimitPerMinute}/분`)
        console.log(`   - 디버그 모드: ${config.debug}\n`)

        // Health Check
        console.log('4. Health Check 수행 중...')
        const healthResult = await client.healthCheck()
        console.log(`📊 Health Check 결과:`)
        console.log(`   - 상태: ${healthResult.status}`)
        console.log(`   - 응답 시간: ${healthResult.latencyMs}ms`)
        console.log(`   - 시간: ${healthResult.timestamp.toLocaleString()}`)
        if (healthResult.error) {
            console.log(`   - 에러: ${healthResult.error}`)
        }
        console.log()

        if (healthResult.status === 'healthy') {
            // 기본 텍스트 생성 테스트
            console.log('5. 기본 텍스트 생성 테스트...')
            const prompt = '안녕하세요! 간단한 인사말을 한국어로 작성해주세요.'

            console.log(`📝 프롬프트: "${prompt}"`)
            const result = await client.generateText(prompt)

            console.log('✅ 텍스트 생성 완료')
            console.log(`📤 생성된 텍스트: "${result.text}"`)
            console.log(`📊 토큰 사용량:`)
            console.log(`   - 입력: ${result.inputTokens} 토큰`)
            console.log(`   - 출력: ${result.outputTokens} 토큰`)
            console.log(`   - 총합: ${result.totalTokens} 토큰`)
            console.log(`   - 완료 이유: ${result.finishReason}\n`)

            // Rate Limit 상태 확인
            console.log('6. Rate Limit 상태 확인...')
            const rateLimitStatus = client.getRateLimitStatus()
            console.log(`📈 Rate Limit 상태:`)
            console.log(
                `   - 현재 요청 수: ${rateLimitStatus.requestCount}/${rateLimitStatus.maxRequests}`
            )
            console.log(
                `   - 남은 요청 수: ${rateLimitStatus.remainingRequests}`
            )
            console.log(
                `   - 리셋까지 시간: ${Math.ceil(
                    rateLimitStatus.resetTimeMs / 1000
                )}초\n`
            )

            console.log('🎉 모든 테스트가 성공적으로 완료되었습니다!')
        } else {
            console.log('❌ Health Check 실패로 인해 추가 테스트를 건너뜁니다.')
        }
    } catch (error) {
        console.error('❌ 테스트 실패:', error)
        process.exit(1)
    }
}

// 스크립트 실행
if (require.main === module) {
    testGeminiAPI()
}
