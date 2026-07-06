/**
 * Painel de seleção de navios para posicionamento.
 * 
 * Props:
 * - ships: array de { type, name, size, img }
 * - selectedShip: type do navio selecionado atualmente
 * - placedTypes: array de types já posicionados no grid
 * - onSelectShip: (type) => void
 */
export default function ShipSelector({ ships, selectedShip, placedTypes, onSelectShip }) {
  return (
    <div className="bg-[#2a1f15] border border-[#3d2a1a]/40 rounded-lg p-4 sm:p-6 flex flex-col gap-3 sm:gap-4 w-full max-w-sm lg:w-64">
      <h3 className="text-[#c4b28a] text-xs font-medium tracking-wider uppercase font-[MedievalSharp]">Seus navios</h3>
      <div className="flex flex-row flex-wrap lg:flex-col gap-2 sm:gap-3">
        {ships.map((ship) => {
          const isPlaced = placedTypes.includes(ship.type);
          const isSelected = selectedShip === ship.type;
          return (
            <button
              key={ship.type}
              onClick={() => onSelectShip(ship.type)}
              className={`flex flex-col items-start gap-1 p-2 sm:p-3 rounded-md border transition-all flex-1 lg:flex-none min-w-[120px]
                ${isSelected ? 'border-[#c4983c] bg-[#c4983c]/10' : 'border-[#3d2a1a]/40 hover:border-[#3d2a1a] bg-[#211a14]/50'}
                ${isPlaced && !isSelected ? 'opacity-60' : 'opacity-100'}
              `}
            >
              {!isPlaced ? (
                <img
                  src={ship.img}
                  alt={ship.name}
                  className="object-contain"
                  style={{ width: `${ship.size * 30}px`, height: '28px' }}
                />
              ) : (
                <span className="text-[#c4983c] text-sm font-semibold">
                  ✓ No tabuleiro
                </span>
              )}
              <span className="text-[#e8d5b0] text-xs font-bold">
                {ship.name} ({ship.size})
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
