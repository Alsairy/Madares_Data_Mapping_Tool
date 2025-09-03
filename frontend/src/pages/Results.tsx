import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../services/api'

interface PipelineResult {
  jobId: string
  schoolsMatched: number
  studentsPrepared: number
  parentsPrepared: number
  exceptions: number
  overallDqScore: number
  completedAt: string
  status: string
}

export default function Results() {
  const [searchParams] = useSearchParams()
  const jobId = searchParams.get('jobId')
  const [result, setResult] = useState<PipelineResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!jobId) {
      setError('No job ID provided')
      setLoading(false)
      return
    }

    const fetchResults = async () => {
      try {
        const response = await api.get(`/api/pipeline/${jobId}/status`)
        setResult(response.data)
      } catch (err) {
        console.error('Error fetching results:', err)
        setError('Failed to fetch pipeline results')
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [jobId])

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Loading Pipeline Results...</h2>
        <div style={{ fontSize: '14px', color: '#666' }}>Job ID: {jobId}</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2 style={{ color: '#dc3545' }}>Error</h2>
        <p>{error}</p>
        <div style={{ fontSize: '14px', color: '#666' }}>Job ID: {jobId}</div>
      </div>
    )
  }

  if (!result) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>No Results Found</h2>
        <div style={{ fontSize: '14px', color: '#666' }}>Job ID: {jobId}</div>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>Pipeline Results</h1>
      <div style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
        Job ID: {result.jobId} | Completed: {new Date(result.completedAt).toLocaleString()}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px', 
          border: '1px solid #dee2e6',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>Schools Matched</h3>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#28a745' }}>
            {result.schoolsMatched}
          </div>
        </div>

        <div style={{ 
          padding: '20px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px', 
          border: '1px solid #dee2e6',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>Students Prepared</h3>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#007bff' }}>
            {result.studentsPrepared}
          </div>
        </div>

        <div style={{ 
          padding: '20px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px', 
          border: '1px solid #dee2e6',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>Parents Prepared</h3>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#6f42c1' }}>
            {result.parentsPrepared}
          </div>
        </div>

        <div style={{ 
          padding: '20px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px', 
          border: '1px solid #dee2e6',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>Exceptions</h3>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: result.exceptions > 0 ? '#dc3545' : '#28a745' }}>
            {result.exceptions}
          </div>
        </div>
      </div>

      <div style={{ 
        padding: '20px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '8px', 
        border: '1px solid #dee2e6',
        marginBottom: '30px'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#495057' }}>Data Quality Score</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ 
            fontSize: '48px', 
            fontWeight: 'bold', 
            color: result.overallDqScore >= 90 ? '#28a745' : result.overallDqScore >= 75 ? '#ffc107' : '#dc3545'
          }}>
            {result.overallDqScore.toFixed(1)}%
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ 
              width: '100%', 
              height: '20px', 
              backgroundColor: '#e9ecef', 
              borderRadius: '10px',
              overflow: 'hidden'
            }}>
              <div style={{ 
                width: `${result.overallDqScore}%`, 
                height: '100%', 
                backgroundColor: result.overallDqScore >= 90 ? '#28a745' : result.overallDqScore >= 75 ? '#ffc107' : '#dc3545',
                transition: 'width 0.3s ease'
              }}></div>
            </div>
            <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '5px' }}>
              {result.overallDqScore >= 90 ? 'Excellent' : result.overallDqScore >= 75 ? 'Good' : 'Needs Improvement'}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
        <button 
          onClick={() => window.location.href = `/api/pipeline/${result.jobId}/download/students`}
          style={{
            padding: '12px 24px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Download Students Export
        </button>
        
        <button 
          onClick={() => window.location.href = `/api/pipeline/${result.jobId}/download/parents`}
          style={{
            padding: '12px 24px',
            backgroundColor: '#6f42c1',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Download Parents Export
        </button>

        {result.exceptions > 0 && (
          <button 
            onClick={() => window.location.href = '/exceptions'}
            style={{
              padding: '12px 24px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Review Exceptions ({result.exceptions})
          </button>
        )}
      </div>

      <div style={{ marginTop: '30px', textAlign: 'center' }}>
        <button 
          onClick={() => window.location.href = '/upload'}
          style={{
            padding: '10px 20px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          ← Start New Pipeline
        </button>
      </div>
    </div>
  )
}
