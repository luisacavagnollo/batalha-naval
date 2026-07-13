import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGame } from '../hooks/useGame';
import ConnectionStatus from '../components/ConnectionStatus';
import PirateBackground from '../components/PirateBackground';
import UIPanel from '../components/UIPanel';
import PirateButton from '../components/PirateButton';

export default function GameOver() {
  const [params] = useSearchParams();
  const winner = params.get('winner');
  const gameId = params.get('gameId');
  const username = localStorage.getItem('username');
  const token = localStorage.getItem('token');
  const isVictory = winner === username;
  const navigate = useNavigate();
  const { connect, requestRematch, rematchGameId, rematchPending, rematchRequested, resetGame, subscribeToGame, connectionStatus, reconnectInfo } = useGame(token);

  useEffect(() => {
    connect().then(() => {
      if (gameId) subscribeToGame(gameId);
    }).catch(() => {});
  }, [connect, gameId, subscribeToGame]);

  useEffect(() => {
    if (rematchGameId) {
      navigate(`/place-ships/${rematchGameId}`);
    }
  }, [rematchGameId, navigate]);

  const handleRematch = () => {
    if (gameId) requestRematch(gameId);
  };

  const handleLobby = () => {
    resetGame();
    navigate('/lobby');
  };

  const showWaiting = rematchPending && !rematchRequested;
  const showOpponentWants = rematchRequested && !rematchPending;

  return (
    <PirateBackground>
      <div className="min-h-screen flex flex-col">
        <ConnectionStatus connectionStatus={connectionStatus} reconnectInfo={reconnectInfo} />

        {/* Header */}
        <header className="w-full px-4 sm:px-8 py-6 flex items-center justify-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#D5AE47] tracking-wider uppercase font-['Cinzel_Decorative',_'Eagle_Lake',_serif] text-shadow-gold">
            Batalha Naval
          </h1>
        </header>

        {/* Conteúdo central */}
        <div className="flex-1 flex items-center justify-center px-4 pb-8">
          <UIPanel variant="default" size="lg" className="w-full max-w-sm text-center">
            {/* Decoração superior */}
            <div className={`w-20 h-1 mx-auto mb-6 rounded-full ${isVictory ? 'bg-gradient-to-r from-[#7A5A28] via-[#D5AE47] to-[#7A5A28]' : 'bg-gradient-to-r from-[#8B2A1E] via-[#C84A3A] to-[#8B2A1E]'}`} />

            {/* Resultado */}
            <h2 className={`text-3xl font-bold tracking-[0.15em] uppercase mb-3 font-['Cinzel_Decorative',_serif] ${isVictory ? 'text-[#D5AE47] text-shadow-gold' : 'text-[#C84A3A]'}`}>
              {isVictory ? 'Vitória' : 'Derrota'}
            </h2>

            <p className="text-[#C6AE78] text-sm mb-8 font-['Cinzel',_serif]">
              {isVictory
                ? 'Todos os navios inimigos foram afundados.'
                : `${winner} venceu esta partida.`}
            </p>

            {/* Notificação de revanche do oponente */}
            {showOpponentWants && (
              <div className="mb-4 px-4 py-3 rounded bg-[#B98B2F]/15 border border-[#B98B2F]/30">
                <p className="text-[#D5AE47] text-sm font-bold font-['Cinzel',_serif]">
                  ⚔️ Seu oponente quer jogar novamente!
                </p>
              </div>
            )}

            {/* Separador */}
            <div className="divider-ornate mb-6" />

            {/* Botões */}
            <div className="flex flex-col gap-3">
              {gameId && (
                <>
                  {showWaiting ? (
                    <PirateButton variant="wood" size="md" fullWidth disabled>
                      Aguardando oponente...
                    </PirateButton>
                  ) : (
                    <PirateButton onClick={handleRematch} variant="gold" size="lg" fullWidth>
                      {showOpponentWants ? 'Aceitar revanche' : 'Jogar novamente'}
                    </PirateButton>
                  )}
                </>
              )}
              <PirateButton onClick={handleLobby} variant="wood" size="md" fullWidth>
                Voltar ao início
              </PirateButton>
            </div>
          </UIPanel>
        </div>
      </div>
    </PirateBackground>
  );
}
