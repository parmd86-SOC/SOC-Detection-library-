import * as XLSX from 'xlsx'

// Sample data for the template
const templateData = [
  {
    use_case_code: 'UC-EXAMPLE-001',
    use_case_title: 'Example: Suspicious Process Execution',
    description: 'Detects execution of processes from suspicious locations or with unusual parameters',
    investigation_guide: '1. Review process details\n2. Check parent process\n3. Analyze command line arguments\n4. Review user context',
    priority: 'HIGH',
    log_sources: 'Windows Security Events;Microsoft Defender for Endpoint',
    mitre_techniques: 'T1059;T1059.001',
    sentinel_query: 'SecurityEvent\n| where EventID == 4688\n| where Process contains "suspicious"',
    chronicle_query: 'rule suspicious_process {\n  meta:\n    author = "SOC Team"\n  events:\n    $e.metadata.event_type = "PROCESS_LAUNCH"\n}',
    other_siem_query: 'eventtype=process process=suspicious*',
  },
  {
    use_case_code: '',
    use_case_title: '',
    description: '',
    investigation_guide: '',
    priority: '',
    log_sources: '',
    mitre_techniques: '',
    sentinel_query: '',
    chronicle_query: '',
    other_siem_query: '',
  },
]

// Create workbook
const workbook = XLSX.utils.book_new()
const worksheet = XLSX.utils.json_to_sheet(templateData)

// Set column widths
worksheet['!cols'] = [
  { wch: 18 },  // use_case_code
  { wch: 40 },  // use_case_title
  { wch: 50 },  // description
  { wch: 50 },  // investigation_guide
  { wch: 12 },  // priority
  { wch: 40 },  // log_sources
  { wch: 25 },  // mitre_techniques
  { wch: 60 },  // sentinel_query
  { wch: 60 },  // chronicle_query
  { wch: 60 },  // other_siem_query
]

XLSX.utils.book_append_sheet(workbook, worksheet, 'Use Cases')

// Add instructions sheet
const instructions = [
  { Column: 'use_case_code', Required: 'Yes', Description: 'Unique identifier (e.g., UC-001, UC-002)', Example: 'UC-001' },
  { Column: 'use_case_title', Required: 'Yes', Description: 'Name of the detection', Example: 'Suspicious PowerShell Execution' },
  { Column: 'description', Required: 'No', Description: 'What this detection identifies', Example: 'Detects encoded PowerShell commands' },
  { Column: 'investigation_guide', Required: 'No', Description: 'Steps for analysts to investigate', Example: '1. Check command line\n2. Review parent process' },
  { Column: 'priority', Required: 'No', Description: 'Severity level: LOW, MEDIUM, HIGH, CRITICAL', Example: 'HIGH' },
  { Column: 'log_sources', Required: 'No', Description: 'Semicolon-separated list of log sources', Example: 'Windows Security Events;Firewall Logs' },
  { Column: 'mitre_techniques', Required: 'No', Description: 'Semicolon-separated MITRE technique IDs', Example: 'T1059;T1059.001;T1059.003' },
  { Column: 'sentinel_query', Required: 'No', Description: 'Microsoft Sentinel KQL query', Example: 'SecurityEvent | where EventID == 4688' },
  { Column: 'chronicle_query', Required: 'No', Description: 'Google Chronicle YARA-L query', Example: 'rule detect_threat { ... }' },
  { Column: 'other_siem_query', Required: 'No', Description: 'Query for other SIEM platforms', Example: 'eventtype=process' },
]

const instructionsSheet = XLSX.utils.json_to_sheet(instructions)
instructionsSheet['!cols'] = [
  { wch: 20 },  // Column
  { wch: 10 },  // Required
  { wch: 50 },  // Description
  { wch: 40 },  // Example
]

XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions')

// Write to file
XLSX.writeFile(workbook, 'import-template.xlsx')

console.log('\n' + '='.repeat(60))
console.log('Import template created: import-template.xlsx')
console.log('='.repeat(60))
console.log('\nInstructions:')
console.log('1. Fill in the "Use Cases" sheet with your detection data')
console.log('2. See "Instructions" sheet for column descriptions')
console.log('3. Import using: npm run import:excel import-template.xlsx')
console.log('\nNotes:')
console.log('- use_case_code and use_case_title are required')
console.log('- Use semicolons (;) to separate multiple values')
console.log('- Run "npm run mitre:sync" before importing if using MITRE techniques')
console.log('='.repeat(60) + '\n')
