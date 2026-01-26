export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateUseCaseSchema } from '@/lib/validations'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const useCase = await prisma.useCase.findUnique({
      where: { id: params.id },
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

    return NextResponse.json(useCase)
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
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const validated = updateUseCaseSchema.parse(body)

    const useCase = await prisma.useCase.update({
      where: { id: params.id },
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
