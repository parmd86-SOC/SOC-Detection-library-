'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RefreshCw, Database, Calendar } from 'lucide-react'

export default function AdminMitrePage() {
  const [syncStatus, setSyncStatus] = useState<any>(null)
  const [syncing, setSyncing] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSyncStatus()
  }, [])

  const fetchSyncStatus = async () => {
    try {
      const response = await fetch('/api/admin/mitre/sync')
      const data = await response.json()
      setSyncStatus(data)
    } catch (error) {
      console.error('Failed to fetch sync status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async (force: boolean = false) => {
    setSyncing(true)
    try {
      const response = await fetch('/api/admin/mitre/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force }),
      })
      const data = await response.json()
      alert(data.message)
      fetchSyncStatus()
    } catch (error) {
      console.error('Failed to sync:', error)
      alert('Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">MITRE ATT&CK Management</h1>
          <p className="text-slate-600 mt-1">Sync and manage MITRE ATT&CK framework data</p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Sync Status</CardTitle>
              <CardDescription>Current state of MITRE ATT&CK data cache</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p>Loading...</p>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Database className="w-5 h-5 text-slate-500" />
                    <div>
                      <p className="text-sm text-slate-600">Cached Techniques</p>
                      <p className="text-2xl font-bold">{syncStatus?.technique_count || 0}</p>
                    </div>
                  </div>
                  {syncStatus?.last_synced_at && (
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-slate-500" />
                      <div>
                        <p className="text-sm text-slate-600">Last Synced</p>
                        <p className="text-lg font-semibold">
                          {new Date(syncStatus.last_synced_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sync MITRE Data</CardTitle>
              <CardDescription>
                Pull the latest MITRE ATT&CK techniques from the official STIX dataset
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">
                This will fetch the latest enterprise-attack.json from the MITRE ATT&CK GitHub
                repository and update the local cache. The sync runs automatically if data is
                older than 30 days.
              </p>
              <div className="flex gap-3">
                <Button onClick={() => handleSync(false)} disabled={syncing}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'Syncing...' : 'Smart Sync'}
                </Button>
                <Button variant="outline" onClick={() => handleSync(true)} disabled={syncing}>
                  Force Sync
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>About MITRE ATT&CK</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                MITRE ATT&CK® is a globally-accessible knowledge base of adversary tactics and
                techniques based on real-world observations. The data is synced from the official
                MITRE ATT&CK STIX repository to enable accurate mapping of security detections
                to attacker behaviors.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
