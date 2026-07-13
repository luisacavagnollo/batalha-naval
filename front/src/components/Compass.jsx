export default function Compass({ size = 'md' }) {
  const sizes = {
    sm: { container: 'w-16 h-16', needle: 'w-8 h-8', north: 'border-l-[3px] border-r-[3px] border-b-[12px]', south: 'border-l-[3px] border-r-[3px] border-t-[12px]', center: 'w-1.5 h-1.5' },
    md: { container: 'w-20 h-20', needle: 'w-10 h-10', north: 'border-l-[4px] border-r-[4px] border-b-[16px]', south: 'border-l-[4px] border-r-[4px] border-t-[16px]', center: 'w-2 h-2' },
    lg: { container: 'w-24 h-24', needle: 'w-12 h-12', north: 'border-l-[5px] border-r-[5px] border-b-[20px]', south: 'border-l-[5px] border-r-[5px] border-t-[20px]', center: 'w-2.5 h-2.5' },
  };

  const s = sizes[size] || sizes.md;

  return (
    <div className={`relative ${s.container} flex items-center justify-center`}>
      {/* Outer ring - bronze */}
      <div className="absolute inset-0 rounded-full border-2 border-[#B98B2F]/50 shadow-[0_0_10px_rgba(185,139,47,0.2)]" />
      {/* Inner ring - iron */}
      <div className="absolute inset-1 rounded-full border border-[#2E2E2E]" />
      {/* Cardinal points */}
      <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[#D5AE47] text-[10px] font-bold font-['Cinzel',_serif]">N</span>
      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[#8B7355] text-[10px] font-bold font-['Cinzel',_serif]">S</span>
      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[#8B7355] text-[10px] font-bold font-['Cinzel',_serif]">W</span>
      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#8B7355] text-[10px] font-bold font-['Cinzel',_serif]">E</span>
      {/* Needle */}
      <div className={`${s.needle} animate-[compass-spin_4s_ease-in-out_infinite] flex items-center justify-center`}>
        <div className="relative w-full h-full">
          <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 ${s.north} border-l-transparent border-r-transparent border-b-[#D5AE47]`} />
          <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 ${s.south} border-l-transparent border-r-transparent border-t-[#4B2F1C]`} />
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${s.center} rounded-full bg-[#D5AE47] border border-[#7A5A28]`} />
        </div>
      </div>
    </div>
  );
}
