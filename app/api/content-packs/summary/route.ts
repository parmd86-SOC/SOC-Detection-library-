import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const packs = await prisma.contentPack.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            content_pack_use_cases: true,
            content_pack_log_sources: true,
          },
        },
        content_pack_log_sources: {
          include: { log_source: true },
        },
      },
    })

    // mitre technique counts: aggregate via use cases in the pack
    // (cheap + safe for now; optimize later)
    const enriched = await Promise.all(
      packs.map(async (p) => {
        const useCaseIds = await prisma.contentPackUseCase.findMany({
          where: { content_pack_id: p.id },
          select: { use_case_id: true },
        })

        const ids = useCaseIds.map((x) => x.use_case_id)
        const mitreCount = ids.length
          ? await prisma.useCaseMitre.count({
              where: { use_case_id: { in: ids } },
            })
          : 0

        return {
          id: p.id,
          name: p.name,
          description: p.description ?? null,
          tenant_id: p.tenant_id ?? null,
          use_case_count: p._count.content_pack_use_cases,
          log_source_count: p._count.content_pack_log_sources,
          mitre_technique_count: mitreCount,
          log_sources: (p.content_pack_log_sources || [])
            .map((x) => x.log_source)
            .filter(Boolean)
            .map((ls) => ({ id: ls.id, name: ls.name })),
        }
      })
    )

    return NextResponse.json(enriched)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to fetch content packs' }, { status: 500 })
  }
}
