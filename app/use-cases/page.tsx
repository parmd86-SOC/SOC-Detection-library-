"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ContentPack = {
  id: string;
  name: string;
  description?: string | null;
  use_case_count: number;
  log_source_count: number;
  mitre_technique_count: number;
};

export default function ContentPacksLanding() {
  const [packs, setPacks] = useState<ContentPack[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/content-packs/summary", { cache: "no-store" });
        const data = await res.json();
        setPacks(data.items ?? []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Detection Library</h1>
        <p className="text-muted-foreground">
          Browse detections organized into Chronicle-style Content Packs
        </p>
      </div>

      {loading && <p>Loading content packs…</p>}

      {!loading && packs.length === 0 && (
        <p className="text-muted-foreground">No content packs found.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {packs.map((p) => (
          <Link
            key={p.id}
            href={`/content-packs/${p.id}`}
            className="rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-semibold">{p.name}</div>
                {p.description && (
                  <div className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {p.description}
                  </div>
                )}
              </div>
              <div className="text-xs text-muted-foreground border rounded-full px-2 py-1">
                Pack
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="border rounded-full px-3 py-1">
                {p.use_case_count} rules
              </span>
              <span className="border rounded-full px-3 py-1">
                {p.log_source_count} sources
              </span>
              <span className="border rounded-full px-3 py-1">
                {p.mitre_technique_count} MITRE
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
