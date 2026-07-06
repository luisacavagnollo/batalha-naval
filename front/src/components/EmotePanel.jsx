const EMOTES = ['👍', '😂', '😱', '😢', '💀', '🫡'];

export default function EmotePanel({ onSendEmote, receivedEmote }) {
  return (
    <>
      {receivedEmote && (
        <div className="fixed top-24 right-8 bg-[#2a1f15] border border-[#c4983c]/40 px-5 py-3 rounded-2xl text-4xl animate-bounce shadow-xl">
          {receivedEmote.emote}
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 flex justify-center py-4 bg-[#211a14]/90 backdrop-blur-sm border-t border-[#3d2a1a]/30 z-30">
        <div className="flex gap-3 bg-[#2a1f15] px-6 py-3 rounded-lg border border-[#3d2a1a]/40">
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
