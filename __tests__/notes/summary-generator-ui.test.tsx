import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { toast } from 'sonner'
import { SummaryGenerator } from '@/components/notes/summary-generator'
import {
    generateNoteSummary,
    updateNoteSummary,
    deleteNoteSummary,
    getNoteSummary
} from '@/lib/notes/summary-actions'
import type { Summary } from '@/lib/db/schema/notes'

// 모킹
jest.mock('sonner')
jest.mock('@/lib/notes/summary-actions')

const mockGenerateNoteSummary = generateNoteSummary as jest.MockedFunction<
    typeof generateNoteSummary
>
const mockUpdateNoteSummary = updateNoteSummary as jest.MockedFunction<
    typeof updateNoteSummary
>
const mockDeleteNoteSummary = deleteNoteSummary as jest.MockedFunction<
    typeof deleteNoteSummary
>
const mockGetNoteSummary = getNoteSummary as jest.MockedFunction<
    typeof getNoteSummary
>
const mockToast = toast as jest.MockedFunction<typeof toast>

describe('SummaryGenerator Component', () => {
    const mockNoteId = 'test-note-id'
    const mockSummary: Summary = {
        id: 'summary-id',
        noteId: mockNoteId,
        model: 'gemini-1.5-flash',
        content: '• 첫 번째 요점\n• 두 번째 요점\n• 세 번째 요점',
        createdAt: new Date('2024-01-01T10:00:00Z')
    }

    beforeEach(() => {
        jest.clearAllMocks()
        // Toast 모킹
        mockToast.success = jest.fn()
        mockToast.error = jest.fn()

        // getNoteSummary 기본 모킹 (요약 없음)
        mockGetNoteSummary.mockResolvedValue({
            success: false,
            error: '요약을 찾을 수 없습니다.'
        })
    })

    describe('초기 렌더링', () => {
        it('요약이 없을 때 기본 상태를 표시해야 한다', () => {
            render(<SummaryGenerator noteId={mockNoteId} />)

            expect(screen.getByText('AI 요약')).toBeInTheDocument()
            expect(screen.getByText('요약 생성')).toBeInTheDocument()
            expect(
                screen.getByText('AI가 이 노트의 핵심 내용을 요약해드립니다.')
            ).toBeInTheDocument()
        })

        it('기존 요약이 있을 때 요약 내용을 표시해야 한다', () => {
            render(
                <SummaryGenerator
                    noteId={mockNoteId}
                    initialSummary={mockSummary}
                />
            )

            // 멀티라인 텍스트는 부분 매칭으로 확인
            expect(
                screen.getByText('첫 번째 요점', { exact: false })
            ).toBeInTheDocument()
            expect(screen.getByText('재생성')).toBeInTheDocument()

            // SVG 아이콘이 있는 버튼들은 클래스로 확인
            const editButton = document
                .querySelector('.lucide-pen-line')
                ?.closest('button')
            expect(editButton).toBeInTheDocument()

            const deleteButton = document
                .querySelector('.lucide-trash2')
                ?.closest('button')
            expect(deleteButton).toBeInTheDocument()
        })
    })

    describe('요약 생성', () => {
        it('요약 생성 버튼을 클릭하면 요약이 생성되어야 한다', async () => {
            // Given
            mockGenerateNoteSummary.mockResolvedValue({
                success: true,
                summary: mockSummary
            })

            const mockOnUpdate = jest.fn()
            render(
                <SummaryGenerator
                    noteId={mockNoteId}
                    onSummaryUpdate={mockOnUpdate}
                />
            )

            // When
            fireEvent.click(screen.getByText('요약 생성'))

            // Then
            expect(screen.getByText('생성 중...')).toBeInTheDocument()

            await waitFor(() => {
                expect(mockGenerateNoteSummary).toHaveBeenCalledWith(mockNoteId)
                expect(mockToast.success).toHaveBeenCalledWith(
                    '요약이 생성되었습니다!'
                )
                expect(mockOnUpdate).toHaveBeenCalledWith(mockSummary)
            })
        })

        it('요약 생성이 실패하면 에러 메시지를 표시해야 한다', async () => {
            // Given
            mockGenerateNoteSummary.mockResolvedValue({
                success: false,
                error: '요약 생성 실패'
            })

            render(<SummaryGenerator noteId={mockNoteId} />)

            // When
            fireEvent.click(screen.getByText('요약 생성'))

            // Then
            await waitFor(() => {
                expect(mockToast.error).toHaveBeenCalledWith('요약 생성 실패')
            })
        })

        it('요약 재생성이 가능해야 한다', async () => {
            // Given
            const newSummary = { ...mockSummary, content: '• 새로운 요약 내용' }
            mockGenerateNoteSummary.mockResolvedValue({
                success: true,
                summary: newSummary
            })

            render(
                <SummaryGenerator
                    noteId={mockNoteId}
                    initialSummary={mockSummary}
                />
            )

            // When
            fireEvent.click(screen.getByText('재생성'))

            // Then
            await waitFor(() => {
                expect(mockGenerateNoteSummary).toHaveBeenCalledWith(mockNoteId)
                expect(mockToast.success).toHaveBeenCalledWith(
                    '요약이 생성되었습니다!'
                )
            })
        })
    })

    describe('요약 편집', () => {
        it('편집 버튼을 클릭하면 편집 모드로 전환되어야 한다', () => {
            render(
                <SummaryGenerator
                    noteId={mockNoteId}
                    initialSummary={mockSummary}
                />
            )

            // When
            const editButton = document
                .querySelector('.lucide-pen-line')
                ?.closest('button')
            fireEvent.click(editButton!)

            // Then
            const textarea = screen.getByRole('textbox')
            expect(textarea).toBeInTheDocument()
            expect(textarea).toHaveValue(mockSummary.content)
            expect(screen.getByText('저장')).toBeInTheDocument()
            expect(screen.getByText('취소')).toBeInTheDocument()
        })

        it('편집 내용을 저장할 수 있어야 한다', async () => {
            // Given
            const updatedContent = '• 수정된 요약 내용'
            const updatedSummary = { ...mockSummary, content: updatedContent }

            mockUpdateNoteSummary.mockResolvedValue({
                success: true,
                summary: updatedSummary
            })

            const mockOnUpdate = jest.fn()
            render(
                <SummaryGenerator
                    noteId={mockNoteId}
                    initialSummary={mockSummary}
                    onSummaryUpdate={mockOnUpdate}
                />
            )

            // When
            const editButton = document
                .querySelector('.lucide-pen-line')
                ?.closest('button')
            fireEvent.click(editButton!)

            const textarea = screen.getByRole('textbox')
            fireEvent.change(textarea, { target: { value: updatedContent } })
            fireEvent.click(screen.getByText('저장'))

            // Then
            await waitFor(() => {
                expect(mockUpdateNoteSummary).toHaveBeenCalledWith(
                    mockSummary.id,
                    updatedContent
                )
                expect(mockToast.success).toHaveBeenCalledWith(
                    '요약이 수정되었습니다!'
                )
                expect(mockOnUpdate).toHaveBeenCalledWith(updatedSummary)
            })
        })

        it('편집을 취소할 수 있어야 한다', () => {
            render(
                <SummaryGenerator
                    noteId={mockNoteId}
                    initialSummary={mockSummary}
                />
            )

            // When
            const editButton = document
                .querySelector('.lucide-pen-line')
                ?.closest('button')
            fireEvent.click(editButton!)
            fireEvent.click(screen.getByText('취소'))

            // Then
            expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
            expect(
                screen.getByText('첫 번째 요점', { exact: false })
            ).toBeInTheDocument()
        })
    })

    describe('요약 삭제', () => {
        it('삭제 버튼을 클릭하면 확인 후 요약이 삭제되어야 한다', async () => {
            // Given
            window.confirm = jest.fn(() => true)
            mockDeleteNoteSummary.mockResolvedValue({ success: true })

            const mockOnUpdate = jest.fn()
            render(
                <SummaryGenerator
                    noteId={mockNoteId}
                    initialSummary={mockSummary}
                    onSummaryUpdate={mockOnUpdate}
                />
            )

            // When
            const deleteButton = document
                .querySelector('.lucide-trash2')
                ?.closest('button')
            fireEvent.click(deleteButton!)

            // Then
            expect(window.confirm).toHaveBeenCalledWith(
                '요약을 삭제하시겠습니까?'
            )

            await waitFor(() => {
                expect(mockDeleteNoteSummary).toHaveBeenCalledWith(
                    mockSummary.id
                )
                expect(mockToast.success).toHaveBeenCalledWith(
                    '요약이 삭제되었습니다!'
                )
                expect(mockOnUpdate).toHaveBeenCalledWith(undefined)
            })
        })

        it('삭제 확인을 취소하면 삭제되지 않아야 한다', () => {
            // Given
            window.confirm = jest.fn(() => false)

            render(
                <SummaryGenerator
                    noteId={mockNoteId}
                    initialSummary={mockSummary}
                />
            )

            // When
            const deleteButton = document
                .querySelector('.lucide-trash2')
                ?.closest('button')
            fireEvent.click(deleteButton!)

            // Then
            expect(window.confirm).toHaveBeenCalled()
            expect(mockDeleteNoteSummary).not.toHaveBeenCalled()
        })
    })

    describe('로딩 상태', () => {
        it('요약 생성 중에는 버튼이 비활성화되어야 한다', async () => {
            // Given
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let resolvePromise: (value: any) => void
            const promise = new Promise(resolve => {
                resolvePromise = resolve
            })
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            mockGenerateNoteSummary.mockReturnValue(promise as any)

            render(<SummaryGenerator noteId={mockNoteId} />)

            // When
            fireEvent.click(screen.getByText('요약 생성'))

            // Then
            expect(screen.getByText('생성 중...')).toBeInTheDocument()
            expect(
                screen.getByRole('button', { name: /생성 중.../i })
            ).toBeDisabled()

            // Clean up
            resolvePromise!({ success: true, summary: mockSummary })
            await waitFor(() => {
                expect(screen.queryByText('생성 중...')).not.toBeInTheDocument()
            })
        })
    })
})
