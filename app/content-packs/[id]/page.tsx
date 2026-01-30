"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type UseCase = {
  id: string;
  use_case_code: string;
  title: string;
  description?: string | null;
  priority: string;
  updated_at: string;
};

type PackDetail = {
  id: string;
  name: string;
  description?: string | null;
  useCases: UseCase[];
};

export default function ContentPackDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [data, setData] = useState<PackDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/content-packs/${id}`, { cache: "no-store" });
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

  const filtered = useMemo(() => {
    if (!data) return [];
    const needle = q.trim().toLowerCase();
    if (!needle) return data.useCases;

    return data.useCases.filter(
      (u) =>
        u.title.toLowerCase().includes(needle) ||
        u.use_case_code.toLowerCase().includes(needle) ||
        (u.description ?? "").toLowerCase().includes(needle)
    );
  }, [data, q]);

  if (loading) return <p>Loading pack…</p>;
  if (!data) return <p className="text-muted-foreground">Pack not found.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/use-cases" className="text-sm text-muted-foreground underline">
            ← Back to Content Packs
          </Link>
          <h1 className="mt-2 text-3xl font-bold">{data.name}</h1>
          {data.description && (
            <p className="mt-2 text-muted-foreground max-w-3xl">{data.description}</p>
          )}
        </div>

        <div className="text-sm text-muted-foreground border rounded-xl px-4 py-3">
          {data.useCases.length} rules
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search rules in this pack…"
          className="w-full rounded-lg border px-4 py-2"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground">No rules match.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((uc) => (
            <Link
              key={uc.id}
              href={`/use-cases/${uc.id}`}
              className="rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono border rounded-full px-3 py-1">
                  {uc.use_case_code}
                </span>
                <span className="text-xs border rounded-full px-3 py-1">
                  {uc.priority}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">
                  Updated {new Date(uc.updated_at).toLocaleDateString()}
                </span>
              </div>

              <div className="mt-2 text-lg font-semibold">{uc.title}</div>
              {uc.description && (
                <div className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {uc.description}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
