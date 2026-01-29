import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const packs = await prisma.contentPack.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            // ✅ MUST match Prisma relation field names on ContentPack
            use_cases: true,
            log_sources: true,
          },
        },
        // optional: include log source names for displaying on pack tiles
        log_sources: {
          include: {
            log_source: true,
          },
        },
      },
    });

    const enriched = await Promise.all(
      packs.map(async (p) => {
        // get use cases in the pack
        const links = await prisma.contentPackUseCase.findMany({
          where: { content_pack_id: p.id },
          select: { use_case_id: true },
        });

        const useCaseIds = links.map((x) => x.use_case_id);

        // count all MITRE technique mappings across those use cases
        const mitreCount =
          useCaseIds.length > 0
            ? await prisma.useCaseMitre.count({
                where: { use_case_id: { in: useCaseIds } },
              })
            : 0;

        return {
          id: p.id,
          tenant_id: p.tenant_id,
          name: p.name,
          description: p.description ?? null,
          use_case_count: p._count.use_cases,
          log_source_count: p._count.log_sources,
          mitre_technique_count: mitreCount,
          log_sources: (p.log_sources || [])
            .map((x) => x.log_source)
            .filter(Boolean)
            .map((ls) => ({ id: ls.id, name: ls.name })),
        };
      })
    );

    return NextResponse.json(enriched);
  } catch (e) {
    console.error("Failed to fetch content packs summary:", e);
    return NextResponse.json(
      { error: "Failed to fetch content packs summary" },
      { status: 500 }
    );
  }
}
