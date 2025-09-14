/**
 * Gemini Client 테스트
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals'
import { GeminiClient } from '../../lib/ai/gemini-client'
import { GeminiError, GeminiErrorType } from '../../lib/ai/errors'
import { estimateTokens, validateTokenLimit } from '../../lib/ai/utils'

// 환경변수 모킹
const mockEnv = {
    GEMINI_API_KEY: 'test-api-key',
    GEMINI_MODEL: 'gemini-2.0-flash-001',
    GEMINI_MAX_TOKENS: '8192',
    GEMINI_TIMEOUT_MS: '10000',
    GEMINI_DEBUG: 'true',
    GEMINI_RATE_LIMIT: '60'
}

// 순수 객체로 클라이언트를 모킹하여 의존성 주입
type MockGenResponse = {
    text: string
    candidates?: { finishReason: string }[]
}

function createMockClient() {
    const generateContent =
        jest.fn<
            (params: {
                model: string
                contents: string
            }) => Promise<MockGenResponse>
        >()
    return {
        models: {
            generateContent
        }
    }
}

describe('GeminiClient', () => {
    beforeEach(() => {
        // 환경변수 설정
        Object.assign(process.env, mockEnv)
        jest.clearAllMocks()
    })

    describe('초기화', () => {
        test('올바른 설정으로 클라이언트가 초기화되어야 함', () => {
            expect(() => new GeminiClient()).not.toThrow()
        })

        test('API 키가 없으면 에러가 발생해야 함', () => {
            delete process.env.GEMINI_API_KEY
            expect(() => new GeminiClient()).toThrow(
                'GEMINI_API_KEY is required'
            )
        })
    })

    describe('설정 관리', () => {
        test('getConfig()가 올바른 설정을 반환해야 함', () => {
            const client = new GeminiClient(createMockClient())
            const config = client.getConfig()

            expect(config.apiKey).toBe('test-api-key')
            expect(config.model).toBe('gemini-2.0-flash-001')
            expect(config.maxTokens).toBe(8192)
            expect(config.timeout).toBe(10000)
            expect(config.debug).toBe(true)
            expect(config.rateLimitPerMinute).toBe(60)
        })
    })

    describe('Rate Limiting', () => {
        test('rate limit 상태를 올바르게 반환해야 함', () => {
            const client = new GeminiClient(createMockClient())
            const status = client.getRateLimitStatus()

            expect(status.requestCount).toBe(0)
            expect(status.maxRequests).toBe(60)
            expect(status.remainingRequests).toBe(60)
            expect(status.resetTimeMs).toBeGreaterThanOrEqual(0)
        })
    })

    describe('Health Check', () => {
        test('성공적인 health check', async () => {
            // 모킹 응답: 클라이언트 구현은 result.text (string) 과 candidates를 사용함
            const mockClient = createMockClient()
            mockClient.models.generateContent.mockResolvedValue({
                text: 'Hello response',
                candidates: [{ finishReason: 'stop' }]
            })

            const client = new GeminiClient(mockClient)
            const result = await client.healthCheck()

            expect(result.status).toBe('healthy')
            expect(result.latencyMs).toBeGreaterThan(0)
            expect(result.timestamp).toBeInstanceOf(Date)
        })

        test('실패하는 health check', async () => {
            const mockClient = createMockClient()
            mockClient.models.generateContent.mockRejectedValue(
                new Error('API Error')
            )

            const client = new GeminiClient(mockClient)
            const result = await client.healthCheck()

            expect(result.status).toBe('unhealthy')
            expect(result.error).toContain('API Error')
        })
    })
})

describe('유틸리티 함수', () => {
    describe('estimateTokens', () => {
        test('영어 텍스트의 토큰 수를 올바르게 계산해야 함', () => {
            const englishText = 'Hello, world!'
            const tokens = estimateTokens(englishText)
            expect(tokens).toBeGreaterThan(0)
            expect(tokens).toBeLessThan(englishText.length)
        })

        test('한국어 텍스트의 토큰 수를 올바르게 계산해야 함', () => {
            const koreanText = '안녕하세요, 세계!'
            const tokens = estimateTokens(koreanText)
            expect(tokens).toBeGreaterThan(0)
            expect(tokens).toBeLessThan(koreanText.length)
        })

        test('혼합 텍스트의 토큰 수를 올바르게 계산해야 함', () => {
            const mixedText = 'Hello 안녕하세요!'
            const tokens = estimateTokens(mixedText)
            expect(tokens).toBeGreaterThan(0)
        })
    })

    describe('validateTokenLimit', () => {
        test('제한 내의 토큰은 통과해야 함', () => {
            expect(validateTokenLimit(1000, 8192)).toBe(true)
        })

        test('제한을 초과하는 토큰은 실패해야 함', () => {
            expect(validateTokenLimit(7000, 8192)).toBe(false)
        })

        test('기본 제한값을 사용해야 함', () => {
            expect(validateTokenLimit(1000)).toBe(true)
            expect(validateTokenLimit(7000)).toBe(false)
        })
    })
})

describe('에러 처리', () => {
    test('GeminiError.fromError()가 올바른 에러 타입을 생성해야 함', () => {
        // API 키 에러
        const apiKeyError = new Error('API key invalid') as Error & {
            status?: number
        }
        apiKeyError.status = 401
        const geminiError1 = GeminiError.fromError(apiKeyError)
        expect(geminiError1.type).toBe(GeminiErrorType.API_KEY_INVALID)

        // 할당량 초과 에러
        const quotaError = new Error('quota exceeded') as Error & {
            status?: number
        }
        quotaError.status = 429
        const geminiError2 = GeminiError.fromError(quotaError)
        expect(geminiError2.type).toBe(GeminiErrorType.QUOTA_EXCEEDED)

        // 일반 에러
        const generalError = new Error('Something went wrong')
        const geminiError3 = GeminiError.fromError(generalError)
        expect(geminiError3.type).toBe(GeminiErrorType.UNKNOWN)
    })
})
