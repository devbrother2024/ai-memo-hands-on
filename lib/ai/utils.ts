/**
 * AI 유틸리티 함수
 */

import { APIUsageLog, TokenUsage } from './types'
import { GeminiError, isRetryableError } from './errors'

/**
 * 텍스트의 대략적인 토큰 수를 계산합니다
 * @param text 텍스트
 * @returns 예상 토큰 수
 */
export function estimateTokens(text: string): number {
    // 대략적인 토큰 수 계산 (1 토큰 ≈ 4 문자, 한국어는 더 적음)
    // 영어: 1 토큰 ≈ 4 문자
    // 한국어: 1 토큰 ≈ 2-3 문자 (더 효율적)
    const koreanRegex = /[가-힣]/g
    const koreanChars = (text.match(koreanRegex) || []).length
    const otherChars = text.length - koreanChars

    const koreanTokens = Math.ceil(koreanChars / 2.5)
    const otherTokens = Math.ceil(otherChars / 4)

    return koreanTokens + otherTokens
}

/**
 * 토큰 제한을 검증합니다
 * @param inputTokens 입력 토큰 수
 * @param maxTokens 최대 토큰 수
 * @returns 제한 내에 있는지 여부
 */
export function validateTokenLimit(
    inputTokens: number,
    maxTokens: number = 8192
): boolean {
    // 응답용 토큰도 고려하여 여유분 확보
    const reservedTokens = 2000
    return inputTokens <= maxTokens - reservedTokens
}

/**
 * API 사용량을 로깅합니다
 * @param log API 사용량 로그
 */
export function logAPIUsage(log: APIUsageLog): void {
    // 개발 환경에서는 콘솔 출력
    if (
        process.env.NODE_ENV === 'development' ||
        process.env.GEMINI_DEBUG === 'true'
    ) {
        console.log('[Gemini API Usage]', {
            timestamp: log.timestamp.toISOString(),
            model: log.model,
            tokens: `${log.inputTokens}+${log.outputTokens}=${
                log.inputTokens + log.outputTokens
            }`,
            latency: `${log.latencyMs}ms`,
            success: log.success,
            error: log.error
        })
    }

    // 프로덕션에서는 실제 로깅 시스템으로 전송
    // TODO: 로깅 시스템 연동 (예: DataDog, New Relic 등)
}

/**
 * 재시도 로직이 포함된 함수 실행
 * @param operation 실행할 함수
 * @param maxRetries 최대 재시도 횟수
 * @param backoffMs 재시도 간격 (밀리초)
 * @returns 함수 실행 결과
 */
export async function withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    backoffMs: number = 1000
): Promise<T> {
    let lastError: Error

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation()
        } catch (error) {
            lastError = error as Error
            const geminiError = GeminiError.fromError(error)

            // 재시도 불가능한 에러는 즉시 throw
            if (!isRetryableError(geminiError)) {
                throw geminiError
            }

            if (attempt < maxRetries) {
                const delayMs = backoffMs * Math.pow(2, attempt - 1) // 지수 백오프
                await sleep(delayMs)
            }
        }
    }

    throw GeminiError.fromError(lastError!)
}

/**
 * 지정된 시간만큼 대기
 * @param ms 대기 시간 (밀리초)
 */
export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 토큰 사용량을 계산합니다
 * @param inputText 입력 텍스트
 * @param outputText 출력 텍스트
 * @returns 토큰 사용량
 */
export function calculateTokenUsage(
    inputText: string,
    outputText: string
): TokenUsage {
    const input = estimateTokens(inputText)
    const output = estimateTokens(outputText)

    return {
        input,
        output,
        total: input + output
    }
}

/**
 * 비용을 추정합니다 (토큰 기반)
 * @param tokenUsage 토큰 사용량
 * @param model 모델명
 * @returns 예상 비용 (USD)
 */
export function estimateCost(tokenUsage: TokenUsage): number {
    // Gemini 2.0 Flash 기준 가격 (2024년 기준)
    // Input: $0.15 per 1M tokens
    // Output: $0.60 per 1M tokens
    const inputCostPer1M = 0.15
    const outputCostPer1M = 0.6

    const inputCost = (tokenUsage.input / 1000000) * inputCostPer1M
    const outputCost = (tokenUsage.output / 1000000) * outputCostPer1M

    return inputCost + outputCost
}

/**
 * 텍스트를 청크로 분할합니다
 * @param text 분할할 텍스트
 * @param maxTokensPerChunk 청크당 최대 토큰 수
 * @returns 텍스트 청크 배열
 */
export function splitTextIntoChunks(
    text: string,
    maxTokensPerChunk: number = 6000
): string[] {
    const sentences = text.split(/[.!?]\s+/)
    const chunks: string[] = []
    let currentChunk = ''

    for (const sentence of sentences) {
        const testChunk = currentChunk
            ? `${currentChunk}. ${sentence}`
            : sentence

        if (estimateTokens(testChunk) <= maxTokensPerChunk) {
            currentChunk = testChunk
        } else {
            if (currentChunk) {
                chunks.push(currentChunk)
                currentChunk = sentence
            } else {
                // 단일 문장이 너무 긴 경우 강제로 분할
                chunks.push(sentence)
            }
        }
    }

    if (currentChunk) {
        chunks.push(currentChunk)
    }

    return chunks
}
