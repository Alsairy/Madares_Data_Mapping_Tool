import React, { useState } from 'react'
import api from '../services/api'

interface FileUpload {
  file: File | null
  uploaded: boolean
  uploading: boolean
  error?: string
  batchId?: string
}

export default function UploadWizard() {
  const [step, setStep] = useState(1)
  const [files, setFiles] = useState<{
    tarkhees: FileUpload
    noor: FileUpload
    madaris: FileUpload
  }>({
    tarkhees: { file: null, uploaded: false, uploading: false },
    noor: { file: null, uploaded: false, uploading: false },
    madaris: { file: null, uploaded: false, uploading: false }
  })
  const [globalUploading, setGlobalUploading] = useState(false)

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
      padding: '40px 20px', 
      maxWidth: '900px', 
      margin: '0 auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: '700', 
          color: '#1a365d',
          marginBottom: '10px'
        }}>
          Madaris Data Upload Wizard
        </h1>
        <p style={{ 
          fontSize: '1.1rem', 
          color: '#4a5568',
          marginBottom: '0'
        }}>
          Upload your data files to begin the mapping process
        </p>
      </div>
      
      <div style={{ marginBottom: '40px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginBottom: '30px',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '10%',
            right: '10%',
            height: '2px',
            backgroundColor: '#e2e8f0',
            zIndex: 1
          }}>
            <div style={{
              height: '100%',
              backgroundColor: '#3182ce',
              width: `${((step - 1) / 2) * 100}%`,
              transition: 'width 0.3s ease'
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
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: step >= s ? '#3182ce' : '#e2e8f0',
                color: step >= s ? 'white' : '#a0aec0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '600',
                fontSize: '1.1rem',
                marginBottom: '8px',
                transition: 'all 0.3s ease',
                border: '3px solid white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                {step > s ? '✓' : s}
              </div>
              <span style={{
                fontSize: '0.9rem',
                fontWeight: '500',
                color: step >= s ? '#3182ce' : '#718096',
                textAlign: 'center'
              }}>
                {s === 1 ? 'Tarkhees License' : s === 2 ? 'Noor Roster' : 'Madaris Schools'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {step === 1 && (
        <div>
          <h2>Step 1: Upload Tarkhees License Data</h2>
          <p>Upload the Tarkhees license file (Excel or CSV format)</p>
          
          <div style={{ border: '2px dashed #ccc', padding: '40px', textAlign: 'center', marginBottom: '20px' }}>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => e.target.files && handleFileSelect('tarkhees', e.target.files[0])}
              style={{ marginBottom: '10px' }}
            />
            {files.tarkhees.file && (
              <div>
                <p>Selected: {files.tarkhees.file.name}</p>
                <button 
                  onClick={() => uploadFile('tarkhees')}
                  disabled={files.tarkhees.uploading || files.tarkhees.uploaded}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: files.tarkhees.uploaded ? '#28a745' : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: files.tarkhees.uploading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {files.tarkhees.uploaded ? 'Uploaded ✓' : files.tarkhees.uploading ? 'Uploading...' : 'Upload File'}
                </button>
              </div>
            )}
          </div>
          
          {files.tarkhees.uploaded && (
            <button 
              onClick={() => setStep(2)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Next Step →
            </button>
          )}
        </div>
      )}

      {step === 2 && (
        <div>
          <h2>Step 2: Upload Noor Roster Data</h2>
          <p>Upload the Noor roster file (Excel format)</p>
          
          <div style={{ border: '2px dashed #ccc', padding: '40px', textAlign: 'center', marginBottom: '20px' }}>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => e.target.files && handleFileSelect('noor', e.target.files[0])}
              style={{ marginBottom: '10px' }}
            />
            {files.noor.file && (
              <div>
                <p>Selected: {files.noor.file.name}</p>
                <button 
                  onClick={() => uploadFile('noor')}
                  disabled={files.noor.uploading || files.noor.uploaded}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: files.noor.uploaded ? '#28a745' : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: files.noor.uploading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {files.noor.uploaded ? 'Uploaded ✓' : files.noor.uploading ? 'Uploading...' : 'Upload File'}
                </button>
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => setStep(1)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              ← Previous
            </button>
            {files.noor.uploaded && (
              <button 
                onClick={() => setStep(3)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Next Step →
              </button>
            )}
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h2>Step 3: Upload Madaris Schools Data</h2>
          <p>Upload the Madaris schools file (Excel or CSV format)</p>
          
          <div style={{ border: '2px dashed #ccc', padding: '40px', textAlign: 'center', marginBottom: '20px' }}>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => e.target.files && handleFileSelect('madaris', e.target.files[0])}
              style={{ marginBottom: '10px' }}
            />
            {files.madaris.file && (
              <div>
                <p>Selected: {files.madaris.file.name}</p>
                <button 
                  onClick={() => uploadFile('madaris')}
                  disabled={files.madaris.uploading || files.madaris.uploaded}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: files.madaris.uploaded ? '#28a745' : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: files.madaris.uploading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {files.madaris.uploaded ? 'Uploaded ✓' : files.madaris.uploading ? 'Uploading...' : 'Upload File'}
                </button>
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => setStep(2)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              ← Previous
            </button>
            {allFilesUploaded && (
              <button 
                onClick={startProcessing}
                disabled={globalUploading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: globalUploading ? 'not-allowed' : 'pointer'
                }}
              >
                {globalUploading ? 'Processing...' : 'Start Processing →'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
