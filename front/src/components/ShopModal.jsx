import { useState, useEffect } from 'react';
import { fetchShopSkins, buySkin, fetchProfile } from '../services/api';

const SKIN_IMAGES = {
  padrao_antigo: '/ships/padrao_antigo/carrier_antigo.png',
  pirate: '/ships/pirate/carrier_pirate.png',
  padrao: '/ships/padrao/carrier.png',
  pirate_op: '/ships/pirate_op/carrier_pirate_op.png',
  pesca: '/ships/pesca/carrier_f.png',
  kitty: '/ships/kitty/carrier_hk.png',
};

export default function ShopModal({ onClose, onBalanceChange }) {
  const token = localStorage.getItem('token');
  const [skins, setSkins] = useState([]);
  const [moedas, setMoedas] = useState(0);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    Promise.all([fetchShopSkins(token), fetchProfile(token)]).then(([skinsData, profile]) => {
      if (skinsData) setSkins(skinsData);
      if (profile) setMoedas(profile.moedas);
      setLoading(false);
    });
  }, [token]);

  const handleBuy = async (skinId) => {
    setBuying(skinId);
    setMessage(null);
    const result = await buySkin(token, skinId);
    if (result.error) {
      setMessage({ type: 'error', text: result.error });
    } else {
      setMoedas(result.moedas);
      setSkins(prev => prev.map(s => s.id === skinId ? { ...s, owned: true } : s));
      setMessage({ type: 'success', text: 'Skin adquirida!' });
      if (onBalanceChange) onBalanceChange(result.moedas);
    }
    setBuying(null);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d0b09]/80 backdrop-blur-sm">
      <div className="bg-[#2a1f15] border border-[#3d2a1a]/60 rounded-lg p-6 sm:p-8 max-w-md w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[#c4983c] tracking-wider uppercase font-[MedievalSharp]">Loja</h2>
          <button onClick={onClose} className="text-[#5a5048] hover:text-[#c4983c] text-2xl transition-colors">✕</button>
        </div>

        {/* Saldo */}
        <div className="flex items-center justify-center gap-2 mb-6 py-3 bg-[#211a14] rounded-md border border-[#3d2a1a]/40">
          <span className="text-[#c4983c] text-lg font-bold">🪙 {moedas}</span>
          <span className="text-[#5a5048] text-xs">moedas</span>
        </div>

        {/* Mensagem */}
        {message && (
          <div className={`mb-4 p-3 rounded-md text-sm text-center ${message.type === 'error' ? 'bg-[#8b1a1a]/20 text-[#c45a4a] border border-[#8b1a1a]/40' : 'bg-[#8b6914]/20 text-[#c4983c] border border-[#c4983c]/40'}`}>
            {message.text}
          </div>
        )}

        {/* Skins list */}
        <div className="flex flex-col gap-3">
          {skins.map(skin => (
            <div key={skin.id} className={`flex items-center gap-3 p-4 rounded-md border ${skin.owned ? 'border-[#3d2a1a]/30 bg-[#211a14]/30 opacity-70' : 'border-[#3d2a1a]/40 bg-[#211a14]/50'}`}>
              <img src={SKIN_IMAGES[skin.id]} alt={skin.name} className="w-20 h-10 object-contain" />
              <div className="flex-1">
                <p className="text-[#e8d5b0] text-sm font-bold">{skin.name}</p>
                {skin.owned ? (
                  <p className="text-[#5a5048] text-xs">Adquirida ✓</p>
                ) : (
                  <p className="text-[#c4983c] text-xs font-bold">🪙 {skin.price}</p>
                )}
              </div>
              {!skin.owned && (
                <button
                  onClick={() => handleBuy(skin.id)}
                  disabled={buying === skin.id || moedas < skin.price}
                  className={`px-4 py-2 rounded-md text-xs font-bold tracking-wider uppercase transition-colors
                    ${moedas >= skin.price
                      ? 'bg-[#8b6914] text-[#211a14] hover:bg-[#c4983c]'
                      : 'bg-[#3d2a1a]/40 text-[#5a5048] cursor-not-allowed'}
                    disabled:opacity-50`}
                >
                  {buying === skin.id ? '...' : 'Comprar'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
