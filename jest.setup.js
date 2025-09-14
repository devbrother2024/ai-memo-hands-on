// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// 환경변수 설정
process.env.GEMINI_API_KEY = 'test-api-key'
process.env.GEMINI_MODEL = 'gemini-2.0-flash-001'
process.env.GEMINI_MAX_TOKENS = '8192'
process.env.GEMINI_TIMEOUT_MS = '10000'
process.env.GEMINI_DEBUG = 'true'
process.env.GEMINI_RATE_LIMIT = '60'
process.env.NODE_ENV = 'test'
