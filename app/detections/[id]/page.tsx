'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Edit, Loader2, AlertCircle, ExternalLink } from 'lucide-react'

interface Detection {
  id: string
  use_case_code: string
  title: string
  description: string | null
  investigation_guide: string | null
  priority: string
  created_at: string
  updated_at: string
  logSources: Array<{ id: string; name: string }>
  mitreTechniques: Array<{ id: string; name: string; description: string | null }>
  queries: Array<{ id: string; siem_type: string; query_text: string }>
}

export default function DetectionDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [detection, setDetection] = useState<Detection | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDetection()
  }, [params.id])

  const fetchDetection = async () => {
    try {
      const response = await fetch(`/api/use-cases/${params.id}`)
      if (!response.ok) {
        throw new Error('Detection not found')
      }
      const data = await response.json()
      setDetection(data)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load detection')
    } finally {
      setLoading(false)
    }
  }

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

  if (error || !detection) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="py-12">
          <CardContent className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Detection Not Found</h3>
            <p className="text-gray-600 mb-4">{error || 'The requested detection could not be found.'}</p>
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
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-gray-500 font-mono">{detection.use_case_code}</span>
              <Badge className={getPriorityColor(detection.priority)}>
                {detection.priority}
              </Badge>
            </div>
            <h1 className="text-4xl font-bold">{detection.title}</h1>
          </div>
          <Button onClick={() => router.push(`/use-cases/${detection.id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="queries">Queries ({detection.queries.length})</TabsTrigger>
          <TabsTrigger value="investigation">Investigation Guide</TabsTrigger>
          <TabsTrigger value="mitre">MITRE ATT&CK ({detection.mitreTechniques.length})</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              {detection.description ? (
                <p className="text-gray-700 whitespace-pre-wrap">{detection.description}</p>
              ) : (
                <p className="text-gray-400 italic">No description provided</p>
              )}
            </CardContent>
          </Card>

          {/* Log Sources */}
          <Card>
            <CardHeader>
              <CardTitle>Log Sources</CardTitle>
            </CardHeader>
            <CardContent>
              {detection.logSources.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {detection.logSources.map((ls) => (
                    <Badge key={ls.id} variant="outline" className="text-base py-2 px-4 bg-blue-50">
                      {ls.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 italic">No log sources specified</p>
              )}
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(detection.created_at).toLocaleDateString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(detection.updated_at).toLocaleDateString()}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Queries Tab */}
        <TabsContent value="queries" className="space-y-4">
          {detection.queries.length > 0 ? (
            detection.queries.map((query) => (
              <Card key={query.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{query.siem_type}</CardTitle>
                    <Badge variant="outline">{query.siem_type}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{query.query_text}</code>
                  </pre>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="py-12">
              <CardContent className="text-center">
                <p className="text-gray-400 italic">No queries defined</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => router.push(`/use-cases/${detection.id}/edit`)}
                >
                  Add Query
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Investigation Guide Tab */}
        <TabsContent value="investigation">
          <Card>
            <CardHeader>
              <CardTitle>Investigation Guide</CardTitle>
            </CardHeader>
            <CardContent>
              {detection.investigation_guide ? (
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap text-gray-700">
                    {detection.investigation_guide}
                  </pre>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400 italic mb-4">No investigation guide provided</p>
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/use-cases/${detection.id}/edit`)}
                  >
                    Add Investigation Guide
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* MITRE ATT&CK Tab */}
        <TabsContent value="mitre" className="space-y-4">
          {detection.mitreTechniques.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {detection.mitreTechniques.map((tech) => (
                <Card key={tech.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge variant="outline" className="mb-2 bg-purple-50">
                          {tech.id}
                        </Badge>
                        <CardTitle className="text-lg">{tech.name}</CardTitle>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          window.open(
                            `https://attack.mitre.org/techniques/${tech.id.replace('.', '/')}`,
                            '_blank'
                          )
                        }
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  {tech.description && (
                    <CardContent>
                      <p className="text-sm text-gray-600 line-clamp-3">{tech.description}</p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <Card className="py-12">
              <CardContent className="text-center">
                <p className="text-gray-400 italic mb-4">No MITRE techniques mapped</p>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/use-cases/${detection.id}/edit`)}
                >
                  Map MITRE Techniques
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
