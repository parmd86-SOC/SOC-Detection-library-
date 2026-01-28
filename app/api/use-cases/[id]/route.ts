import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateUseCaseSchema } from '@/lib/validations'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const { id } = await context.params
    
    const useCase = await prisma.useCase.findUnique({
      where: { id },
      include: {
        log_sources: {
          include: {
            log_source: true,
          },
        },
        mitre_techniques: {
          include: {
            technique: true,
          },
        },
        queries: true,
      },
    })

    if (!useCase) {
      return NextResponse.json(
        { error: 'Use case not found' },
        { status: 404 }
      )
    }

    // Transform to match the expected format
    const response = {
      id: useCase.id,
      use_case_code: useCase.use_case_code,
      title: useCase.title,
      description: useCase.description,
      investigation_guide: useCase.investigation_guide,
      priority: useCase.priority,
      created_at: useCase.created_at,
      updated_at: useCase.updated_at,
      logSources: useCase.log_sources.map((ls) => ({
        id: ls.log_source.id,
        name: ls.log_source.name,
      })),
      mitreTechniques: useCase.mitre_techniques.map((mt) => ({
        id: mt.technique.technique_id,
        name: mt.technique.name,
        description: mt.technique.description,
      })),
      queries: useCase.queries.map((q) => ({
        id: q.id,
        siem_type: q.siem_type,
        query_text: q.query_text,
      })),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching use case:', error)
    return NextResponse.json(
      { error: 'Failed to fetch use case' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const validated = updateUseCaseSchema.parse(body)

    const useCase = await prisma.useCase.update({
      where: { id },
      data: validated,
      include: {
        log_sources: {
          include: {
            log_source: true,
          },
        },
        mitre_techniques: {
          include: {
            technique: true,
          },
        },
        queries: true,
      },
    })

    return NextResponse.json(useCase)
  } catch (error) {
    console.error('Error updating use case:', error)
    return NextResponse.json(
      { error: 'Failed to update use case' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.useCase.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting use case:', error)
    return NextResponse.json(
      { error: 'Failed to delete use case' },
      { status: 500 }
    )
  }
}
