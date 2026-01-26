'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Save, Trash2, ArrowLeft } from 'lucide-react'

export default function UseCaseDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [useCase, setUseCase] = useState<any>(null)
  const [logSources, setLogSources] = useState<any[]>([])
  const [allLogSources, setAllLogSources] = useState<any[]>([])
  const [techniques, setTechniques] = useState<any[]>([])
  const [searchTechnique, setSearchTechnique] = useState('')
  const [availableTechniques, setAvailableTechniques] = useState<any[]>([])
  const [queries, setQueries] = useState({
    SENTINEL: '',
    CHRONICLE: '',
    OTHER: '',
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUseCase()
    fetchAllLogSources()
  }, [params.id])

  const fetchUseCase = async () => {
    try {
      const response = await fetch(`/api/use-cases/${params.id}`)
      const data = await response.json()
      setUseCase(data)
      setLogSources(data.log_sources?.map((ls: any) => ls.log_source) || [])
      setTechniques(data.mitre_techniques?.map((mt: any) => mt.technique) || [])
      
      const queriesMap: any = {}
      data.queries?.forEach((q: any) => {
        queriesMap[q.siem_type] = q.query_text
      })
      setQueries({ ...queries, ...queriesMap })
    } catch (error) {
      console.error('Failed to fetch use case:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAllLogSources = async () => {
    try {
      const response = await fetch('/api/log-sources')
      const data = await response.json()
      setAllLogSources(data)
    } catch (error) {
      console.error('Failed to fetch log sources:', error)
    }
  }

  const searchTechniques = async (query: string) => {
    if (!query) {
      setAvailableTechniques([])
      return
    }
    try {
      const response = await fetch(`/api/mitre/techniques?search=${query}`)
      const data = await response.json()
      setAvailableTechniques(data)
    } catch (error) {
      console.error('Failed to search techniques:', error)
    }
  }

  const handleSaveBasicInfo = async () => {
    try {
      const response = await fetch(`/api/use-cases/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: useCase.title,
          description: useCase.description,
          investigation_guide: useCase.investigation_guide,
          priority: useCase.priority,
        }),
      })
      if (response.ok) {
        alert('Saved successfully')
        fetchUseCase()
      }
    } catch (error) {
      console.error('Failed to save:', error)
    }
  }

  const handleSaveLogSources = async () => {
    try {
      const response = await fetch(`/api/use-cases/${params.id}/log-sources`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          log_source_ids: logSources.map((ls) => ls.id),
        }),
      })
      if (response.ok) alert('Log sources saved')
    } catch (error) {
      console.error('Failed to save log sources:', error)
    }
  }

  const handleSaveMitre = async () => {
    try {
      const response = await fetch(`/api/use-cases/${params.id}/mitre`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          technique_ids: techniques.map((t) => t.technique_id),
        }),
      })
      if (response.ok) alert('MITRE techniques saved')
    } catch (error) {
      console.error('Failed to save MITRE:', error)
    }
  }

  const handleSaveQueries = async () => {
    try {
      const queriesArray = Object.entries(queries)
        .filter(([_, text]) => text)
        .map(([siem_type, query_text]) => ({ siem_type, query_text }))

      const response = await fetch(`/api/use-cases/${params.id}/queries`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queries: queriesArray }),
      })
      if (response.ok) alert('Queries saved')
    } catch (error) {
      console.error('Failed to save queries:', error)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this use case?')) return
    
    try {
      const response = await fetch(`/api/use-cases/${params.id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        router.push('/use-cases')
      }
    } catch (error) {
      console.error('Failed to delete:', error)
    }
  }

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <code className="text-sm font-mono bg-slate-100 px-2 py-1 rounded">
                  {useCase?.use_case_code}
                </code>
                <Badge>{useCase?.priority}</Badge>
              </div>
              <h1 className="text-3xl font-bold text-slate-900">{useCase?.title}</h1>
            </div>
          </div>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="log-sources">Log Sources</TabsTrigger>
            <TabsTrigger value="mitre">MITRE Mapping</TabsTrigger>
            <TabsTrigger value="queries">Queries</TabsTrigger>
            <TabsTrigger value="guidance">Investigation Guide</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={useCase?.title || ''}
                    onChange={(e) => setUseCase({ ...useCase, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={useCase?.priority}
                    onValueChange={(value) => setUseCase({ ...useCase, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="CRITICAL">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    rows={6}
                    value={useCase?.description || ''}
                    onChange={(e) => setUseCase({ ...useCase, description: e.target.value })}
                  />
                </div>
                <Button onClick={handleSaveBasicInfo}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="log-sources">
            <Card>
              <CardHeader>
                <CardTitle>Associated Log Sources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {allLogSources.map((source) => (
                    <label key={source.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={logSources.some((ls) => ls.id === source.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setLogSources([...logSources, source])
                          } else {
                            setLogSources(logSources.filter((ls) => ls.id !== source.id))
                          }
                        }}
                      />
                      {source.name}
                    </label>
                  ))}
                </div>
                <Button onClick={handleSaveLogSources}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Log Sources
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mitre">
            <Card>
              <CardHeader>
                <CardTitle>MITRE ATT&CK Techniques</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Search Techniques</Label>
                  <Input
                    placeholder="Search by ID or name..."
                    value={searchTechnique}
                    onChange={(e) => {
                      setSearchTechnique(e.target.value)
                      searchTechniques(e.target.value)
                    }}
                  />
                  {availableTechniques.length > 0 && (
                    <div className="border rounded-md max-h-48 overflow-y-auto">
                      {availableTechniques.map((tech) => (
                        <div
                          key={tech.technique_id}
                          className="p-2 hover:bg-slate-50 cursor-pointer"
                          onClick={() => {
                            if (!techniques.find((t) => t.technique_id === tech.technique_id)) {
                              setTechniques([...techniques, tech])
                            }
                            setSearchTechnique('')
                            setAvailableTechniques([])
                          }}
                        >
                          <span className="font-mono text-sm">{tech.technique_id}</span> - {tech.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Selected Techniques</Label>
                  <div className="flex flex-wrap gap-2">
                    {techniques.map((tech) => (
                      <Badge key={tech.technique_id} variant="secondary">
                        {tech.technique_id} - {tech.name}
                        <button
                          onClick={() => setTechniques(techniques.filter((t) => t.technique_id !== tech.technique_id))}
                          className="ml-2 text-red-600"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button onClick={handleSaveMitre}>
                  <Save className="w-4 h-4 mr-2" />
                  Save MITRE Mapping
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="queries">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Microsoft Sentinel (KQL)</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    rows={8}
                    placeholder="Enter your KQL query..."
                    value={queries.SENTINEL}
                    onChange={(e) => setQueries({ ...queries, SENTINEL: e.target.value })}
                    className="font-mono text-sm"
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Google Chronicle (YARA-L)</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    rows={8}
                    placeholder="Enter your YARA-L query..."
                    value={queries.CHRONICLE}
                    onChange={(e) => setQueries({ ...queries, CHRONICLE: e.target.value })}
                    className="font-mono text-sm"
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Other SIEM</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    rows={8}
                    placeholder="Enter query for other SIEM..."
                    value={queries.OTHER}
                    onChange={(e) => setQueries({ ...queries, OTHER: e.target.value })}
                    className="font-mono text-sm"
                  />
                </CardContent>
              </Card>
              <Button onClick={handleSaveQueries}>
                <Save className="w-4 h-4 mr-2" />
                Save All Queries
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="guidance">
            <Card>
              <CardHeader>
                <CardTitle>Investigation Guide</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  rows={12}
                  value={useCase?.investigation_guide || ''}
                  onChange={(e) => setUseCase({ ...useCase, investigation_guide: e.target.value })}
                  placeholder="Provide step-by-step guidance for analysts investigating this detection..."
                />
                <Button onClick={handleSaveBasicInfo}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Investigation Guide
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
