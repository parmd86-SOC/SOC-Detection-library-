import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''

    const techniques = await prisma.mitreTechniqueCache.findMany({
      where: search
        ? {
            OR: [
              { technique_id: { contains: search, mode: 'insensitive' } },
              { name: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { technique_id: 'asc' },
      take: 50,
    })

    return NextResponse.json(techniques)
  } catch (error) {
    console.error('Error fetching MITRE techniques:', error)
    return NextResponse.json(
      { error: 'Failed to fetch MITRE techniques' },
      { status: 500 }
    )
  }
}
