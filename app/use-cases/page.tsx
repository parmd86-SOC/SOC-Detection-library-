'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Search, Plus, Filter } from 'lucide-react'

interface UseCase {
  id: string
  use_case_code: string
  title: string
  description: string | null
  priority: string
  updated_at: string
  log_sources: any[]
  mitre_techniques: any[]
  queries: any[]
}

export default function UseCasesPage() {
  const router = useRouter()
  const [useCases, setUseCases] = useState<UseCase[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetchUseCases()
  }, [search, page])

  const fetchUseCases = async () => {
    try {
      const params = new URLSearchParams({
        search,
        page: page.toString(),
        limit: '20',
      })
      const response = await fetch(`/api/use-cases?${params}`)
      const data = await response.json()
      setUseCases(data.data)
    } catch (error) {
      console.error('Failed to fetch use cases:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200'
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'LOW': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Detection Library</h1>
            <p className="text-slate-600 mt-1">Manage security use cases and detections</p>
          </div>
          <Link href="/use-cases/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Use Case
            </Button>
          </Link>
        </div>

        <Card className="p-6 mb-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search by code, title, or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>
        </Card>

        {loading ? (
          <div className="text-center py-12 text-slate-600">Loading...</div>
        ) : (
          <div className="space-y-4">
            {useCases.map((useCase) => (
              <Card
                key={useCase.id}
                className="p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/use-cases/${useCase.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <code className="text-sm font-mono bg-slate-100 px-2 py-1 rounded">
                        {useCase.use_case_code}
                      </code>
                      <Badge className={getPriorityColor(useCase.priority)}>
                        {useCase.priority}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      {useCase.title}
                    </h3>
                    {useCase.description && (
                      <p className="text-slate-600 text-sm line-clamp-2 mb-3">
                        {useCase.description}
                      </p>
                    )}
                    <div className="flex gap-4 text-sm text-slate-500">
                      <span>{useCase.log_sources.length} log sources</span>
                      <span>{useCase.mitre_techniques.length} MITRE techniques</span>
                      <span>{useCase.queries.length} queries</span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400">
                    Updated {new Date(useCase.updated_at).toLocaleDateString()}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
