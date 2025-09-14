/**
 * AI 관련 에러 정의
 */

export enum GeminiErrorType {
    API_KEY_INVALID = 'API_KEY_INVALID',
    QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
    TIMEOUT = 'TIMEOUT',
    CONTENT_FILTERED = 'CONTENT_FILTERED',
    NETWORK_ERROR = 'NETWORK_ERROR',
    RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
    INVALID_REQUEST = 'INVALID_REQUEST',
    UNKNOWN = 'UNKNOWN'
}

export class GeminiError extends Error {
    constructor(
        public type: GeminiErrorType,
        message: string,
        public originalError?: unknown
    ) {
        super(message)
        this.name = 'GeminiError'
    }

    static fromError(error: unknown): GeminiError {
        if (error instanceof GeminiError) {
            return error
        }

        // Narrow unknown safely
        const errObj = ((): {
            message?: string
            status?: number
            code?: string
        } => {
            if (typeof error === 'object' && error !== null) {
                const o = error as Record<string, unknown>
                return {
                    message:
                        typeof o.message === 'string' ? o.message : undefined,
                    status: typeof o.status === 'number' ? o.status : undefined,
                    code: typeof o.code === 'string' ? o.code : undefined
                }
            }
            return {}
        })()

        // API 키 관련 에러
        if (errObj.message?.includes('API key') || errObj.status === 401) {
            return new GeminiError(
                GeminiErrorType.API_KEY_INVALID,
                'Invalid API key provided',
                error
            )
        }

        // 할당량 초과 에러
        if (errObj.status === 429 || errObj.message?.includes('quota')) {
            return new GeminiError(
                GeminiErrorType.QUOTA_EXCEEDED,
                'API quota exceeded',
                error
            )
        }

        // 네트워크 에러
        if (errObj.code === 'ENOTFOUND' || errObj.code === 'ECONNREFUSED') {
            return new GeminiError(
                GeminiErrorType.NETWORK_ERROR,
                'Network connection failed',
                error
            )
        }

        // 타임아웃 에러
        if (
            errObj.code === 'ETIMEDOUT' ||
            errObj.message?.includes('timeout')
        ) {
            return new GeminiError(
                GeminiErrorType.TIMEOUT,
                'Request timeout',
                error
            )
        }

        // 컨텐츠 필터링 에러
        if (
            errObj.message?.includes('content filter') ||
            errObj.message?.includes('safety')
        ) {
            return new GeminiError(
                GeminiErrorType.CONTENT_FILTERED,
                'Content was filtered for safety reasons',
                error
            )
        }

        // 요청 형식 에러
        if (errObj.status === 400) {
            return new GeminiError(
                GeminiErrorType.INVALID_REQUEST,
                'Invalid request format',
                error
            )
        }

        // 기타 알 수 없는 에러
        return new GeminiError(
            GeminiErrorType.UNKNOWN,
            errObj.message || 'Unknown error occurred',
            error
        )
    }
}

export function isRetryableError(error: GeminiError): boolean {
    const retryableTypes = [
        GeminiErrorType.NETWORK_ERROR,
        GeminiErrorType.TIMEOUT,
        GeminiErrorType.RATE_LIMIT_EXCEEDED,
        GeminiErrorType.UNKNOWN
    ]

    return retryableTypes.includes(error.type)
}
