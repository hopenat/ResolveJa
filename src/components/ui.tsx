import type { ReactNode } from 'react'
import logoSrc from '../assets/logo.png'

export function Logo({ className = 'w-14' }: { className?: string }) {
  return (
    <div className={`relative aspect-[1036/1071] overflow-hidden rounded-[22%] shrink-0 ${className}`}>
      <img src={logoSrc} alt="ResolveJá" className="absolute max-w-none" style={{ width: '271.8%', left: '-85.9%', top: '-18.8%' }} />
    </div>
  )
}

export function Icon({ n, className = 'w-6 h-6' }: { n: string; className?: string }) {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  const d: Record<string, ReactNode> = {
    bolt: <path d="M13 2 4 14h7l-1 8 9-12h-7z" />,
    drop: <path d="M12 3s6 6.500 6 11a6 6 0 0 1-12 0c0-4.500 6-11 6-11z" />,
    broom: <path d="m14 4 6 6M4 20l7-7M9 9l6 6-3 5H6l-2-2v-6z" />,
    tool: <path d="M14.500 6.500a4 4 0 0 0 5 5L21 13l-8 8-3-3 8-8M3 21l4-4M5 7l2-2 3 3-2 2z" />,
    truck: <><path d="M2 6h12v10H2zM14 9h4l4 4v3h-8z" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></>,
    home: <path d="m3 11 9-8 9 8v10h-6v-6H9v6H3z" />,
    pin: <><path d="M12 22s7-6.500 7-12a7 7 0 0 0-14 0c0 5.500 7 12 7 12z" /><circle cx="12" cy="10" r="2.500" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.300-4.300" /></>,
    car: <path d="M5 16h14M6 16l1.500-6h9L18 16M6 16v3M18 16v3M8 13h.01M16 13h.01" />,
    nav: <path d="m3 11 18-8-8 18-2-8z" />,
    shield: <><path d="M12 3 4 6v6c0 5 3.500 8 8 9 4.500-1 8-4 8-9V6z" /><path d="m9 12 2 2 4-4" /></>,
    back: <path d="m15 5-7 7 7 7" />,
    list: <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    cal: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
    x: <path d="M6 6l12 12M18 6 6 18" />,
    check: <path d="m5 12 5 5 9-10" />,
    out: <path d="M9 4H5v16h4M16 8l4 4-4 4M20 12H9" />,
    wallet: <><path d="M3 7h15a3 3 0 0 1 3 3v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M3 7l12-3v3M17 14h.01" /></>,
    users: <><circle cx="9" cy="8" r="3.500" /><path d="M2 20a7 7 0 0 1 14 0M16 5a3.500 3.500 0 0 1 0 7M22 20a7 7 0 0 0-4-6" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m3 8 9 6 9-6" /></>,
    lock: <><rect x="5" y="11" width="14" height="10" rx="3" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
    arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  }
  return <svg viewBox="0 0 24 24" className={className} {...p}>{d[n]}</svg>
}
export const catIcon = (c?: string) => ({ Eletricista: 'bolt', Encanador: 'drop', Diarista: 'broom', Montador: 'tool', Frete: 'truck' } as Record<string, string>)[c ?? ''] ?? 'tool'

export const Star = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={`${className} fill-amber-400`}><path d="m12 2 3 6.500 7 .8-5.200 4.800 1.500 7L12 17.500 5.700 21l1.500-7L2 9.300l7-.8z" /></svg>
)

export function Avatar({ name, photo, className = 'w-12 h-12' }: { name: string; photo?: string; className?: string }) {
  return photo
    ? <img src={photo} alt={name} className={`${className} rounded-xl object-cover bg-navy-100`} />
    : <div className={`${className} rounded-xl bg-navy-800 text-white grid place-items-center font-extrabold`}>{name.split(' ').map((s) => s[0]).slice(0, 2).join('')}</div>
}

export function MapSvg({ children, route, dark }: { children?: ReactNode; route?: boolean; dark?: boolean }) {
  const c = dark ? { bg: '#0f2447', road: '#1c3a6b', road2: '#183260', park: '#12353a', water: '#0a1b38' } : { bg: '#e8eef6', road: '#fff', road2: '#fff', park: '#d3e6dc', water: '#c9dcf2' }
  return (
    <svg viewBox="0 0 360 340" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full" style={{ background: c.bg }}>
      <rect x="230" y="190" width="140" height="90" rx="14" fill={c.park} />
      <path d="M-10 300 C 80 270, 160 330, 380 290 L380 350 L-10 350z" fill={c.water} />
      <g stroke={c.road} strokeWidth="10" fill="none" strokeLinecap="round">
        <path d="M-10 60 L370 120" /><path d="M-10 190 L370 160" /><path d="M60 -10 L90 350" />
        <path d="M200 -10 L170 350" /><path d="M300 -10 L330 350" /><path d="M-10 250 L370 240" />
      </g>
      <g stroke={c.road2} strokeWidth="5" fill="none"><path d="M-10 120 L370 70" /><path d="M130 -10 L135 350" /><path d="M250 -10 L260 350" /><path d="M-10 20 L370 30" /><path d="M-10 320 L370 340" /></g>
      {route && (
        <>
          <path d="M60 300 L90 250 L170 245 L175 190 L250 175 L300 120 L300 60" stroke={dark ? '#071530' : '#0b1f44'} strokeWidth="9" fill="none" strokeLinejoin="round" strokeLinecap="round" />
          <path d="M60 300 L90 250 L170 245 L175 190 L250 175 L300 120 L300 60" stroke="#34d399" strokeWidth="4" fill="none" className="route-flow" strokeLinecap="round" />
          <path d="M175 190 L250 175" stroke="#ff7a1a" strokeWidth="5" fill="none" strokeLinecap="round" />
        </>
      )}
      {children}
    </svg>
  )
}

export function Sheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  if (!open) return null
  return (
    <div className="absolute inset-0 z-40 flex items-end">
      <button aria-label="Fechar" onClick={onClose} className="absolute inset-0 bg-navy-950/60" />
      <div className="relative w-full max-h-[92%] overflow-y-auto no-scrollbar bg-white rounded-t-[28px] p-5 pb-8 slide-up">
        <div className="mx-auto w-10 h-1.5 rounded-full bg-navy-100 mb-4" />
        {children}
      </div>
    </div>
  )
}

export const STATUS_LABEL: Record<string, { l: string; c: string }> = {
  pending: { l: 'Aguardando resposta', c: 'bg-urgent/15 text-urgent' },
  accepted: { l: 'Aceito', c: 'bg-emerald/15 text-emerald-dark' },
  declined: { l: 'Recusado', c: 'bg-red-100 text-red-600' },
  expired: { l: 'Prazo expirado', c: 'bg-navy-100 text-navy-900/60' },
  cancelled: { l: 'Cancelado', c: 'bg-navy-100 text-navy-900/60' },
  done: { l: 'Concluído', c: 'bg-navy-900 text-white' },
}
