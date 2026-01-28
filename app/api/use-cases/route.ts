import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const useCase = await prisma.useCase.findUnique({
      where: { id: params.id },
      include: {
        log_sources: { include: { log_source: true } },
        mitre_techniques: { include: { technique: true } },
        queries: true,
      },
    });

    if (!useCase) {
      return NextResponse.json({ error: "Use case not found" }, { status: 404 });
    }

    const normalized = {
      ...useCase,
      logSources: (useCase.log_sources || [])
        .map((x) => x.log_source)
        .filter(Boolean)
        .map((ls) => ({ id: ls.id, name: ls.name, slug: ls.slug })),
      mitreTechniques: (useCase.mitre_techniques || [])
        .map((x) => x.technique)
        .filter(Boolean)
        .map((t) => ({ id: t.id, name: t.name })),
      // keep original arrays too (harmless), but UI can use normalized ones
    };

    return NextResponse.json(normalized);
  } catch (error) {
    console.error("Error fetching use case:", error);
    return NextResponse.json({ error: "Failed to fetch use case" }, { status: 500 });
  }
}
