import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    // Test database connection first
    await prisma.$connect()
    
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const logSource = searchParams.get('logSource') || ''
    const technique = searchParams.get('technique') || ''
    const tactic = searchParams.get('tactic') || ''
    const hasSentinel = searchParams.get('hasSentinel')
    const hasChronicle = searchParams.get('hasChronicle')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit
    const where: any = {}
    
    if (search) {
      where.OR = [
        { use_case_code: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }
    
    if (logSource) {
      where.log_sources = {
        some: {
          log_source: {
            name: { equals: logSource, mode: 'insensitive' },
          },
        },
      }
    }
    
    if (technique) {
      where.mitre_techniques = {
        some: {
          technique_id: { equals: technique },
        },
      }
    }
    
    if (tactic) {
      where.mitre_techniques = {
        some: {
          technique: {
            tactics: {
              path: '$',
              array_contains: [tactic],
            },
          },
        },
      }
    }
    
    if (hasSentinel === 'true') {
      where.queries = {
        some: {
          siem_type: 'SENTINEL',
        },
      }
    }
    
    if (hasChronicle === 'true') {
      where.queries = {
        some: {
          siem_type: 'CHRONICLE',
        },
      }
    }
    
    const total = await prisma.useCase.count({ where })
    const useCases = await prisma.useCase.findMany({
      where,
      skip,
      take: limit,
      orderBy: { updated_at: 'desc' },
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
    
    return NextResponse.json({
      data: useCases,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching use cases:', error)
    
    // Return more detailed error in development
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch use cases',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined 
      },
      { status: 500 }
    )
  }
}
