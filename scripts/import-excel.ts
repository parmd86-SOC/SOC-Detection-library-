import * as XLSX from 'xlsx'
import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'

const prisma = new PrismaClient()

interface ImportRow {
  use_case_code: string
  use_case_title: string
  description?: string
  investigation_guide?: string
  priority?: string
  log_sources?: string  // semicolon-separated
  mitre_techniques?: string  // semicolon-separated
  sentinel_query?: string
  chronicle_query?: string
  other_siem_query?: string
}

async function importFromExcel(filePath: string) {
  console.log(`Importing from: ${filePath}`)

  // Read the Excel/CSV file
  const workbook = XLSX.readFile(filePath)
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  const data: ImportRow[] = XLSX.utils.sheet_to_json(worksheet)

  console.log(`Found ${data.length} rows to import`)

  // Ensure default tenant exists
  await prisma.tenant.upsert({
    where: { id: 'default' },
    update: {},
    create: { id: 'default', name: 'Default Tenant' },
  })

  let successCount = 0
  let errorCount = 0

  for (const row of data) {
    try {
      // Validate required fields
      if (!row.use_case_code || !row.use_case_title) {
        console.error(`Skipping row - missing required fields: ${JSON.stringify(row)}`)
        errorCount++
        continue
      }

      // Create or update use case
      const useCase = await prisma.useCase.upsert({
        where: { use_case_code: row.use_case_code },
        update: {
          title: row.use_case_title,
          description: row.description || null,
          investigation_guide: row.investigation_guide || null,
          priority: (row.priority?.toUpperCase() as any) || 'MEDIUM',
        },
        create: {
          tenant_id: 'default',
          use_case_code: row.use_case_code,
          title: row.use_case_title,
          description: row.description || null,
          investigation_guide: row.investigation_guide || null,
          priority: (row.priority?.toUpperCase() as any) || 'MEDIUM',
        },
      })

      // Handle log sources
      if (row.log_sources) {
        const logSourceNames = row.log_sources.split(';').map((s) => s.trim()).filter(Boolean)
        
        // Clear existing associations
        await prisma.useCaseLogSource.deleteMany({
          where: { use_case_id: useCase.id },
        })

        for (const name of logSourceNames) {
          // Create log source if it doesn't exist
          const logSource = await prisma.logSource.upsert({
            where: { name },
            update: {},
            create: { name },
          })

          // Create association
          await prisma.useCaseLogSource.create({
            data: {
              use_case_id: useCase.id,
              log_source_id: logSource.id,
            },
          })
        }
      }

      // Handle MITRE techniques
      if (row.mitre_techniques) {
        const techniqueIds = row.mitre_techniques.split(';').map((s) => s.trim()).filter(Boolean)
        
        // Clear existing associations
        await prisma.useCaseMitre.deleteMany({
          where: { use_case_id: useCase.id },
        })

        for (const techniqueId of techniqueIds) {
          // Check if technique exists in cache
          const technique = await prisma.mitreTechniqueCache.findUnique({
            where: { technique_id: techniqueId },
          })

          if (technique) {
            await prisma.useCaseMitre.create({
              data: {
                use_case_id: useCase.id,
                technique_id: techniqueId,
              },
            })
          } else {
            console.warn(`MITRE technique ${techniqueId} not found in cache - skipping`)
          }
        }
      }

      // Handle queries
      if (row.sentinel_query) {
        await prisma.useCaseQuery.upsert({
          where: {
            use_case_id_siem_type: {
              use_case_id: useCase.id,
              siem_type: 'SENTINEL',
            },
          },
          update: { query_text: row.sentinel_query },
          create: {
            use_case_id: useCase.id,
            siem_type: 'SENTINEL',
            query_text: row.sentinel_query,
          },
        })
      }

      if (row.chronicle_query) {
        await prisma.useCaseQuery.upsert({
          where: {
            use_case_id_siem_type: {
              use_case_id: useCase.id,
              siem_type: 'CHRONICLE',
            },
          },
          update: { query_text: row.chronicle_query },
          create: {
            use_case_id: useCase.id,
            siem_type: 'CHRONICLE',
            query_text: row.chronicle_query,
          },
        })
      }

      if (row.other_siem_query) {
        await prisma.useCaseQuery.upsert({
          where: {
            use_case_id_siem_type: {
              use_case_id: useCase.id,
              siem_type: 'OTHER',
            },
          },
          update: { query_text: row.other_siem_query },
          create: {
            use_case_id: useCase.id,
            siem_type: 'OTHER',
            query_text: row.other_siem_query,
          },
        })
      }

      console.log(`✓ Imported: ${row.use_case_code}`)
      successCount++
    } catch (error) {
      console.error(`✗ Error importing ${row.use_case_code}:`, error)
      errorCount++
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log(`Import complete!`)
  console.log(`Success: ${successCount}`)
  console.log(`Errors: ${errorCount}`)
  console.log('='.repeat(60) + '\n')
}

// Main execution
const filePath = process.argv[2]

if (!filePath) {
  console.error('Usage: npm run import:excel <path-to-excel-or-csv>')
  console.error('Example: npm run import:excel ./data/detections.xlsx')
  process.exit(1)
}

if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`)
  process.exit(1)
}

importFromExcel(filePath)
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
