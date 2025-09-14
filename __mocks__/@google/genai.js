// Mock implementation of @google/genai for Jest tests

class MockGoogleGenAI {
    constructor(options = {}) {
        this.apiKey = options.apiKey || 'mock-api-key'
        this.models = {
            generateContent: jest.fn().mockResolvedValue({
                text: '• 첫 번째 테스트 요점\n• 두 번째 테스트 요점\n• 세 번째 테스트 요점',
                inputTokens: 10,
                outputTokens: 20,
                totalTokens: 30,
                finishReason: 'STOP'
            })
        }
    }
}

// ESM and CommonJS compatible export
const GoogleGenAI = MockGoogleGenAI

// CommonJS export
module.exports = {
    GoogleGenAI,
    HarmCategory: {
        HARM_CATEGORY_HATE_SPEECH: 'HARM_CATEGORY_HATE_SPEECH',
        HARM_CATEGORY_DANGEROUS_CONTENT: 'HARM_CATEGORY_DANGEROUS_CONTENT'
    },
    HarmBlockThreshold: {
        BLOCK_MEDIUM_AND_ABOVE: 'BLOCK_MEDIUM_AND_ABOVE'
    }
}

// ESM export
module.exports.default = { GoogleGenAI }
