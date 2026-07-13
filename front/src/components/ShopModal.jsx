import { useState, useEffect, useRef } from 'react';
import { fetchShopSkins, buySkin, fetchProfile } from '../services/api';
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

export default function ShopModal({ onClose, onBalanceChange }) {
  const token = localStorage.getItem('token');
  const [skins, setSkins] = useState([]);
  const [moedas, setMoedas] = useState(0);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(null);
  const [message, setMessage] = useState(null);
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
    const minDelay = new Promise(r => setTimeout(r, 1000));
    Promise.all([fetchShopSkins(token), fetchProfile(token), minDelay]).then(([skinsData, profile]) => {
      if (profile?._unauthorized) { onClose(); return; }
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d0b09]/85 backdrop-blur-sm">
        <UIPanel variant="default" size="lg">
          <div className="flex flex-col items-center justify-center gap-4">
            <Compass size="md" />
            <p className="text-[#C6AE78] text-sm font-['Cinzel',_serif]">Carregando...</p>
          </div>
        </UIPanel>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d0b09]/85 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="shop-modal-title">
      <UIPanel variant="default" size="md" className="max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto outline-none">
        <div ref={modalRef} tabIndex={-1} className="outline-none">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 id="shop-modal-title" className="text-xl font-bold text-[#D5AE47] tracking-wider uppercase font-['Cinzel_Decorative',_serif] text-shadow-gold">
              Loja
            </h2>
            <button onClick={onClose} className="text-[#8B7355] hover:text-[#D5AE47] text-2xl transition-colors" aria-label="Fechar">✕</button>
          </div>

          {/* Saldo */}
          <div className="flex items-center justify-center gap-2 mb-6 py-3 bg-[#2B1D14] rounded-md border-2 border-[#2E2E2E]">
            <span className="text-[#D5AE47] text-lg font-bold font-['Cinzel',_serif]">🪙 {moedas}</span>
            <span className="text-[#8B7355] text-xs">moedas</span>
          </div>

          {/* Mensagem */}
          {message && (
            <div className={`mb-4 p-3 rounded text-sm text-center border ${
              message.type === 'error'
                ? 'bg-[#8B2A1E]/20 text-[#C84A3A] border-[#C84A3A]/40'
                : 'bg-[#4D9F59]/15 text-[#4D9F59] border-[#4D9F59]/40'
            }`}>
              {message.text}
            </div>
          )}

          {/* Skins list */}
          <div className="flex flex-col gap-3">
            {skins.map(skin => (
              <div key={skin.id} className={`flex items-center gap-3 p-4 rounded border ${
                skin.owned
                  ? 'border-[#2E2E2E] bg-[#2B1D14]/30 opacity-70'
                  : 'border-[#2E2E2E] bg-[#2B1D14]/50'
              }`}>
                <img src={SKIN_IMAGES[skin.id]} alt={skin.name} className="w-20 h-10 object-contain" />
                <div className="flex-1">
                  <p className="text-[#F4E2B6] text-sm font-bold">{skin.name}</p>
                  {skin.owned ? (
                    <p className="text-[#8B7355] text-xs">Adquirida ✓</p>
                  ) : (
                    <p className="text-[#D5AE47] text-xs font-bold">🪙 {skin.price}</p>
                  )}
                </div>
                {!skin.owned && (
                  <PirateButton
                    onClick={() => handleBuy(skin.id)}
                    variant="gold"
                    size="sm"
                    disabled={buying === skin.id || moedas < skin.price}
                  >
                    {buying === skin.id ? '...' : 'Comprar'}
                  </PirateButton>
                )}
              </div>
            ))}
          </div>
        </div>
      </UIPanel>
    </div>
  );
}
