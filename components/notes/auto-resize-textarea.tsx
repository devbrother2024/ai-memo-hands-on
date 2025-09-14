'use client'

import * as React from 'react'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface AutoResizeTextareaProps
    extends Omit<
        React.TextareaHTMLAttributes<HTMLTextAreaElement>,
        'onChange'
    > {
    value: string
    onChange: (value: string) => void
    minRows?: number
    maxRows?: number
}

export const AutoResizeTextarea = React.forwardRef<
    HTMLTextAreaElement,
    AutoResizeTextareaProps
>(
    (
        { value, onChange, minRows = 3, maxRows = 20, className, ...props },
        ref
    ) => {
        const textareaRef = React.useRef<HTMLTextAreaElement>(null)

        // ref forwarding
        React.useImperativeHandle(ref, () => textareaRef.current!)

        const adjustHeight = React.useCallback(() => {
            const textarea = textareaRef.current
            if (!textarea) return

            // 높이를 초기화하여 정확한 scrollHeight 측정
            textarea.style.height = 'auto'

            const computed = window.getComputedStyle(textarea)
            const lineHeight = parseInt(computed.lineHeight)
            const paddingTop = parseInt(computed.paddingTop)
            const paddingBottom = parseInt(computed.paddingBottom)
            const borderTop = parseInt(computed.borderTopWidth)
            const borderBottom = parseInt(computed.borderBottomWidth)

            const minHeight =
                lineHeight * minRows +
                paddingTop +
                paddingBottom +
                borderTop +
                borderBottom
            const maxHeight =
                lineHeight * maxRows +
                paddingTop +
                paddingBottom +
                borderTop +
                borderBottom

            const scrollHeight = textarea.scrollHeight
            const newHeight = Math.max(
                minHeight,
                Math.min(maxHeight, scrollHeight)
            )

            textarea.style.height = `${newHeight}px`
        }, [minRows, maxRows])

        // value 변경 시 높이 조절
        React.useEffect(() => {
            adjustHeight()
        }, [value, adjustHeight])

        // 창 크기 변경 시 높이 재조정
        React.useEffect(() => {
            const handleResize = () => adjustHeight()
            window.addEventListener('resize', handleResize)
            return () => window.removeEventListener('resize', handleResize)
        }, [adjustHeight])

        const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            onChange(e.target.value)
        }

        return (
            <Textarea
                ref={textareaRef}
                value={value}
                onChange={handleChange}
                className={cn(
                    'resize-none overflow-hidden transition-[height] duration-150',
                    className
                )}
                {...props}
            />
        )
    }
)

AutoResizeTextarea.displayName = 'AutoResizeTextarea'
