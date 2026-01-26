import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { useCaseLogSourcesSchema } from '@/lib/validations'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PUT(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const validated = useCaseLogSourcesSchema.parse(body)

    await prisma.useCaseLogSource.deleteMany({
      where: { use_case_id: id },
    })

    if (validated.log_source_ids.length > 0) {
      await prisma.useCaseLogSource.createMany({
        data: validated.log_source_ids.map((logSourceId) => ({
          use_case_id: id,
          log_source_id: logSourceId,
        })),
      })
    }

    const useCase = await prisma.useCase.findUnique({
      where: { id },
      include: {
        log_sources: {
          include: {
            log_source: true,
          },
        },
      },
    })

    return NextResponse.json(useCase)
  } catch (error) {
    console.error('Error updating log sources:', error)
    return NextResponse.json(
      { error: 'Failed to update log sources' },
      { status: 500 }
    )
  }
}
