"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type UseCaseDetail = {
  id: string;
  use_case_code?: string;
  title: string;
  description: string | null;
  priority?: string | null;
  updated_at?: string;

  logSources?: Array<{ id: string; name: string; slug?: string | null }>;
  mitreTechniques?: Array<{ id: string; name: string }>;
  queries?: Array<{
    id: string;
    title?: string | null;
    description?: string | null;
    query?: string | null;
    code?: string | null;
    // optional if you later add these to query model:
    log_source_name?: string | null;
    mitre_technique_id?: string | null;
  }>;
};

function priorityClass(priority?: string | null) {
  switch ((priority || "").toUpperCase()) {
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

export default function UseCaseDetailClient() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [data, setData] = useState<UseCaseDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // query filters
  const [qText, setQText] = useState("");
  const [logSourceFilter, setLogSourceFilter] = useState("all");
  const [mitreFilter, setMitreFilter] = useState("all");

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/use-cases/${id}`, { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
        if (!cancelled) setData(json);
      } catch (e) {
        console.error("Use case detail load failed:", e);
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const logSources = data?.logSources || [];
  const mitreTechniques = data?.mitreTechniques || [];
  const queries = data?.queries || [];

  const filteredQueries = useMemo(() => {
    const t = qText.trim().toLowerCase();
    return queries.filter((q) => {
      const matchText =
        !t ||
        (q.title || "").toLowerCase().includes(t) ||
        (q.description || "").toLowerCase().includes(t) ||
        (q.query || "").toLowerCase().includes(t) ||
        (q.code || "").toLowerCase().includes(t);

      const matchLS = logSourceFilter === "all" || (q.log_source_name && q.log_source_name === logSourceFilter);
      const matchMitre = mitreFilter === "all" || (q.mitre_technique_id && q.mitre_technique_id === mitreFilter);

      return matchText && matchLS && matchMitre;
    });
  }, [queries, qText, logSourceFilter, mitreFilter]);

  if (loading) {
    return (
      <div className="container mx-auto py-10 px-4 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto py-10 px-4">
        <Button variant="ghost" onClick={() => router.push("/use-cases")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Use Cases
        </Button>
        <p className="mt-6 text-gray-600">Couldn’t load this use case.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <Button variant="ghost" onClick={() => router.push("/use-cases")}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Use Cases
      </Button>

      <div>
        <div className="flex items-center gap-2">
          {data.use_case_code && <span className="text-sm text-gray-500 font-mono">{data.use_case_code}</span>}
          {data.priority && <Badge className={priorityClass(data.priority)}>{data.priority}</Badge>}
        </div>
        <h1 className="text-3xl font-bold mt-2">{data.title}</h1>
        {data.description && <p className="text-gray-600 mt-2 max-w-3xl">{data.description}</p>}
      </div>

      {/* Log source tiles */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Log Sources</h2>
        {logSources.length === 0 ? (
          <p className="text-gray-600">No log sources linked.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {logSources.map((ls) => (
              <Card
                key={ls.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => (ls.slug ? router.push(`/log-sources/${ls.slug}`) : undefined)}
              >
                <CardHeader>
                  <CardTitle className="text-base">{ls.name}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600">
                  {ls.slug ? "Open log source →" : "No slug"}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* MITRE */}
      <div>
        <h2 className="text-lg font-semibold mb-3">MITRE ATT&CK</h2>
        {mitreTechniques.length === 0 ? (
          <p className="text-gray-600">No MITRE techniques linked.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {mitreTechniques.map((t) => (
              <Badge key={t.id} variant="outline" className="bg-purple-50">
                {t.id} — {t.name}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Query filters */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Queries</h2>

        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[240px]">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Search queries</label>
            <Input value={qText} onChange={(e) => setQText(e.target.value)} placeholder="Search by title / code / query text…" />
          </div>

          <div className="min-w-[220px]">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Log Source</label>
            <Select value={logSourceFilter} onValueChange={setLogSourceFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {logSources.map((ls) => (
                  <SelectItem key={ls.id} value={ls.name}>{ls.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-[220px]">
            <label className="text-sm font-medium text-gray-700 mb-2 block">MITRE</label>
            <Select value={mitreFilter} onValueChange={setMitreFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {mitreTechniques.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.id} — {t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button variant="ghost" onClick={() => { setQText(""); setLogSourceFilter("all"); setMitreFilter("all"); }}>
            Clear
          </Button>
        </div>

        {filteredQueries.length === 0 ? (
          <p className="text-gray-600">No queries found.</p>
        ) : (
          <div className="space-y-3">
            {filteredQueries.map((q) => (
              <Card key={q.id}>
                <CardHeader>
                  <CardTitle className="text-base">{q.title || q.code || "Query"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {q.description && <p className="text-gray-600">{q.description}</p>}
                  {q.query ? (
                    <pre className="text-xs bg-gray-50 border rounded-md p-3 overflow-auto">{q.query}</pre>
                  ) : (
                    <p className="text-gray-500 text-sm">No query text stored.</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
