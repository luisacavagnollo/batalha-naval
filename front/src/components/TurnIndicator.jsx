export default function TurnIndicator({ gameFinished, gameState, username }) {
  const isWinner = gameState?.winnerId === username;

  const bannerClass = gameFinished
    ? (isWinner
      ? 'bg-[#B98B2F]/15 border-2 border-[#B98B2F]/50 text-[#D5AE47] shadow-[0_0_15px_rgba(185,139,47,0.2)]'
      : 'bg-[#8B2A1E]/15 border-2 border-[#C84A3A]/50 text-[#C84A3A]')
    : gameState?.myTurn
      ? 'bg-[#B98B2F]/15 border-2 border-[#B98B2F]/50 text-[#D5AE47] animate-pulse shadow-[0_0_15px_rgba(185,139,47,0.3)]'
      : 'bg-[#2B1D14] border-2 border-[#2E2E2E] text-[#8B7355]';

  const bannerText = gameFinished
    ? (isWinner ? 'Vitória' : 'Derrota')
    : gameState?.myTurn ? 'Sua vez — Ataque' : 'Aguardando oponente...';

  return (
    <div className="w-full flex flex-col items-center justify-center h-20 sm:h-22">
      <div className={`px-4 sm:px-8 py-2 sm:py-3 rounded-md text-sm sm:text-base font-bold tracking-wider uppercase font-['Cinzel',_serif] ${bannerClass}`}>
        {bannerText}
      </div>
      {gameState?.sunkShipType && gameState?.lastShotResult === 'SUNK' && (
        <span className="text-[#D5AE47] text-sm font-bold mt-1 font-['Cinzel',_serif]">
          {gameState.sunkShipType} afundado!
        </span>
      )}
    </div>
  );
}
