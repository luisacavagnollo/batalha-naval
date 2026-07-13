import UIPanel from './UIPanel';

/**
 * Painel de seleção de navios para posicionamento.
 */
export default function ShipSelector({ ships, selectedShip, placedTypes, onSelectShip }) {
  return (
    <UIPanel variant="dark" size="md" className="w-full max-w-sm lg:w-64">
      <h3 className="text-[#D5AE47] text-xs font-bold tracking-[0.15em] uppercase font-['Cinzel',_serif] text-shadow-gold mb-3">
        Seus navios
      </h3>
      <div className="flex flex-row flex-wrap lg:flex-col gap-2 sm:gap-3">
        {ships.map((ship) => {
          const isPlaced = placedTypes.includes(ship.type);
          const isSelected = selectedShip === ship.type;
          return (
            <button
              key={ship.type}
              onClick={() => onSelectShip(ship.type)}
              className={`flex flex-col items-start gap-1 p-2 sm:p-3 rounded border-2 transition-all flex-1 lg:flex-none min-w-[120px]
                ${isSelected
                  ? 'border-[#B98B2F] bg-[#B98B2F]/10 shadow-[0_0_10px_rgba(185,139,47,0.2)]'
                  : 'border-[#2E2E2E] hover:border-[#7A5A28] bg-[#2B1D14]/50'}
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
                <span className="text-[#D5AE47] text-sm font-bold font-['Cinzel',_serif]">
                  ✓ No tabuleiro
                </span>
              )}
              <span className="text-[#F4E2B6] text-xs font-bold">
                {ship.name} ({ship.size})
              </span>
            </button>
          );
        })}
      </div>
    </UIPanel>
  );
}
