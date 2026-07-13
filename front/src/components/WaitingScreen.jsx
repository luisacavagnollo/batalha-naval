import { useState, useEffect } from 'react';
import Compass from './Compass';
import PirateButton from './PirateButton';

const PIRATE_PHRASES = [
  'Alistando tripulação...',
  'Preparando os canhões...',
  'Carregando pólvora...',
  'Içando as velas...',
  'Consultando o mapa...',
  'Afiando as espadas...',
  'Enchendo os barris de rum...',
  'Soltando as âncoras...',
  'Avistando o horizonte...',
  'Desenhando a rota...',
];

/**
 * Tela de espera temática pirata.
 */
export default function WaitingScreen({ title, subtitle, description, onCancel, cancelText = 'Cancelar' }) {
  const [phraseIndex, setPhraseIndex] = useState(() => Math.floor(Math.random() * PIRATE_PHRASES.length));
  const [dots, setDots] = useState('');
  const [ropeProgress, setRopeProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex(prev => (prev + 1) % PIRATE_PHRASES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setRopeProgress(prev => prev >= 100 ? 0 : prev + 1);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center gap-5 py-6">
      {/* Bússola girando */}
      <Compass size="lg" />

      {/* Título e subtítulo */}
      {title && (
        <p className="text-[#C6AE78] text-xs font-bold tracking-[0.2em] uppercase font-['Cinzel',_serif]">{title}</p>
      )}
      {subtitle && (
        <div className="text-4xl font-mono font-black tracking-[0.4em] text-[#D5AE47] text-shadow-gold">
          {subtitle}
        </div>
      )}
      {description && (
        <p className="text-[#8B7355] text-sm text-center">{description}</p>
      )}

      {/* Barra de progresso estilo corda */}
      <div className="w-48 h-3 rounded-full bg-[#1A0F09] border-2 border-[#2E2E2E] overflow-hidden relative">
        <div className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'repeating-linear-gradient(90deg, #5B3921 0px, #4B2F1C 2px, transparent 2px, transparent 6px)',
          }}
        />
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#7A5A28] via-[#D5AE47] to-[#B98B2F] transition-all duration-100"
          style={{ width: `${ropeProgress}%` }}
        />
      </div>

      {/* Frase pirata rotativa */}
      <p className="text-[#C6AE78] text-sm font-['Cinzel',_serif] h-6 transition-opacity duration-500">
        {PIRATE_PHRASES[phraseIndex]}
      </p>

      {/* Indicador de conexão */}
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-[#D5AE47] animate-pulse shadow-[0_0_6px_rgba(213,174,71,0.5)]" />
        <span className="text-[#8B7355] text-sm">Aguardando oponente{dots}</span>
      </div>

      {/* Botão cancelar */}
      {onCancel && (
        <PirateButton onClick={onCancel} variant="danger" size="sm" className="mt-2">
          {cancelText}
        </PirateButton>
      )}
    </div>
  );
}
