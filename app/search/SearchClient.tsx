'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Search, Loader2, X } from 'lucide-react'

interface Detection {
  id: string
  code: string
  name: string
  description: string | null
  priority: string
  logSources: Array<{ id: string; name: string; slug: string }>
  mitreTechniques: Array<{ id: string; name: string }>
}

export default function SearchClient() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<Detection[]>([])
  const [loading, setLoading] = useState(false)
  const [count, setCount] = useState(0)
  const [sort, setSort] = useState('newest')
  const [logSourceFilter, setLogSourceFilter] = useState<string[]>([])
  const [mitreFilter, setMitreFilter] = useState<string[]>([])

  const performSearch = async () => {
    if (!searchQuery.trim()) {
      setResults([])
      setCount(0)
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        sort,
      })

      if (logSourceFilter.length > 0) {
        params.append('logSources', logSourceFilter.join(','))
      }
      if (mitreFilter.length > 0) {
        params.append('mitre', mitreFilter.join(','))
      }

      const response = await fetch(`/api/search?${params}`)
      const data = await response.json()
      setResults(data.results)
      setCount(data.count)
    } catch (err) {
      console.error('Search error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const t = setTimeout(performSearch, 300)
    return () => clearTimeout(t)
  }, [searchQuery, sort, logSourceFilter, mitreFilter])

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

  return (
    <div className="container mx-auto py-8 px-4">
      <Button variant="ghost" onClick={() => router.push('/')} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Dashboard
      </Button>

      <h1 className="text-4xl font-bold mb-6">Search Detections</h1>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search detections…"
          className="pl-10 py-6 text-lg"
          autoFocus
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : results.length === 0 ? (
        <p className="text-gray-500 text-center">No results</p>
      ) : (
        <div className="space-y-4">
          {results.map((d) => (
            <Card key={d.id} onClick={() => router.push(`/detections/${d.id}`)} className="cursor-pointer">
              <CardHeader>
                <CardTitle>{d.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className={getPriorityColor(d.priority)}>{d.priority}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
