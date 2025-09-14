// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

import '@testing-library/jest-dom'

// 환경변수 설정
process.env.GEMINI_API_KEY = 'test-api-key'
process.env.GEMINI_MODEL = 'gemini-2.0-flash-001'
process.env.GEMINI_MAX_TOKENS = '8192'
process.env.GEMINI_TIMEOUT_MS = '10000'
process.env.GEMINI_DEBUG = 'true'
process.env.GEMINI_RATE_LIMIT = '60'
process.env.NODE_ENV = 'test'

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    unobserve() {}
}

// Mock window.confirm
global.confirm = jest.fn()

// Mock navigator.platform
Object.defineProperty(navigator, 'platform', {
    writable: true,
    value: 'MacIntel'
})

// Mock TextEncoder/TextDecoder for Node.js compatibility
import { TextEncoder, TextDecoder } from 'util'
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock Request/Response for Next.js server actions
global.Request = class MockRequest {
    constructor(url, options = {}) {
        this.url = url
        this.method = options.method || 'GET'
        this.headers = new Map(Object.entries(options.headers || {}))
    }
}

global.Response = class MockResponse {
    constructor(body, options = {}) {
        this.body = body
        this.status = options.status || 200
        this.headers = new Map(Object.entries(options.headers || {}))
    }
}
