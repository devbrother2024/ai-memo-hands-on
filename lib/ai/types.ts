/**
 * AI 관련 타입 정의
 */

export interface GeminiConfig {
    apiKey: string
    model: string
    maxTokens: number
    timeout: number
    debug: boolean
    rateLimitPerMinute: number
}

export interface GeminiGenerateRequest {
    prompt: string
    maxTokens?: number
    temperature?: number
}

export interface GeminiGenerateResponse {
    text: string
    inputTokens: number
    outputTokens: number
    totalTokens: number
    finishReason: string
}

export interface APIUsageLog {
    timestamp: Date
    model: string
    inputTokens: number
    outputTokens: number
    latencyMs: number
    success: boolean
    error?: string
}

export interface TokenUsage {
    input: number
    output: number
    total: number
}

export interface HealthCheckResult {
    status: 'healthy' | 'unhealthy'
    latencyMs: number
    error?: string
    timestamp: Date
}
