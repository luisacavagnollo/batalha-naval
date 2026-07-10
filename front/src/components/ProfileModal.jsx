import { useState, useEffect, useRef } from 'react';
import { fetchProfile, fetchStats, equipSkin } from '../services/api';
import Compass from './Compass';

const SKIN_IMAGES = {
  padrao_antigo: '/ships/padrao_antigo/carrier_antigo.png',
  pirate: '/ships/pirate/carrier_pirate.png',
  padrao: '/ships/padrao/carrier.png',
  pirate_op: '/ships/pirate_op/carrier_pirate_op.png',
  pesca: '/ships/pesca/carrier_f.png',
  kitty: '/ships/kitty/carrier_hk.png',
};

const SKIN_NAMES = {
  padrao_antigo: 'Frota Clássica',
  pirate: 'Frota Pirata',
  padrao: 'Frota Imperial',
  pirate_op: 'Frota Pirata Lendária',
  pesca: 'Frota Pesqueira',
  kitty: 'Frota Hello Kitty',
};

export default function ProfileModal({ onClose }) {
  const token = localStorage.getItem('token');
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [equipping, setEquipping] = useState(null);
  const [tab, setTab] = useState('stats');
  const modalRef = useRef(null);

  // Focus trap e Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    // Focus no modal ao abrir
    modalRef.current?.focus();
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    Promise.all([fetchProfile(token), fetchStats(token)]).then(([profileData, statsData]) => {
      if (profileData?._unauthorized) {
        onClose();
        return;
      }
      setProfile(profileData);
      if (statsData && statsData.history) setHistory(statsData.history);
      setLoading(false);
    });
  }, [token]);

  const handleEquip = async (skinId) => {
    setEquipping(skinId);
    const result = await equipSkin(token, skinId);
    if (result && !result.error) {
      setProfile(prev => ({ ...prev, skinEquipada: result.skinEquipada }));
    }
    setEquipping(null);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d0b09]/80 backdrop-blur-sm">
        <div className="bg-[#2a1f15] border border-[#3d2a1a]/60 rounded-lg p-8 shadow-2xl flex flex-col items-center gap-4">
          <Compass size="md" />
          <p className="text-[#c4b28a] text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  const total = (profile.wins || 0) + (profile.losses || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d0b09]/80 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="profile-modal-title">
      <div ref={modalRef} tabIndex={-1} className="bg-[#2a1f15] border border-[#3d2a1a]/60 rounded-lg p-6 sm:p-8 max-w-md w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto outline-none">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 id="profile-modal-title" className="text-xl font-bold text-[#c4983c] tracking-wider uppercase font-[MedievalSharp]">Meu Perfil</h2>
          <button onClick={onClose} className="text-[#5a5048] hover:text-[#c4983c] text-2xl transition-colors" aria-label="Fechar">✕</button>
        </div>

        {/* Username + Moedas */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#3d2a1a]/40">
          <span className="text-[#e8d5b0] text-lg font-bold">{profile.username}</span>
          <span className="text-[#c4983c] font-bold">🪙 {profile.moedas}</span>
        </div>

        {/* Tabs */}
        <div className="flex mb-6 border-b border-[#3d2a1a]/40">
          <button
            onClick={() => setTab('stats')}
            className={`flex-1 pb-3 text-sm font-bold tracking-wider uppercase transition-colors ${tab === 'stats' ? 'text-[#c4983c] border-b-2 border-[#c4983c]' : 'text-[#5a5048] hover:text-[#c4b28a]'}`}
          >
            Estatísticas
          </button>
          <button
            onClick={() => setTab('skins')}
            className={`flex-1 pb-3 text-sm font-bold tracking-wider uppercase transition-colors ${tab === 'skins' ? 'text-[#c4983c] border-b-2 border-[#c4983c]' : 'text-[#5a5048] hover:text-[#c4b28a]'}`}
          >
            Skins
          </button>
        </div>

        {/* Tab: Estatísticas */}
        {tab === 'stats' && (
          <>
            <div className="grid grid-cols-3 gap-3 text-center mb-6">
              <div className="bg-[#211a14] rounded-md p-3">
                <p className="text-[#e8d5b0] text-xl font-bold">{profile.wins || 0}</p>
                <p className="text-[#5a5048] text-xs">Vitórias</p>
              </div>
              <div className="bg-[#211a14] rounded-md p-3">
                <p className="text-[#e8d5b0] text-xl font-bold">{profile.losses || 0}</p>
                <p className="text-[#5a5048] text-xs">Derrotas</p>
              </div>
              <div className="bg-[#211a14] rounded-md p-3">
                <p className="text-[#c4983c] text-xl font-bold">{profile.winRate || 0}%</p>
                <p className="text-[#5a5048] text-xs">Win Rate</p>
              </div>
            </div>

            <p className="text-[#5a5048] text-xs text-center mb-6">{total} partidas jogadas</p>

            <div>
              <h3 className="text-[#c4b28a] text-xs font-medium tracking-wider uppercase mb-3 font-[MedievalSharp]">Últimas partidas</h3>
              {history.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {history.map((match, i) => (
                    <div key={i} className="flex items-center justify-between py-2 px-3 rounded-md bg-[#211a14]/50 border border-[#3d2a1a]/20">
                      <span className="text-[#e8d5b0] text-sm">{match.opponent === 'BOT' ? 'Bot' : match.opponent}</span>
                      <span className={`text-xs font-bold tracking-wider ${match.won ? 'text-[#c4983c]' : 'text-[#8b1a1a]'}`}>
                        {match.won ? 'Vitória' : 'Derrota'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[#5a5048] text-sm">Sem histórico</p>
              )}
            </div>
          </>
        )}

        {/* Tab: Skins */}
        {tab === 'skins' && (
          <div className="flex flex-col gap-3">
            {(profile.skinsAdquiridas || []).map(skinId => {
              const isEquipped = profile.skinEquipada === skinId;
              return (
                <div key={skinId} className={`flex items-center gap-3 p-3 rounded-md border ${isEquipped ? 'border-[#c4983c]/60 bg-[#c4983c]/10' : 'border-[#3d2a1a]/40 bg-[#211a14]/50'}`}>
                  <img src={SKIN_IMAGES[skinId]} alt={skinId} className="w-16 h-8 object-contain" />
                  <div className="flex-1">
                    <p className="text-[#e8d5b0] text-sm font-bold">{SKIN_NAMES[skinId] || skinId}</p>
                    {isEquipped && <p className="text-[#c4983c] text-xs">Equipada</p>}
                  </div>
                  {!isEquipped && (
                    <button
                      onClick={() => handleEquip(skinId)}
                      disabled={equipping === skinId}
                      className="px-3 py-1.5 rounded-md bg-[#8b6914] text-[#211a14] text-xs font-bold tracking-wider uppercase hover:bg-[#c4983c] transition-colors disabled:opacity-50"
                    >
                      {equipping === skinId ? '...' : 'Equipar'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
