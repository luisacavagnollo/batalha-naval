/**
 * PirateButton - Botão temático com texturas físicas.
 *
 * Props:
 * - variant: 'gold' | 'wood' | 'danger' | 'ocean'
 * - size: 'sm' | 'md' | 'lg'
 * - fullWidth: boolean
 * - disabled: boolean
 * - children: conteúdo
 * - className: classes adicionais
 * - icon: elemento ícone à esquerda
 */
export default function PirateButton({
  variant = 'gold',
  size = 'md',
  fullWidth = false,
  disabled = false,
  children,
  className = '',
  icon,
  ...props
}) {
  const variants = {
    gold: `
      bg-gradient-to-b from-[#D5AE47] via-[#B98B2F] to-[#7A5A28]
      border-2 border-[#7A5A28]
      text-[#2B1D14]
      shadow-[0_4px_12px_rgba(0,0,0,0.4),0_2px_4px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,220,100,0.4),inset_0_-2px_4px_rgba(0,0,0,0.2)]
      hover:from-[#F0C95C] hover:via-[#D5AE47] hover:to-[#B98B2F]
      hover:shadow-[0_4px_16px_rgba(185,139,47,0.4),0_2px_8px_rgba(185,139,47,0.3),inset_0_1px_0_rgba(255,220,100,0.6),inset_0_-2px_4px_rgba(0,0,0,0.15)]
      hover:-translate-y-[1px]
      active:translate-y-[1px] active:shadow-[0_2px_4px_rgba(0,0,0,0.4),inset_0_2px_4px_rgba(0,0,0,0.3)]
    `,
    wood: `
      bg-gradient-to-b from-[#6B4423] via-[#5B3921] to-[#4B2F1C]
      border-2 border-[#2E2E2E]
      text-[#F4E2B6]
      shadow-[0_4px_12px_rgba(0,0,0,0.4),0_2px_4px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(107,68,35,0.5),inset_0_-2px_4px_rgba(0,0,0,0.3)]
      hover:from-[#7A5530] hover:via-[#6B4423] hover:to-[#5B3921]
      hover:border-[#7A5A28]
      hover:shadow-[0_4px_16px_rgba(185,139,47,0.2),0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(185,139,47,0.3),inset_0_-2px_4px_rgba(0,0,0,0.2)]
      hover:-translate-y-[1px]
      active:translate-y-[1px] active:shadow-[0_2px_4px_rgba(0,0,0,0.4),inset_0_2px_4px_rgba(0,0,0,0.3)]
    `,
    ocean: `
      bg-gradient-to-b from-[#1E4D74] via-[#173A59] to-[#0F2840]
      border-2 border-[#0F2840]
      text-[#F4E2B6]
      shadow-[0_4px_12px_rgba(0,0,0,0.4),0_2px_4px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(42,107,158,0.4),inset_0_-2px_4px_rgba(0,0,0,0.3)]
      hover:from-[#2A6B9E] hover:via-[#1E4D74] hover:to-[#173A59]
      hover:border-[#7A5A28]
      hover:shadow-[0_4px_16px_rgba(30,77,116,0.3),inset_0_1px_0_rgba(42,107,158,0.5)]
      hover:-translate-y-[1px]
      active:translate-y-[1px] active:shadow-[0_2px_4px_rgba(0,0,0,0.4),inset_0_2px_4px_rgba(0,0,0,0.3)]
    `,
    danger: `
      bg-gradient-to-b from-[#A03830] via-[#C84A3A] to-[#8B2A1E]
      border-2 border-[#8B2A1E]
      text-[#F4E2B6]
      shadow-[0_4px_12px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,100,80,0.3),inset_0_-2px_4px_rgba(0,0,0,0.3)]
      hover:from-[#C04A40] hover:via-[#A03830] hover:to-[#C84A3A]
      hover:shadow-[0_4px_16px_rgba(200,74,58,0.3),inset_0_1px_0_rgba(255,100,80,0.4)]
      hover:-translate-y-[1px]
      active:translate-y-[1px] active:shadow-[0_2px_4px_rgba(0,0,0,0.4),inset_0_2px_4px_rgba(0,0,0,0.3)]
    `,
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-3 text-sm',
    lg: 'px-8 py-4 text-base',
  };

  return (
    <button
      className={`
        relative overflow-hidden
        rounded font-bold tracking-wider uppercase
        font-['Cinzel',_'MedievalSharp',_serif]
        transition-all duration-200 ease-out
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}
        ${className}
      `}
      disabled={disabled}
      {...props}
    >
      {/* Textura de grão (sutil) */}
      <span
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `repeating-linear-gradient(92deg, transparent, transparent 10px, rgba(0,0,0,0.03) 10px, rgba(0,0,0,0.03) 11px)`,
        }}
      />

      {/* Conteúdo */}
      <span className="relative z-[1] flex items-center justify-center gap-2">
        {icon && <span className="text-lg">{icon}</span>}
        {children}
      </span>
    </button>
  );
}
