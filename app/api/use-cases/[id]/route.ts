import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { useCaseQueriesSchema } from '@/lib/validations'

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
    const validated = useCaseQueriesSchema.parse(body)

    for (const query of validated.queries) {
      await prisma.useCaseQuery.upsert({
        where: {
          use_case_id_siem_type: {
            use_case_id: id,
            siem_type: query.siem_type,
          },
        },
        update: {
          query_text: query.query_text,
        },
        create: {
          use_case_id: id,
          siem_type: query.siem_type,
          query_text: query.query_text,
        },
      })
    }

    const useCase = await prisma.useCase.findUnique({
      where: { id },
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
