import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { useCaseMitreSchema } from '@/lib/validations'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const validated = useCaseMitreSchema.parse(body)

    // Delete existing associations
    await prisma.useCaseMitre.deleteMany({
      where: { use_case_id: params.id },
    })

    // Create new associations
    if (validated.technique_ids.length > 0) {
      await prisma.useCaseMitre.createMany({
        data: validated.technique_ids.map((techniqueId) => ({
          use_case_id: params.id,
          technique_id: techniqueId,
        })),
        skipDuplicates: true,
      })
    }

    // Return updated use case
    const useCase = await prisma.useCase.findUnique({
      where: { id: params.id },
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
