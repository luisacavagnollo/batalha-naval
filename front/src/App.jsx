import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import Login from './pages/Login';
import Lobby from './pages/Lobby';
import PlaceShips from './pages/PlaceShips';
import Game from './pages/Game';
import GameOver from './pages/GameOver';

function isTokenValid(token) {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    // exp está em segundos, Date.now() em ms
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!isTokenValid(token)) {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    return <Navigate to="/" />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <GameProvider>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/lobby" element={<PrivateRoute><Lobby /></PrivateRoute>} />
          <Route path="/place-ships/:gameId" element={<PrivateRoute><PlaceShips /></PrivateRoute>} />
          <Route path="/game/:gameId" element={<PrivateRoute><Game /></PrivateRoute>} />
          <Route path="/game-over" element={<PrivateRoute><GameOver /></PrivateRoute>} />
        </Routes>
      </GameProvider>
    </BrowserRouter>
  );
}
