"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Filter, Loader2 } from "lucide-react";

type UseCase = {
  id: string;
  use_case_code: string;
  title: string;
  description: string | null;
  priority: string;
  updated_at: string;

  // list API may return either of these shapes
  log_sources?: any[];
  mitre_techniques?: any[];
  queries?: any[];

  logSources?: Array<{ id: string; name: string; slug?: string }>;
  mitreTechniques?: Array<{ id: string; name: string }>;
};

type Summary = {
  logSources: Array<{ id: string; name: string; slug: string; useCaseCount: number }>;
  mitre: Array<{ id: string; name: string; useCaseCount: number }>;
};

function priorityClass(priority: string) {
  switch (priority?.toUpperCase()) {
    case "CRITICAL":
      return "bg-red-100 text-red-800 border-red-200";
    case "HIGH":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "MEDIUM":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "LOW":
      return "bg-green-100 text-green-800 border-green-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

export default function UseCasesPage() {
  const router = useRouter();

  const [useCases, setUseCases] = useState<UseCase[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(true);

  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [priority, setPriority] = useState("all");
  const [logSource, setLogSource] = useState("all");
  const [mitre, setMitre] = useState("all");

  // load summary for tiles + dropdown options
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingSummary(true);
      try {
        const res = await fetch("/api/use-cases/summary", { cache: "no-store" });
        const json = await res.json();
        if (!cancelled) setSummary(json);
      } catch (e) {
        console.error(e);
        if (!cancelled) setSummary(null);
      } finally {
        if (!cancelled) setLoadingSummary(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // load list (simple: load all then filter client-side)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/use-cases", { cache: "no-store" });
        const json = await res.json();
        // support either: { items: [...] } or raw array
        const items = Array.isArray(json) ? json : json.items || [];
        if (!cancelled) setUseCases(items);
      } catch (e) {
        console.error(e);
        if (!cancelled) setUseCases([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();

    return useCases.filter((uc) => {
      const matchesText =
        !s ||
        uc.use_case_code?.toLowerCase().includes(s) ||
        uc.title?.toLowerCase().includes(s) ||
        (uc.description || "").toLowerCase().includes(s);

      const matchesPriority = priority === "all" || (uc.priority || "").toUpperCase() === priority;

      // Try to infer log sources / mitre from either shape
      const logSourceNames =
        (uc.logSources || []).map((x) => x.name) ||
        (uc.log_sources || []).map((x: any) => x?.log_source?.name).filter(Boolean) ||
        [];

      const mitreIds =
        (uc.mitreTechniques || []).map((x) => x.id) ||
        (uc.mitre_techniques || []).map((x: any) => x?.technique?.id).filter(Boolean) ||
        [];

      const matchesLogSource = logSource === "all" || logSourceNames.includes(logSource);
      const matchesMitre = mitre === "all" || mitreIds.includes(mitre);

      return matchesText && matchesPriority && matchesLogSource && matchesMitre;
    });
  }, [useCases, search, priority, logSource, mitre]);

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">Detection Library</h1>
          <p className="text-gray-600 mt-1">Manage security use cases and detections</p>
        </div>

        <Button onClick={() => router.push("/use-cases/new")}>
          <Plus className="h-4 w-4 mr-2" /> New Use Case
        </Button>
      </div>

      {/* Log Source tiles */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Log Sources</h2>
          {loadingSummary && <Loader2 className="h-4 w-4 animate-spin" />}
        </div>

        {summary?.logSources?.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {summary.logSources.map((ls) => (
              <Card
                key={ls.id}
                className={`cursor-pointer hover:shadow-md transition-shadow ${
                  logSource !== "all" && logSource === ls.name ? "border-2 border-blue-500" : ""
                }`}
                onClick={() => setLogSource((prev) => (prev === ls.name ? "all" : ls.name))}
              >
                <CardHeader>
                  <CardTitle className="text-base">{ls.name}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600">
                  {ls.useCaseCount} use cases
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No log source summary available.</p>
        )}
      </div>

      {/* Search + filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by code, title, or description..."
                className="pl-10"
              />
            </div>

            <Button variant="outline" onClick={() => setShowFilters((v) => !v)}>
              <Filter className="h-4 w-4 mr-2" /> Filters
            </Button>
          </div>

          {showFilters && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Priority</label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="CRITICAL">CRITICAL</SelectItem>
                    <SelectItem value="HIGH">HIGH</SelectItem>
                    <SelectItem value="MEDIUM">MEDIUM</SelectItem>
                    <SelectItem value="LOW">LOW</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Log Source</label>
                <Select value={logSource} onValueChange={setLogSource}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {summary?.logSources?.map((ls) => (
                      <SelectItem key={ls.id} value={ls.name}>{ls.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">MITRE</label>
                <Select value={mitre} onValueChange={setMitre}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {summary?.mitre?.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.id} — {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="sm:col-span-3">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSearch("");
                    setPriority("all");
                    setLogSource("all");
                    setMitre("all");
                  }}
                >
                  Clear all
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((uc) => {
            const logCount = uc.logSources?.length ?? uc.log_sources?.length ?? 0;
            const mitreCount = uc.mitreTechniques?.length ?? uc.mitre_techniques?.length ?? 0;
            const queryCount = uc.queries?.length ?? 0;

            return (
              <Card
                key={uc.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push(`/use-cases/${uc.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-6">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="outline">{uc.use_case_code}</Badge>
                        <Badge className={priorityClass(uc.priority)}>{uc.priority}</Badge>
                      </div>

                      <h3 className="text-xl font-semibold mb-2">{uc.title}</h3>
                      {uc.description && (
                        <p className="text-gray-600 line-clamp-2">{uc.description}</p>
                      )}

                      <div className="text-sm text-gray-600 mt-3">
                        {logCount} log sources &nbsp;&nbsp; {mitreCount} MITRE techniques &nbsp;&nbsp; {queryCount} queries
                      </div>
                    </div>

                    <div className="text-sm text-gray-500 whitespace-nowrap">
                      Updated {new Date(uc.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {filtered.length === 0 && (
            <p className="text-gray-600 text-center py-10">No use cases match your filters.</p>
          )}
        </div>
      )}
    </div>
  );
}
