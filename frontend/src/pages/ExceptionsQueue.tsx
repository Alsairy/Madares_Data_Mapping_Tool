import React, { useState, useEffect } from 'react'
import api from '../services/api'

interface DQIssue {
  id: string
  entityId: string
  entityType: string
  issueType: string
  description: string
  severity: string
  status: string
  createdAt: string
  resolvedAt?: string
  resolvedBy?: string
  resolution?: string
}

interface QueueResponse {
  issues: DQIssue[]
  totalCount: number
  page: number
  pageSize: number
}

interface Statistics {
  totalIssues: number
  openIssues: number
  resolvedIssues: number
  highSeverityIssues: number
  mediumSeverityIssues: number
  lowSeverityIssues: number
}

export default function ExceptionsQueue() {
  const [issues, setIssues] = useState<DQIssue[]>([])
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [selectedIssue, setSelectedIssue] = useState<DQIssue | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('')
  const [resolving, setResolving] = useState<string | null>(null)

  useEffect(() => {
    loadIssues()
    loadStatistics()
  }, [page, entityTypeFilter])

  const loadIssues = async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '20'
      })
      if (entityTypeFilter) params.append('entityType', entityTypeFilter)

      const response = await api.get(`/api/exceptions?${params}`)
      const data: QueueResponse = response.data
      
      setIssues(data.issues)
      setTotalCount(data.totalCount)
    } catch (error) {
      console.error('Error loading issues:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStatistics = async () => {
    try {
      const response = await api.get('/api/exceptions/statistics')
      setStatistics(response.data)
    } catch (error) {
      console.error('Error loading statistics:', error)
    }
  }

  const resolveIssue = async (issueId: string, action: string, resolution?: string) => {
    setResolving(issueId)
    try {
      await api.post(`/api/exceptions/${issueId}/action`, {
        action,
        resolution
      })
      
      await loadIssues()
      await loadStatistics()
      setSelectedIssue(null)
    } catch (error) {
      console.error('Error resolving issue:', error)
    } finally {
      setResolving(null)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'High': return '#dc3545'
      case 'Medium': return '#ffc107'
      case 'Low': return '#28a745'
      default: return '#6c757d'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return '#dc3545'
      case 'Resolved': return '#28a745'
      case 'Dismissed': return '#6c757d'
      default: return '#6c757d'
    }
  }

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading exceptions...</div>
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Data Quality Exceptions Queue</h1>
      
      {statistics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '30px' }}>
          <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>{statistics.totalIssues}</div>
            <div style={{ color: '#6c757d' }}>Total Issues</div>
          </div>
          <div style={{ padding: '15px', backgroundColor: '#fff3cd', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#856404' }}>{statistics.openIssues}</div>
            <div style={{ color: '#856404' }}>Open</div>
          </div>
          <div style={{ padding: '15px', backgroundColor: '#d1edff', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#0c5460' }}>{statistics.resolvedIssues}</div>
            <div style={{ color: '#0c5460' }}>Resolved</div>
          </div>
          <div style={{ padding: '15px', backgroundColor: '#f8d7da', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#721c24' }}>{statistics.highSeverityIssues}</div>
            <div style={{ color: '#721c24' }}>High Severity</div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <label>Filter by Entity Type:</label>
        <select 
          value={entityTypeFilter} 
          onChange={(e) => setEntityTypeFilter(e.target.value)}
          style={{ padding: '5px 10px', borderRadius: '4px', border: '1px solid #ccc' }}
        >
          <option value="">All Types</option>
          <option value="School">School</option>
          <option value="Student">Student</option>
          <option value="Parent">Parent</option>
        </select>
        <button 
          onClick={() => { setPage(1); loadIssues(); }}
          style={{
            padding: '5px 15px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Refresh
        </button>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #dee2e6' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa' }}>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Entity</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Issue Type</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Severity</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Status</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Created</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {issues.map((issue) => (
              <tr key={issue.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                <td style={{ padding: '12px' }}>
                  <div>{issue.entityType}</div>
                  <small style={{ color: '#6c757d' }}>{issue.entityId.substring(0, 8)}...</small>
                </td>
                <td style={{ padding: '12px' }}>{issue.issueType}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.8em',
                    backgroundColor: getSeverityColor(issue.severity) + '20',
                    color: getSeverityColor(issue.severity)
                  }}>
                    {issue.severity}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.8em',
                    backgroundColor: getStatusColor(issue.status) + '20',
                    color: getStatusColor(issue.status)
                  }}>
                    {issue.status}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  {new Date(issue.createdAt).toLocaleDateString()}
                </td>
                <td style={{ padding: '12px' }}>
                  <button
                    onClick={() => setSelectedIssue(issue)}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.8em'
                    }}
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          Showing {issues.length} of {totalCount} issues
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            style={{
              padding: '8px 16px',
              backgroundColor: page === 1 ? '#e9ecef' : '#007bff',
              color: page === 1 ? '#6c757d' : 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: page === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            Previous
          </button>
          <span style={{ padding: '8px 16px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
            Page {page}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={issues.length < 20}
            style={{
              padding: '8px 16px',
              backgroundColor: issues.length < 20 ? '#e9ecef' : '#007bff',
              color: issues.length < 20 ? '#6c757d' : 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: issues.length < 20 ? 'not-allowed' : 'pointer'
            }}
          >
            Next
          </button>
        </div>
      </div>

      {selectedIssue && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80%',
            overflow: 'auto'
          }}>
            <h2>Issue Details</h2>
            
            <div style={{ marginBottom: '20px' }}>
              <strong>Entity:</strong> {selectedIssue.entityType} ({selectedIssue.entityId})
            </div>
            <div style={{ marginBottom: '20px' }}>
              <strong>Issue Type:</strong> {selectedIssue.issueType}
            </div>
            <div style={{ marginBottom: '20px' }}>
              <strong>Description:</strong> {selectedIssue.description}
            </div>
            <div style={{ marginBottom: '20px' }}>
              <strong>Severity:</strong> <span style={{ color: getSeverityColor(selectedIssue.severity) }}>{selectedIssue.severity}</span>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <strong>Status:</strong> <span style={{ color: getStatusColor(selectedIssue.status) }}>{selectedIssue.status}</span>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <strong>Created:</strong> {new Date(selectedIssue.createdAt).toLocaleString()}
            </div>

            {selectedIssue.status === 'Open' && (
              <div style={{ marginBottom: '20px' }}>
                <h3>Resolution Actions</h3>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => resolveIssue(selectedIssue.id, 'resolve', 'Manually resolved by steward')}
                    disabled={resolving === selectedIssue.id}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: resolving === selectedIssue.id ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {resolving === selectedIssue.id ? 'Resolving...' : 'Mark Resolved'}
                  </button>
                  <button
                    onClick={() => resolveIssue(selectedIssue.id, 'dismiss', 'Dismissed as false positive')}
                    disabled={resolving === selectedIssue.id}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: resolving === selectedIssue.id ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {resolving === selectedIssue.id ? 'Dismissing...' : 'Dismiss'}
                  </button>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setSelectedIssue(null)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
