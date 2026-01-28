import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Optional: simple search param support (safe even if you don't use it yet)
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();

    const useCases = await prisma.useCase.findMany({
      where: q
        ? {
            OR: [
              { use_case_code: { contains: q, mode: "insensitive" } },
              { title: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: { updated_at: "desc" },
      include: {
        log_sources: { include: { log_source: true } },
        mitre_techniques: { include: { technique: true } },
        queries: true,
      },
    });

    const normalized = useCases.map((useCase) => ({
      ...useCase,

      // LogSource has no slug in your schema
      logSources: (useCase.log_sources || [])
        .map((x) => x.log_source)
        .filter(Boolean)
        .map((ls) => ({ id: ls.id, name: ls.name })),

      // MitreTechnique uses technique_id
      mitreTechniques: (useCase.mitre_techniques || [])
        .map((x) => x.technique)
        .filter(Boolean)
        .map((t) => ({ id: t.technique_id, name: t.name })),
    }));

    return NextResponse.json({ items: normalized, count: normalized.length });
  } catch (error) {
    console.error("Error fetching use cases:", error);
    return NextResponse.json({ error: "Failed to fetch use cases" }, { status: 500 });
  }
}
