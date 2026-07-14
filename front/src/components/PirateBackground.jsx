/**
 * PirateBackground - Background com imagem temática pirata.
 *
 * Props:
 *   variant - "lobby" (padrão) para lobby/login, "battle" para telas de jogo/posicionamento
 */
export default function PirateBackground({ children, variant = 'lobby' }) {
  const bgImage = variant === 'battle'
    ? '/backgrounds/battle-bg.png'
    : '/backgrounds/lobby-bg.png';

  return (
    <div className="min-h-[100dvh] relative overflow-hidden bg-[#1A0F09]">
      {/* Camada 1: Imagem de fundo */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url('${bgImage}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 85%',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* Camada 2: Vinheta escura nas bordas para legibilidade */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{ boxShadow: 'inset 0 0 200px 80px rgba(0,0,0,0.6)' }}
      />

      {/* Camada 3: Overlay leve para garantir contraste com textos */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{ background: 'rgba(0, 0, 0, 0.15)' }}
      />

      {/* Conteúdo principal */}
      <div className="relative z-[2]">
        {children}
      </div>
    </div>
  );
}
