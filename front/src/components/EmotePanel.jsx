const EMOTES = ['👍', '😂', '😱', '😢', '💀', '🫡'];

export default function EmotePanel({ onSendEmote, receivedEmote }) {
  return (
    <>
      {receivedEmote && (
        <div className="fixed top-24 right-8 bg-[#4B2F1C] border-2 border-[#B98B2F]/40 px-5 py-3 rounded-2xl text-4xl animate-bounce shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
          {receivedEmote.emote}
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 flex justify-center py-4 bg-[#1A0F09]/90 backdrop-blur-sm border-t-2 border-[#2E2E2E] z-30">
        <div className="flex gap-3 bg-[#4B2F1C] px-6 py-3 rounded-lg border-2 border-[#2E2E2E] shadow-[0_4px_12px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(107,68,35,0.4)]">
          {EMOTES.map(e => (
            <button key={e} onClick={() => onSendEmote(e)} className="text-2xl hover:scale-125 transition-transform active:scale-90">
              {e}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
