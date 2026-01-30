import Link from "next/link";

type PackSummary = {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  use_case_count: number;
  log_source_count: number;
  mitre_technique_count: number;
  log_sources: { id: string; name: string }[];
};

export const dynamic = "force-dynamic";

async function getPacks(): Promise<PackSummary[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/content-packs/summary`, {
    cache: "no-store",
  });

  if (!res.ok) {
    // fail closed so page still renders
    return [];
  }

  return res.json();
}

export default async function UseCasesPage() {
  const packs = await getPacks();

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">Detection Library</h1>
          <p className="mt-1 text-muted-foreground">
            Browse detections by content packs (Chronicle-style)
          </p>
        </div>

        <Link
          href="/use-cases/new"
          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + New Use Case
        </Link>
      </div>

      {/* Content Packs */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Content Packs</h2>

        {packs.length === 0 ? (
          <div className="rounded-lg border p-6 text-sm text-muted-foreground">
            No content packs found yet. (Your `/api/content-packs/summary` returned no items.)
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {packs.map((p) => (
              <Link
                key={p.id}
                href={`/content-packs/${p.id}`}
                className="rounded-xl border p-5 hover:bg-muted/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold">{p.name}</div>
                    {p.description ? (
                      <div className="mt-1 text-sm text-muted-foreground line-clamp-2">
                        {p.description}
                      </div>
                    ) : (
                      <div className="mt-1 text-sm text-muted-foreground">
                        No description provided.
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 text-right text-xs text-muted-foreground">
                    <div>{p.use_case_count} use cases</div>
                    <div>{p.log_source_count} log sources</div>
                    <div>{p.mitre_technique_count} MITRE mappings</div>
                  </div>
                </div>

                {/* Small list of log sources (optional) */}
                {p.log_sources?.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {p.log_sources.slice(0, 6).map((ls) => (
                      <span
                        key={ls.id}
                        className="rounded-full border px-2 py-1 text-xs text-muted-foreground"
                      >
                        {ls.name}
                      </span>
                    ))}
                    {p.log_sources.length > 6 ? (
                      <span className="rounded-full border px-2 py-1 text-xs text-muted-foreground">
                        +{p.log_sources.length - 6} more
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
