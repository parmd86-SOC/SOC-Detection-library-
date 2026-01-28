'use client'

import { Suspense } from 'react'
import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Search, Loader2, Filter, X } from 'lucide-react'
import { debounce } from '@/lib/utils'

interface Detection {
  id: string
  code: string
  name: string
  description: string | null
  priority: string
  logSources: Array<{ id: string; name: string; slug: string }>
  mitreTechniques: Array<{ id: string; name: string }>
}

interface SearchResult {
  results: Detection[]
  count: number
  query: string
}

function SearchPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''

  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [results, setResults] = useState<Detection[]>([])
  const [loading, setLoading] = useState(false)
  const [count, setCount] = useState(0)
  const [sort, setSort] = useState('newest')
  const [logSourceFilter, setLogSourceFilter] = useState<string[]>([])
  const [mitreFilter, setMitreFilter] = useState<string[]>([])

  // Debounced search function
  const performSearch = useCallback(
    debounce(async (query: string, sortBy: string, logSources: string[], mitre: string[]) => {
      if (!query.trim()) {
        setResults([])
        setCount(0)
        return
      }

      setLoading(true)
      try {
        const params = new URLSearchParams({
          q: query,
          sort: sortBy,
        })
        
        if (logSources.length > 0) {
          params.append('logSources', logSources.join(','))
        }
        if (mitre.length > 0) {
          params.append('mitre', mitre.join(','))
        }

        const response = await fetch(`/api/search?${params}`)
        const data: SearchResult = await response.json()
        setResults(data.results)
        setCount(data.count)
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setLoading(false)
      }
    }, 300),
    []
  )

  useEffect(() => {
    performSearch(searchQuery, sort, logSourceFilter, mitreFilter)
  }, [searchQuery, sort, logSourceFilter, mitreFilter, performSearch])

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

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text
    const parts = text.split(new RegExp(`(${query})`, 'gi'))
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <mark key={i} className="bg-yellow-200">{part}</mark>
        : part
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
        <h1 className="text-4xl font-bold mb-2">Search Detections</h1>
        {count > 0 && (
          <p className="text-gray-600">
            Found {count} {count === 1 ? 'result' : 'results'} for "{searchQuery}"
          </p>
        )}
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            type="text"
            placeholder="Search detections by name, description, MITRE technique, or log source..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-6 text-lg"
            autoFocus
          />
        </div>
      </div>

      {/* Filters and Sort */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Sort By
          </label>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="name-asc">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z-A)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Active Filters */}
        {(logSourceFilter.length > 0 || mitreFilter.length > 0) && (
          <div className="w-full">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Active Filters
            </label>
            <div className="flex flex-wrap gap-2">
              {logSourceFilter.map((filter) => (
                <Badge key={filter} variant="outline" className="gap-2">
                  {filter}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setLogSourceFilter((prev) => prev.filter((f) => f !== filter))}
                  />
                </Badge>
              ))}
              {mitreFilter.map((filter) => (
                <Badge key={filter} variant="outline" className="gap-2 bg-purple-50">
                  {filter}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setMitreFilter((prev) => prev.filter((f) => f !== filter))}
                  />
                </Badge>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setLogSourceFilter([])
                  setMitreFilter([])
                }}
              >
                Clear All
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : !searchQuery.trim() ? (
        <Card className="py-12">
          <CardContent className="text-center">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Start typing to search</h3>
            <p className="text-gray-600">
              Search across detection names, descriptions, MITRE techniques, and log sources
            </p>
          </CardContent>
        </Card>
      ) : results.length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-center">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No results found</h3>
            <p className="text-gray-600">
              Try a different search term or adjust your filters
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {results.map((detection) => (
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
                    <CardTitle className="text-xl">
                      {highlightMatch(detection.name, searchQuery)}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {detection.description && (
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {highlightMatch(detection.description, searchQuery)}
                  </p>
                )}
                
                {/* MITRE Techniques */}
                {detection.mitreTechniques.length > 0 && (
                  <div className="mb-3">
                    <span className="text-sm font-medium text-gray-700 mr-2">MITRE:</span>
                    <div className="inline-flex flex-wrap gap-2">
                      {detection.mitreTechniques.map((tech) => (
                        <Badge 
                          key={tech.id} 
                          variant="outline" 
                          className="bg-purple-50 cursor-pointer hover:bg-purple-100"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (!mitreFilter.includes(tech.id)) {
                              setMitreFilter([...mitreFilter, tech.id])
                            }
                          }}
                        >
                          {tech.id} - {tech.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Log Sources */}
                {detection.logSources.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-700 mr-2">Log Sources:</span>
                    <div className="inline-flex flex-wrap gap-2">
                      {detection.logSources.map((ls) => (
                        <Badge 
                          key={ls.id} 
                          variant="outline" 
                          className="bg-blue-50 cursor-pointer hover:bg-blue-100"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (!logSourceFilter.includes(ls.name)) {
                              setLogSourceFilter([...logSourceFilter, ls.name])
                            }
                          }}
                        >
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

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  )
}
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''

  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [results, setResults] = useState<Detection[]>([])
  const [loading, setLoading] = useState(false)
  const [count, setCount] = useState(0)
  const [sort, setSort] = useState('newest')
  const [logSourceFilter, setLogSourceFilter] = useState<string[]>([])
  const [mitreFilter, setMitreFilter] = useState<string[]>([])

  // Debounced search function
  const performSearch = useCallback(
    debounce(async (query: string, sortBy: string, logSources: string[], mitre: string[]) => {
      if (!query.trim()) {
        setResults([])
        setCount(0)
        return
      }

      setLoading(true)
      try {
        const params = new URLSearchParams({
          q: query,
          sort: sortBy,
        })
        
        if (logSources.length > 0) {
          params.append('logSources', logSources.join(','))
        }
        if (mitre.length > 0) {
          params.append('mitre', mitre.join(','))
        }

        const response = await fetch(`/api/search?${params}`)
        const data: SearchResult = await response.json()
        setResults(data.results)
        setCount(data.count)
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setLoading(false)
      }
    }, 300),
    []
  )

  useEffect(() => {
    performSearch(searchQuery, sort, logSourceFilter, mitreFilter)
  }, [searchQuery, sort, logSourceFilter, mitreFilter, performSearch])

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

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text
    const parts = text.split(new RegExp(`(${query})`, 'gi'))
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <mark key={i} className="bg-yellow-200">{part}</mark>
        : part
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
        <h1 className="text-4xl font-bold mb-2">Search Detections</h1>
        {count > 0 && (
          <p className="text-gray-600">
            Found {count} {count === 1 ? 'result' : 'results'} for "{searchQuery}"
          </p>
        )}
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            type="text"
            placeholder="Search detections by name, description, MITRE technique, or log source..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-6 text-lg"
            autoFocus
          />
        </div>
      </div>

      {/* Filters and Sort */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Sort By
          </label>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="name-asc">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z-A)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Active Filters */}
        {(logSourceFilter.length > 0 || mitreFilter.length > 0) && (
          <div className="w-full">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Active Filters
            </label>
            <div className="flex flex-wrap gap-2">
              {logSourceFilter.map((filter) => (
                <Badge key={filter} variant="outline" className="gap-2">
                  {filter}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setLogSourceFilter((prev) => prev.filter((f) => f !== filter))}
                  />
                </Badge>
              ))}
              {mitreFilter.map((filter) => (
                <Badge key={filter} variant="outline" className="gap-2 bg-purple-50">
                  {filter}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setMitreFilter((prev) => prev.filter((f) => f !== filter))}
                  />
                </Badge>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setLogSourceFilter([])
                  setMitreFilter([])
                }}
              >
                Clear All
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : !searchQuery.trim() ? (
        <Card className="py-12">
          <CardContent className="text-center">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Start typing to search</h3>
            <p className="text-gray-600">
              Search across detection names, descriptions, MITRE techniques, and log sources
            </p>
          </CardContent>
        </Card>
      ) : results.length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-center">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No results found</h3>
            <p className="text-gray-600">
              Try a different search term or adjust your filters
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {results.map((detection) => (
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
                    <CardTitle className="text-xl">
                      {highlightMatch(detection.name, searchQuery)}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {detection.description && (
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {highlightMatch(detection.description, searchQuery)}
                  </p>
                )}
                
                {/* MITRE Techniques */}
                {detection.mitreTechniques.length > 0 && (
                  <div className="mb-3">
                    <span className="text-sm font-medium text-gray-700 mr-2">MITRE:</span>
                    <div className="inline-flex flex-wrap gap-2">
                      {detection.mitreTechniques.map((tech) => (
                        <Badge 
                          key={tech.id} 
                          variant="outline" 
                          className="bg-purple-50 cursor-pointer hover:bg-purple-100"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (!mitreFilter.includes(tech.id)) {
                              setMitreFilter([...mitreFilter, tech.id])
                            }
                          }}
                        >
                          {tech.id} - {tech.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Log Sources */}
                {detection.logSources.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-700 mr-2">Log Sources:</span>
                    <div className="inline-flex flex-wrap gap-2">
                      {detection.logSources.map((ls) => (
                        <Badge 
                          key={ls.id} 
                          variant="outline" 
                          className="bg-blue-50 cursor-pointer hover:bg-blue-100"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (!logSourceFilter.includes(ls.name)) {
                              setLogSourceFilter([...logSourceFilter, ls.name])
                            }
                          }}
                        >
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
