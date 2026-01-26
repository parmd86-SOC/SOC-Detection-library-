import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { useCaseLogSourcesSchema } from '@/lib/validations'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const validated = useCaseLogSourcesSchema.parse(body)

    // Delete existing associations
    await prisma.useCaseLogSource.deleteMany({
      where: { use_case_id: params.id },
    })

    // Create new associations
    if (validated.log_source_ids.length > 0) {
      await prisma.useCaseLogSource.createMany({
        data: validated.log_source_ids.map((logSourceId) => ({
          use_case_id: params.id,
          log_source_id: logSourceId,
        })),
      })
    }

    // Return updated use case
    const useCase = await prisma.useCase.findUnique({
      where: { id: params.id },
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
