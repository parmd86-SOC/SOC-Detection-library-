import Link from "next/link";
import { notFound } from "next/navigation";

type UseCase = {
  id: string;
  use_case_code: string;
  title: string;
  description?: string | null;
};

type ContentPack = {
  id: string;
  name: string;
  description?: string | null;
  use_cases: UseCase[];
};

async function getContentPack(id: string): Promise<ContentPack | null> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/content-packs/${id}`,
    { cache: "no-store" }
  );

  if (!res.ok) return null;
  return res.json();
}

export default async function ContentPackPage({
  params,
}: {
  params: { id: string };
}) {
  const pack = await getContentPack(params.id);

  if (!pack) notFound();

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{pack.name}</h1>
        {pack.description && (
          <p className="text-muted-foreground mt-2">
            {pack.description}
          </p>
        )}
      </div>

      {/* Use cases */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          Use Cases ({pack.use_cases.length})
        </h2>

        {pack.use_cases.length === 0 ? (
          <p className="text-muted-foreground">
            No use cases in this content pack.
          </p>
        ) : (
          <div className="grid gap-4">
            {pack.use_cases.map((uc) => (
              <Link
                key={uc.id}
                href={`/use-cases/${uc.id}`}
                className="block rounded-lg border p-4 hover:bg-muted transition"
              >
                <div className="text-xs font-mono text-muted-foreground">
                  {uc.use_case_code}
                </div>
                <div className="font-semibold">{uc.title}</div>
                {uc.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {uc.description}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
