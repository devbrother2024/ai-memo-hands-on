import { GeminiClient } from '@/lib/ai/gemini-client'
import { estimateTokens } from '@/lib/ai/utils'
import { GeminiError } from '@/lib/ai/errors'

interface SummaryGenerationOptions {
    maxTokens?: number
    bulletPoints?: { min: number; max: number }
}

interface SummaryResult {
    content: string
    tokensUsed: number
    model: string
}

/**
 * 노트 내용을 바탕으로 AI 요약을 생성합니다.
 */
export class SummaryGenerator {
    private geminiClient: GeminiClient

    constructor(geminiClient?: GeminiClient) {
        this.geminiClient = geminiClient || new GeminiClient()
    }

    /**
     * 노트 내용에서 3-6개 불릿 포인트 요약을 생성합니다.
     */
    async generateSummary(
        noteContent: string,
        options: SummaryGenerationOptions = {}
    ): Promise<SummaryResult> {
        const { maxTokens = 8000, bulletPoints = { min: 3, max: 6 } } = options

        // 입력 검증
        if (!noteContent || noteContent.trim().length === 0) {
            throw new Error('요약할 내용이 없습니다.')
        }

        // 토큰 제한 확인
        const inputTokens = estimateTokens(noteContent)
        if (inputTokens > maxTokens) {
            throw new Error(
                `내용이 너무 깁니다. 최대 ${maxTokens} 토큰까지 지원됩니다. (현재: ${inputTokens} 토큰)`
            )
        }

        try {
            const prompt = this.createSummaryPrompt(noteContent, bulletPoints)
            const result = await this.geminiClient.generateText(prompt)

            // 결과 검증
            const validatedSummary = this.validateSummaryQuality(
                result.text,
                bulletPoints
            )

            return {
                content: validatedSummary,
                tokensUsed: result.totalTokens,
                model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-001'
            }
        } catch (error) {
            if (error instanceof GeminiError) {
                throw new Error(
                    `AI 요약 생성 중 오류가 발생했습니다: ${error.message}`
                )
            }
            throw new Error('요약 생성 중 예상치 못한 오류가 발생했습니다.')
        }
    }

    /**
     * 요약 생성을 위한 프롬프트를 구성합니다.
     */
    private createSummaryPrompt(
        content: string,
        bulletPoints: { min: number; max: number }
    ): string {
        return `다음 노트 내용을 읽고 핵심 요점을 ${bulletPoints.min}-${bulletPoints.max}개의 불릿 포인트로 요약해주세요.

요약 규칙:
1. 각 불릿 포인트는 한 줄로 작성하세요
2. 불릿 포인트는 "• "로 시작하세요
3. 중요한 내용과 핵심 아이디어를 우선으로 포함하세요
4. 간결하고 명확하게 작성하세요
5. 원문의 의미를 왜곡하지 마세요

노트 내용:
${content}

요약:`
    }

    /**
     * 생성된 요약의 품질을 검증합니다.
     */
    private validateSummaryQuality(
        summary: string,
        bulletPoints: { min: number; max: number }
    ): string {
        if (!summary || summary.trim().length === 0) {
            throw new Error('빈 요약이 생성되었습니다.')
        }

        // 불릿 포인트 개수 확인
        const bulletLines = summary
            .split('\n')
            .filter(line => line.trim().startsWith('•'))

        if (bulletLines.length < bulletPoints.min) {
            throw new Error(
                `요약이 너무 짧습니다. 최소 ${bulletPoints.min}개의 요점이 필요합니다.`
            )
        }

        if (bulletLines.length > bulletPoints.max) {
            // 최대 개수를 초과하면 자동으로 잘라냄
            const trimmedSummary = bulletLines
                .slice(0, bulletPoints.max)
                .join('\n')
            return trimmedSummary
        }

        return summary.trim()
    }

    /**
     * 토큰 제한에 맞게 노트 내용을 자릅니다.
     */
    static truncateContentToTokenLimit(
        content: string,
        maxTokens: number = 8000
    ): string {
        const currentTokens = estimateTokens(content)

        if (currentTokens <= maxTokens) {
            return content
        }

        // 대략적인 비율로 자르기 (여유분 20% 추가)
        const ratio = (maxTokens * 0.8) / currentTokens
        const truncatedLength = Math.floor(content.length * ratio)

        return (
            content.substring(0, truncatedLength) +
            '...\n\n[내용이 길어 일부만 요약됩니다]'
        )
    }
}

// 기본 인스턴스 내보내기
export const summaryGenerator = new SummaryGenerator()
