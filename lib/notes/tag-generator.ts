import { GeminiClient } from '@/lib/ai/gemini-client'
import { estimateTokens } from '@/lib/ai/utils'
import { GeminiError } from '@/lib/ai/errors'

interface TagGenerationOptions {
    maxTokens?: number
    tagCount?: { min: number; max: number }
}

interface TagResult {
    tags: string[]
    tokensUsed: number
    model: string
}

export class NoteTagGenerator {
    private geminiClient: GeminiClient

    constructor(geminiClient?: GeminiClient) {
        this.geminiClient = geminiClient || new GeminiClient()
    }

    /**
     * 노트 내용을 기반으로 AI 태그를 생성합니다.
     * @param noteContent 태그를 생성할 노트 내용
     * @param options 태그 생성 옵션 (최대 토큰, 태그 개수 등)
     * @returns 생성된 태그 목록, 사용된 토큰 수, 모델명
     */
    async generateTags(
        noteContent: string,
        options: TagGenerationOptions = {}
    ): Promise<TagResult> {
        const { maxTokens = 8000, tagCount = { min: 3, max: 6 } } = options

        // 입력 검증
        if (!noteContent || noteContent.trim().length === 0) {
            throw new Error('태그를 생성할 내용이 없습니다.')
        }

        if (noteContent.trim().length < 50) {
            throw new Error(
                '태그 생성을 위해서는 최소 50자 이상의 내용이 필요합니다.'
            )
        }

        // 토큰 제한 확인
        const inputTokens = estimateTokens(noteContent)
        if (inputTokens > maxTokens) {
            throw new Error(
                `내용이 너무 깁니다. 최대 ${maxTokens} 토큰까지 지원됩니다. (현재: ${inputTokens} 토큰)`
            )
        }

        try {
            const prompt = this.createTagPrompt(noteContent, tagCount)
            const result = await this.geminiClient.generateText(prompt)

            // 결과에서 태그 추출 및 검증
            const tags = this.extractAndValidateTags(result.text, tagCount)

            return {
                tags,
                tokensUsed: result.totalTokens,
                model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-001' // TODO: 실제 사용된 모델명으로 변경
            }
        } catch (error) {
            if (error instanceof GeminiError) {
                throw new Error(
                    `AI 태그 생성 중 오류가 발생했습니다: ${error.message}`
                )
            }
            throw new Error('태그 생성 중 예상치 못한 오류가 발생했습니다.')
        }
    }

    /**
     * 태그 생성 프롬프트를 생성합니다.
     * @param content 노트 내용
     * @param tagCount 태그 개수 제한
     * @returns 생성된 프롬프트
     */
    private createTagPrompt(
        content: string,
        tagCount: { min: number; max: number }
    ): string {
        return `다음 노트 내용을 분석하여 ${tagCount.min}-${tagCount.max}개의 관련성 높은 태그를 생성해주세요.

규칙:
1. 각 태그는 한국어 또는 영어로 작성
2. 태그는 검색에 유용하고 일반적인 키워드 우선
3. 너무 구체적이거나 개인적인 정보는 피할 것
4. 중복되는 의미의 태그는 하나만 선택
5. 각 태그는 쉼표로 구분하여 나열

노트 내용:
${content}

태그 (쉼표로 구분):`
    }

    /**
     * AI 응답에서 태그를 추출하고 검증합니다.
     * @param responseText AI 응답 텍스트
     * @param tagCount 태그 개수 제한
     * @returns 검증된 태그 배열
     */
    private extractAndValidateTags(
        responseText: string,
        tagCount: { min: number; max: number }
    ): string[] {
        const rawText = responseText.trim()
        if (!rawText) {
            throw new Error('빈 태그 응답이 생성되었습니다.')
        }

        // 쉼표로 분리하고 정리
        let tags = rawText
            .split(',')
            .map(tag => this.normalizeTag(tag.trim()))
            .filter(tag => tag.length > 0 && tag.length <= 50) // 빈 태그나 너무 긴 태그 제거

        // 중복 제거 (대소문자 구분 없이)
        tags = this.removeDuplicates(tags)

        // 개수 제한 적용
        if (tags.length > tagCount.max) {
            tags = tags.slice(0, tagCount.max)
        }

        if (tags.length < tagCount.min) {
            console.warn(
                `생성된 태그 수가 최소 개수보다 적습니다. (생성: ${tags.length}개, 최소: ${tagCount.min}개)`
            )
        }

        return tags
    }

    /**
     * 태그 텍스트를 정규화합니다.
     * @param tag 원본 태그
     * @returns 정규화된 태그
     */
    private normalizeTag(tag: string): string {
        return tag
            .replace(/^[#\-\*\s]+/, '') // 앞의 특수문자 제거
            .replace(/[#\-\*\s]+$/, '') // 뒤의 특수문자 제거
            .replace(/\s+/g, ' ') // 연속 공백을 하나로
            .trim()
    }

    /**
     * 중복 태그를 제거합니다 (대소문자 구분 없음).
     * @param tags 태그 배열
     * @returns 중복이 제거된 태그 배열
     */
    private removeDuplicates(tags: string[]): string[] {
        const seen = new Set<string>()
        return tags.filter(tag => {
            const normalized = tag.toLowerCase()
            if (seen.has(normalized)) {
                return false
            }
            seen.add(normalized)
            return true
        })
    }

    /**
     * 콘텐츠를 토큰 제한에 맞춰 자릅니다.
     * @param content 원본 콘텐츠
     * @param maxTokens 최대 토큰 수
     * @returns 잘린 콘텐츠
     */
    static truncateContentToTokenLimit(
        content: string,
        maxTokens: number = 8000
    ): string {
        const currentTokens = estimateTokens(content)

        if (currentTokens <= maxTokens) {
            return content
        }

        // 대략적인 비율로 자르기
        const ratio = (maxTokens * 0.8) / currentTokens // 20% 여유분
        const truncatedLength = Math.floor(content.length * ratio)

        return (
            content.substring(0, truncatedLength) +
            '...\n\n[내용이 길어 일부만 태그 생성됩니다]'
        )
    }
}
