"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";

type UseCase = {
  id: string;
  use_case_code: string;
  title: string;
  description?: string | null;
  priority: string;
  updated_at: string;
};

export default function UseCasesPage() {
  const [useCases, setUseCases] = useState<UseCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/use-cases", {
          cache: "no-store",
        });
        const data = await res.json();
        setUseCases(data.useCases ?? []);
      } catch (e) {
        console.error("Failed to load use cases", e);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const filtered = useCases.filter(
    (u) =>
      u.title.toLowerCase().includes(query.toLowerCase()) ||
      u.use_case_code.toLowerCase().includes(query.toLowerCase()) ||
      (u.description ?? "").toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Detection Library</h1>
        <p className="text-muted-foreground">
          Manage security use cases and detections
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <input
          className="w-full rounded-md border px-9 py-2"
          placeholder="Search by code, title, or description..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {loading && <p>Loading use cases…</p>}

      {!loading && filtered.length === 0 && (
        <p className="text-muted-foreground">
          No use cases match your filters.
        </p>
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
