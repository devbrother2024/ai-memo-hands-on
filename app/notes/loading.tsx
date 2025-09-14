import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <div className="h-8 w-40 bg-gray-200 rounded-md animate-pulse" />
                        <div className="h-4 w-24 bg-gray-200 rounded-md mt-2 animate-pulse" />
                    </div>
                    <div className="h-10 w-28 bg-gray-200 rounded-md animate-pulse" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, idx) => (
                        <Card key={idx}>
                            <CardHeader className="pb-3">
                                <CardTitle>
                                    <Skeleton className="h-5 w-3/4" />
                                </CardTitle>
                                <Skeleton className="h-4 w-24 mt-2" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-4 w-full mb-2" />
                                <Skeleton className="h-4 w-5/6 mb-2" />
                                <Skeleton className="h-4 w-4/6" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    )
}
