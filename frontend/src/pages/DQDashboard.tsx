import React, { useState, useEffect } from 'react'
import api from '../services/api'

interface KPIs {
  schoolMatchRate: number
  studentMatchRate: number
  parentMatchRate: number
  dqRulePassRate: number
  totalRecords: number
  openIssues: number
  resolvedIssues: number
}

interface TrendData {
  date: string
  batchCount: number
  recordsProcessed: number
}

interface RegionalData {
  region: string
  schoolCount: number
  studentCount: number
}

export default function DQDashboard() {
  const [kpis, setKpis] = useState<KPIs | null>(null)
  const [trends, setTrends] = useState<TrendData[]>([])
  const [regional, setRegional] = useState<RegionalData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const [kpisRes, trendsRes, regionalRes] = await Promise.all([
        api.get('/api/dashboard/kpis'),
        api.get('/api/dashboard/trends?days=30'),
        api.get('/api/dashboard/regional')
      ])
      
      setKpis(kpisRes.data)
      setTrends(trendsRes.data)
      setRegional(regionalRes.data)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading dashboard...</div>
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Data Quality Dashboard</h1>
      
      {kpis && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          <div style={{
            padding: '20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #dee2e6'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>School Match Rate</h3>
            <div style={{ fontSize: '2em', fontWeight: 'bold', color: kpis.schoolMatchRate >= 0.98 ? '#28a745' : '#dc3545' }}>
              {formatPercentage(kpis.schoolMatchRate)}
            </div>
            <small style={{ color: '#6c757d' }}>Target: ≥98%</small>
          </div>

          <div style={{
            padding: '20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #dee2e6'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>Student Match Rate</h3>
            <div style={{ fontSize: '2em', fontWeight: 'bold', color: kpis.studentMatchRate >= 0.95 ? '#28a745' : '#dc3545' }}>
              {formatPercentage(kpis.studentMatchRate)}
            </div>
            <small style={{ color: '#6c757d' }}>Target: ≥95%</small>
          </div>

          <div style={{
            padding: '20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #dee2e6'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>Parent Match Rate</h3>
            <div style={{ fontSize: '2em', fontWeight: 'bold', color: kpis.parentMatchRate >= 0.95 ? '#28a745' : '#dc3545' }}>
              {formatPercentage(kpis.parentMatchRate)}
            </div>
            <small style={{ color: '#6c757d' }}>Target: ≥95%</small>
          </div>

          <div style={{
            padding: '20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #dee2e6'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>DQ Rule Pass Rate</h3>
            <div style={{ fontSize: '2em', fontWeight: 'bold', color: kpis.dqRulePassRate >= 0.90 ? '#28a745' : '#dc3545' }}>
              {formatPercentage(kpis.dqRulePassRate)}
            </div>
            <small style={{ color: '#6c757d' }}>Target: ≥90%</small>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '40px' }}>
        <div>
          <h2>Processing Trends (Last 30 Days)</h2>
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #dee2e6'
          }}>
            {trends.length > 0 ? (
              <div>
                {trends.map((trend, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '10px 0',
                    borderBottom: index < trends.length - 1 ? '1px solid #dee2e6' : 'none'
                  }}>
                    <span>{new Date(trend.date).toLocaleDateString()}</span>
                    <span>{trend.batchCount} batches</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#6c757d', textAlign: 'center' }}>No processing data available</p>
            )}
          </div>
        </div>

        <div>
          <h2>Regional Coverage</h2>
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #dee2e6'
          }}>
            {regional.length > 0 ? (
              <div>
                {regional.slice(0, 10).map((region, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '10px 0',
                    borderBottom: index < Math.min(regional.length, 10) - 1 ? '1px solid #dee2e6' : 'none'
                  }}>
                    <span>{region.region}</span>
                    <span>{region.schoolCount} schools, {region.studentCount} students</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#6c757d', textAlign: 'center' }}>No regional data available</p>
            )}
          </div>
        </div>
      </div>

      {kpis && (
        <div>
          <h2>Issue Summary</h2>
          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{
              padding: '20px',
              backgroundColor: '#fff3cd',
              borderRadius: '8px',
              border: '1px solid #ffeaa7',
              flex: 1
            }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#856404' }}>Open Issues</h3>
              <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#856404' }}>
                {kpis.openIssues}
              </div>
            </div>

            <div style={{
              padding: '20px',
              backgroundColor: '#d1edff',
              borderRadius: '8px',
              border: '1px solid #bee5eb',
              flex: 1
            }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#0c5460' }}>Resolved Issues</h3>
              <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#0c5460' }}>
                {kpis.resolvedIssues}
              </div>
            </div>

            <div style={{
              padding: '20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #dee2e6',
              flex: 1
            }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>Total Records</h3>
              <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#495057' }}>
                {kpis.totalRecords.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
