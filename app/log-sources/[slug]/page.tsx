'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Search, AlertCircle, Loader2 } from 'lucide-react'

interface Detection {
  id: string
  code: string
  name: string
  description: string | null
  priority: string
  logSources: Array<{ id: string; name: string }>
  mitreTechniques: Array<{ id: string; name: string }>
}

interface LogSourceDetail {
  logSource: {
    id: string
    name: string
    slug: string
    detectionCount: number
  }
  detections: Detection[]
}

export default function LogSourceDetailPage({ params }: { params: { slug: string } }) {
  const router = useRouter()
  const [data, setData] = useState<LogSourceDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchLogSourceDetails()
  }, [params.slug])

  const fetchLogSourceDetails = async () => {
    try {
      const response = await fetch(`/api/log-sources/${params.slug}`)
      if (!response.ok) {
        throw new Error('Log source not found')
      }
      const data = await response.json()
      setData(data)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load log source')
    } finally {
      setLoading(false)
    }
  }

  const filteredDetections = data?.detections.filter((d) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      d.name.toLowerCase().includes(query) ||
      d.code.toLowerCase().includes(query) ||
      d.description?.toLowerCase().includes(query) ||
      d.mitreTechniques.some(
        (mt) =>
          mt.id.toLowerCase().includes(query) ||
          mt.name.toLowerCase().includes(query)
      )
    )
  })

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'LOW':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="py-12">
          <CardContent className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Log Source Not Found</h3>
            <p className="text-gray-600 mb-4">{error || 'The requested log source could not be found.'}</p>
            <Button onClick={() => router.push('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-4xl font-bold mb-2">{data.logSource.name}</h1>
        <p className="text-gray-600">
          {data.logSource.detectionCount} {data.logSource.detectionCount === 1 ? 'detection' : 'detections'}
        </p>
      </div>

      {/* Search within this log source */}
      <div className="mb-6">
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            type="text"
            placeholder="Search within this log source..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {searchQuery && (
          <p className="text-sm text-gray-600 mt-2">
            Showing {filteredDetections?.length || 0} of {data.detections.length} detections
          </p>
        )}
      </div>

      {/* Detections List */}
      {filteredDetections && filteredDetections.length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-center">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No detections found</h3>
            <p className="text-gray-600">
              {searchQuery
                ? `No detections match "${searchQuery}"`
                : 'This log source has no detections yet.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredDetections?.map((detection) => (
            <Card
              key={detection.id}
              className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-500"
              onClick={() => router.push(`/detections/${detection.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-gray-500 font-mono">{detection.code}</span>
                      <Badge className={getPriorityColor(detection.priority)}>
                        {detection.priority}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl">{detection.name}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {detection.description && (
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {detection.description}
                  </p>
                )}
                
                {/* MITRE Techniques */}
                {detection.mitreTechniques.length > 0 && (
                  <div className="mb-3">
                    <span className="text-sm font-medium text-gray-700 mr-2">MITRE:</span>
                    <div className="inline-flex flex-wrap gap-2">
                      {detection.mitreTechniques.map((tech) => (
                        <Badge key={tech.id} variant="outline" className="bg-purple-50">
                          {tech.id} - {tech.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Other Log Sources */}
                {detection.logSources.length > 1 && (
                  <div>
                    <span className="text-sm font-medium text-gray-700 mr-2">Also in:</span>
                    <div className="inline-flex flex-wrap gap-2">
                      {detection.logSources
                        .filter((ls) => ls.name !== data.logSource.name)
                        .map((ls) => (
                          <Badge key={ls.id} variant="outline" className="bg-blue-50">
                            {ls.name}
                          </Badge>
                        ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
