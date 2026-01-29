import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const contentPackId = searchParams.get('content_pack_id')

    const useCases = await prisma.useCase.findMany({
      where: contentPackId
        ? {
            content_packs: {
              some: { content_pack_id: contentPackId },
            },
          }
        : undefined,
      orderBy: { updated_at: 'desc' },
      include: {
        log_sources: { include: { log_source: true } },
        mitre_techniques: { include: { technique: true } },
        queries: true,
      },
    })

    return NextResponse.json({ useCases })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch use cases' }, { status: 500 })
  }
}
