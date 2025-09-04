import React, { useState, useRef } from 'react'
import api from '../services/api'

interface FileUploadState {
  file: File | null
  uploading: boolean
  uploaded: boolean
  error: string | null
}

const UploadWizard: React.FC = () => {
  const [tarkhees, setTarkhees] = useState<FileUploadState>({
    file: null,
    uploading: false,
    uploaded: false,
    error: null
  })
  
  const [noor, setNoor] = useState<FileUploadState>({
    file: null,
    uploading: false,
    uploaded: false,
    error: null
  })
  
  const [madaris, setMadaris] = useState<FileUploadState>({
    file: null,
    uploading: false,
    uploaded: false,
    error: null
  })

  const [processing, setProcessing] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState<string | null>(null)

  const fileInputRefs = {
    tarkhees: useRef<HTMLInputElement>(null),
    noor: useRef<HTMLInputElement>(null),
    madaris: useRef<HTMLInputElement>(null)
  }

  const validateFile = (file: File): string | null => {
    const validTypes = ['.csv', '.xlsx', '.xls']
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    
    if (!validTypes.includes(fileExtension)) {
      return 'Please select a CSV or Excel file (.csv, .xlsx, .xls)'
    }
    
    if (file.size > 50 * 1024 * 1024) {
      return 'File size must be less than 50MB'
    }
    
    return null
  }

  const handleFileSelect = (
    event: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<FileUploadState>>
  ) => {
    const file = event.target.files?.[0]
    if (file) {
      const error = validateFile(file)
      setter(prev => ({ ...prev, file, error, uploaded: false }))
    }
  }

  const handleDrop = (
    event: React.DragEvent<HTMLDivElement>,
    setter: React.Dispatch<React.SetStateAction<FileUploadState>>
  ) => {
    event.preventDefault()
    setDragOver(null)
    
    const file = event.dataTransfer.files[0]
    if (file) {
      const error = validateFile(file)
      setter(prev => ({ ...prev, file, error, uploaded: false }))
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>, type: string) => {
    event.preventDefault()
    setDragOver(type)
  }

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragOver(null)
  }

  const uploadFile = async (
    file: File,
    endpoint: string,
    setter: React.Dispatch<React.SetStateAction<FileUploadState>>
  ) => {
    setter(prev => ({ ...prev, uploading: true, error: null }))
    
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await api.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1))
          console.log(`Upload progress: ${percentCompleted}%`)
        }
      })
      
      setter(prev => ({ ...prev, uploading: false, uploaded: true }))
      console.log('Upload successful:', response.data)
    } catch (error: any) {
      console.error('Upload failed:', error)
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Upload failed. Please try again.'
      setter(prev => ({ 
        ...prev, 
        uploading: false, 
        error: errorMessage 
      }))
    }
  }

  const handleUpload = async (
    state: FileUploadState,
    endpoint: string,
    setter: React.Dispatch<React.SetStateAction<FileUploadState>>
  ) => {
    if (!state.file || state.error) return
    await uploadFile(state.file, endpoint, setter)
  }

  const runPipeline = async () => {
    if (!tarkhees.uploaded || !noor.uploaded || !madaris.uploaded) {
      alert('Please upload all three files first')
      return
    }

    setProcessing(true)
    
    const formData = new FormData()
    if (tarkhees.file) formData.append('licenseFile', tarkhees.file)
    if (noor.file) formData.append('noorRosterFile', noor.file)
    if (madaris.file) formData.append('madarisSchoolsFile', madaris.file)

    try {
      const response = await api.post('/api/pipeline/run', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      })
      setJobId(response.data.jobId || response.data.batchId || 'Processing started')
      setProcessing(false)
    } catch (error: any) {
      console.error('Pipeline failed:', error)
      setProcessing(false)
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Pipeline processing failed. Please try again.'
      alert(errorMessage)
    }
  }

  const FileUploadCard = ({ 
    title, 
    description,
    state, 
    onFileSelect, 
    onUpload, 
    endpoint,
    type,
    inputRef
  }: {
    title: string
    description: string
    state: FileUploadState
    onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
    onUpload: () => void
    endpoint: string
    type: string
    inputRef: React.RefObject<HTMLInputElement>
  }) => (
    <div className={`upload-card ${state.uploaded ? 'uploaded' : ''} ${state.error ? 'error' : ''}`}>
      <div className="card-header">
        <h3>{title}</h3>
        <p className="description">{description}</p>
      </div>
      
      <div 
        className={`drop-zone ${dragOver === type ? 'drag-over' : ''} ${state.uploaded ? 'success' : ''}`}
        onDrop={(e) => handleDrop(e, type === 'tarkhees' ? setTarkhees : type === 'noor' ? setNoor : setMadaris)}
        onDragOver={(e) => handleDragOver(e, type)}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={onFileSelect}
          disabled={state.uploading || state.uploaded}
          style={{ display: 'none' }}
        />
        
        {state.uploaded ? (
          <div className="upload-success">
            <div className="success-icon">✅</div>
            <div className="success-text">
              <strong>Upload Complete</strong>
              <span>{state.file?.name}</span>
            </div>
          </div>
        ) : state.file ? (
          <div className="file-selected">
            <div className="file-icon">📄</div>
            <div className="file-details">
              <strong>{state.file.name}</strong>
              <span>{(state.file.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation()
                onUpload()
              }}
              disabled={state.uploading || !!state.error}
              className={`upload-btn ${state.uploading ? 'uploading' : ''}`}
            >
              {state.uploading ? (
                <>
                  <span className="spinner"></span>
                  Uploading...
                </>
              ) : (
                <>
                  <span>📤</span>
                  Upload File
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="drop-prompt">
            <div className="upload-icon">☁️</div>
            <div className="prompt-text">
              <strong>Drop your file here</strong>
              <span>or click to browse</span>
              <small>Supports CSV, Excel (.xlsx, .xls) • Max 50MB</small>
            </div>
          </div>
        )}
      </div>
      
      {state.error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {state.error}
        </div>
      )}
    </div>
  )

  const allFilesUploaded = tarkhees.uploaded && noor.uploaded && madaris.uploaded
  const hasErrors = !!(tarkhees.error || noor.error || madaris.error)

  return (
    <div className="upload-wizard">
      <div className="wizard-container">
        <div className="wizard-header">
          <div className="header-content">
            <h1>🎯 Madaris Data Mapping Tool</h1>
            <p>Upload the three required files to begin intelligent data processing and mapping</p>
            <div className="progress-indicator">
              <div className="step-indicators">
                <div className={`step ${tarkhees.uploaded ? 'completed' : tarkhees.file ? 'active' : ''}`}>
                  <span className="step-number">1</span>
                  <span className="step-label">Tarkhees</span>
                </div>
                <div className={`step ${noor.uploaded ? 'completed' : noor.file ? 'active' : ''}`}>
                  <span className="step-number">2</span>
                  <span className="step-label">Noor</span>
                </div>
                <div className={`step ${madaris.uploaded ? 'completed' : madaris.file ? 'active' : ''}`}>
                  <span className="step-number">3</span>
                  <span className="step-label">Madaris</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="upload-section">
          <div className="upload-grid">
            <FileUploadCard
              title="📋 Tarkhees License File"
              description="Ministry licensing data with school registration details"
              state={tarkhees}
              onFileSelect={(e) => handleFileSelect(e, setTarkhees)}
              onUpload={() => handleUpload(tarkhees, '/api/pipeline/ingest/tarkhees', setTarkhees)}
              endpoint="/api/pipeline/ingest/tarkhees"
              type="tarkhees"
              inputRef={fileInputRefs.tarkhees}
            />

            <FileUploadCard
              title="👥 Noor Roster File"
              description="Student enrollment data from the Noor education system"
              state={noor}
              onFileSelect={(e) => handleFileSelect(e, setNoor)}
              onUpload={() => handleUpload(noor, '/api/pipeline/ingest/noor', setNoor)}
              endpoint="/api/pipeline/ingest/noor"
              type="noor"
              inputRef={fileInputRefs.noor}
            />

            <FileUploadCard
              title="🏫 Madaris Schools File"
              description="School directory and administrative information"
              state={madaris}
              onFileSelect={(e) => handleFileSelect(e, setMadaris)}
              onUpload={() => handleUpload(madaris, '/api/pipeline/ingest/madaris', setMadaris)}
              endpoint="/api/pipeline/ingest/madaris"
              type="madaris"
              inputRef={fileInputRefs.madaris}
            />
          </div>
        </div>

        <div className="pipeline-section">
          <div className="pipeline-controls">
            <div className="controls-header">
              <h2>🚀 Data Processing Pipeline</h2>
              <p>Process and map data across all three systems</p>
            </div>
            
            <div className="pipeline-status">
              {allFilesUploaded ? (
                <div className="ready-status">
                  <span className="status-icon">✅</span>
                  <span>All files uploaded successfully - Ready to process!</span>
                </div>
              ) : (
                <div className="waiting-status">
                  <span className="status-icon">⏳</span>
                  <span>Upload all three files to begin processing</span>
                </div>
              )}
            </div>

            <button 
              onClick={runPipeline}
              disabled={!allFilesUploaded || processing || hasErrors}
              className={`run-pipeline-btn ${allFilesUploaded && !hasErrors ? 'ready' : ''}`}
            >
              {processing ? (
                <>
                  <span className="spinner large"></span>
                  Processing Data Pipeline...
                </>
              ) : (
                <>
                  <span>🚀</span>
                  {allFilesUploaded ? 'Run Data Pipeline' : 'Upload Files to Continue'}
                </>
              )}
            </button>
            
            {jobId && (
              <div className="job-status">
                <div className="status-header">
                  <span className="success-icon">🎉</span>
                  <strong>Pipeline Started Successfully!</strong>
                </div>
                <div className="job-details">
                  <span>Job ID: <code>{jobId}</code></span>
                  <p>Your data is being processed. You can monitor progress in the dashboard.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .upload-wizard {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 2rem 1rem;
        }

        .wizard-container {
          max-width: 1400px;
          margin: 0 auto;
        }

        .wizard-header {
          text-align: center;
          margin-bottom: 3rem;
          color: white;
        }

        .header-content h1 {
          font-size: 3rem;
          margin-bottom: 1rem;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
          font-weight: 700;
        }

        .header-content p {
          font-size: 1.3rem;
          opacity: 0.95;
          margin-bottom: 2rem;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }

        .progress-indicator {
          display: flex;
          justify-content: center;
          margin-top: 2rem;
        }

        .step-indicators {
          display: flex;
          gap: 3rem;
          align-items: center;
        }

        .step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.3s ease;
        }

        .step-number {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 1.1rem;
          transition: all 0.3s ease;
        }

        .step.active .step-number {
          background: rgba(255,255,255,0.3);
          transform: scale(1.1);
        }

        .step.completed .step-number {
          background: #48bb78;
          color: white;
        }

        .step-label {
          font-size: 0.9rem;
          opacity: 0.8;
          font-weight: 500;
        }

        .upload-section {
          margin-bottom: 3rem;
        }

        .upload-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 2rem;
        }

        .upload-card {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(0,0,0,0.1);
          transition: all 0.3s ease;
          border: 2px solid transparent;
        }

        .upload-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 60px rgba(0,0,0,0.15);
        }

        .upload-card.uploaded {
          border-color: #48bb78;
          background: linear-gradient(135deg, #f0fff4 0%, #ffffff 100%);
        }

        .upload-card.error {
          border-color: #e53e3e;
        }

        .card-header {
          padding: 2rem 2rem 1rem;
          border-bottom: 1px solid #f0f0f0;
        }

        .card-header h3 {
          color: #2d3748;
          margin-bottom: 0.5rem;
          font-size: 1.4rem;
          font-weight: 600;
        }

        .description {
          color: #718096;
          font-size: 0.95rem;
          line-height: 1.4;
          margin: 0;
        }

        .drop-zone {
          padding: 2rem;
          min-height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
        }

        .drop-zone:hover {
          background: #f8faff;
        }

        .drop-zone.drag-over {
          background: #e6f3ff;
          border-color: #667eea;
        }

        .drop-zone.success {
          background: #f0fff4;
        }

        .drop-prompt {
          text-align: center;
          color: #718096;
        }

        .upload-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
          opacity: 0.7;
        }

        .prompt-text strong {
          display: block;
          color: #2d3748;
          font-size: 1.1rem;
          margin-bottom: 0.5rem;
        }

        .prompt-text span {
          display: block;
          margin-bottom: 1rem;
        }

        .prompt-text small {
          color: #a0aec0;
          font-size: 0.85rem;
        }

        .file-selected {
          display: flex;
          align-items: center;
          gap: 1rem;
          width: 100%;
        }

        .file-icon {
          font-size: 2.5rem;
          opacity: 0.8;
        }

        .file-details {
          flex: 1;
          text-align: left;
        }

        .file-details strong {
          display: block;
          color: #2d3748;
          margin-bottom: 0.25rem;
          font-size: 1rem;
        }

        .file-details span {
          color: #718096;
          font-size: 0.9rem;
        }

        .upload-success {
          display: flex;
          align-items: center;
          gap: 1rem;
          color: #276749;
        }

        .success-icon {
          font-size: 3rem;
        }

        .success-text strong {
          display: block;
          font-size: 1.2rem;
          margin-bottom: 0.5rem;
        }

        .success-text span {
          color: #68d391;
          font-size: 0.95rem;
        }

        .upload-btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.95rem;
        }

        .upload-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }

        .upload-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .upload-btn.uploading {
          background: #a0aec0;
        }

        .error-message {
          padding: 1rem 2rem;
          background: #fed7d7;
          color: #c53030;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
          border-top: 1px solid #feb2b2;
        }

        .error-icon {
          font-size: 1.1rem;
        }

        .pipeline-section {
          display: flex;
          justify-content: center;
        }

        .pipeline-controls {
          background: white;
          padding: 3rem;
          border-radius: 20px;
          box-shadow: 0 15px 50px rgba(0,0,0,0.1);
          text-align: center;
          max-width: 600px;
          width: 100%;
        }

        .controls-header h2 {
          color: #2d3748;
          margin-bottom: 0.5rem;
          font-size: 2rem;
          font-weight: 700;
        }

        .controls-header p {
          color: #718096;
          margin-bottom: 2rem;
          font-size: 1.1rem;
        }

        .pipeline-status {
          margin-bottom: 2rem;
          padding: 1rem;
          border-radius: 12px;
        }

        .ready-status {
          background: #f0fff4;
          color: #276749;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-weight: 500;
        }

        .waiting-status {
          background: #fffaf0;
          color: #c05621;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-weight: 500;
        }

        .status-icon {
          font-size: 1.2rem;
        }

        .run-pipeline-btn {
          padding: 1.25rem 3rem;
          font-size: 1.3rem;
          font-weight: 700;
          border: none;
          border-radius: 12px;
          background: #a0aec0;
          color: white;
          cursor: not-allowed;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          width: 100%;
          max-width: 400px;
          margin: 0 auto;
        }

        .run-pipeline-btn.ready {
          background: linear-gradient(135deg, #48bb78, #38a169);
          cursor: pointer;
          box-shadow: 0 6px 25px rgba(72, 187, 120, 0.3);
        }

        .run-pipeline-btn.ready:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 0 10px 35px rgba(72, 187, 120, 0.4);
        }

        .run-pipeline-btn:disabled {
          opacity: 0.7;
        }

        .job-status {
          margin-top: 2rem;
          padding: 2rem;
          background: linear-gradient(135deg, #f0fff4, #e6fffa);
          border: 2px solid #9ae6b4;
          border-radius: 16px;
          color: #276749;
        }

        .status-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
          font-size: 1.2rem;
        }

        .success-icon {
          font-size: 1.5rem;
        }

        .job-details {
          text-align: center;
        }

        .job-details code {
          background: #e6fffa;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
          font-size: 0.9rem;
          font-weight: 600;
          color: #2d3748;
        }

        .job-details p {
          margin-top: 1rem;
          color: #2d5016;
          font-size: 0.95rem;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .spinner.large {
          width: 20px;
          height: 20px;
          border-width: 3px;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 1200px) {
          .upload-grid {
            grid-template-columns: 1fr;
            max-width: 500px;
            margin: 0 auto;
          }
        }

        @media (max-width: 768px) {
          .upload-wizard {
            padding: 1rem 0.5rem;
          }
          
          .header-content h1 {
            font-size: 2.2rem;
          }
          
          .header-content p {
            font-size: 1.1rem;
          }
          
          .step-indicators {
            gap: 1.5rem;
          }
          
          .upload-card {
            margin: 0 0.5rem;
          }
          
          .card-header,
          .drop-zone {
            padding: 1.5rem;
          }
          
          .pipeline-controls {
            padding: 2rem 1.5rem;
            margin: 0 0.5rem;
          }
          
          .run-pipeline-btn {
            font-size: 1.1rem;
            padding: 1rem 2rem;
          }
        }

        @media (max-width: 480px) {
          .file-selected {
            flex-direction: column;
            text-align: center;
            gap: 1rem;
          }
          
          .upload-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}} />
    </div>
  )
}

export default UploadWizard
