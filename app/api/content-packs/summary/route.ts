import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const packs = await prisma.contentPack.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        tenant_id: true,
        name: true,
        description: true,
      },
    });

    const enriched = await Promise.all(
      packs.map(async (p) => {
        const useCaseCount = await prisma.contentPackUseCase.count({
          where: { content_pack_id: p.id },
        });

        const logSourceCount = await prisma.contentPackLogSource.count({
          where: { content_pack_id: p.id },
        });

        // optional: technique count across all use cases in this pack
        const links = await prisma.contentPackUseCase.findMany({
          where: { content_pack_id: p.id },
          select: { use_case_id: true },
        });

        const useCaseIds = links.map((x) => x.use_case_id);

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
          use_case_count: useCaseCount,
          log_source_count: logSourceCount,
          mitre_technique_count: mitreCount,
        };
      })
    );

    return NextResponse.json({ items: enriched });
  } catch (e) {
    console.error("Failed to fetch content packs summary:", e);
    return NextResponse.json(
      { error: "Failed to fetch content packs summary" },
      { status: 500 }
    );
  }
}
