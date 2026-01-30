import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pack = await prisma.contentPack.findUnique({
      where: { id: params.id },
      include: {
        // ✅ These MUST match your Prisma relation field names on ContentPack
        // (your summary route implies these exist)
        use_cases: {
          include: {
            use_case: {
              include: {
                log_sources: { include: { log_source: true } },
                mitre_techniques: { include: { technique: true } },
                queries: true,
              },
            },
          },
        },
        log_sources: {
          include: {
            log_source: true,
          },
        },
      },
    });

    if (!pack) {
      return NextResponse.json({ error: "Content pack not found" }, { status: 404 });
    }

    // Normalize shape for UI
    const useCases = (pack.use_cases || [])
      .map((x) => x.use_case)
      .filter(Boolean)
      .map((uc) => ({
        id: uc.id,
        use_case_code: uc.use_case_code,
        title: uc.title,
        description: uc.description ?? null,
        priority: uc.priority,
        updated_at: uc.updated_at,
        log_sources: (uc.log_sources || [])
          .map((l) => l.log_source)
          .filter(Boolean)
          .map((ls) => ({ id: ls.id, name: ls.name })),
        mitre_techniques: (uc.mitre_techniques || [])
          .map((m) => m.technique)
          .filter(Boolean)
          .map((t) => ({
            technique_id: t.technique_id,
            name: t.name,
            tactics: t.tactics,
            platforms: t.platforms,
          })),
        queries: uc.queries || [],
      }));

    const logSources = (pack.log_sources || [])
      .map((x) => x.log_source)
      .filter(Boolean)
      .map((ls) => ({ id: ls.id, name: ls.name }));

    return NextResponse.json({
      id: pack.id,
      tenant_id: pack.tenant_id,
      name: pack.name,
      description: pack.description ?? null,
      created_at: pack.created_at,
      use_cases: useCases,
      log_sources: logSources,
      counts: {
        use_cases: useCases.length,
        log_sources: logSources.length,
      },
    });
  } catch (e) {
    console.error("Failed to fetch content pack:", e);
    return NextResponse.json(
      { error: "Failed to fetch content pack" },
      { status: 500 }
    );
  }
}
