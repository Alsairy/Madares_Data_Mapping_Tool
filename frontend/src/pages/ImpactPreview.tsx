import React, { useState } from 'react'
import api from '../services/api'
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { Badge } from '../components/Badge'

interface ImpactAnalysis {
  batchId: string
  newRecords: {
    schools: number
    students: number
    parents: number
  }
  updatedRecords: {
    schools: number
    students: number
    parents: number
  }
  dataQualityScore: number
  openIssues: number
  warnings: string[]
}

export default function ImpactPreview() {
  const [batchId, setBatchId] = useState('')
  const [analysis, setAnalysis] = useState<ImpactAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [injectionMode, setInjectionMode] = useState<'simulate' | 'live'>('simulate')

  const handleAnalyze = async () => {
    if (!batchId) {
      alert('Please enter a batch ID')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await api.get(`/api/batch/${encodeURIComponent(batchId)}/impact`)
      setAnalysis(response.data)
    } catch (err) {
      setError('Failed to analyze impact')
      console.error('Impact analysis error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleExecute = async () => {
    if (!analysis) return

    setLoading(true)
    try {
      await api.post(`/api/batch/${encodeURIComponent(analysis.batchId)}/inject`, null, {
        params: { simulate: injectionMode === 'simulate' }
      })
      alert(`${injectionMode === 'live' ? 'Live' : 'Simulated'} injection completed successfully`)
      if (injectionMode === 'live') {
        setAnalysis(null)
        setBatchId('')
      }
    } catch (err) {
      setError('Failed to execute injection')
      console.error('Injection error:', err)
    } finally {
      setLoading(false)
    }
  }

  const getQualityScoreColor = (score: number) => {
    if (score >= 0.9) return 'text-green-600'
    if (score >= 0.75) return 'text-amber-600'
    return 'text-red-600'
  }

  const getQualityScoreBg = (score: number) => {
    if (score >= 0.9) return 'bg-green-50 border-green-200'
    if (score >= 0.75) return 'bg-amber-50 border-amber-200'
    return 'bg-red-50 border-red-200'
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Data Injection Impact Preview</h1>
        <p className="text-lg text-gray-600">
          Analyze the impact of data injection before executing changes
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>🔍</span>
            <span>Select Batch for Impact Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <Input
                label="Batch ID"
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                placeholder="Enter batch ID"
              />
            </div>
            
            <Button
              onClick={handleAnalyze}
              loading={loading}
              disabled={!batchId}
              variant="primary"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              {loading ? 'Analyzing...' : 'Analyze Impact'}
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

      {analysis && (
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>📊</span>
                <span>Impact Analysis Results</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-cyan-50 border border-cyan-200 rounded-lg">
                  <div className="text-2xl mb-2">🏫</div>
                  <h3 className="text-sm font-medium text-gray-600 mb-1">New Schools</h3>
                  <div className="text-2xl font-bold text-cyan-600">
                    {analysis.newRecords.schools}
                  </div>
                </div>

                <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-2xl mb-2">👨‍🎓</div>
                  <h3 className="text-sm font-medium text-gray-600 mb-1">New Students</h3>
                  <div className="text-2xl font-bold text-green-600">
                    {analysis.newRecords.students}
                  </div>
                </div>

                <div className="text-center p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="text-2xl mb-2">👨‍👩‍👧‍👦</div>
                  <h3 className="text-sm font-medium text-gray-600 mb-1">New Parents</h3>
                  <div className="text-2xl font-bold text-purple-600">
                    {analysis.newRecords.parents}
                  </div>
                </div>

                <div className="text-center p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="text-2xl mb-2">🔄</div>
                  <h3 className="text-sm font-medium text-gray-600 mb-1">Updated Records</h3>
                  <div className="text-2xl font-bold text-amber-600">
                    {analysis.updatedRecords.schools + analysis.updatedRecords.students + analysis.updatedRecords.parents}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className={getQualityScoreBg(analysis.dataQualityScore)}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>📈</span>
                  <span>Data Quality Score</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className={`text-6xl font-bold ${getQualityScoreColor(analysis.dataQualityScore)}`}>
                    {(analysis.dataQualityScore * 100).toFixed(1)}%
                  </div>
                  <Badge 
                    variant={analysis.dataQualityScore >= 0.9 ? 'success' : analysis.dataQualityScore >= 0.75 ? 'warning' : 'error'}
                    className="mt-2"
                  >
                    {analysis.dataQualityScore >= 0.9 ? 'Excellent' : analysis.dataQualityScore >= 0.75 ? 'Good' : 'Needs Improvement'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className={analysis.openIssues > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>{analysis.openIssues > 0 ? '⚠️' : '✅'}</span>
                  <span>Open Issues</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className={`text-6xl font-bold ${analysis.openIssues > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {analysis.openIssues}
                  </div>
                  <Badge 
                    variant={analysis.openIssues > 0 ? 'error' : 'success'}
                    className="mt-2"
                  >
                    {analysis.openIssues > 0 ? 'Action Required' : 'All Clear'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {analysis.warnings.length > 0 && (
            <Card className="bg-amber-50 border-amber-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-amber-900">
                  <span>⚠️</span>
                  <span>Warnings ({analysis.warnings.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.warnings.map((warning, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <svg className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <span className="text-amber-800">{warning}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-blue-900">
                <span>⚙️</span>
                <span>Injection Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Injection Mode:
                </label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="injectionMode"
                      value="simulate"
                      checked={injectionMode === 'simulate'}
                      onChange={(e) => setInjectionMode(e.target.value as 'simulate' | 'live')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900">Simulate (Preview only)</span>
                      <p className="text-xs text-gray-500">Test the injection without making actual changes</p>
                    </div>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="injectionMode"
                      value="live"
                      checked={injectionMode === 'live'}
                      onChange={(e) => setInjectionMode(e.target.value as 'simulate' | 'live')}
                      className="text-red-600 focus:ring-red-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900">Live (Execute changes)</span>
                      <p className="text-xs text-gray-500">Apply changes to the production database</p>
                    </div>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center space-x-4">
            <Button
              onClick={handleExecute}
              loading={loading}
              variant={injectionMode === 'live' ? 'error' : 'success'}
              size="lg"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {loading ? 'Processing...' : `${injectionMode === 'live' ? 'Execute Live' : 'Run Simulation'} Injection`}
            </Button>
            
            <Button
              onClick={() => {
                setAnalysis(null)
                setBatchId('')
              }}
              variant="secondary"
              size="lg"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
