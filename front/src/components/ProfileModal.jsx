import { useState, useEffect, useRef } from 'react';
import { fetchProfile, fetchStats, equipSkin } from '../services/api';
import Compass from './Compass';
import UIPanel from './UIPanel';
import PirateButton from './PirateButton';

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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    modalRef.current?.focus();
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    Promise.all([fetchProfile(token), fetchStats(token)]).then(([profileData, statsData]) => {
      if (profileData?._unauthorized) { onClose(); return; }
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d0b09]/85 backdrop-blur-sm">
        <UIPanel variant="default" size="lg" className="flex flex-col items-center gap-4">
          <Compass size="md" />
          <p className="text-[#C6AE78] text-sm font-['Cinzel',_serif]">Carregando...</p>
        </UIPanel>
      </div>
    );
  }

  const total = (profile.wins || 0) + (profile.losses || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d0b09]/85 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="profile-modal-title">
      <UIPanel variant="default" size="md" className="max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto outline-none" ref={modalRef} as="div">
        <div ref={modalRef} tabIndex={-1} className="outline-none">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 id="profile-modal-title" className="text-xl font-bold text-[#D5AE47] tracking-wider uppercase font-['Cinzel_Decorative',_serif] text-shadow-gold">
              Meu Perfil
            </h2>
            <button onClick={onClose} className="text-[#8B7355] hover:text-[#D5AE47] text-2xl transition-colors" aria-label="Fechar">✕</button>
          </div>

          {/* Username + Moedas */}
          <div className="flex items-center justify-between mb-4 pb-4 border-b-2 border-[#2E2E2E]">
            <span className="text-[#F4E2B6] text-lg font-bold font-['Cinzel',_serif]">{profile.username}</span>
            <span className="text-[#D5AE47] font-bold">🪙 {profile.moedas}</span>
          </div>

          {/* Tabs */}
          <div className="flex mb-6 border-b-2 border-[#2E2E2E] relative">
            <div className="absolute bottom-0 h-[2px] bg-gradient-to-r from-[#7A5A28] via-[#D5AE47] to-[#7A5A28] transition-all duration-300"
              style={{ left: tab === 'stats' ? '0%' : '50%', width: '50%' }} />
            <button onClick={() => setTab('stats')}
              className={`flex-1 pb-3 text-sm font-bold tracking-wider uppercase transition-colors font-['Cinzel',_serif] ${tab === 'stats' ? 'text-[#D5AE47]' : 'text-[#8B7355] hover:text-[#C6AE78]'}`}>
              Estatísticas
            </button>
            <button onClick={() => setTab('skins')}
              className={`flex-1 pb-3 text-sm font-bold tracking-wider uppercase transition-colors font-['Cinzel',_serif] ${tab === 'skins' ? 'text-[#D5AE47]' : 'text-[#8B7355] hover:text-[#C6AE78]'}`}>
              Skins
            </button>
          </div>

          {/* Tab: Estatísticas */}
          {tab === 'stats' && (
            <>
              <div className="grid grid-cols-3 gap-3 text-center mb-6">
                <div className="bg-[#2B1D14] rounded-md p-3 border border-[#2E2E2E]">
                  <p className="text-[#F4E2B6] text-xl font-bold font-['Cinzel',_serif]">{profile.wins || 0}</p>
                  <p className="text-[#8B7355] text-xs">Vitórias</p>
                </div>
                <div className="bg-[#2B1D14] rounded-md p-3 border border-[#2E2E2E]">
                  <p className="text-[#F4E2B6] text-xl font-bold font-['Cinzel',_serif]">{profile.losses || 0}</p>
                  <p className="text-[#8B7355] text-xs">Derrotas</p>
                </div>
                <div className="bg-[#2B1D14] rounded-md p-3 border border-[#2E2E2E]">
                  <p className="text-[#D5AE47] text-xl font-bold font-['Cinzel',_serif]">{profile.winRate || 0}%</p>
                  <p className="text-[#8B7355] text-xs">Win Rate</p>
                </div>
              </div>

              <p className="text-[#8B7355] text-xs text-center mb-6">{total} partidas jogadas</p>

              <div>
                <h3 className="text-[#C6AE78] text-xs font-bold tracking-[0.15em] uppercase mb-3 font-['Cinzel',_serif]">Últimas partidas</h3>
                {history.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {history.map((match, i) => (
                      <div key={i} className="flex items-center justify-between py-2 px-3 rounded bg-[#2B1D14]/50 border border-[#2E2E2E]">
                        <span className="text-[#F4E2B6] text-sm">{match.opponent === 'BOT' ? 'Bot' : match.opponent}</span>
                        <span className={`text-xs font-bold tracking-wider ${match.won ? 'text-[#D5AE47]' : 'text-[#C84A3A]'}`}>
                          {match.won ? 'Vitória' : 'Derrota'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#8B7355] text-sm">Sem histórico</p>
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
                  <div key={skinId} className={`flex items-center gap-3 p-3 rounded border ${isEquipped ? 'border-[#B98B2F]/60 bg-[#B98B2F]/10' : 'border-[#2E2E2E] bg-[#2B1D14]/50'}`}>
                    <img src={SKIN_IMAGES[skinId]} alt={skinId} className="w-16 h-8 object-contain" />
                    <div className="flex-1">
                      <p className="text-[#F4E2B6] text-sm font-bold">{SKIN_NAMES[skinId] || skinId}</p>
                      {isEquipped && <p className="text-[#D5AE47] text-xs">Equipada</p>}
                    </div>
                    {!isEquipped && (
                      <PirateButton onClick={() => handleEquip(skinId)} variant="gold" size="sm" disabled={equipping === skinId}>
                        {equipping === skinId ? '...' : 'Equipar'}
                      </PirateButton>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </UIPanel>
    </div>
  );
}
