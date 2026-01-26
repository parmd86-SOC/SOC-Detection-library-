import { NextRequest, NextResponse } from 'next/server'
import { syncMitreAttack } from '@/lib/mitre-sync'
import { mitreSyncSchema } from '@/lib/validations'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

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
