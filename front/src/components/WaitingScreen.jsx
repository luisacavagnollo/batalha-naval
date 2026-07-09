import { useState, useEffect } from 'react';
import Compass from './Compass';

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
 * Props:
 * - title: texto principal (ex: "Código da sala")
 * - subtitle: texto secundário (ex: código da sala "ABCD")
 * - description: descrição abaixo (ex: "Compartilhe este código...")
 * - onCancel: callback para botão cancelar (opcional)
 * - cancelText: texto do botão cancelar (default: "Cancelar")
 */
export default function WaitingScreen({ title, subtitle, description, onCancel, cancelText = 'Cancelar' }) {
  const [phraseIndex, setPhraseIndex] = useState(() => Math.floor(Math.random() * PIRATE_PHRASES.length));
  const [dots, setDots] = useState('');
  const [ropeProgress, setRopeProgress] = useState(0);

  // Rotacionar frases a cada 3s
  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex(prev => (prev + 1) % PIRATE_PHRASES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Animar dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Animar barra de progresso (loop infinito)
  useEffect(() => {
    const interval = setInterval(() => {
      setRopeProgress(prev => prev >= 100 ? 0 : prev + 1);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      {/* Bússola girando */}
      <Compass size="lg" />

      {/* Título e subtítulo */}
      {title && (
        <p className="text-[#c4b28a] text-xs font-bold tracking-wider uppercase font-[MedievalSharp]">{title}</p>
      )}
      {subtitle && (
        <div className="text-4xl font-mono font-black tracking-[0.4em] text-[#c4983c]">
          {subtitle}
        </div>
      )}
      {description && (
        <p className="text-[#5a5048] text-sm text-center">{description}</p>
      )}

      {/* Barra de progresso estilo corda */}
      <div className="w-48 h-3 rounded-full bg-[#211a14] border border-[#3d2a1a]/60 overflow-hidden relative">
        {/* Textura de corda */}
        <div className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'repeating-linear-gradient(90deg, #5a5048 0px, #3d2a1a 2px, transparent 2px, transparent 6px)',
          }}
        />
        {/* Progresso */}
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#8b6914] to-[#c4983c] transition-all duration-100"
          style={{ width: `${ropeProgress}%` }}
        />
      </div>

      {/* Frase pirata rotativa */}
      <p className="text-[#c4b28a] text-sm font-[MedievalSharp] h-6 transition-opacity duration-500">
        {PIRATE_PHRASES[phraseIndex]}
      </p>

      {/* Indicador de conexão */}
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-1.5 rounded-full bg-[#c4983c] animate-pulse" />
        <span className="text-[#5a5048] text-sm">Aguardando oponente{dots}</span>
      </div>

      {/* Botão cancelar */}
      {onCancel && (
        <button
          onClick={onCancel}
          className="mt-2 px-5 py-2.5 rounded-md border border-[#8b1a1a]/50 text-[#c45a4a] text-xs font-bold tracking-wider uppercase hover:bg-[#8b1a1a]/20 hover:border-[#8b1a1a] transition-colors"
        >
          {cancelText}
        </button>
      )}
    </div>
  );
}
