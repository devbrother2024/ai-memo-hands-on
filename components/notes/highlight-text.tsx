interface HighlightTextProps {
    text: string
    highlight: string
    className?: string
}

export function HighlightText({
    text,
    highlight,
    className = ''
}: HighlightTextProps) {
    if (!highlight.trim()) {
        return <span className={className}>{text}</span>
    }

    // 대소문자 무시하고 검색어를 찾기 위한 정규식
    const regex = new RegExp(
        `(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
        'gi'
    )
    const parts = text.split(regex)

    return (
        <span className={className}>
            {parts.map((part, index) => {
                // 정규식에 매치되는 부분인지 확인
                if (regex.test(part)) {
                    return (
                        <mark
                            key={index}
                            className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded"
                        >
                            {part}
                        </mark>
                    )
                }
                return part
            })}
        </span>
    )
}
