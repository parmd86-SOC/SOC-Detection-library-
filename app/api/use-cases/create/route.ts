import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createUseCaseSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = createUseCaseSchema.parse(body)

    // Ensure default tenant exists
    await prisma.tenant.upsert({
      where: { id: 'default' },
      update: {},
      create: {
        id: 'default',
        name: 'Default Tenant',
      },
    })

    const useCase = await prisma.useCase.create({
      data: {
        tenant_id: 'default',
        use_case_code: validated.use_case_code,
        title: validated.title,
        description: validated.description,
        investigation_guide: validated.investigation_guide,
        priority: validated.priority,
      },
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

    return NextResponse.json(useCase, { status: 201 })
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Use case code already exists' },
        { status: 409 }
      )
    }
    
    console.error('Error creating use case:', error)
    return NextResponse.json(
      { error: 'Failed to create use case' },
      { status: 500 }
    )
  }
}
