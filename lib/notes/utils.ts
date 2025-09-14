export function getContentPreview(
    content: string | null | undefined,
    max = 150
) {
    const base = (content ?? '').trim()
    if (base.length === 0) return '내용이 없습니다.'
    if (base.length <= max) return base
    return base.slice(0, max) + '…'
}

export function formatRelativeDate(date: Date | string) {
    const d = typeof date === 'string' ? new Date(date) : date
    const diffMs = d.getTime() - Date.now()

    const rtf = new Intl.RelativeTimeFormat('ko', { numeric: 'auto' })

    const seconds = Math.round(diffMs / 1000)
    const minutes = Math.round(seconds / 60)
    const hours = Math.round(minutes / 60)
    const days = Math.round(hours / 24)
    const months = Math.round(days / 30)
    const years = Math.round(days / 365)

    if (Math.abs(seconds) < 60) return rtf.format(seconds, 'second')
    if (Math.abs(minutes) < 60) return rtf.format(minutes, 'minute')
    if (Math.abs(hours) < 24) return rtf.format(hours, 'hour')
    if (Math.abs(days) < 30) return rtf.format(days, 'day')
    if (Math.abs(months) < 12) return rtf.format(months, 'month')
    return rtf.format(years, 'year')
}
