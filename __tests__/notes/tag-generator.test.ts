import { NoteTagGenerator } from '@/lib/notes/tag-generator'
import { GeminiClient } from '@/lib/ai/gemini-client'
import { GeminiError, GeminiErrorType } from '@/lib/ai/errors'
import { estimateTokens } from '@/lib/ai/utils'

// 모킹
jest.mock('@/lib/ai/gemini-client')
jest.mock('@/lib/ai/utils')

const mockGeminiClient = GeminiClient as jest.MockedClass<typeof GeminiClient>
const mockEstimateTokens = estimateTokens as jest.MockedFunction<
    typeof estimateTokens
>

describe('NoteTagGenerator', () => {
    let tagGenerator: NoteTagGenerator
    let mockClient: jest.Mocked<GeminiClient>

    beforeEach(() => {
        jest.clearAllMocks()

        // GeminiClient 모킹
        mockClient = {
            generateText: jest.fn(),
            getConfig: jest.fn(),
            isRateLimited: jest.fn(),
            healthCheck: jest.fn(),
            getRateLimitStatus: jest.fn()
        } as unknown as jest.Mocked<GeminiClient>

        mockGeminiClient.mockImplementation(() => mockClient)
        tagGenerator = new NoteTagGenerator()

        // estimateTokens 모킹
        mockEstimateTokens.mockReturnValue(100)
    })

    describe('generateTags', () => {
        const sampleContent =
            '이것은 인공지능과 머신러닝에 대한 노트입니다. 딥러닝 알고리즘과 신경망에 대해 설명합니다.'

        it('정상적으로 태그를 생성해야 한다', async () => {
            // Given
            const mockResponse = {
                text: '인공지능, 머신러닝, 딥러닝, 신경망, 알고리즘',
                inputTokens: 20,
                outputTokens: 30,
                totalTokens: 50,
                finishReason: 'STOP'
            }
            mockClient.generateText.mockResolvedValue(mockResponse)

            // When
            const result = await tagGenerator.generateTags(sampleContent)

            // Then
            expect(result.tags).toEqual([
                '인공지능',
                '머신러닝',
                '딥러닝',
                '신경망',
                '알고리즘'
            ])
            expect(result.tokensUsed).toBe(50)
            expect(result.model).toBe('gemini-2.0-flash-001')
        })

        it('빈 내용에 대해 에러를 발생시켜야 한다', async () => {
            // Given
            const emptyContent = ''

            // When & Then
            await expect(
                tagGenerator.generateTags(emptyContent)
            ).rejects.toThrow('태그를 생성할 내용이 없습니다.')
        })

        it('50자 미만의 내용에 대해 에러를 발생시켜야 한다', async () => {
            // Given
            const shortContent = '짧은 내용'

            // When & Then
            await expect(
                tagGenerator.generateTags(shortContent)
            ).rejects.toThrow(
                '태그 생성을 위해서는 최소 50자 이상의 내용이 필요합니다.'
            )
        })

        it('토큰 제한을 초과하면 에러를 발생시켜야 한다', async () => {
            // Given
            mockEstimateTokens.mockReturnValue(9000)

            // When & Then
            await expect(
                tagGenerator.generateTags(sampleContent, { maxTokens: 8000 })
            ).rejects.toThrow('내용이 너무 깁니다.')
        })

        it('Gemini API 에러를 적절히 처리해야 한다', async () => {
            // Given
            const geminiError = new GeminiError(
                GeminiErrorType.INVALID_REQUEST,
                'API 에러'
            )
            mockClient.generateText.mockRejectedValue(geminiError)

            // When & Then
            await expect(
                tagGenerator.generateTags(sampleContent)
            ).rejects.toThrow('AI 태그 생성 중 오류가 발생했습니다')
        })

        it('예상치 못한 에러를 적절히 처리해야 한다', async () => {
            // Given
            mockClient.generateText.mockRejectedValue(
                new Error('Unknown error')
            )

            // When & Then
            await expect(
                tagGenerator.generateTags(sampleContent)
            ).rejects.toThrow('태그 생성 중 예상치 못한 오류가 발생했습니다.')
        })
    })

    describe('extractAndValidateTags', () => {
        it('쉼표로 구분된 태그를 올바르게 추출해야 한다', () => {
            // Given
            const responseText = '인공지능, 머신러닝, 딥러닝'
            const tagCount = { min: 2, max: 5 }

            // When
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = (tagGenerator as any).extractAndValidateTags(
                responseText,
                tagCount
            )

            // Then
            expect(result).toEqual(['인공지능', '머신러닝', '딥러닝'])
        })

        it('중복 태그를 제거해야 한다', () => {
            // Given
            const responseText =
                '인공지능, AI, 머신러닝, 인공지능, ML, 머신러닝'
            const tagCount = { min: 2, max: 10 }

            // When
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = (tagGenerator as any).extractAndValidateTags(
                responseText,
                tagCount
            )

            // Then
            expect(result).toEqual(['인공지능', 'AI', '머신러닝', 'ML'])
        })

        it('특수문자를 포함한 태그를 정규화해야 한다', () => {
            // Given
            const responseText = '#인공지능, -머신러닝, *딥러닝*'
            const tagCount = { min: 2, max: 5 }

            // When
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = (tagGenerator as any).extractAndValidateTags(
                responseText,
                tagCount
            )

            // Then
            expect(result).toEqual(['인공지능', '머신러닝', '딥러닝'])
        })

        it('최대 개수를 초과하는 태그를 자동으로 잘라야 한다', () => {
            // Given
            const responseText =
                '태그1, 태그2, 태그3, 태그4, 태그5, 태그6, 태그7'
            const tagCount = { min: 2, max: 5 }

            // When
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = (tagGenerator as any).extractAndValidateTags(
                responseText,
                tagCount
            )

            // Then
            expect(result).toHaveLength(5)
            expect(result).toEqual([
                '태그1',
                '태그2',
                '태그3',
                '태그4',
                '태그5'
            ])
        })

        it('빈 응답에 대해 에러를 발생시켜야 한다', () => {
            // Given
            const emptyResponse = ''
            const tagCount = { min: 2, max: 5 }

            // When & Then
            expect(() => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ;(tagGenerator as any).extractAndValidateTags(
                    emptyResponse,
                    tagCount
                )
            }).toThrow('빈 태그 응답이 생성되었습니다.')
        })
    })

    describe('normalizeTag', () => {
        it('앞뒤 특수문자를 제거해야 한다', () => {
            // Given
            const tag = '#인공지능*'

            // When
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = (tagGenerator as any).normalizeTag(tag)

            // Then
            expect(result).toBe('인공지능')
        })

        it('연속 공백을 하나로 변환해야 한다', () => {
            // Given
            const tag = '머신   러닝'

            // When
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = (tagGenerator as any).normalizeTag(tag)

            // Then
            expect(result).toBe('머신 러닝')
        })
    })

    describe('removeDuplicates', () => {
        it('대소문자 구분 없이 중복을 제거해야 한다', () => {
            // Given
            const tags = [
                'AI',
                'ai',
                'Ai',
                'Machine Learning',
                'machine learning'
            ]

            // When
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = (tagGenerator as any).removeDuplicates(tags)

            // Then
            expect(result).toEqual(['AI', 'Machine Learning'])
        })
    })

    describe('truncateContentToTokenLimit', () => {
        it('토큰 제한 내의 내용은 그대로 반환해야 한다', () => {
            // Given
            mockEstimateTokens.mockReturnValue(5000)
            const content = '적당한 길이의 내용'

            // When
            const result = NoteTagGenerator.truncateContentToTokenLimit(
                content,
                8000
            )

            // Then
            expect(result).toBe(content)
        })

        it('토큰 제한을 초과하는 내용은 잘라야 한다', () => {
            // Given
            mockEstimateTokens.mockReturnValue(10000)
            const content = '매우 긴 내용'.repeat(100)

            // When
            const result = NoteTagGenerator.truncateContentToTokenLimit(
                content,
                8000
            )

            // Then
            expect(result).toContain('...')
            expect(result).toContain('[내용이 길어 일부만 태그 생성됩니다]')
            expect(result.length).toBeLessThan(content.length)
        })
    })
})
