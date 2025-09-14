'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DeleteNoteButton } from './delete-note-button'
import { HighlightText } from './highlight-text'
import { formatRelativeDate, getContentPreview } from '@/lib/notes/utils'
import { cn } from '@/lib/utils'
import type { Note } from '@/lib/db/schema/notes'

interface NoteCardProps {
    note: Note
    onDelete?: (noteId: string) => void
    searchQuery?: string
    className?: string
}

export function NoteCard({
    note,
    onDelete,
    searchQuery = '',
    className
}: NoteCardProps) {
    const [isDeleted, setIsDeleted] = useState(false)

    const handleDelete = () => {
        setIsDeleted(true)
        if (onDelete) {
            onDelete(note.id)
        }
    }

    if (isDeleted) {
        return null
    }

    return (
        <Card
            className={cn(
                'hover:shadow-lg transition-all duration-200 cursor-pointer h-full group',
                className
            )}
        >
            <Link href={`/notes/${note.id}`} className="block h-full">
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-lg line-clamp-2 flex-1">
                            <HighlightText
                                text={note.title}
                                highlight={searchQuery}
                            />
                        </CardTitle>
                        <div
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={e => e.preventDefault()}
                        >
                            <DeleteNoteButton
                                noteId={note.id}
                                noteTitle={note.title}
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onDelete={handleDelete}
                            />
                        </div>
                    </div>
                    <p className="text-sm text-gray-500">
                        {formatRelativeDate(note.updatedAt)}
                    </p>
                </CardHeader>
                <CardContent>
                    <HighlightText
                        text={getContentPreview(note.content)}
                        highlight={searchQuery}
                        className="text-gray-700 text-sm line-clamp-3"
                    />
                </CardContent>
            </Link>
        </Card>
    )
}
