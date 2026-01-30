import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contentPackId = searchParams.get("content_pack_id");

    if (contentPackId) {
      const links = await prisma.contentPackUseCase.findMany({
        where: { content_pack_id: contentPackId },
        select: { use_case_id: true },
      });

      const ids = links.map((x) => x.use_case_id);

      const useCases = await prisma.useCase.findMany({
        where: { id: { in: ids.length ? ids : ["__none__"] } },
        orderBy: { updated_at: "desc" },
        include: {
          log_sources: { include: { log_source: true } },
          mitre_techniques: { include: { technique: true } },
          queries: true,
        },
      });

      return NextResponse.json({ useCases });
    }

    const useCases = await prisma.useCase.findMany({
      orderBy: { updated_at: "desc" },
      include: {
        log_sources: { include: { log_source: true } },
        mitre_techniques: { include: { technique: true } },
        queries: true,
      },
    });

    return NextResponse.json({ useCases });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch use cases" },
      { status: 500 }
    );
  }
}
