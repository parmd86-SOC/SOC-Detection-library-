import { prisma } from '@/lib/prisma'

interface StixObject {
  type: string
  id: string
  created?: string
  modified?: string
  name?: string
  description?: string
  kill_chain_phases?: Array<{
    kill_chain_name: string
    phase_name: string
  }>
  x_mitre_platforms?: string[]
  external_references?: Array<{
    source_name: string
    external_id?: string
    url?: string
  }>
  x_mitre_deprecated?: boolean
  revoked?: boolean
}

interface StixBundle {
  type: string
  id: string
  objects: StixObject[]
}

export async function syncMitreAttack(force: boolean = false): Promise<{
  success: boolean
  message: string
  techniquesProcessed?: number
}> {
  try {
    // Check if we need to sync (skip if last sync < 30 days unless force=true)
    if (!force) {
      const latestTechnique = await prisma.mitreTechniqueCache.findFirst({
        orderBy: { last_synced_at: 'desc' },
        select: { last_synced_at: true },
      })

      if (latestTechnique) {
        const daysSinceSync = Math.floor(
          (Date.now() - latestTechnique.last_synced_at.getTime()) / (1000 * 60 * 60 * 24)
        )
        if (daysSinceSync < 30) {
          return {
            success: true,
            message: `MITRE data is fresh (synced ${daysSinceSync} days ago). Use force=true to sync anyway.`,
          }
        }
      }
    }

    // Fetch MITRE ATT&CK STIX data
    const response = await fetch(
      'https://raw.githubusercontent.com/mitre-attack/attack-stix-data/master/enterprise-attack/enterprise-attack.json'
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch MITRE data: ${response.statusText}`)
    }

    const stixBundle: StixBundle = await response.json()
    
    // Filter for attack-pattern objects (techniques)
    const techniques = stixBundle.objects.filter(
      (obj) => 
        obj.type === 'attack-pattern' && 
        !obj.x_mitre_deprecated && 
        !obj.revoked
    )

    let processedCount = 0

    // Process each technique
    for (const technique of techniques) {
      // Extract technique ID from external references
      const mitreRef = technique.external_references?.find(
        (ref) => ref.source_name === 'mitre-attack'
      )

      if (!mitreRef?.external_id) continue

      const techniqueId = mitreRef.external_id

      // Extract tactics from kill chain phases
      const tactics = technique.kill_chain_phases
        ?.filter((phase) => phase.kill_chain_name === 'mitre-attack')
        .map((phase) => phase.phase_name) || []

      // Extract platforms
      const platforms = technique.x_mitre_platforms || []

      // Upsert technique
      await prisma.mitreTechniqueCache.upsert({
        where: { technique_id: techniqueId },
        update: {
          name: technique.name || '',
          description: technique.description || null,
          tactics: tactics,
          platforms: platforms,
          last_synced_at: new Date(),
          raw_stix: technique as any,
        },
        create: {
          technique_id: techniqueId,
          name: technique.name || '',
          description: technique.description || null,
          tactics: tactics,
          platforms: platforms,
          last_synced_at: new Date(),
          raw_stix: technique as any,
        },
      })

      processedCount++
    }

    return {
      success: true,
      message: `Successfully synced ${processedCount} MITRE ATT&CK techniques`,
      techniquesProcessed: processedCount,
    }
  } catch (error) {
    console.error('MITRE sync error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error during MITRE sync',
    }
  }
}
