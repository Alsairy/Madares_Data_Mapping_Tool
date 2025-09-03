import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card'
import { Button } from '../components/Button'
import { Badge } from '../components/Badge'

export default function PipelineRun() {
  const [files, setFiles] = useState<{
    tarkhees?: File
    noor?: File
    madaris?: File
  }>({})
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const navigate = useNavigate()

  const handleFileChange = (type: 'tarkhees' | 'noor' | 'madaris', file: File | null) => {
    setFiles(prev => ({ ...prev, [type]: file || undefined }))
  }

  const handleSubmit = async () => {
    if (!files.tarkhees || !files.noor || !files.madaris) {
      alert('Please upload all three files')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('licenseFile', files.tarkhees)
      formData.append('noorRosterFile', files.noor)
      formData.append('madarisSchoolsFile', files.madaris)
      
      const response = await api.post('/api/pipeline/run', formData)
      setResult(response.data)
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const downloadFile = async (filename: string) => {
    if (!result?.jobId) return
    const allowed = ['students_master.xlsx', 'parents_master.xlsx', 'mapping_report.csv', 'student_parent_links.xlsx']
    if (!allowed.includes(filename)) {
      console.error('Invalid filename requested'); return
    }
    try {
      window.location.href = `${api.defaults.baseURL}/api/pipeline/${result.jobId}/download/${filename}`
    } catch (error) {
      console.error('Download failed:', error)
      alert('Download failed')
    }
  }

  const fileInputs = [
    {
      type: 'tarkhees' as const,
      title: 'Tarkhees License File',
      description: 'Upload the Tarkhees license file with CR mappings',
      icon: '📄'
    },
    {
      type: 'noor' as const,
      title: 'Noor Roster',
      description: 'Upload the Noor roster with students, parents, and school data',
      icon: '👥'
    },
    {
      type: 'madaris' as const,
      title: 'Madaris Schools Extract',
      description: 'Upload the Madaris schools extract file',
      icon: '🏫'
    }
  ]

  const downloadOptions = [
    {
      filename: 'students_master.xlsx',
      title: 'Students Excel',
      description: 'Complete student records',
      icon: '👨‍🎓',
      variant: 'success' as const
    },
    {
      filename: 'parents_master.xlsx',
      title: 'Parents Excel',
      description: 'Complete parent records',
      icon: '👨‍👩‍👧‍👦',
      variant: 'secondary' as const
    },
    {
      filename: 'mapping_report.csv',
      title: 'Mapping CSV',
      description: 'Detailed mapping report',
      icon: '📊',
      variant: 'warning' as const
    }
  ]

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Standalone Pipeline</h1>
        <p className="text-lg text-gray-600">
          Upload three files to run the complete mapping and cleansing pipeline
        </p>
      </div>

      {!result && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {fileInputs.map((input) => (
              <Card key={input.type} className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span className="text-2xl">{input.icon}</span>
                    <span>{input.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">{input.description}</p>
                  
                  <div className="space-y-3">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept=".xlsx,.csv"
                        onChange={(e) => handleFileChange(input.type, e.target.files?.[0] || null)}
                        className="hidden"
                      />
                      <Button variant="secondary" size="sm" className="w-full">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Choose File
                      </Button>
                    </label>
                    
                    {files[input.type] && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-green-800 truncate">
                              {files[input.type]!.name}
                            </p>
                            <p className="text-xs text-green-600">
                              {(files[input.type]!.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Button
              onClick={handleSubmit}
              disabled={!files.tarkhees || !files.noor || !files.madaris}
              loading={uploading}
              variant="primary"
              size="lg"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {uploading ? 'Running mapping & cleansing...' : 'Run mapping & cleansing'}
            </Button>
          </div>
        </>
      )}

      {result && (
        <div className="space-y-6">
          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-green-900">
                <span>✅</span>
                <span>Pipeline Completed Successfully</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-800 font-medium">Job completed successfully</p>
                  <p className="text-sm text-green-600">Job ID: {result.jobId}</p>
                </div>
                <Badge variant="success" size="lg">
                  Complete
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>📥</span>
                <span>Download Reports</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {downloadOptions.map((option) => (
                  <div
                    key={option.filename}
                    className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                  >
                    <div className="text-center space-y-3">
                      <div className="text-3xl">{option.icon}</div>
                      <div>
                        <h3 className="font-medium text-gray-900">{option.title}</h3>
                        <p className="text-sm text-gray-500">{option.description}</p>
                      </div>
                      <Button
                        onClick={() => downloadFile(option.filename)}
                        variant={option.variant}
                        size="sm"
                        className="w-full"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <Button
              onClick={() => {
                setResult(null)
                setFiles({})
              }}
              variant="secondary"
              size="lg"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Process New Files
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
