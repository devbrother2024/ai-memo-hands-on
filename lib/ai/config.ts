/**
 * AI 설정 관리
 */

import { GeminiConfig } from './types'

export function getGeminiConfig(): GeminiConfig {
    const config: GeminiConfig = {
        apiKey: process.env.GEMINI_API_KEY!,
        model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-001',
        maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS || '8192'),
        timeout: parseInt(process.env.GEMINI_TIMEOUT_MS || '10000'),
        debug: process.env.GEMINI_DEBUG === 'true',
        rateLimitPerMinute: parseInt(process.env.GEMINI_RATE_LIMIT || '60')
    }

    // 필수 설정 검증
    if (!config.apiKey) {
        throw new Error('GEMINI_API_KEY is required')
    }

    // 토큰 수 검증
    if (config.maxTokens <= 0 || config.maxTokens > 32768) {
        throw new Error('GEMINI_MAX_TOKENS must be between 1 and 32768')
    }

    // 타임아웃 검증
    if (config.timeout <= 0 || config.timeout > 60000) {
        throw new Error('GEMINI_TIMEOUT_MS must be between 1 and 60000')
    }

    // Rate limit 검증
    if (config.rateLimitPerMinute <= 0 || config.rateLimitPerMinute > 300) {
        throw new Error('GEMINI_RATE_LIMIT must be between 1 and 300')
    }

    return config
}

export function validateEnvironment(): void {
    try {
        getGeminiConfig()
    } catch (error) {
        console.error('Gemini configuration validation failed:', error)
        throw error
    }
}

export const DEFAULT_CONFIG = {
    model: 'gemini-2.0-flash-001',
    maxTokens: 8192,
    timeout: 10000,
    debug: false,
    rateLimitPerMinute: 60
} as const
