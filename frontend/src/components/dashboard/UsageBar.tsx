interface UsageBarProps {
  label: string;
  percentage: number;
  subText: string;
}

export default function UsageBar({ label, percentage, subText }: UsageBarProps) {
  // Animación del ancho de la barra
  const clamped = Math.min(100, Math.max(0, percentage));
  
  // Color dinámico según uso para alertar visualmente (Verde < 60, Naranja < 85, Rojo > 85)
  const barColor = clamped > 85 ? 'bg-red-500' : clamped > 60 ? 'bg-amber-400' : 'bg-blue-500';
  const shadowColor = clamped > 85 ? 'shadow-red-500/50' : clamped > 60 ? 'shadow-amber-400/50' : 'shadow-blue-500/50';

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between items-end">
        <span className="text-sm font-semibold text-slate-300">{label}</span>
        <span className="text-sm font-bold text-slate-100">{clamped}%</span>
      </div>
      
      <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700/50 relative">
        <div 
          className={`h-full ${barColor} ${shadowColor} rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] transition-all duration-700 ease-out`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      
      <p className="text-xs text-slate-500 font-medium tracking-wide flex justify-between">
        <span>Uso actual</span>
        <span>{subText}</span>
      </p>
    </div>
  );
}
