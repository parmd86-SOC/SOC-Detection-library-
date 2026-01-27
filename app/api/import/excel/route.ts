import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes for large imports

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      )
    }

    // Read the file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Parse Excel file
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet)

    if (data.length === 0) {
      return NextResponse.json(
        { error: 'Excel file is empty' },
        { status: 400 }
      )
    }

    // Ensure default tenant exists
    await prisma.tenant.upsert({
      where: { id: 'default' },
      update: {},
      create: { id: 'default', name: 'Default Tenant' },
    })

    let createdCount = 0
    let updatedCount = 0
    let errorCount = 0
    const logSources = new Set<string>()
    const mitreTechniques = new Set<string>()

    // Process each row
    for (const row of data as any[]) {
      try {
        const useCaseCode = row['use_case_code']
        const title = row['Use Case']
        const description = row['Description']
        const logSource = row['Log Source '] // Note the space
        const mitreTechniqueId = row['MITRE Technique ID']
        const mitreTechniqueName = row['MITRE Technique']

        if (!useCaseCode || !title) {
          errorCount++
          continue
        }

        // Create or update use case
        const useCase = await prisma.useCase.upsert({
          where: { use_case_code: useCaseCode },
          update: {
            title,
            description: description || null,
          },
          create: {
            tenant_id: 'default',
            use_case_code: useCaseCode,
            title,
            description: description || null,
            priority: 'MEDIUM',
          },
        })

        if (useCase) {
          // Check if this was an insert or update
          const existing = await prisma.useCase.findUnique({
            where: { use_case_code: useCaseCode },
            select: { created_at: true, updated_at: true }
          })
          
          if (existing && existing.created_at.getTime() === existing.updated_at.getTime()) {
            createdCount++
          } else {
            updatedCount++
          }
        }

        // Handle log source
        if (logSource && logSource.trim()) {
          const logSourceName = logSource.trim()
          logSources.add(logSourceName)

          // Create log source if it doesn't exist
          const logSourceRecord = await prisma.logSource.upsert({
            where: { name: logSourceName },
            update: {},
            create: { name: logSourceName },
          })

          // Link to use case
          await prisma.useCaseLogSource.upsert({
            where: {
              use_case_id_log_source_id: {
                use_case_id: useCase.id,
                log_source_id: logSourceRecord.id,
              },
            },
            update: {},
            create: {
              use_case_id: useCase.id,
              log_source_id: logSourceRecord.id,
            },
          })
        }

        // Handle MITRE technique
        if (mitreTechniqueId && mitreTechniqueId.trim()) {
          const techId = mitreTechniqueId.trim()
          mitreTechniques.add(techId)

          // Create MITRE technique if it doesn't exist
          await prisma.mitreTechniqueCache.upsert({
            where: { technique_id: techId },
            update: {},
            create: {
              technique_id: techId,
              name: mitreTechniqueName || techId,
              description: '',
            },
          })

          // Link to use case
          await prisma.useCaseMitre.upsert({
            where: {
              use_case_id_technique_id: {
                use_case_id: useCase.id,
                technique_id: techId,
              },
            },
            update: {},
            create: {
              use_case_id: useCase.id,
              technique_id: techId,
            },
          })
        }
      } catch (error) {
        console.error('Error processing row:', error)
        errorCount++
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Import completed successfully',
      stats: {
        total: data.length,
        created: createdCount,
        updated: updatedCount,
        errors: errorCount,
        logSources: logSources.size,
        mitreTechniques: mitreTechniques.size,
      },
    })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: 'Failed to import Excel file', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
