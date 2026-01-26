import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { useCaseMitreSchema } from '@/lib/validations'

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
    const validated = useCaseMitreSchema.parse(body)

    await prisma.useCaseMitre.deleteMany({
      where: { use_case_id: id },
    })

    if (validated.technique_ids.length > 0) {
      await prisma.useCaseMitre.createMany({
        data: validated.technique_ids.map((techniqueId) => ({
          use_case_id: id,
          technique_id: techniqueId,
        })),
        skipDuplicates: true,
      })
    }

    const useCase = await prisma.useCase.findUnique({
      where: { id },
      include: {
        mitre_techniques: {
          include: {
            technique: true,
          },
        },
      },
    })

    return NextResponse.json(useCase)
  } catch (error) {
    console.error('Error updating MITRE techniques:', error)
    return NextResponse.json(
      { error: 'Failed to update MITRE techniques' },
      { status: 500 }
    )
  }
}
