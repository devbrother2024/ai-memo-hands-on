import { SummaryGenerator } from '@/lib/notes/summary-generator'
import { GeminiClient } from '@/lib/ai/gemini-client'
import { GeminiError, GeminiErrorType } from '@/lib/ai/errors'

// Gemini Client 모킹
jest.mock('@/lib/ai/gemini-client')
const MockedGeminiClient = GeminiClient as jest.MockedClass<typeof GeminiClient>

describe('SummaryGenerator', () => {
    let summaryGenerator: SummaryGenerator
    let mockGeminiClient: jest.Mocked<GeminiClient>

    beforeEach(() => {
        jest.clearAllMocks()

        // 모킹된 GeminiClient 인스턴스 생성
        mockGeminiClient = {
            generateText: jest.fn(),
            healthCheck: jest.fn()
        } as unknown as jest.Mocked<GeminiClient>

        // MockedGeminiClient의 생성자가 모킹된 인스턴스를 반환하도록 설정
        MockedGeminiClient.mockImplementation(() => mockGeminiClient)

        summaryGenerator = new SummaryGenerator(mockGeminiClient)
    })

    describe('generateSummary', () => {
        const sampleContent = `
        오늘 프로젝트 회의에서 다음과 같은 내용들이 논의되었습니다.
        
        1. 새로운 API 엔드포인트 개발 계획
        2. 데이터베이스 스키마 변경 사항
        3. 프론트엔드 UI 개선 방안
        4. 성능 최적화 전략
        5. 보안 강화 방안
        
        다음 주까지 각 팀에서 세부 계획을 수립하여 보고하기로 했습니다.
        `.trim()

        const mockApiResponse = {
            text: `• 프로젝트 회의에서 API 개발, DB 변경, UI 개선 등이 논의됨
• 성능 최적화와 보안 강화 방안도 함께 검토됨
• 다음 주까지 각 팀별 세부 계획 수립 예정`,
            inputTokens: 150,
            outputTokens: 50,
            totalTokens: 200,
            finishReason: 'STOP'
        }

        it('정상적인 요약을 생성해야 한다', async () => {
            // Given
            mockGeminiClient.generateText.mockResolvedValue(mockApiResponse)

            // When
            const result = await summaryGenerator.generateSummary(sampleContent)

            // Then
            expect(result).toEqual({
                content: mockApiResponse.text,
                tokensUsed: mockApiResponse.totalTokens,
                model: 'gemini-1.5-flash'
            })
            expect(mockGeminiClient.generateText).toHaveBeenCalledWith(
                expect.stringContaining(
                    '다음 노트 내용을 읽고 핵심 요점을 3-6개의 불릿 포인트로 요약해주세요'
                )
            )
        })

        it('빈 내용에 대해 에러를 발생시켜야 한다', async () => {
            // Given
            const emptyContent = ''

            // When & Then
            await expect(
                summaryGenerator.generateSummary(emptyContent)
            ).rejects.toThrow('요약할 내용이 없습니다.')
        })

        it('토큰 제한을 초과하면 에러를 발생시켜야 한다', async () => {
            // Given
            const longContent = 'A'.repeat(50000) // 매우 긴 내용
            const options = { maxTokens: 100 }

            // When & Then
            await expect(
                summaryGenerator.generateSummary(longContent, options)
            ).rejects.toThrow('내용이 너무 깁니다')
        })

        it('불릿 포인트가 최소 개수보다 적으면 에러를 발생시켜야 한다', async () => {
            // Given
            const insufficientResponse = {
                ...mockApiResponse,
                text: '• 하나의 요점만 있음'
            }
            mockGeminiClient.generateText.mockResolvedValue(
                insufficientResponse
            )

            // When & Then
            await expect(
                summaryGenerator.generateSummary(sampleContent)
            ).rejects.toThrow('요약이 너무 짧습니다')
        })

        it('불릿 포인트가 최대 개수를 초과하면 자동으로 잘라야 한다', async () => {
            // Given
            const excessiveResponse = {
                ...mockApiResponse,
                text: `• 첫 번째 요점
• 두 번째 요점
• 세 번째 요점
• 네 번째 요점
• 다섯 번째 요점
• 여섯 번째 요점
• 일곱 번째 요점
• 여덟 번째 요점`
            }
            mockGeminiClient.generateText.mockResolvedValue(excessiveResponse)

            // When
            const result = await summaryGenerator.generateSummary(sampleContent)

            // Then
            const bulletLines = result.content
                .split('\n')
                .filter(line => line.trim().startsWith('•'))
            expect(bulletLines.length).toBeLessThanOrEqual(6)
        })

        it('GeminiError가 발생하면 적절한 에러 메시지를 반환해야 한다', async () => {
            // Given
            const geminiError = new GeminiError(
                GeminiErrorType.API_KEY_INVALID,
                'API 호출 실패'
            )
            mockGeminiClient.generateText.mockRejectedValue(geminiError)

            // When & Then
            await expect(
                summaryGenerator.generateSummary(sampleContent)
            ).rejects.toThrow(
                'AI 요약 생성 중 오류가 발생했습니다: API 호출 실패'
            )
        })

        it('예상치 못한 에러가 발생하면 일반적인 에러 메시지를 반환해야 한다', async () => {
            // Given
            mockGeminiClient.generateText.mockRejectedValue(
                new Error('네트워크 오류')
            )

            // When & Then
            await expect(
                summaryGenerator.generateSummary(sampleContent)
            ).rejects.toThrow('요약 생성 중 예상치 못한 오류가 발생했습니다.')
        })

        it('커스텀 옵션으로 요약을 생성할 수 있어야 한다', async () => {
            // Given
            const customOptions = {
                maxTokens: 5000,
                bulletPoints: { min: 2, max: 4 }
            }
            const customResponse = {
                ...mockApiResponse,
                text: '• 첫 번째 요점\n• 두 번째 요점'
            }
            mockGeminiClient.generateText.mockResolvedValue(customResponse)

            // When
            const result = await summaryGenerator.generateSummary(
                sampleContent,
                customOptions
            )

            // Then
            expect(result.content).toBe(customResponse.text)
            expect(mockGeminiClient.generateText).toHaveBeenCalledWith(
                expect.stringContaining('2-4개의 불릿 포인트로 요약해주세요')
            )
        })
    })

    describe('truncateContentToTokenLimit', () => {
        it('토큰 제한 내의 내용은 그대로 반환해야 한다', () => {
            // Given
            const shortContent = '짧은 내용입니다.'

            // When
            const result = SummaryGenerator.truncateContentToTokenLimit(
                shortContent,
                1000
            )

            // Then
            expect(result).toBe(shortContent)
        })

        it('토큰 제한을 초과하는 내용은 잘라서 반환해야 한다', () => {
            // Given
            const longContent = 'A'.repeat(10000)

            // When
            const result = SummaryGenerator.truncateContentToTokenLimit(
                longContent,
                100
            )

            // Then
            expect(result.length).toBeLessThan(longContent.length)
            expect(result).toContain('[내용이 길어 일부만 요약됩니다]')
        })
    })

    describe('createSummaryPrompt', () => {
        it('적절한 프롬프트를 생성해야 한다', () => {
            // Given
            const content = '테스트 내용'
            const bulletPoints = { min: 3, max: 6 }

            // When
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const prompt = (summaryGenerator as any).createSummaryPrompt(
                content,
                bulletPoints
            )

            // Then
            expect(prompt).toContain('3-6개의 불릿 포인트로 요약해주세요')
            expect(prompt).toContain('테스트 내용')
            expect(prompt).toContain('• ')
        })
    })

    describe('validateSummaryQuality', () => {
        it('빈 요약에 대해 에러를 발생시켜야 한다', () => {
            // Given
            const emptySummary = ''
            const bulletPoints = { min: 3, max: 6 }

            // When & Then
            expect(() => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ;(summaryGenerator as any).validateSummaryQuality(
                    emptySummary,
                    bulletPoints
                )
            }).toThrow('빈 요약이 생성되었습니다.')
        })

        it('유효한 요약은 그대로 반환해야 한다', () => {
            // Given
            const validSummary = '• 첫 번째\n• 두 번째\n• 세 번째'
            const bulletPoints = { min: 3, max: 6 }

            // When
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = (summaryGenerator as any).validateSummaryQuality(
                validSummary,
                bulletPoints
            )

            // Then
            expect(result).toBe(validSummary.trim())
        })
    })
})
