/**
 * PirateBackground - Background decorativo com:
 * - Textura de mapa antigo em baixa opacidade
 * - Cordas nas laterais
 * - Iluminação quente de lampiões
 * - Vinheta escura nas bordas
 * - Nunca plano (múltiplas camadas de profundidade)
 */
export default function PirateBackground({ children }) {
  return (
    <div className="min-h-screen relative overflow-hidden bg-[#1A0F09]">
      {/* Camada 1: Background base com gradiente radial (profundidade) */}
      <div
        className="fixed inset-0 z-0"
        style={{
          background: `
            radial-gradient(ellipse at 50% 30%, #2B1D14 0%, #1A0F09 70%),
            linear-gradient(180deg, #2B1D14 0%, #1A0F09 100%)
          `,
        }}
      />

      {/* Camada 2: Textura de mapa antigo */}
      <div
        className="fixed inset-0 z-0 opacity-[0.07]"
        style={{
          backgroundImage: `
            radial-gradient(ellipse at 20% 30%, rgba(185, 139, 47, 0.3) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 60%, rgba(185, 139, 47, 0.2) 0%, transparent 40%),
            radial-gradient(ellipse at 40% 80%, rgba(122, 90, 40, 0.2) 0%, transparent 45%),
            repeating-linear-gradient(0deg, transparent, transparent 80px, rgba(185, 139, 47, 0.1) 80px, rgba(185, 139, 47, 0.1) 81px),
            repeating-linear-gradient(90deg, transparent, transparent 80px, rgba(185, 139, 47, 0.1) 80px, rgba(185, 139, 47, 0.1) 81px),
            repeating-linear-gradient(45deg, transparent, transparent 150px, rgba(185, 139, 47, 0.05) 150px, rgba(185, 139, 47, 0.05) 152px),
            repeating-linear-gradient(-45deg, transparent, transparent 200px, rgba(122, 90, 40, 0.04) 200px, rgba(122, 90, 40, 0.04) 202px)
          `,
        }}
      />

      {/* Camada 3: Textura de grão sutil (não-flat) */}
      <div
        className="fixed inset-0 z-0 opacity-[0.4]"
        style={{
          backgroundImage: `
            repeating-linear-gradient(95deg, transparent, transparent 40px, rgba(0,0,0,0.02) 40px, rgba(0,0,0,0.02) 41px),
            repeating-linear-gradient(85deg, transparent, transparent 80px, rgba(60,30,10,0.03) 80px, rgba(60,30,10,0.03) 82px)
          `,
        }}
      />

      {/* Camada 4: Iluminação de lampiões */}
      <div className="fixed top-[-100px] left-[-100px] w-[500px] h-[500px] rounded-full pointer-events-none z-0 animate-[lamp-flicker_4s_ease-in-out_infinite]"
        style={{ background: 'radial-gradient(circle, rgba(212, 170, 80, 0.12) 0%, transparent 70%)' }}
      />
      <div className="fixed bottom-[-100px] right-[-100px] w-[500px] h-[500px] rounded-full pointer-events-none z-0 animate-[lamp-flicker_4s_ease-in-out_infinite_-2s]"
        style={{ background: 'radial-gradient(circle, rgba(212, 170, 80, 0.10) 0%, transparent 70%)' }}
      />
      <div className="fixed top-[30%] left-[50%] -translate-x-1/2 w-[700px] h-[400px] rounded-full pointer-events-none z-0 animate-[lamp-flicker_6s_ease-in-out_infinite_-1s]"
        style={{ background: 'radial-gradient(ellipse, rgba(212, 170, 80, 0.05) 0%, transparent 70%)' }}
      />

      {/* Camada 5: Cordas laterais */}
      <div
        className="fixed top-0 bottom-0 left-[12px] w-[14px] z-[1] pointer-events-none animate-[rope-sway_8s_ease-in-out_infinite] rounded-[7px] opacity-50"
        style={{
          backgroundImage: `repeating-linear-gradient(180deg, #5B3921 0px, #4B2F1C 3px, #6B4423 6px, #5B3921 9px, #3D2815 12px)`,
          boxShadow: '2px 0 8px rgba(0,0,0,0.4)',
          maskImage: 'linear-gradient(180deg, transparent 0%, black 5%, black 95%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, black 5%, black 95%, transparent 100%)',
        }}
      />
      <div
        className="fixed top-0 bottom-0 right-[12px] w-[14px] z-[1] pointer-events-none animate-[rope-sway_8s_ease-in-out_infinite_-4s] rounded-[7px] opacity-50"
        style={{
          backgroundImage: `repeating-linear-gradient(180deg, #4B2F1C 0px, #5B3921 3px, #3D2815 6px, #6B4423 9px, #4B2F1C 12px)`,
          boxShadow: '-2px 0 8px rgba(0,0,0,0.4)',
          maskImage: 'linear-gradient(180deg, transparent 0%, black 5%, black 95%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, black 5%, black 95%, transparent 100%)',
        }}
      />

      {/* Camada 6: Vinheta escura nas bordas */}
      <div className="fixed inset-0 z-0 pointer-events-none"
        style={{ boxShadow: 'inset 0 0 150px 60px rgba(0,0,0,0.5)' }}
      />

      {/* Conteúdo principal */}
      <div className="relative z-[2]">
        {children}
      </div>
    </div>
  );
}
