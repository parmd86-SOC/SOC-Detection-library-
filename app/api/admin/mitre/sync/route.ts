import { NextRequest, NextResponse } from 'next/server'
import { syncMitreAttack } from '@/lib/mitre-sync'
import { mitreSyncSchema } from '@/lib/validations'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = mitreSyncSchema.parse(body)

    const result = await syncMitreAttack(validated.force)

    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(result, { status: 500 })
    }
  } catch (error) {
    console.error('Error syncing MITRE:', error)
    return NextResponse.json(
      { error: 'Failed to sync MITRE data' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const latestTechnique = await prisma.mitreTechniqueCache.findFirst({
      orderBy: { last_synced_at: 'desc' },
      select: { last_synced_at: true },
    })

    const count = await prisma.mitreTechniqueCache.count()

    return NextResponse.json({
      last_synced_at: latestTechnique?.last_synced_at || null,
      technique_count: count,
    })
  } catch (error) {
    console.error('Error fetching MITRE sync status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch MITRE sync status' },
      { status: 500 }
    )
  }
}
