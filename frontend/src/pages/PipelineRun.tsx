import { useState } from 'react'
import api from '../services/api'

export default function PipelineRun(){
  const [licenseFile, setLicenseFile] = useState<File|null>(null)
  const [noorFile, setNoorFile] = useState<File|null>(null)
  const [madarisFile, setMadarisFile] = useState<File|null>(null)
  const [job, setJob] = useState<any>(null)
  const [busy, setBusy] = useState(false)

  const run = async ()=>{
    if(!licenseFile || !noorFile || !madarisFile) return
    setBusy(true)
    const form = new FormData()
    form.append('licenseFile', licenseFile)
    form.append('noorRosterFile', noorFile)
    form.append('madarisSchoolsFile', madarisFile)
    const res = await api.post('/api/pipeline/run', form)
    setJob(res.data)
    setBusy(false)
  }

  const dl = (name:string)=>{
    if(!job) return
    window.location.href = `${api.defaults.baseURL}/api/pipeline/${job.jobId}/download/${name}`
  }

  return (
    <div>
      <h2>Standalone Pipeline (3 files)</h2>
      <div style={{display:'grid', gap:8, maxWidth:600}}>
        <label>Tarkhees License file <input type='file' onChange={e=>setLicenseFile(e.target.files?.[0] || null)} /></label>
        <label>Noor roster (students+parents+school) <input type='file' onChange={e=>setNoorFile(e.target.files?.[0] || null)} /></label>
        <label>Madaris schools extract <input type='file' onChange={e=>setMadarisFile(e.target.files?.[0] || null)} /></label>
        <button onClick={run} disabled={busy || !licenseFile || !noorFile || !madarisFile}>{busy? 'Running...' : 'Run mapping & cleansing'}</button>
      </div>

      {job && (
        <div style={{marginTop:16}}>
          <h3>Results</h3>
          <pre style={{background:'#f6f6f6', padding:12}}>{JSON.stringify(job, null, 2)}</pre>
          <div style={{display:'flex', gap:8}}>
            <button onClick={()=>dl('students_master.xlsx')}>Download Students Excel</button>
            <button onClick={()=>dl('parents_master.xlsx')}>Download Parents Excel</button>
            <button onClick={()=>dl('mapping_report.csv')}>Download Mapping Report</button>
          </div>
        </div>
      )}
    </div>
  )
}
