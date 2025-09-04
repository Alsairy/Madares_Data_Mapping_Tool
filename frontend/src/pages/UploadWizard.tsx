import React, { useState, useRef } from 'react'
import api from '../services/api'

interface FileUpload {
  file: File | null
  uploaded: boolean
  uploading: boolean
  error?: string
  batchId?: string
  progress?: number
}

interface ProcessingStatus {
  isProcessing: boolean
  jobId?: string
  progress?: number
  status?: string
  error?: string
}

export default function UploadWizard() {
  const [step, setStep] = useState(1)
  const [files, setFiles] = useState<{
    tarkhees: FileUpload
    noor: FileUpload
    madaris: FileUpload
  }>({
    tarkhees: { file: null, uploaded: false, uploading: false, progress: 0 },
    noor: { file: null, uploaded: false, uploading: false, progress: 0 },
    madaris: { file: null, uploaded: false, uploading: false, progress: 0 }
  })
  const [globalUploading, setGlobalUploading] = useState(false)
  const [processing, setProcessing] = useState<ProcessingStatus>({ isProcessing: false })
  const [showSuccess, setShowSuccess] = useState(false)
  
  const fileInputRefs = {
    tarkhees: useRef<HTMLInputElement>(null),
    noor: useRef<HTMLInputElement>(null),
    madaris: useRef<HTMLInputElement>(null)
  }

  const handleFileSelect = (type: keyof typeof files, file: File) => {
    setFiles(prev => ({
      ...prev,
      [type]: { file, uploaded: false, uploading: false, error: undefined }
    }))
  }

  const uploadFile = async (type: keyof typeof files) => {
    const fileData = files[type]
    if (!fileData.file) return

    setFiles(prev => ({
      ...prev,
      [type]: { ...prev[type], uploading: true, error: undefined }
    }))
    
    try {
      const formData = new FormData()
      formData.append('file', fileData.file)
      
      const response = await api.post(`/api/pipeline/ingest/${type}`, formData)
      
      setFiles(prev => ({
        ...prev,
        [type]: { ...prev[type], uploaded: true, uploading: false, batchId: response.data.uploadId }
      }))
    } catch (error) {
      console.error(`Error uploading ${type} file:`, error)
      setFiles(prev => ({
        ...prev,
        [type]: { ...prev[type], uploading: false, error: 'Upload failed. Please try again.' }
      }))
    }
  }

  const allFilesUploaded = Object.values(files).every(f => f.uploaded)

  const startProcessing = async () => {
    if (!allFilesUploaded) return
    
    setGlobalUploading(true)
    try {
      const response = await api.post('/api/pipeline/process', {
        tarkheesUploadId: files.tarkhees.batchId,
        noorUploadId: files.noor.batchId,
        madarisUploadId: files.madaris.batchId,
        uploadedBy: 'wizard-user'
      })
      
      window.location.href = `/results?jobId=${response.data.jobId}`
    } catch (error) {
      console.error('Error processing files:', error)
      alert('Error processing files. Please try again.')
    } finally {
      setGlobalUploading(false)
    }
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '40px 20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '20px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        <div style={{ 
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          padding: '40px',
          textAlign: 'center',
          color: 'white'
        }}>
          <h1 style={{ 
            fontSize: '3rem', 
            fontWeight: '800', 
            marginBottom: '15px',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}>
            🎯 Madaris Data Upload Wizard
          </h1>
          <p style={{ 
            fontSize: '1.3rem', 
            opacity: '0.9',
            marginBottom: '0',
            fontWeight: '300'
          }}>
            Transform your data with our intelligent mapping system
          </p>
        </div>
        
          <div style={{ marginBottom: '50px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '40px',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '25px',
                left: '10%',
                right: '10%',
                height: '4px',
                backgroundColor: '#e2e8f0',
                borderRadius: '2px',
                zIndex: 1
              }}>
                <div style={{
                  height: '100%',
                  background: 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)',
                  width: `${((step - 1) / 2) * 100}%`,
                  transition: 'width 0.5s ease',
                  borderRadius: '2px'
                }}></div>
              </div>
              {[1, 2, 3].map(s => (
                <div key={s} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  zIndex: 2,
                  position: 'relative'
                }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: step >= s ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' : '#f7fafc',
                    color: step >= s ? 'white' : '#a0aec0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    fontSize: '1.2rem',
                    marginBottom: '12px',
                    transition: 'all 0.3s ease',
                    border: step >= s ? '3px solid white' : '3px solid #e2e8f0',
                    boxShadow: step >= s ? '0 8px 25px rgba(79, 172, 254, 0.3)' : '0 2px 4px rgba(0,0,0,0.1)'
                  }}>
                    {step > s ? '✓' : s}
                  </div>
                  <span style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: step >= s ? '#2d3748' : '#718096',
                    textAlign: 'center',
                    maxWidth: '120px'
                  }}>
                    {s === 1 ? '📄 Tarkhees License' : s === 2 ? '👥 Noor Roster' : '🏫 Madaris Schools'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {step === 1 && (
            <div style={{ 
              background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
              borderRadius: '15px',
              padding: '40px',
              border: '1px solid #e2e8f0'
            }}>
              <h2 style={{ 
                fontSize: '2rem', 
                fontWeight: '700', 
                color: '#2d3748',
                marginBottom: '15px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                📄 Step 1: Upload Tarkhees License Data
              </h2>
              <p style={{ 
                fontSize: '1.1rem', 
                color: '#4a5568',
                marginBottom: '30px'
              }}>
                Upload the Tarkhees license file (Excel or CSV format)
              </p>
              
              <div style={{ 
                border: '3px dashed #4facfe', 
                borderRadius: '15px',
                padding: '50px', 
                textAlign: 'center', 
                marginBottom: '30px',
                background: 'rgba(79, 172, 254, 0.05)',
                transition: 'all 0.3s ease'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '20px' }}>📁</div>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => e.target.files && handleFileSelect('tarkhees', e.target.files[0])}
                  style={{ 
                    marginBottom: '20px',
                    padding: '10px',
                    fontSize: '1rem',
                    borderRadius: '8px',
                    border: '2px solid #e2e8f0'
                  }}
                />
                {files.tarkhees.file && (
                  <div style={{ marginTop: '20px' }}>
                    <p style={{ 
                      fontSize: '1.1rem', 
                      fontWeight: '600', 
                      color: '#2d3748',
                      marginBottom: '20px'
                    }}>
                      ✅ Selected: {files.tarkhees.file.name}
                    </p>
                    <button 
                      onClick={() => uploadFile('tarkhees')}
                      disabled={files.tarkhees.uploading || files.tarkhees.uploaded}
                      style={{
                        padding: '15px 30px',
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        background: files.tarkhees.uploaded ? 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)' : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: files.tarkhees.uploading ? 'not-allowed' : 'pointer',
                        boxShadow: '0 4px 15px rgba(79, 172, 254, 0.3)',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {files.tarkhees.uploaded ? '✅ Uploaded Successfully!' : files.tarkhees.uploading ? '⏳ Uploading...' : '🚀 Upload File'}
                    </button>
                    {files.tarkhees.error && (
                      <p style={{ color: '#e53e3e', marginTop: '10px', fontWeight: '600' }}>
                        ❌ {files.tarkhees.error}
                      </p>
                    )}
                  </div>
                )}
              </div>
              
              {files.tarkhees.uploaded && (
                <div style={{ textAlign: 'center' }}>
                  <button 
                    onClick={() => setStep(2)}
                    style={{
                      padding: '15px 30px',
                      fontSize: '1.1rem',
                      fontWeight: '600',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Next Step → 👥
                  </button>
                </div>
              )}
            </div>
          )}

      {step === 2 && (
        <div style={{ 
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          borderRadius: '15px',
          padding: '40px',
          border: '1px solid #e2e8f0'
        }}>
          <h2 style={{ 
            fontSize: '2rem', 
            fontWeight: '700', 
            color: '#2d3748',
            marginBottom: '15px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            👥 Step 2: Upload Noor Roster Data
          </h2>
          <p style={{ 
            fontSize: '1.1rem', 
            color: '#4a5568',
            marginBottom: '30px'
          }}>
            Upload the Noor roster file (Excel format)
          </p>
          
          <div style={{ 
            border: '3px dashed #4facfe', 
            borderRadius: '15px',
            padding: '50px', 
            textAlign: 'center', 
            marginBottom: '30px',
            background: 'rgba(79, 172, 254, 0.05)',
            transition: 'all 0.3s ease'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>👥</div>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => e.target.files && handleFileSelect('noor', e.target.files[0])}
              style={{ 
                marginBottom: '20px',
                padding: '10px',
                fontSize: '1rem',
                borderRadius: '8px',
                border: '2px solid #e2e8f0'
              }}
            />
            {files.noor.file && (
              <div style={{ marginTop: '20px' }}>
                <p style={{ 
                  fontSize: '1.1rem', 
                  fontWeight: '600', 
                  color: '#2d3748',
                  marginBottom: '20px'
                }}>
                  ✅ Selected: {files.noor.file.name}
                </p>
                <button 
                  onClick={() => uploadFile('noor')}
                  disabled={files.noor.uploading || files.noor.uploaded}
                  style={{
                    padding: '15px 30px',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    background: files.noor.uploaded ? 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)' : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: files.noor.uploading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 15px rgba(79, 172, 254, 0.3)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {files.noor.uploaded ? '✅ Uploaded Successfully!' : files.noor.uploading ? '⏳ Uploading...' : '🚀 Upload File'}
                </button>
                {files.noor.error && (
                  <p style={{ color: '#e53e3e', marginTop: '10px', fontWeight: '600' }}>
                    ❌ {files.noor.error}
                  </p>
                )}
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
            <button 
              onClick={() => setStep(1)}
              style={{
                padding: '15px 30px',
                fontSize: '1.1rem',
                fontWeight: '600',
                background: 'linear-gradient(135deg, #718096 0%, #4a5568 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(113, 128, 150, 0.3)',
                transition: 'all 0.3s ease'
              }}
            >
              ← Previous Step
            </button>
            {files.noor.uploaded && (
              <button 
                onClick={() => setStep(3)}
                style={{
                  padding: '15px 30px',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
                  transition: 'all 0.3s ease'
                }}
              >
                Next Step → 🏫
              </button>
            )}
          </div>
        </div>
      )}

      {step === 3 && (
        <div style={{ 
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          borderRadius: '15px',
          padding: '40px',
          border: '1px solid #e2e8f0'
        }}>
          <h2 style={{ 
            fontSize: '2rem', 
            fontWeight: '700', 
            color: '#2d3748',
            marginBottom: '15px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            🏫 Step 3: Upload Madaris Schools Data
          </h2>
          <p style={{ 
            fontSize: '1.1rem', 
            color: '#4a5568',
            marginBottom: '30px'
          }}>
            Upload the Madaris schools file (Excel or CSV format)
          </p>
          
          <div style={{ 
            border: '3px dashed #4facfe', 
            borderRadius: '15px',
            padding: '50px', 
            textAlign: 'center', 
            marginBottom: '30px',
            background: 'rgba(79, 172, 254, 0.05)',
            transition: 'all 0.3s ease'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🏫</div>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => e.target.files && handleFileSelect('madaris', e.target.files[0])}
              style={{ 
                marginBottom: '20px',
                padding: '10px',
                fontSize: '1rem',
                borderRadius: '8px',
                border: '2px solid #e2e8f0'
              }}
            />
            {files.madaris.file && (
              <div style={{ marginTop: '20px' }}>
                <p style={{ 
                  fontSize: '1.1rem', 
                  fontWeight: '600', 
                  color: '#2d3748',
                  marginBottom: '20px'
                }}>
                  ✅ Selected: {files.madaris.file.name}
                </p>
                <button 
                  onClick={() => uploadFile('madaris')}
                  disabled={files.madaris.uploading || files.madaris.uploaded}
                  style={{
                    padding: '15px 30px',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    background: files.madaris.uploaded ? 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)' : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: files.madaris.uploading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 15px rgba(79, 172, 254, 0.3)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {files.madaris.uploaded ? '✅ Uploaded Successfully!' : files.madaris.uploading ? '⏳ Uploading...' : '🚀 Upload File'}
                </button>
                {files.madaris.error && (
                  <p style={{ color: '#e53e3e', marginTop: '10px', fontWeight: '600' }}>
                    ❌ {files.madaris.error}
                  </p>
                )}
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
            <button 
              onClick={() => setStep(2)}
              style={{
                padding: '15px 30px',
                fontSize: '1.1rem',
                fontWeight: '600',
                background: 'linear-gradient(135deg, #718096 0%, #4a5568 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(113, 128, 150, 0.3)',
                transition: 'all 0.3s ease'
              }}
            >
              ← Previous Step
            </button>
            {allFilesUploaded && (
              <button 
                onClick={startProcessing}
                disabled={globalUploading}
                style={{
                  padding: '15px 30px',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  background: globalUploading ? 'linear-gradient(135deg, #fbb6ce 0%, #f687b3 100%)' : 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: globalUploading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 15px rgba(72, 187, 120, 0.3)',
                  transition: 'all 0.3s ease'
                }}
              >
                {globalUploading ? '⏳ Processing Pipeline...' : '🚀 Start Processing →'}
              </button>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
