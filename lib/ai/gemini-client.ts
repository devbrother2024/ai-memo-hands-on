/**
 * Google Gemini API 클라이언트
 */

import { GoogleGenAI } from '@google/genai'
import { getGeminiConfig } from './config'
import { GeminiError, GeminiErrorType } from './errors'
import {
    GeminiGenerateRequest,
    GeminiGenerateResponse,
    HealthCheckResult,
    APIUsageLog
} from './types'
import {
    estimateTokens,
    validateTokenLimit,
    withRetry,
    logAPIUsage,
    calculateTokenUsage
} from './utils'

// Minimal client typings to avoid `any`
type GenerateContentParams = { model: string; contents: string }
type GenerateContentResult = {
    text: string
    candidates?: { finishReason?: string }[]
}
interface GenerativeModels {
    generateContent: (
        params: GenerateContentParams
    ) => Promise<GenerateContentResult>
}
interface GenAIClient {
    models: GenerativeModels
}

export class GeminiClient {
    private client: GenAIClient
    private config = getGeminiConfig()
    private requestCount = 0
    private lastResetTime = Date.now()

    constructor(clientOverride?: GenAIClient) {
        try {
            this.client =
                clientOverride ??
                (new GoogleGenAI({
                    apiKey: this.config.apiKey
                }) as unknown as GenAIClient)
        } catch (error) {
            throw new GeminiError(
                GeminiErrorType.API_KEY_INVALID,
                'Failed to initialize Gemini client',
                error
            )
        }
    }

    /**
     * API 연결 상태를 확인합니다
     */
    async healthCheck(): Promise<HealthCheckResult> {
        const startTime = Date.now()

        try {
            await this.generateText('Hello')
            const latencyMs = Date.now() - startTime

            return {
                status: 'healthy',
                latencyMs,
                timestamp: new Date()
            }
        } catch (error) {
            const latencyMs = Date.now() - startTime
            const geminiError = GeminiError.fromError(error)

            return {
                status: 'unhealthy',
                latencyMs,
                error: geminiError.message,
                timestamp: new Date()
            }
        }
    }

    /**
     * 텍스트를 생성합니다
     * @param prompt 프롬프트
     * @param options 추가 옵션
     * @returns 생성된 텍스트와 토큰 정보
     */
    async generateText(
        prompt: string,
        options: Partial<GeminiGenerateRequest> = {}
    ): Promise<GeminiGenerateResponse> {
        const startTime = Date.now()

        try {
            // Rate limiting 체크
            await this.checkRateLimit()

            // 토큰 제한 검증
            const inputTokens = estimateTokens(prompt)
            const maxTokens = options.maxTokens || this.config.maxTokens

            if (!validateTokenLimit(inputTokens, maxTokens)) {
                throw new GeminiError(
                    GeminiErrorType.INVALID_REQUEST,
                    `Input too long: ${inputTokens} tokens (max: ${
                        maxTokens - 2000
                    })`
                )
            }

            // API 호출
            const result = await withRetry(
                () => this.callGeminiAPI(prompt, options),
                3,
                1000
            )

            const latencyMs = Date.now() - startTime
            const tokenUsage = calculateTokenUsage(prompt, result.text)

            // 사용량 로깅
            this.logUsage({
                timestamp: new Date(),
                model: this.config.model,
                inputTokens: tokenUsage.input,
                outputTokens: tokenUsage.output,
                latencyMs,
                success: true
            })

            return {
                text: result.text,
                inputTokens: tokenUsage.input,
                outputTokens: tokenUsage.output,
                totalTokens: tokenUsage.total,
                finishReason: result.finishReason || 'stop'
            }
        } catch (error) {
            const latencyMs = Date.now() - startTime
            const geminiError = GeminiError.fromError(error)

            // 에러 로깅
            this.logUsage({
                timestamp: new Date(),
                model: this.config.model,
                inputTokens: estimateTokens(prompt),
                outputTokens: 0,
                latencyMs,
                success: false,
                error: geminiError.message
            })

            throw geminiError
        }
    }

    /**
     * 실제 Gemini API를 호출합니다
     */
    private async callGeminiAPI(
        prompt: string,
        options: Partial<GeminiGenerateRequest>
    ): Promise<{ text: string; finishReason?: string }> {
        // 타임아웃 설정
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
                reject(
                    new GeminiError(
                        GeminiErrorType.TIMEOUT,
                        `Request timeout after ${this.config.timeout}ms`
                    )
                )
            }, this.config.timeout)
        })

        try {
            const generatePromise = this.client.models.generateContent({
                model: this.config.model,
                contents: prompt
            })

            const result = (await Promise.race([
                generatePromise,
                timeoutPromise
            ])) as GenerateContentResult
            const text = result.text

            if (!text) {
                throw new GeminiError(
                    GeminiErrorType.CONTENT_FILTERED,
                    'No text generated - content may have been filtered'
                )
            }

            return {
                text,
                finishReason: result.candidates?.[0]?.finishReason
            }
        } catch (error: unknown) {
            // Gemini API 특정 에러 처리
            const errorMessage =
                error instanceof Error ? error.message : String(error)

            if (errorMessage?.includes('quota')) {
                throw new GeminiError(
                    GeminiErrorType.QUOTA_EXCEEDED,
                    'API quota exceeded',
                    error
                )
            }

            if (errorMessage?.includes('safety')) {
                throw new GeminiError(
                    GeminiErrorType.CONTENT_FILTERED,
                    'Content was filtered for safety reasons',
                    error
                )
            }

            throw GeminiError.fromError(error)
        }
    }

    /**
     * Rate limiting을 확인합니다
     */
    private async checkRateLimit(): Promise<void> {
        const now = Date.now()
        const timeWindow = 60 * 1000 // 1분

        // 시간 윈도우 리셋
        if (now - this.lastResetTime >= timeWindow) {
            this.requestCount = 0
            this.lastResetTime = now
        }

        // Rate limit 체크
        if (this.requestCount >= this.config.rateLimitPerMinute) {
            const waitTime = timeWindow - (now - this.lastResetTime)
            throw new GeminiError(
                GeminiErrorType.RATE_LIMIT_EXCEEDED,
                `Rate limit exceeded. Wait ${Math.ceil(
                    waitTime / 1000
                )} seconds.`
            )
        }

        this.requestCount++
    }

    /**
     * API 사용량을 로깅합니다
     */
    private logUsage(log: APIUsageLog): void {
        logAPIUsage(log)
    }

    /**
     * 클라이언트 설정을 반환합니다
     */
    getConfig() {
        return { ...this.config }
    }

    /**
     * 현재 rate limit 상태를 반환합니다
     */
    getRateLimitStatus() {
        const now = Date.now()
        const timeWindow = 60 * 1000
        const remainingTime = Math.max(
            0,
            timeWindow - (now - this.lastResetTime)
        )

        return {
            requestCount: this.requestCount,
            maxRequests: this.config.rateLimitPerMinute,
            remainingRequests: Math.max(
                0,
                this.config.rateLimitPerMinute - this.requestCount
            ),
            resetTimeMs: remainingTime
        }
    }
}
