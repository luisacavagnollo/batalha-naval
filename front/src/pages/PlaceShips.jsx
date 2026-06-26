import { useState } from 'react';
import { useParams } from 'react-router-dom';

const SHIPS = [
  { type: 'CARRIER', name: 'Porta-aviões', size: 5 },
  { type: 'BATTLESHIP', name: 'Navio-tanque', size: 4 },
  { type: 'CRUISER', name: 'Contratorpedeiro', size: 3 },
  { type: 'SUBMARINE', name: 'Submarino', size: 3 },
  { type: 'DESTROYER', name: 'Destroyer', size: 2 },
];

export default function PlaceShips() {
  const { gameId } = useParams();
  const [orientation, setOrientation] = useState('HORIZONTAL');
  const [currentShip, setCurrentShip] = useState(0);
  const [placed, setPlaced] = useState([]);

  const allPlaced = placed.length === SHIPS.length;

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4">Posicione seus navios</h1>

      <div className="mb-4 flex gap-4 items-center">
        <button
          onClick={() => setOrientation(o => o === 'HORIZONTAL' ? 'VERTICAL' : 'HORIZONTAL')}
          className="px-4 py-2 bg-slate-700 rounded hover:bg-slate-600"
        >
          Rotacionar ({orientation === 'HORIZONTAL' ? 'H' : 'V'})
        </button>
        {!allPlaced && (
          <span className="text-slate-300">
            Posicionar: {SHIPS[currentShip].name} ({SHIPS[currentShip].size})
          </span>
        )}
      </div>

      {/* Grid 10x10 */}
      <div className="grid grid-cols-10 gap-0.5 mb-4">
        {Array.from({ length: 100 }, (_, i) => {
          const row = Math.floor(i / 10);
          const col = i % 10;
          const isShip = placed.some(p =>
            p.cells.some(c => c.row === row && c.col === col)
          );
          return (
            <div
              key={i}
              className={`w-8 h-8 sm:w-10 sm:h-10 border border-slate-600 cursor-pointer ${isShip ? 'bg-slate-500' : 'bg-blue-900 hover:bg-blue-700'}`}
              onClick={() => {
                if (allPlaced) return;
                // Lógica de posicionamento será conectada ao hook
              }}
            />
          );
        })}
      </div>

      {allPlaced && (
        <button className="px-6 py-3 bg-green-600 hover:bg-green-500 rounded-lg font-semibold">
          Pronto!
        </button>
      )}

      <div className="mt-4 text-slate-400 text-sm">
        <p>Navios restantes:</p>
        {SHIPS.filter((_, i) => i >= placed.length).map(s => (
          <span key={s.type} className="mr-3">{s.name} ({s.size})</span>
        ))}
      </div>
    </div>
  );
}
