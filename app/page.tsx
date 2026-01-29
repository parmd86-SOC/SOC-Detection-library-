'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

type PackSummary = {
  id: string
  name: string
  description?: string | null
  tenant_id?: string | null
  use_case_count: number
  log_source_count: number
  mitre_technique_count: number
  // optional: show a few names for UX
  log_sources?: { id: string; name: string }[]
  // readiness flags (optional)
  status?: 'READY' | 'PARTIAL' | 'NOT_READY'
}

type UseCaseListItem = {
  id: string
  use_case_code: string
  title: string
  description: string | null
  priority: Priority
  updated_at: string
  // existing relations (your API already returns these in many places)
  log_sources?: any[]
  mitre_techniques?: any[]
  queries?: any[]
}

export default function HomePage() {
  const [packs, setPacks] = useState<PackSummary[]>([])
  const [packsLoading, setPacksLoading] = useState(true)

  const [useCases, setUseCases] = useState<UseCaseListItem[]>([])
  const [useCasesLoading, setUseCasesLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState('')
  const [selectedPackId, setSelectedPackId] = useState<string>('') // empty = All
  const [selectedPriority, setSelectedPriority] = useState<string>('') // empty = All
  const [selectedLogSource, setSelectedLogSource] = useState<string>('') // empty = All
  const [selectedMitre, setSelectedMitre] = useState<string>('') // empty = All

  // Load pack summaries
  useEffect(() => {
    let cancelled = false
    async function load() {
      setPacksLoading(true)
      try {
        const res = await fetch('/api/content-packs/summary', { cache: 'no-store' })
        if (!res.ok) throw new Error(`Failed to load packs: ${res.status}`)
        const data = await res.json()
        if (!cancelled) setPacks(data || [])
      } catch (e) {
        console.error(e)
        if (!cancelled) setPacks([])
      } finally {
        if (!cancelled) setPacksLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  // Load use cases (filtered by selected pack)
  useEffect(() => {
    let cancelled = false
    async function load() {
      setUseCasesLoading(true)
      try {
        const qs = new URLSearchParams()
        if (selectedPackId) qs.set('content_pack_id', selectedPackId)

        // You can keep your existing /api/use-cases route and just add support for content_pack_id
        const res = await fetch(`/api/use-cases?${qs.toString()}`, { cache: 'no-store' })
        if (!res.ok) throw new Error(`Failed to load use cases: ${res.status}`)
        const data = await res.json()
        if (!cancelled) setUseCases(data?.useCases ?? data ?? [])
      } catch (e) {
        console.error(e)
        if (!cancelled) setUseCases([])
      } finally {
        if (!cancelled) setUseCasesLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [selectedPackId])

  // Build dropdown options from loaded data (no extra endpoints needed)
  const logSourceOptions = useMemo(() => {
    const set = new Set<string>()
    for (const uc of useCases) {
      // Many APIs return join rows like { log_source: { name } }
      for (const x of uc.log_sources || []) {
        const n = x?.log_source?.name ?? x?.name
        if (n) set.add(n)
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [useCases])

  const mitreOptions = useMemo(() => {
    const set = new Set<string>()
    for (const uc of useCases) {
      for (const x of uc.mitre_techniques || []) {
        // Your cache uses technique_id as PK; often present as technique.technique_id
        const id = x?.technique?.technique_id ?? x?.technique_id
        const name = x?.technique?.name ?? x?.name
        if (id && name) set.add(`${id} — ${name}`)
        else if (id) set.add(id)
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [useCases])

  const filteredUseCases = useMemo(() => {
    const q = search.trim().toLowerCase()

    return useCases.filter((uc) => {
      if (q) {
        const hay = `${uc.use_case_code} ${uc.title} ${uc.description ?? ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }

      if (selectedPriority && uc.priority !== selectedPriority) return false

      if (selectedLogSource) {
        const has = (uc.log_sources || []).some((x) => {
          const n = x?.log_source?.name ?? x?.name
          return n === selectedLogSource
        })
        if (!has) return false
      }

      if (selectedMitre) {
        const selId = selectedMitre.split(' — ')[0]
        const has = (uc.mitre_techniques || []).some((x) => {
          const id = x?.technique?.technique_id ?? x?.technique_id
          const name = x?.technique?.name ?? x?.name
          if (selectedMitre.includes('—')) return id === selId && `${id} — ${name}` === selectedMitre
          return id === selectedMitre
        })
        if (!has) return false
      }

      return true
    })
  }, [useCases, search, selectedPriority, selectedLogSource, selectedMitre])

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">Security Content Packs</h1>
          <p className="text-muted-foreground mt-1">
            Curated detection content aligned to data sources and threats (Chronicle-style)
          </p>
        </div>

        <Button asChild>
          <Link href="/use-cases/new">+ New Use Case</Link>
        </Button>
      </div>

      {/* Packs */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Content Packs</h2>
          <div className="text-sm text-muted-foreground">
            {packsLoading ? 'Loading…' : `${packs.length} packs`}
          </div>
        </div>

        {packsLoading ? (
          <div className="text-sm text-muted-foreground">Loading content packs…</div>
        ) : packs.length === 0 ? (
          <Card className="p-4">
            <div className="font-medium">No content packs found</div>
            <div className="text-sm text-muted-foreground mt-1">
              Create packs in Supabase (content_packs + join tables), then refresh.
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* "All" tile */}
            <Card
              className={`p-4 cursor-pointer hover:shadow-sm transition ${
                selectedPackId === '' ? 'ring-2 ring-black/10' : ''
              }`}
              onClick={() => setSelectedPackId('')}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">All detections</div>
                  <div className="text-sm text-muted-foreground">
                    Browse everything across all packs
                  </div>
                </div>
                <Badge variant="secondary">All</Badge>
              </div>
            </Card>

            {packs.map((p) => (
              <Card
                key={p.id}
                className={`p-4 cursor-pointer hover:shadow-sm transition ${
                  selectedPackId === p.id ? 'ring-2 ring-black/10' : ''
                }`}
                onClick={() => setSelectedPackId(p.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{p.name}</div>
                    {p.description ? (
                      <div className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {p.description}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground mt-1">
                        {p.use_case_count} detections • {p.log_source_count} log sources • {p.mitre_technique_count} MITRE
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 mt-3">
                      <Badge variant="secondary">{p.use_case_count} detections</Badge>
                      <Badge variant="secondary">{p.log_source_count} log sources</Badge>
                      <Badge variant="secondary">{p.mitre_technique_count} MITRE</Badge>
                      {p.status ? (
                        <Badge
                          variant={
                            p.status === 'READY'
                              ? 'default'
                              : p.status === 'PARTIAL'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {p.status === 'READY'
                            ? 'Ready'
                            : p.status === 'PARTIAL'
                            ? 'Partially ready'
                            : 'Not ready'}
                        </Badge>
                      ) : null}
                    </div>

                    {p.log_sources && p.log_sources.length > 0 ? (
                      <div className="mt-3 text-xs text-muted-foreground">
                        Data: {p.log_sources.slice(0, 4).map((x) => x.name).join(', ')}
                        {p.log_sources.length > 4 ? '…' : ''}
                      </div>
                    ) : null}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Filters + List */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">
          {selectedPackId ? 'Detections in selected pack' : 'All detections'}
        </h2>

        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            <div className="md:col-span-5">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by code, title, or description…"
              />
            </div>

            <div className="md:col-span-2">
              <select
                className="w-full h-10 rounded-md border px-3 text-sm"
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
              >
                <option value="">Priority (All)</option>
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <select
                className="w-full h-10 rounded-md border px-3 text-sm"
                value={selectedLogSource}
                onChange={(e) => setSelectedLogSource(e.target.value)}
              >
                <option value="">Log Source (All)</option>
                {logSourceOptions.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3">
              <select
                className="w-full h-10 rounded-md border px-3 text-sm"
                value={selectedMitre}
                onChange={(e) => setSelectedMitre(e.target.value)}
              >
                <option value="">MITRE (All)</option>
                {mitreOptions.slice(0, 300).map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {useCasesLoading ? (
          <div className="text-sm text-muted-foreground">Loading detections…</div>
        ) : filteredUseCases.length === 0 ? (
          <Card className="p-4">
            <div className="font-medium">No results</div>
            <div className="text-sm text-muted-foreground mt-1">
              Try clearing filters or choosing a different pack.
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredUseCases.map((uc) => {
              const logCount = uc.log_sources?.length ?? 0
              const mitreCount = uc.mitre_techniques?.length ?? 0
              const queryCount = uc.queries?.length ?? 0

              return (
                <Link key={uc.id} href={`/use-cases/${uc.id}`} className="block">
                  <Card className="p-5 hover:shadow-sm transition">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{uc.use_case_code}</Badge>
                          <Badge variant="outline">{uc.priority}</Badge>
                        </div>
                        <div className="text-2xl font-semibold mt-2">{uc.title}</div>
                        {uc.description ? (
                          <div className="text-muted-foreground mt-2 line-clamp-2">
                            {uc.description}
                          </div>
                        ) : null}

                        <div className="flex gap-6 text-sm text-muted-foreground mt-3">
                          <span>{logCount} log sources</span>
                          <span>{mitreCount} MITRE techniques</span>
                          <span>{queryCount} queries</span>
                        </div>
                      </div>

                      <div className="text-sm text-muted-foreground whitespace-nowrap">
                        Updated {new Date(uc.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
