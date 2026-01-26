import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { useCaseQueriesSchema } from '@/lib/validations'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const validated = useCaseQueriesSchema.parse(body)

    // Upsert queries by siem_type
    for (const query of validated.queries) {
      await prisma.useCaseQuery.upsert({
        where: {
          use_case_id_siem_type: {
            use_case_id: params.id,
            siem_type: query.siem_type,
          },
        },
        update: {
          query_text: query.query_text,
        },
        create: {
          use_case_id: params.id,
          siem_type: query.siem_type,
          query_text: query.query_text,
        },
      })
    }

    // Return updated use case
    const useCase = await prisma.useCase.findUnique({
      where: { id: params.id },
      include: {
        queries: true,
      },
    })

    return NextResponse.json(useCase)
  } catch (error) {
    console.error('Error updating queries:', error)
    return NextResponse.json(
      { error: 'Failed to update queries' },
      { status: 500 }
    )
  }
}
