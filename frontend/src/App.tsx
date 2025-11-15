import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ComputationalJobsDashboard } from './pages/ComputationalJobsDashboard'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/dashboard" element={<ComputationalJobsDashboard />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  )
}

export default App