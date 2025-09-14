import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
    // Provide the path to your Next.js app to load next.config.js and .env files
    dir: './'
})

// Add any custom config to be passed to Jest
const customJestConfig = {
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testEnvironment: 'jest-environment-jsdom',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
    testMatch: [
        '**/__tests__/**/*.(ts|tsx|js)',
        '**/*.(test|spec).(ts|tsx|js)'
    ],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
        '^@google/genai$': '<rootDir>/__mocks__/@google/genai.js'
    },
    collectCoverageFrom: [
        'lib/**/*.{ts,tsx}',
        'components/**/*.{ts,tsx}',
        '!lib/**/*.d.ts',
        '!**/*.stories.{ts,tsx}'
    ],
    coverageReporters: ['text', 'lcov', 'html'],
    testTimeout: 10000,
    transformIgnorePatterns: ['node_modules/(?!(sonner|lucide-react)/)']
}

export default createJestConfig(customJestConfig)
