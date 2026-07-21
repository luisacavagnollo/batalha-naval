import UIPanel from '../UIPanel';

const FLEET_CELL = 44;
const FLEET_CELL_MOBILE = 28;
const FLEET_HEIGHT = 40;
const FLEET_HEIGHT_MOBILE = 24;
const MAX_SHIP_SIZE = 5;

export default function ShipList({ ships, title, align, mobile }) {
  const fleetCell = mobile ? FLEET_CELL_MOBILE : FLEET_CELL;
  const fleetHeight = mobile ? FLEET_HEIGHT_MOBILE : FLEET_HEIGHT;
  const maxWidth = MAX_SHIP_SIZE * fleetCell;

  if (mobile) {
    return (
      <div className="flex xl:hidden flex-col gap-2 items-center w-full">
        <UIPanel variant="dark" size="sm" className="w-full">
          <h3 className="text-[#D5AE47] text-xs font-bold tracking-[0.15em] uppercase mb-3 font-['Cinzel',_serif] text-center text-shadow-gold">
            {title}
          </h3>
          <div className="flex flex-wrap gap-2 justify-center">
            {ships.map((ship) => (
              <div
                key={ship.type}
                className={`transition-opacity duration-500 ${ship.sunk ? 'opacity-25' : 'opacity-100'}`}
                style={{ display: 'flex', alignItems: 'center' }}
              >
                <img src={ship.img} alt={ship.name}
                  className={`object-contain ${ship.sunk ? 'grayscale' : ''}`}
                  style={{ width: `${ship.size * fleetCell}px`, height: `${fleetHeight}px` }}
                />
                {ship.sunk && <span className="text-[#C84A3A] text-sm font-bold ml-1">✕</span>}
              </div>
            ))}
          </div>
        </UIPanel>
      </div>
    );
  }

  return (
    <div className={`hidden xl:flex flex-col gap-4 justify-center ${align === 'right' ? 'items-end' : 'items-start'}`}
      style={{ width: `${maxWidth + 32}px`, alignSelf: 'stretch' }}>
      <UIPanel variant="dark" size="sm" className="w-full flex flex-col gap-4">
        <h3 className="text-[#D5AE47] text-xs font-bold tracking-[0.15em] uppercase font-['Cinzel',_serif] text-shadow-gold">
          {title}
        </h3>
        <div className="flex flex-col gap-4 items-center">
          {ships.map((ship) => (
            <div key={ship.type}
              className={`transition-opacity duration-500 ${ship.sunk ? 'opacity-25' : 'opacity-100'}`}
              style={{ width: `${maxWidth}px`, display: 'flex', justifyContent: 'center', alignItems: 'center' }}
            >
              <img src={ship.img} alt={ship.name}
                className={`object-contain ${ship.sunk ? 'grayscale' : ''}`}
                style={{ width: `${ship.size * fleetCell}px`, height: `${fleetHeight}px` }}
              />
              {ship.sunk && <span className="text-[#C84A3A] text-sm font-bold ml-2">✕</span>}
            </div>
          ))}
        </div>
      </UIPanel>
    </div>
  );
}
