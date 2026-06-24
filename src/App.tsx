import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Scoreboard from './pages/Scoreboard';
import Admin from './pages/Admin';
import MatchScoring from './pages/MatchScoring';
import Players from './pages/Players';
import MyPlayer from './pages/MyPlayer';
import Itinerary from './pages/Itinerary';
import Scorecards from './pages/Scorecards';
import PrintableScorecard from './pages/PrintableScorecard';
import Merch from './pages/Merch';
import Games from './pages/Games';
import SoloRounds from './pages/SoloRounds';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/scores" element={<Scoreboard />} />
        <Route path="/players" element={<Players />} />
        <Route path="/itinerary" element={<Itinerary />} />
        <Route path="/scorecards" element={<Scorecards />} />
        <Route path="/scorecards/:matchupId" element={<PrintableScorecard />} />
        <Route path="/solo" element={<SoloRounds />} />
        <Route path="/merch" element={<Merch />} />
        <Route path="/games" element={<Games />} />
        <Route path="/my-player" element={<MyPlayer />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/match/:matchupId" element={<MatchScoring />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
