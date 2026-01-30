"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type LogSource = {
  id: string;
  name: string;
};

type Mitre = {
  id: string;
  technique_id: string;
  name: string;
  tactic: string;
};

type UseCaseDetail = {
  id: string;
  use_case_code: string;
  title: string;
  description?: string | null;
  priority: string;
  updated_at: string;
  log_sources: LogSource[];
  mitre_techniques: Mitre[];
};

export default function UseCaseDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [data, setData] = useState<UseCaseDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/use-cases/${id}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          setData(null);
          return;
        }

        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error(e);
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    if (id) load();
  }, [id]);

  if (loading) {
    return <p>Loading use case…</p>;
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <Link href="/use-cases" className="underline text-sm">
          ← Back
        </Link>
        <p className="text-muted-foreground">Use case not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link href="/use-cases" className="text-sm underline text-muted-foreground">
          ← Back to Content Packs
        </Link>

        <div className="mt-3 flex items-center gap-3 flex-wrap">
          <span className="font-mono text-xs border rounded-full px-3 py-1">
            {data.use_case_code}
          </span>
          <span className="text-xs border rounded-full px-3 py-1">
            {data.priority}
          </span>
          <span className="text-xs text-muted-foreground">
            Updated {new Date(data.updated_at).toLocaleDateString()}
          </span>
        </div>

        <h1 className="mt-4 text-3xl font-bold">{data.title}</h1>

        {data.description && (
          <p className="mt-3 max-w-3xl text-muted-foreground">
            {data.description}
          </p>
        )}
      </div>

      {/* Log Sources */}
      <section>
        <h2 className="text-xl font-semibold mb-3">Log Sources</h2>
        {data.log_sources.length === 0 ? (
          <p className="text-sm text-muted-foreground">No log sources mapped.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {data.log_sources.map((ls) => (
              <span
                key={ls.id}
                className="text-sm border rounded-full px-3 py-1 bg-muted"
              >
                {ls.name}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* MITRE Techniques */}
      <section>
        <h2 className="text-xl font-semibold mb-3">MITRE ATT&CK</h2>
        {data.mitre_techniques.length === 0 ? (
          <p className="text-sm text-muted-foreground">No MITRE techniques mapped.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.mitre_techniques.map((m) => (
              <div
                key={m.id}
                className="rounded-lg border p-4 bg-white shadow-sm"
              >
                <div className="text-xs text-muted-foreground">
                  {m.tactic}
                </div>
                <div className="font-mono text-sm">{m.technique_id}</div>
                <div className="font-semibold">{m.name}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
