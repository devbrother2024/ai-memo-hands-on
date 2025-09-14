import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
    // Provide the path to your Next.js app to load next.config.js and .env files
    dir: './'
})

// Add any custom config to be passed to Jest
const customJestConfig = {
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testEnvironment: 'jest-environment-node',
    preset: 'ts-jest',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
    transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest'
    },
    testMatch: ['**/__tests__/**/*.(ts|js)', '**/*.(test|spec).(ts|js)'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1'
    },
    collectCoverageFrom: [
        'lib/**/*.{ts,tsx}',
        'components/**/*.{ts,tsx}',
        '!lib/**/*.d.ts',
        '!**/*.stories.{ts,tsx}'
    ],
    coverageReporters: ['text', 'lcov', 'html'],
    testTimeout: 10000
}

export default createJestConfig(customJestConfig)
