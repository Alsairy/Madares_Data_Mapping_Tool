import { Link, Routes, Route } from 'react-router-dom'
import UploadWizard from '../pages/UploadWizard'
import DQDashboard from '../pages/DQDashboard'
import ExceptionsQueue from '../pages/ExceptionsQueue'
import RecordCompare from '../pages/RecordCompare'
import ImpactPreview from '../pages/ImpactPreview'
import PipelineRun from '../pages/PipelineRun'

export default function App() {
  return (
    <div style={{fontFamily:'system-ui', padding:20, maxWidth:1200, margin:'0 auto'}}>
      <h1>Madaris Data Cleansing & Mapping Tool</h1>
      <nav style={{display:'flex', gap:16}}>
        <Link to='/upload'>Upload</Link>
        <Link to='/dq'>DQ Dashboard</Link>
        <Link to='/exceptions'>Exceptions</Link>
        <Link to='/compare'>Record Compare</Link>
        <Link to='/impact'>Impact Preview</Link><Link to='/pipeline'>Pipeline</Link>
      </nav>
      <div style={{marginTop:20}}>
        <Routes>
          <Route path='/upload' element={<UploadWizard/>} />
          <Route path='/dq' element={<DQDashboard/>} />
          <Route path='/exceptions' element={<ExceptionsQueue/>} />
          <Route path='/compare' element={<RecordCompare/>} />
          <Route path='/impact' element={<ImpactPreview/>} />
          <Route index element={<PipelineRun/>} />
          <Route path='/pipeline' element={<PipelineRun/>} />
        </Routes>
      </div>
    </div>
  )
}
