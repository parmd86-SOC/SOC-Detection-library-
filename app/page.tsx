'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, Database, Loader2 } from 'lucide-react'

interface LogSource {
  id: string
  name: string
  slug: string
  detectionCount: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [logSources, setLogSources] = useState<LogSource[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchLogSources()
  }, [])

  const fetchLogSources = async () => {
    try {
      const response = await fetch('/api/log-sources')
      const data = await response.json()
      setLogSources(data)
    } catch (error) {
      console.error('Error fetching log sources:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  const totalDetections = logSources.reduce((sum, ls) => sum + ls.detectionCount, 0)

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Detection Library</h1>
        <p className="text-gray-600">
          Browse {totalDetections.toLocaleString()} detection rules across {logSources.length} log sources
        </p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative max-w-2xl">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            type="text"
            placeholder="Search detections by name, description, MITRE technique, or log source..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-6 text-lg"
          />
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Try searching: "PowerShell", "T1059", "privilege escalation", "Windows Security"
        </p>
      </form>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Detections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalDetections.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Log Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{logSources.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Average per Source</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {logSources.length > 0 ? Math.round(totalDetections / logSources.length) : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Log Source Tiles */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Browse by Log Source</h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : logSources.length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-center">
            <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No log sources found</h3>
            <p className="text-gray-600">
              Import your detection rules to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {logSources.map((logSource) => (
            <Card
              key={logSource.id}
              className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-500"
              onClick={() => router.push(`/log-sources/${logSource.slug}`)}
            >
              <CardHeader>
                <CardTitle className="text-lg">{logSource.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-blue-600">
                    {logSource.detectionCount}
                  </span>
                  <span className="text-gray-600">
                    {logSource.detectionCount === 1 ? 'detection' : 'detections'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
