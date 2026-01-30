"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

type UseCase = {
  id: string;
  use_case_code: string;
  title: string;
  description?: string | null;
  priority: string;
  updated_at: string;
};

type ContentPack = {
  id: string;
  name: string;
  description?: string | null;
  use_case_count: number;
  log_source_count: number;
  mitre_technique_count: number;
};

export default function UseCasesPage() {
  const [packs, setPacks] = useState<ContentPack[]>([]);
  const [packsLoading, setPacksLoading] = useState(true);

  const [useCases, setUseCases] = useState<UseCase[]>([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);

  // Load content packs
  useEffect(() => {
    async function loadPacks() {
      try {
        const res = await fetch("/api/content-packs/summary", { cache: "no-store" });
        const data = await res.json();
        setPacks(data.items ?? []);
      } catch (e) {
        console.error("Failed to load content packs", e);
      } finally {
        setPacksLoading(false);
      }
    }
    loadPacks();
  }, []);

  // Load use cases (all OR filtered by selected pack)
  useEffect(() => {
    async function loadUseCases() {
      setLoading(true);
      try {
        const url = selectedPackId
          ? `/api/use-cases?content_pack_id=${encodeURIComponent(selectedPackId)}`
          : "/api/use-cases";

        const res = await fetch(url, { cache: "no-store" });
        const data = await res.json();
        setUseCases(data.useCases ?? []);
      } catch (e) {
        console.error("Failed to load use cases", e);
        setUseCases([]);
      } finally {
        setLoading(false);
      }
    }

    loadUseCases();
  }, [selectedPackId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return useCases;

    return useCases.filter(
      (u) =>
        u.title.toLowerCase().includes(q) ||
        u.use_case_code.toLowerCase().includes(q) ||
        (u.description ?? "").toLowerCase().includes(q)
    );
  }, [query, useCases]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Detection Library</h1>
        <p className="text-muted-foreground">
          Manage security use cases and detections
        </p>
      </div>

      {/* Content Packs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Content Packs</h2>
          <button
            className="text-sm underline text-muted-foreground hover:text-foreground"
            onClick={() => setSelectedPackId(null)}
            disabled={!selectedPackId}
          >
            Clear selection
          </button>
        </div>

        {packsLoading && <p>Loading content packs…</p>}

        {!packsLoading && packs.length === 0 && (
          <p className="text-muted-foreground">No content packs found.</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {packs.map((p) => {
            const active = selectedPackId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedPackId(p.id)}
                className={`text-left rounded-lg border p-4 transition hover:bg-muted/30 ${
                  active ? "ring-2 ring-foreground" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold">{p.name}</div>
                    {p.description && (
                      <div className="mt-1 text-sm text-muted-foreground line-clamp-2">
                        {p.description}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="border rounded px-2 py-1">
                    {p.use_case_count} use cases
                  </span>
                  <span className="border rounded px-2 py-1">
                    {p.log_source_count} log sources
                  </span>
                  <span className="border rounded px-2 py-1">
                    {p.mitre_technique_count} MITRE mappings
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <input
          className="w-full rounded-md border px-9 py-2"
          placeholder="Search by code, title, or description..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Use cases */}
      {loading && <p>Loading use cases…</p>}

      {!loading && filtered.length === 0 && (
        <p className="text-muted-foreground">No use cases match your filters.</p>
      )}

      <div className="space-y-4">
        {filtered.map((uc) => (
          <div
            key={uc.id}
            className="rounded-lg border p-4 hover:bg-muted/30 transition"
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono border px-2 py-1 rounded">
                {uc.use_case_code}
              </span>
              <span className="text-xs rounded bg-yellow-100 px-2 py-1">
                {uc.priority}
              </span>
            </div>

            <h3 className="mt-2 text-lg font-semibold">{uc.title}</h3>

            {uc.description && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-3">
                {uc.description}
              </p>
            )}

            <p className="mt-2 text-xs text-muted-foreground">
              Updated {new Date(uc.updated_at).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
