import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { NominatePage } from './pages/NominatePage'
import { VotePage } from './pages/VotePage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<NominatePage />} />
        <Route path="/vote" element={<VotePage />} />
      </Routes>
    </BrowserRouter>
  )
}
