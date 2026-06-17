import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Scoreboard from './pages/Scoreboard';
import Admin from './pages/Admin';
import MatchScoring from './pages/MatchScoring';
import Players from './pages/Players';
import MyPlayer from './pages/MyPlayer';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Scoreboard />} />
        <Route path="/players" element={<Players />} />
        <Route path="/my-player" element={<MyPlayer />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/match/:matchupId" element={<MatchScoring />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
