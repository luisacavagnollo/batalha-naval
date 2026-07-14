import { useState, useEffect, useRef } from 'react';

const EMOTES = ['👍', '😂', '😱', '😢', '💀', '🫡'];

export default function EmotePanel({ onSendEmote, receivedEmote }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  // Fechar ao clicar fora
  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Fechar automaticamente após enviar
  const handleSend = (emote) => {
    onSendEmote(emote);
    setOpen(false);
  };

  return (
    <>
      {/* Emote recebido do oponente */}
      {receivedEmote && (
        <div className="fixed top-24 right-4 sm:right-8 bg-[#4B2F1C] border-2 border-[#B98B2F]/40 px-4 py-2.5 rounded-2xl text-3xl sm:text-4xl animate-bounce shadow-[0_4px_20px_rgba(0,0,0,0.5)] z-50">
          {receivedEmote.emote}
        </div>
      )}

      {/* Botão + popup no canto inferior direito */}
      <div ref={panelRef} className="fixed bottom-4 right-4 z-40">
        {/* Popup de emotes */}
        {open && (
          <div className="absolute bottom-14 right-0 bg-[#4B2F1C] border-2 border-[#2E2E2E] rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.6)] p-3 animate-[float-gentle_0.2s_ease-out]">
            <div className="grid grid-cols-3 gap-2">
              {EMOTES.map(e => (
                <button
                  key={e}
                  onClick={() => handleSend(e)}
                  className="text-2xl hover:scale-125 transition-transform active:scale-90 w-10 h-10 flex items-center justify-center rounded hover:bg-[#B98B2F]/15"
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Botão de chat */}
        <button
          onClick={() => setOpen(!open)}
          className={`w-12 h-12 rounded-full flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.5)] transition-all ${
            open
              ? 'bg-[#B98B2F] text-[#1A0F09]'
              : 'bg-[#4B2F1C] border-2 border-[#2E2E2E] text-[#D5AE47] hover:bg-[#5B3921] hover:border-[#B98B2F]/40'
          }`}
          title="Emotes"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path d="M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.403 4.403 0 00-1.032-.211 50.89 50.89 0 00-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 002.433 3.984L7.28 21.53A.75.75 0 016 21v-4.03a48.527 48.527 0 01-1.087-.128C2.905 16.58 1.5 14.833 1.5 12.862V6.638c0-1.97 1.405-3.718 3.413-3.979z" />
            <path d="M15.75 7.5c-1.376 0-2.739.057-4.086.169C10.124 7.797 9 9.103 9 10.609v4.285c0 1.507 1.128 2.814 2.67 2.94 1.243.102 2.5.157 3.768.165l2.782 2.781a.75.75 0 001.28-.53v-2.39l.33-.026c1.542-.125 2.67-1.433 2.67-2.94v-4.286c0-1.505-1.125-2.811-2.664-2.94A49.392 49.392 0 0015.75 7.5z" />
          </svg>
        </button>
      </div>
    </>
  );
}
