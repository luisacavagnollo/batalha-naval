/**
 * UIPanel - Painel base estilo placa de madeira presa com rebites.
 * Todos os containers da interface usam este componente para manter
 * consistência visual (profundidade, textura, iluminação).
 *
 * Props:
 * - variant: 'default' | 'dark' | 'light' | 'highlight'
 * - size: 'sm' | 'md' | 'lg'
 * - rivets: boolean (mostrar rebites nos cantos)
 * - className: classes adicionais
 * - children: conteúdo
 * - noPadding: boolean
 * - as: tag HTML (default 'div')
 */
export default function UIPanel({
  variant = 'default',
  size = 'md',
  rivets = false,
  className = '',
  children,
  noPadding = false,
  as: Tag = 'div',
  ...props
}) {
  const variants = {
    default: 'bg-gradient-to-br from-[#5B3921] via-[#4B2F1C] to-[#3D2815]',
    dark: 'bg-gradient-to-br from-[#4B2F1C] via-[#3A2518] to-[#2B1D14]',
    light: 'bg-gradient-to-br from-[#6B4423] via-[#5B3921] to-[#4B2F1C]',
    highlight: 'bg-gradient-to-br from-[#5B3921] via-[#4B2F1C] to-[#3D2815] ring-1 ring-[#B98B2F]/30',
  };

  const sizes = {
    sm: noPadding ? '' : 'p-3 sm:p-4',
    md: noPadding ? '' : 'p-4 sm:p-6',
    lg: noPadding ? '' : 'p-6 sm:p-8',
  };

  return (
    <Tag
      className={`
        relative rounded-md
        ${variants[variant]}
        ${sizes[size]}
        border-[3px] border-[#2E2E2E]
        shadow-[0_8px_32px_rgba(0,0,0,0.6),0_4px_12px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(107,68,35,0.5),inset_0_-1px_0_rgba(0,0,0,0.3)]
        ${className}
      `}
      {...props}
    >
      {/* Textura de grão de madeira */}
      <div
        className="absolute inset-0 rounded-[3px] pointer-events-none opacity-100"
        style={{
          backgroundImage: `
            repeating-linear-gradient(93deg, transparent, transparent 12px, rgba(0,0,0,0.04) 12px, rgba(0,0,0,0.04) 13px),
            repeating-linear-gradient(88deg, transparent, transparent 30px, rgba(40,20,5,0.06) 30px, rgba(40,20,5,0.06) 33px),
            repeating-linear-gradient(91deg, transparent, transparent 60px, rgba(80,40,15,0.03) 60px, rgba(80,40,15,0.03) 63px)
          `,
        }}
      />

      {/* Iluminação interna sutil (lampião) */}
      <div className="absolute inset-0 rounded-[3px] pointer-events-none bg-gradient-to-br from-[rgba(212,170,80,0.05)] via-transparent to-transparent" />

      {/* Rebites nos cantos */}
      {rivets && (
        <>
          <Rivet position="top-left" />
          <Rivet position="top-right" />
          <Rivet position="bottom-left" />
          <Rivet position="bottom-right" />
        </>
      )}

      {/* Conteúdo */}
      <div className="relative z-[1]">
        {children}
      </div>
    </Tag>
  );
}

function Rivet({ position, variant = 'bronze' }) {
  const positions = {
    'top-left': 'top-2 left-2',
    'top-right': 'top-2 right-2',
    'bottom-left': 'bottom-2 left-2',
    'bottom-right': 'bottom-2 right-2',
  };

  const variants = {
    bronze: 'from-[#8D6B32] via-[#5A4020] to-[#3D2815]',
    iron: 'from-[#6B6B6B] via-[#3A3A3A] to-[#1E1E1E]',
  };

  return (
    <div
      className={`
        absolute ${positions[position]} z-10
        w-3 h-3 rounded-full
        bg-radial-[circle_at_35%_35%] ${variants[variant]}
        shadow-[inset_0_1px_2px_rgba(255,255,255,0.2),inset_0_-1px_2px_rgba(0,0,0,0.4),0_2px_4px_rgba(0,0,0,0.5)]
      `}
    >
      {/* Reflexo de luz */}
      <div className="absolute top-[2px] left-[3px] w-[4px] h-[3px] rounded-full bg-[rgba(255,220,150,0.3)]" />
    </div>
  );
}

export { Rivet };
