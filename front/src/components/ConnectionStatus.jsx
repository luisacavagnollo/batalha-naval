import { useEffect, useState } from 'react';

export default function ConnectionStatus({ connectionStatus, reconnectInfo }) {
  const [countdown, setCountdown] = useState(null);

  useEffect(() => {
    if (connectionStatus !== 'reconnecting' || !reconnectInfo?.nextRetryIn) {
      setCountdown(null);
      return;
    }
    const seconds = Math.ceil(reconnectInfo.nextRetryIn / 1000);
    setCountdown(seconds);
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [connectionStatus, reconnectInfo]);

  if (connectionStatus === 'connected') return null;

  const isReconnecting = connectionStatus === 'reconnecting';
  const hasFailed = reconnectInfo?.failed;

  return (
    <div className={`w-full px-4 py-2 text-center text-sm font-medium transition-all duration-300 border-b ${
      hasFailed
        ? 'bg-[#8B2A1E]/95 text-[#F4E2B6] border-[#C84A3A]/50'
        : isReconnecting
          ? 'bg-[#7A5A28]/95 text-[#F4E2B6] border-[#B98B2F]/50'
          : 'bg-[#2B1D14]/95 text-[#C6AE78] border-[#2E2E2E]'
    }`}>
      <div className="flex items-center justify-center gap-2 max-w-lg mx-auto">
        {isReconnecting && !hasFailed && (
          <>
            <span className="inline-block w-2 h-2 bg-[#D5AE47] rounded-full animate-pulse" />
            <span>
              Reconectando... tentativa {reconnectInfo?.attempt}/{reconnectInfo?.maxAttempts}
              {countdown !== null && countdown > 0 && (
                <span className="ml-1 text-[#D5AE47]">({countdown}s)</span>
              )}
            </span>
          </>
        )}
        {hasFailed && (
          <>
            <span className="inline-block w-2 h-2 bg-[#C84A3A] rounded-full" />
            <span>Conexão perdida. Recarregue a página para tentar novamente.</span>
          </>
        )}
        {!isReconnecting && !hasFailed && connectionStatus === 'disconnected' && (
          <>
            <span className="inline-block w-2 h-2 bg-[#8B7355] rounded-full" />
            <span>Desconectado</span>
          </>
        )}
      </div>
    </div>
  );
}
