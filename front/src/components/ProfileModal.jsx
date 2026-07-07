import { useState, useEffect } from 'react';
import { fetchProfile, equipSkin } from '../services/api';

const SKIN_IMAGES = {
  padrao_antigo: '/ships/padrao_antigo/carrier_antigo.png',
  pirate: '/ships/pirate/carrier_pirate.png',
  padrao: '/ships/padrao/carrier.png',
  pirate_op: '/ships/pirate_op/carrier_pirate_op.png',
};

const SKIN_NAMES = {
  padrao_antigo: 'Frota Clássica',
  pirate: 'Frota Pirata',
  padrao: 'Frota Imperial',
  pirate_op: 'Frota Pirata Lendária',
};

export default function ProfileModal({ onClose }) {
  const token = localStorage.getItem('token');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [equipping, setEquipping] = useState(null);

  useEffect(() => {
    fetchProfile(token).then(data => {
      setProfile(data);
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
        <div className="bg-[#2a1f15] border border-[#3d2a1a]/60 rounded-lg p-8 shadow-2xl">
          <p className="text-[#c4b28a] text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  const total = (profile.wins || 0) + (profile.losses || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d0b09]/80 backdrop-blur-sm">
      <div className="bg-[#2a1f15] border border-[#3d2a1a]/60 rounded-lg p-6 sm:p-8 max-w-md w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[#c4983c] tracking-wider uppercase font-[MedievalSharp]">Meu Perfil</h2>
          <button onClick={onClose} className="text-[#5a5048] hover:text-[#c4983c] text-2xl transition-colors">✕</button>
        </div>

        {/* Username + Moedas */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#3d2a1a]/40">
          <span className="text-[#e8d5b0] text-lg font-bold">{profile.username}</span>
          <span className="text-[#c4983c] font-bold">🪙 {profile.moedas}</span>
        </div>

        {/* Stats */}
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

        {/* Partidas jogadas */}
        <p className="text-[#5a5048] text-xs text-center mb-6">{total} partidas jogadas</p>

        {/* Skins */}
        <div className="mb-4">
          <h3 className="text-[#c4b28a] text-xs font-medium tracking-wider uppercase mb-3 font-[MedievalSharp]">Minhas Skins</h3>
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
        </div>
      </div>
    </div>
  );
}
