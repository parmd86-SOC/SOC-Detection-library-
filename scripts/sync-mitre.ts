import { syncMitreAttack } from '../lib/mitre-sync'

async function main() {
  const force = process.argv.includes('--force')
  
  console.log('Starting MITRE ATT&CK sync...')
  console.log(`Force mode: ${force}`)

  const result = await syncMitreAttack(force)

  console.log('\n' + '='.repeat(60))
  console.log(result.message)
  if (result.techniquesProcessed) {
    console.log(`Techniques processed: ${result.techniquesProcessed}`)
  }
  console.log('='.repeat(60) + '\n')

  if (!result.success) {
    process.exit(1)
  }
}

main()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
