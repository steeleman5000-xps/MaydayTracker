import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Scoreboard from './pages/Scoreboard';
import Admin from './pages/Admin';
import MatchScoring from './pages/MatchScoring';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Scoreboard />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/match/:matchupId" element={<MatchScoring />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
