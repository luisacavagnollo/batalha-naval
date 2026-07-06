export default function TurnIndicator({ gameFinished, gameState, username }) {
  const isWinner = gameState?.winnerId === username;

  const bannerClass = gameFinished
    ? (isWinner
      ? 'bg-[#8b6914]/20 border border-[#c4983c]/40 text-[#c4983c]'
      : 'bg-[#8b1a1a]/20 border border-[#8b1a1a]/40 text-[#c45a4a]')
    : gameState?.myTurn
      ? 'bg-[#8b6914]/20 border border-[#c4983c]/40 text-[#c4983c] animate-pulse'
      : 'bg-[#2a1f15] border border-[#3d2a1a]/30 text-[#5a5048]';

  const bannerText = gameFinished
    ? (isWinner ? 'Vitória' : 'Derrota')
    : gameState?.myTurn ? 'Sua vez — Ataque' : 'Aguardando oponente...';

  return (
    <div className="w-full flex flex-col items-center justify-center h-20 sm:h-22">
      <div className={`px-4 sm:px-8 py-2 sm:py-3 rounded-md text-sm sm:text-base font-bold tracking-wider uppercase font-[MedievalSharp] ${bannerClass}`}>
        {bannerText}
      </div>
      {gameState?.sunkShipType && gameState?.lastShotResult === 'SUNK' && (
        <span className="text-[#c4983c] text-sm font-semibold mt-1">
          {gameState.sunkShipType} afundado!
        </span>
      )}
    </div>
  );
}
