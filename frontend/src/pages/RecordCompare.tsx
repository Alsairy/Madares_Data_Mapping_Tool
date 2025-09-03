import React, { useState } from 'react'
import api from '../services/api'

interface EntityRecord {
  id: string
  type: string
  fields: Record<string, any>
}

interface ComparisonResult {
  sourceRecord: EntityRecord
  targetRecord: EntityRecord
  conflicts: string[]
  recommendations: Record<string, string>
}

export default function RecordCompare() {
  const [sourceId, setSourceId] = useState('')
  const [targetId, setTargetId] = useState('')
  const [comparison, setComparison] = useState<ComparisonResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [mergeDecisions, setMergeDecisions] = useState<Record<string, string>>({})

  const compareRecords = async () => {
    if (!sourceId || !targetId) return

    setLoading(true)
    try {
      const response = await api.get(`/api/matching/compare?sourceId=${sourceId}&targetId=${targetId}`)
      setComparison(response.data)
      setMergeDecisions({})
    } catch (error) {
      console.error('Error comparing records:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFieldDecision = (fieldName: string, value: string) => {
    setMergeDecisions(prev => ({
      ...prev,
      [fieldName]: value
    }))
  }

  const executeMerge = async () => {
    if (!comparison) return

    try {
      await api.post('/api/matching/merge', {
        sourceId: comparison.sourceRecord.id,
        targetId: comparison.targetRecord.id,
        decisions: mergeDecisions
      })
      
      alert('Records merged successfully!')
      setComparison(null)
      setSourceId('')
      setTargetId('')
      setMergeDecisions({})
    } catch (error) {
      console.error('Error merging records:', error)
      alert('Error merging records')
    }
  }

  const getFieldValue = (record: EntityRecord, fieldName: string) => {
    return record.fields[fieldName] || 'N/A'
  }

  const isConflictField = (fieldName: string) => {
    return comparison?.conflicts.includes(fieldName) || false
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Record Comparison & Merge</h1>
      
      <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <h2>Compare Records</h2>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>Source Record ID:</label>
            <input
              type="text"
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
              placeholder="Enter source record ID"
              style={{
                padding: '8px 12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                width: '200px'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>Target Record ID:</label>
            <input
              type="text"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              placeholder="Enter target record ID"
              style={{
                padding: '8px 12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                width: '200px'
              }}
            />
          </div>
          <button
            onClick={compareRecords}
            disabled={loading || !sourceId || !targetId}
            style={{
              padding: '8px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Comparing...' : 'Compare'}
          </button>
        </div>
      </div>

      {comparison && (
        <div>
          <h2>Comparison Results</h2>
          
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              padding: '10px',
              backgroundColor: comparison.conflicts.length > 0 ? '#fff3cd' : '#d1edff',
              borderRadius: '4px',
              border: `1px solid ${comparison.conflicts.length > 0 ? '#ffeaa7' : '#bee5eb'}`
            }}>
              {comparison.conflicts.length > 0 ? (
                <span style={{ color: '#856404' }}>
                  ⚠️ {comparison.conflicts.length} field conflicts detected
                </span>
              ) : (
                <span style={{ color: '#0c5460' }}>
                  ✅ No conflicts detected - records can be merged automatically
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '30px' }}>
            <div>
              <h3>Source Record</h3>
              <div style={{
                backgroundColor: 'white',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                padding: '15px'
              }}>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Type:</strong> {comparison.sourceRecord.type}
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>ID:</strong> {comparison.sourceRecord.id}
                </div>
                {Object.entries(comparison.sourceRecord.fields).map(([key, value]) => (
                  <div key={key} style={{
                    padding: '8px',
                    marginBottom: '5px',
                    backgroundColor: isConflictField(key) ? '#fff3cd' : '#f8f9fa',
                    borderRadius: '4px'
                  }}>
                    <strong>{key}:</strong> {String(value)}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3>Target Record</h3>
              <div style={{
                backgroundColor: 'white',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                padding: '15px'
              }}>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Type:</strong> {comparison.targetRecord.type}
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>ID:</strong> {comparison.targetRecord.id}
                </div>
                {Object.entries(comparison.targetRecord.fields).map(([key, value]) => (
                  <div key={key} style={{
                    padding: '8px',
                    marginBottom: '5px',
                    backgroundColor: isConflictField(key) ? '#fff3cd' : '#f8f9fa',
                    borderRadius: '4px'
                  }}>
                    <strong>{key}:</strong> {String(value)}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3>Merge Decisions</h3>
              <div style={{
                backgroundColor: 'white',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                padding: '15px'
              }}>
                {comparison.conflicts.map(fieldName => (
                  <div key={fieldName} style={{ marginBottom: '15px' }}>
                    <div style={{ marginBottom: '5px' }}>
                      <strong>{fieldName}:</strong>
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ display: 'block', marginBottom: '5px' }}>
                        <input
                          type="radio"
                          name={fieldName}
                          value="source"
                          checked={mergeDecisions[fieldName] === 'source'}
                          onChange={() => handleFieldDecision(fieldName, 'source')}
                          style={{ marginRight: '5px' }}
                        />
                        Use Source: {getFieldValue(comparison.sourceRecord, fieldName)}
                      </label>
                      <label style={{ display: 'block', marginBottom: '5px' }}>
                        <input
                          type="radio"
                          name={fieldName}
                          value="target"
                          checked={mergeDecisions[fieldName] === 'target'}
                          onChange={() => handleFieldDecision(fieldName, 'target')}
                          style={{ marginRight: '5px' }}
                        />
                        Use Target: {getFieldValue(comparison.targetRecord, fieldName)}
                      </label>
                      {comparison.recommendations[fieldName] && (
                        <div style={{
                          padding: '5px',
                          backgroundColor: '#e7f3ff',
                          borderRadius: '4px',
                          fontSize: '0.9em',
                          color: '#0066cc'
                        }}>
                          💡 Recommendation: {comparison.recommendations[fieldName]}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {comparison.conflicts.length === 0 && (
                  <div style={{ color: '#6c757d', textAlign: 'center' }}>
                    No conflicts to resolve
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <button
              onClick={executeMerge}
              disabled={comparison.conflicts.some(field => !mergeDecisions[field])}
              style={{
                padding: '12px 30px',
                backgroundColor: comparison.conflicts.some(field => !mergeDecisions[field]) ? '#e9ecef' : '#28a745',
                color: comparison.conflicts.some(field => !mergeDecisions[field]) ? '#6c757d' : 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '1.1em',
                cursor: comparison.conflicts.some(field => !mergeDecisions[field]) ? 'not-allowed' : 'pointer'
              }}
            >
              Execute Merge
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
