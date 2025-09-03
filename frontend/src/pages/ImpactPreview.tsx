import React, { useState, useEffect } from 'react'
import api from '../services/api'

interface ImpactData {
  batchId: string
  newSchools: number
  updatedSchools: number
  newStudents: number
  updatedStudents: number
  newParents: number
  updatedParents: number
  openIssues: number
  highSeverityIssues: number
  readyForInjection: boolean
  estimatedDuration: string
}

export default function ImpactPreview() {
  const [batchId, setBatchId] = useState('')
  const [impact, setImpact] = useState<ImpactData | null>(null)
  const [loading, setLoading] = useState(false)
  const [injecting, setInjecting] = useState(false)
  const [simulate, setSimulate] = useState(true)

  const loadImpact = async () => {
    if (!batchId) return

    setLoading(true)
    try {
      const response = await api.get(`/api/batch/${batchId}/impact`)
      setImpact(response.data)
    } catch (error) {
      console.error('Error loading impact data:', error)
    } finally {
      setLoading(false)
    }
  }

  const executeInjection = async () => {
    if (!batchId) return

    setInjecting(true)
    try {
      const response = await api.post(`/api/batch/${batchId}/inject?simulate=${simulate}`)
      
      if (simulate) {
        alert('Simulation completed successfully! Check the results.')
      } else {
        alert('Data injection completed successfully!')
      }
      
      await loadImpact()
    } catch (error) {
      console.error('Error executing injection:', error)
      alert('Error during injection process')
    } finally {
      setInjecting(false)
    }
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Data Injection Impact Preview</h1>
      
      <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <h2>Select Batch for Impact Analysis</h2>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>Batch ID:</label>
            <input
              type="text"
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              placeholder="Enter batch ID"
              style={{
                padding: '8px 12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                width: '300px'
              }}
            />
          </div>
          <button
            onClick={loadImpact}
            disabled={loading || !batchId}
            style={{
              padding: '8px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Loading...' : 'Analyze Impact'}
          </button>
        </div>
      </div>

      {impact && (
        <div>
          <div style={{
            padding: '15px',
            marginBottom: '30px',
            backgroundColor: impact.readyForInjection ? '#d1edff' : '#fff3cd',
            borderRadius: '8px',
            border: `1px solid ${impact.readyForInjection ? '#bee5eb' : '#ffeaa7'}`
          }}>
            <h3 style={{ margin: '0 0 10px 0' }}>
              {impact.readyForInjection ? '✅ Ready for Injection' : '⚠️ Issues Require Resolution'}
            </h3>
            {!impact.readyForInjection && (
              <p style={{ margin: 0, color: '#856404' }}>
                {impact.highSeverityIssues} high severity issues must be resolved before injection
              </p>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            <div style={{
              padding: '20px',
              backgroundColor: 'white',
              borderRadius: '8px',
              border: '1px solid #dee2e6',
              textAlign: 'center'
            }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>Schools</h3>
              <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#28a745' }}>
                +{impact.newSchools}
              </div>
              <div style={{ color: '#6c757d' }}>New</div>
              <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#ffc107', marginTop: '10px' }}>
                ~{impact.updatedSchools}
              </div>
              <div style={{ color: '#6c757d' }}>Updated</div>
            </div>

            <div style={{
              padding: '20px',
              backgroundColor: 'white',
              borderRadius: '8px',
              border: '1px solid #dee2e6',
              textAlign: 'center'
            }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>Students</h3>
              <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#28a745' }}>
                +{impact.newStudents}
              </div>
              <div style={{ color: '#6c757d' }}>New</div>
              <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#ffc107', marginTop: '10px' }}>
                ~{impact.updatedStudents}
              </div>
              <div style={{ color: '#6c757d' }}>Updated</div>
            </div>

            <div style={{
              padding: '20px',
              backgroundColor: 'white',
              borderRadius: '8px',
              border: '1px solid #dee2e6',
              textAlign: 'center'
            }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>Parents</h3>
              <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#28a745' }}>
                +{impact.newParents}
              </div>
              <div style={{ color: '#6c757d' }}>New</div>
              <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#ffc107', marginTop: '10px' }}>
                ~{impact.updatedParents}
              </div>
              <div style={{ color: '#6c757d' }}>Updated</div>
            </div>

            <div style={{
              padding: '20px',
              backgroundColor: 'white',
              borderRadius: '8px',
              border: '1px solid #dee2e6',
              textAlign: 'center'
            }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>Data Quality</h3>
              <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#dc3545' }}>
                {impact.openIssues}
              </div>
              <div style={{ color: '#6c757d' }}>Open Issues</div>
              <div style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#dc3545', marginTop: '10px' }}>
                {impact.highSeverityIssues}
              </div>
              <div style={{ color: '#6c757d' }}>High Severity</div>
            </div>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <h3>Injection Settings</h3>
            <div style={{
              padding: '20px',
              backgroundColor: 'white',
              borderRadius: '8px',
              border: '1px solid #dee2e6'
            }}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="radio"
                    name="injectionMode"
                    checked={simulate}
                    onChange={() => setSimulate(true)}
                  />
                  <span>Simulation Mode (Safe - No actual changes)</span>
                </label>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="radio"
                    name="injectionMode"
                    checked={!simulate}
                    onChange={() => setSimulate(false)}
                  />
                  <span>Production Mode (Live injection - Irreversible)</span>
                </label>
              </div>
              
              <div style={{
                padding: '10px',
                backgroundColor: simulate ? '#e7f3ff' : '#fff3cd',
                borderRadius: '4px',
                marginBottom: '15px'
              }}>
                {simulate ? (
                  <span style={{ color: '#0066cc' }}>
                    ℹ️ Simulation mode will preview changes without modifying the database
                  </span>
                ) : (
                  <span style={{ color: '#856404' }}>
                    ⚠️ Production mode will make permanent changes to the database
                  </span>
                )}
              </div>

              <div style={{ marginBottom: '15px' }}>
                <strong>Estimated Duration:</strong> {impact.estimatedDuration}
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <button
              onClick={executeInjection}
              disabled={injecting || (!simulate && !impact.readyForInjection)}
              style={{
                padding: '15px 40px',
                backgroundColor: injecting ? '#e9ecef' : 
                  (!simulate && !impact.readyForInjection) ? '#dc3545' : 
                  simulate ? '#007bff' : '#28a745',
                color: injecting ? '#6c757d' : 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '1.2em',
                cursor: (injecting || (!simulate && !impact.readyForInjection)) ? 'not-allowed' : 'pointer'
              }}
            >
              {injecting ? 'Processing...' : 
               simulate ? 'Run Simulation' : 
               impact.readyForInjection ? 'Execute Live Injection' : 'Cannot Inject (Resolve Issues First)'}
            </button>
          </div>

          {!simulate && !impact.readyForInjection && (
            <div style={{
              marginTop: '20px',
              padding: '15px',
              backgroundColor: '#f8d7da',
              borderRadius: '8px',
              border: '1px solid #f5c6cb',
              textAlign: 'center'
            }}>
              <p style={{ margin: 0, color: '#721c24' }}>
                Production injection is blocked due to unresolved high severity issues. 
                Please resolve all critical data quality issues before proceeding.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
