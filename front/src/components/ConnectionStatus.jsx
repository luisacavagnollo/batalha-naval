import { useEffect, useState } from 'react';

/**
 * Indicador visual de status da conexão WebSocket.
 * Mostra uma barra acima do header que empurra o conteúdo para baixo.
 */
export default function ConnectionStatus({ connectionStatus, reconnectInfo }) {
  const [countdown, setCountdown] = useState(null);

  // Countdown visual enquanto aguarda próxima tentativa
  useEffect(() => {
    if (connectionStatus !== 'reconnecting' || !reconnectInfo?.nextRetryIn) {
      setCountdown(null);
      return;
    }

    const seconds = Math.ceil(reconnectInfo.nextRetryIn / 1000);
    setCountdown(seconds);

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [connectionStatus, reconnectInfo]);

  // Não mostrar nada se conectado
  if (connectionStatus === 'connected') return null;

  const isReconnecting = connectionStatus === 'reconnecting';
  const hasFailed = reconnectInfo?.failed;

  return (
    <div className={`w-full px-4 py-2 text-center text-sm font-medium transition-all duration-300 ${
      hasFailed 
        ? 'bg-[#8b1a1a]/95 text-[#e8d5b0] border-b border-[#8b1a1a]' 
        : isReconnecting 
          ? 'bg-[#8b6914]/95 text-[#e8d5b0] border-b border-[#c4983c]/50' 
          : 'bg-[#2a1f15]/95 text-[#c4b28a] border-b border-[#3d2a1a]/50'
    }`}>
      <div className="flex items-center justify-center gap-2 max-w-lg mx-auto">
        {isReconnecting && !hasFailed && (
          <>
            <span className="inline-block w-2 h-2 bg-[#c4983c] rounded-full animate-pulse" />
            <span>
              Reconectando... tentativa {reconnectInfo?.attempt}/{reconnectInfo?.maxAttempts}
              {countdown !== null && countdown > 0 && (
                <span className="ml-1 text-[#d4a84b]">({countdown}s)</span>
              )}
            </span>
          </>
        )}

        {hasFailed && (
          <>
            <span className="inline-block w-2 h-2 bg-[#c45a4a] rounded-full" />
            <span>Conexão perdida. Recarregue a página para tentar novamente.</span>
          </>
        )}

        {!isReconnecting && !hasFailed && connectionStatus === 'disconnected' && (
          <>
            <span className="inline-block w-2 h-2 bg-[#5a5048] rounded-full" />
            <span>Desconectado</span>
          </>
        )}
      </div>
    </div>
  );
}
