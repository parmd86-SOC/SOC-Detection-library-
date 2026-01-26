import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create default tenant
  const tenant = await prisma.tenant.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      name: 'Default Tenant',
    },
  })
  console.log('Created default tenant')

  // Create log sources
  const logSources = await Promise.all([
    prisma.logSource.upsert({
      where: { name: 'Windows Security Events' },
      update: {},
      create: { name: 'Windows Security Events' },
    }),
    prisma.logSource.upsert({
      where: { name: 'Microsoft Defender for Endpoint' },
      update: {},
      create: { name: 'Microsoft Defender for Endpoint' },
    }),
    prisma.logSource.upsert({
      where: { name: 'Azure Active Directory' },
      update: {},
      create: { name: 'Azure Active Directory' },
    }),
    prisma.logSource.upsert({
      where: { name: 'Office 365 Audit Logs' },
      update: {},
      create: { name: 'Office 365 Audit Logs' },
    }),
    prisma.logSource.upsert({
      where: { name: 'Firewall Logs' },
      update: {},
      create: { name: 'Firewall Logs' },
    }),
  ])
  console.log(`Created ${logSources.length} log sources`)

  // Create sample use cases
  const useCase1 = await prisma.useCase.upsert({
    where: { use_case_code: 'UC-001' },
    update: {},
    create: {
      tenant_id: tenant.id,
      use_case_code: 'UC-001',
      title: 'Suspicious PowerShell Execution',
      description: 'Detects potentially malicious PowerShell commands including encoded commands, download cradles, and obfuscation techniques.',
      investigation_guide: `1. Review the full PowerShell command line
2. Check if the script is signed and by whom
3. Analyze the parent process
4. Check for network connections initiated by PowerShell
5. Review recent file modifications by the process
6. Check VirusTotal for any downloaded files or scripts`,
      priority: 'HIGH',
    },
  })

  const useCase2 = await prisma.useCase.upsert({
    where: { use_case_code: 'UC-002' },
    update: {},
    create: {
      tenant_id: tenant.id,
      use_case_code: 'UC-002',
      title: 'Multiple Failed Login Attempts',
      description: 'Identifies multiple failed authentication attempts from the same source, which may indicate brute force or password spray attacks.',
      investigation_guide: `1. Verify the user account being targeted
2. Check if successful login occurred after failures
3. Review source IP geolocation and reputation
4. Check for similar patterns across other accounts
5. Verify MFA status for affected accounts
6. Consider temporarily blocking source IP if attack is ongoing`,
      priority: 'MEDIUM',
    },
  })

  const useCase3 = await prisma.useCase.upsert({
    where: { use_case_code: 'UC-003' },
    update: {},
    create: {
      tenant_id: tenant.id,
      use_case_code: 'UC-003',
      title: 'Privilege Escalation via Token Manipulation',
      description: 'Detects attempts to manipulate access tokens to gain elevated privileges on Windows systems.',
      investigation_guide: `1. Identify the process performing token manipulation
2. Review process ancestry and determine legitimacy
3. Check if the account normally performs these actions
4. Review other activities by the same user/process
5. Check for lateral movement indicators
6. Isolate the host if malicious activity confirmed`,
      priority: 'CRITICAL',
    },
  })

  console.log('Created 3 sample use cases')

  // Add log sources to use cases
  await prisma.useCaseLogSource.createMany({
    data: [
      { use_case_id: useCase1.id, log_source_id: logSources[0].id },
      { use_case_id: useCase1.id, log_source_id: logSources[1].id },
      { use_case_id: useCase2.id, log_source_id: logSources[0].id },
      { use_case_id: useCase2.id, log_source_id: logSources[2].id },
      { use_case_id: useCase3.id, log_source_id: logSources[0].id },
      { use_case_id: useCase3.id, log_source_id: logSources[1].id },
    ],
    skipDuplicates: true,
  })

  // Add sample queries
  await prisma.useCaseQuery.upsert({
    where: {
      use_case_id_siem_type: {
        use_case_id: useCase1.id,
        siem_type: 'SENTINEL',
      },
    },
    update: {},
    create: {
      use_case_id: useCase1.id,
      siem_type: 'SENTINEL',
      query_text: `SecurityEvent
| where EventID == 4688
| where Process has "powershell.exe" or Process has "pwsh.exe"
| where CommandLine has_any ("-enc", "-encodedcommand", "downloadstring", "invoke-expression", "iex")
| project TimeGenerated, Computer, Account, Process, CommandLine`,
    },
  })

  await prisma.useCaseQuery.upsert({
    where: {
      use_case_id_siem_type: {
        use_case_id: useCase2.id,
        siem_type: 'SENTINEL',
      },
    },
    update: {},
    create: {
      use_case_id: useCase2.id,
      siem_type: 'SENTINEL',
      query_text: `SecurityEvent
| where EventID == 4625
| summarize FailedAttempts = count() by SourceIP = IpAddress, TargetAccount = Account, bin(TimeGenerated, 5m)
| where FailedAttempts >= 5
| project TimeGenerated, SourceIP, TargetAccount, FailedAttempts`,
    },
  })

  console.log('Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
