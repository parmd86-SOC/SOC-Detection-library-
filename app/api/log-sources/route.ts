import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createLogSourceSchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
  try {
    const logSources = await prisma.logSource.findMany({
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(logSources)
  } catch (error) {
    console.error('Error fetching log sources:', error)
    return NextResponse.json(
      { error: 'Failed to fetch log sources' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = createLogSourceSchema.parse(body)

    const logSource = await prisma.logSource.create({
      data: validated,
    })

    return NextResponse.json(logSource, { status: 201 })
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Log source already exists' },
        { status: 409 }
      )
    }

    console.error('Error creating log source:', error)
    return NextResponse.json(
      { error: 'Failed to create log source' },
      { status: 500 }
    )
  }
}
