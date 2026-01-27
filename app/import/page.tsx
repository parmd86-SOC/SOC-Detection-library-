'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function ImportPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setResult(null)
      setError(null)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first')
      return
    }

    setUploading(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/import/excel', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Import failed')
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Import Detection Rules</h1>
          <p className="text-gray-600">
            Upload your Excel file to import detection rules into the library
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Upload Excel File</CardTitle>
            <CardDescription>
              Select your SOC_Detection_data.xlsx file to import
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100
                  cursor-pointer"
                disabled={uploading}
              />
            </div>

            {file && (
              <div className="text-sm text-gray-600">
                Selected: <span className="font-medium">{file.name}</span> ({(file.size / 1024).toFixed(2)} KB)
              </div>
            )}

            <Button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full"
            >
              {uploading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Importing...
                </>
              ) : (
                'Import'
              )}
            </Button>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">
                  <strong>Error:</strong> {error}
                </p>
              </div>
            )}

            {result && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md space-y-3">
                <p className="text-sm text-green-800 font-semibold">
                  ✅ Import completed successfully!
                </p>
                <div className="text-sm text-green-700 space-y-1">
                  <div className="grid grid-cols-2 gap-2">
                    <div>Total rows:</div>
                    <div className="font-medium">{result.stats.total}</div>
                    
                    <div>Created:</div>
                    <div className="font-medium text-green-600">{result.stats.created}</div>
                    
                    <div>Updated:</div>
                    <div className="font-medium text-blue-600">{result.stats.updated}</div>
                    
                    <div>Errors:</div>
                    <div className="font-medium text-red-600">{result.stats.errors}</div>
                    
                    <div>Log Sources:</div>
                    <div className="font-medium">{result.stats.logSources}</div>
                    
                    <div>MITRE Techniques:</div>
                    <div className="font-medium">{result.stats.mitreTechniques}</div>
                  </div>
                </div>
                <Button
                  onClick={() => router.push('/use-cases')}
                  variant="outline"
                  className="w-full mt-4"
                >
                  View Use Cases
                </Button>
              </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">Expected Excel Format:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <code className="bg-blue-100 px-1 rounded">use_case_code</code> - Unique identifier (required)</li>
                <li>• <code className="bg-blue-100 px-1 rounded">Use Case</code> - Detection title (required)</li>
                <li>• <code className="bg-blue-100 px-1 rounded">Description</code> - Detection description</li>
                <li>• <code className="bg-blue-100 px-1 rounded">Log Source </code> - Data source name</li>
                <li>• <code className="bg-blue-100 px-1 rounded">MITRE Technique ID</code> - e.g., T1059</li>
                <li>• <code className="bg-blue-100 px-1 rounded">MITRE Technique</code> - Technique name</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
