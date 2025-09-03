import React, { useState } from 'react'
import api from '../services/api'
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { Badge } from '../components/Badge'

interface ComparisonResult {
  sourceRecord: Record<string, any>
  targetRecord: Record<string, any>
  conflicts: Array<{
    field: string
    sourceValue: any
    targetValue: any
    recommendation: string
  }>
  mergeRecommendation: Record<string, any>
}

export default function RecordCompare() {
  const [sourceRecordId, setSourceRecordId] = useState('')
  const [targetRecordId, setTargetRecordId] = useState('')
  const [comparison, setComparison] = useState<ComparisonResult | null>(null)
  const [compareLoading, setCompareLoading] = useState(false)
  const [mergeLoading, setMergeLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mergeDecisions, setMergeDecisions] = useState<Record<string, any>>({})
  const isEqual = (a: any, b: any) => { try { return JSON.stringify(a) === JSON.stringify(b) } catch { return a === b } }

  const handleCompare = async () => {
    if (!sourceRecordId || !targetRecordId) {
      alert('Please enter both source and target record IDs')
      return
    }

    setCompareLoading(true)
    setError(null)
    try {
      const response = await api.get('/api/matching/compare', { 
        params: { sourceId: sourceRecordId, targetId: targetRecordId } 
      })
      setComparison(response.data)
      setMergeDecisions(response.data.mergeRecommendation || {})
    } catch (err) {
      setError('Failed to compare records')
      console.error('Comparison error:', err)
    } finally {
      setCompareLoading(false)
    }
  }

  const handleMergeDecisionChange = (field: string, value: any) => {
    setMergeDecisions(prev => ({ ...prev, [field]: value }))
  }

  const handleMerge = async () => {
    if (!comparison) return

    setMergeLoading(true)
    try {
      await api.post('/api/matching/merge', {
        sourceId: sourceRecordId,
        targetId: targetRecordId,
        decisions: mergeDecisions
      })
      alert('Records merged successfully')
      setComparison(null)
      setSourceRecordId('')
      setTargetRecordId('')
      setMergeDecisions({})
    } catch (err) {
      setError('Failed to merge records')
      console.error('Merge error:', err)
    } finally {
      setMergeLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Record Comparison & Merge</h1>
        <p className="text-lg text-gray-600">
          Compare and merge duplicate records to maintain data quality
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>🔍</span>
            <span>Compare Records</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Source Record ID"
              value={sourceRecordId}
              onChange={(e) => setSourceRecordId(e.target.value)}
              placeholder="Enter source record ID"
            />
            
            <Input
              label="Target Record ID"
              value={targetRecordId}
              onChange={(e) => setTargetRecordId(e.target.value)}
              placeholder="Enter target record ID"
            />
          </div>
          
          <div className="mt-6 text-center">
            <Button
              onClick={handleCompare}
              loading={compareLoading}
              disabled={!sourceRecordId || !targetRecordId}
              variant="primary"
              size="lg"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              {compareLoading ? 'Comparing...' : 'Compare Records'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="bg-red-50 border-red-200">
          <CardContent>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {comparison && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-900 flex items-center space-x-2">
                  <span>📄</span>
                  <span>Source Record</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-white p-4 rounded-lg border overflow-auto max-h-64">
                  {JSON.stringify(comparison.sourceRecord, null, 2)}
                </pre>
              </CardContent>
            </Card>
            
            <Card className="bg-cyan-50 border-cyan-200">
              <CardHeader>
                <CardTitle className="text-cyan-900 flex items-center space-x-2">
                  <span>📄</span>
                  <span>Target Record</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-white p-4 rounded-lg border overflow-auto max-h-64">
                  {JSON.stringify(comparison.targetRecord, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </div>

          {comparison.conflicts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>⚠️</span>
                  <span>Conflicts Found ({comparison.conflicts.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <p className="text-amber-800 font-medium">
                      {comparison.conflicts.length} conflict(s) detected. Please review and make merge decisions below.
                    </p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {comparison.conflicts.map((conflict, index) => (
                    <Card key={index} className="border-gray-200">
                      <CardContent>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">
                          Field: {conflict.field}
                        </h4>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Source Value
                            </label>
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <code className="text-sm text-blue-900">
                                {JSON.stringify(conflict.sourceValue)}
                              </code>
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Target Value
                            </label>
                            <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-lg">
                              <code className="text-sm text-cyan-900">
                                {JSON.stringify(conflict.targetValue)}
                              </code>
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Your Decision
                            </label>
                            <div className="space-y-2">
                              <label className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  name={`conflict-${index}`}
                                  checked={isEqual(mergeDecisions[conflict.field], conflict.sourceValue)}
                                  onChange={() => handleMergeDecisionChange(conflict.field, conflict.sourceValue)}
                                  className="text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">Use Source</span>
                              </label>
                              <label className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  name={`conflict-${index}`}
                                  checked={isEqual(mergeDecisions[conflict.field], conflict.targetValue)}
                                  onChange={() => handleMergeDecisionChange(conflict.field, conflict.targetValue)}
                                  className="text-cyan-600 focus:ring-cyan-500"
                                />
                                <span className="text-sm text-gray-700">Use Target</span>
                              </label>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Recommendation:</span> {conflict.recommendation}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-green-900 flex items-center space-x-2">
                <span>🔄</span>
                <span>Merge Preview</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-white p-4 rounded-lg border overflow-auto max-h-64">
                {JSON.stringify(mergeDecisions, null, 2)}
              </pre>
            </CardContent>
          </Card>

          <div className="flex justify-center space-x-4">
            <Button
              onClick={handleMerge}
              loading={mergeLoading}
              variant="success"
              size="lg"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {mergeLoading ? 'Merging...' : 'Execute Merge'}
            </Button>
            
            <Button
              onClick={() => {
                setComparison(null)
                setMergeDecisions({})
              }}
              variant="secondary"
              size="lg"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
