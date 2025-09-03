import React, { useState } from 'react'
import api from '../services/api'

interface FileUpload {
  file: File | null
  uploaded: boolean
  batchId?: string
}

export default function UploadWizard() {
  const [step, setStep] = useState(1)
  const [files, setFiles] = useState<{
    tarkhees: FileUpload
    noor: FileUpload
    madaris: FileUpload
  }>({
    tarkhees: { file: null, uploaded: false },
    noor: { file: null, uploaded: false },
    madaris: { file: null, uploaded: false }
  })
  const [uploading, setUploading] = useState(false)

  const handleFileSelect = (type: keyof typeof files, file: File) => {
    setFiles(prev => ({
      ...prev,
      [type]: { file, uploaded: false }
    }))
  }

  const uploadFile = async (type: keyof typeof files) => {
    const fileData = files[type]
    if (!fileData.file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', fileData.file)
      
      const response = await api.post(`/api/pipeline/ingest/${type}`, formData)
      
      setFiles(prev => ({
        ...prev,
        [type]: { ...prev[type], uploaded: true, batchId: response.data.uploadId }
      }))
    } catch (error) {
      console.error(`Error uploading ${type} file:`, error)
    } finally {
      setUploading(false)
    }
  }

  const allFilesUploaded = Object.values(files).every(f => f.uploaded)

  const startProcessing = async () => {
    if (!allFilesUploaded) return
    
    setUploading(true)
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
      setUploading(false)
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Data Upload Wizard</h1>
      
      <div style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{
              padding: '10px 20px',
              backgroundColor: step >= s ? '#007bff' : '#e9ecef',
              color: step >= s ? 'white' : '#6c757d',
              borderRadius: '5px'
            }}>
              Step {s}
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
                  disabled={uploading || files.tarkhees.uploaded}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: files.tarkhees.uploaded ? '#28a745' : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: uploading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {files.tarkhees.uploaded ? 'Uploaded ✓' : uploading ? 'Uploading...' : 'Upload File'}
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
                  disabled={uploading || files.noor.uploaded}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: files.noor.uploaded ? '#28a745' : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: uploading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {files.noor.uploaded ? 'Uploaded ✓' : uploading ? 'Uploading...' : 'Upload File'}
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
                  disabled={uploading || files.madaris.uploaded}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: files.madaris.uploaded ? '#28a745' : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: uploading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {files.madaris.uploaded ? 'Uploaded ✓' : uploading ? 'Uploading...' : 'Upload File'}
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
                disabled={uploading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: uploading ? 'not-allowed' : 'pointer'
                }}
              >
                {uploading ? 'Processing...' : 'Start Processing →'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
