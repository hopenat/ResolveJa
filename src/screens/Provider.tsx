import { useState } from 'react'
import { Avatar, Icon, MapSvg, STATUS_LABEL } from '../components/ui'
import { AddressSection, PhotoPicker } from '../components/Account'
import { brl, fmtCountdown, fmtWhen, logout, setStatus, toggleOnline, useDB, useNow, userById, type Request, type User } from '../lib/store'

type Tab = 'dash' | 'jobs' | 'me'

function Countdown({ r, now }: { r: Request; now: number }) {
  const left = r.expiresAt - now, total = r.expiresAt - r.createdAt
  const urgent = left < 10 * 60_000
  return (
    <div className={`rounded-2xl p-3 ${urgent ? 'bg-red-500/15' : 'bg-urgent/15'}`}>
      <div className={`flex items-center justify-between text-sm font-extrabold ${urgent ? 'text-red-400' : 'text-urgent'}`}>
        <span className="flex items-center gap-1.5"><Icon n="clock" className="w-4 h-4" />Responda em</span><span className="tabular-nums text-lg">{fmtCountdown(left)}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10 mt-2 overflow-hidden"><div className={`h-full transition-all ${urgent ? 'bg-red-400' : 'bg-urgent'}`} style={{ width: `${Math.max(0, (left / total) * 100)}%` }} /></div>
    </div>
  )
}

function Actions({ r }: { r: Request }) {
  return (
    <div className="grid grid-cols-5 gap-2">
      <button onClick={() => setStatus(r.id, 'declined')} className="col-span-2 rounded-2xl py-3.5 font-extrabold bg-white/10 hover:bg-white/15 active:scale-95 transition">Recusar</button>
      <button onClick={() => setStatus(r.id, 'accepted')} className="col-span-3 rounded-2xl py-3.5 font-extrabold bg-emerald text-white hover:bg-emerald-dark active:scale-95 transition shadow-lg shadow-emerald/30">Aceitar</button>
    </div>
  )
}

function Dash({ me, mine, now }: { me: User; mine: Request[]; now: number }) {
  const pending = mine.filter((r) => r.status === 'pending').sort((a, b) => a.expiresAt - b.expiresAt)
  const earn = mine.filter((r) => r.status === 'accepted' || r.status === 'done').reduce((s, r) => s + r.price, 0)
  const next = pending[0]
  const client = next ? userById(next.clientId) : null
  return (
    <div className="relative h-full">
      <MapSvg route dark>
        <circle cx="60" cy="300" r="12" fill="#ff7a1a" opacity=".25" className="pulse-ring" style={{ transformOrigin: '60px 300px' }} />
        <circle cx="60" cy="300" r="9" fill="#ff7a1a" stroke="#fff" strokeWidth="4" />
        <g transform="translate(300 60)"><path d="M0 0c-14-14-14-34 0-34s14 20 0 34z" fill="#10b981" stroke="#fff" strokeWidth="3" /><circle cx="0" cy="-22" r="5" fill="#fff" /></g>
      </MapSvg>
      <div className="absolute top-4 inset-x-4 space-y-2">
        <div className="flex items-center gap-3 bg-navy-950/95 backdrop-blur text-white rounded-2xl px-4 py-3 shadow-xl border border-white/10">
          <div className="flex-1 leading-tight"><p className="text-[10px] font-extrabold text-urgent tracking-wider">DEEPTECH · ROTEAMENTO IA</p><p className="font-extrabold">{me.online ? '12 min · 4,8 km até o próximo' : 'Você está offline'}</p></div>
          <button onClick={() => toggleOnline(me.id)} aria-pressed={!!me.online} className={`relative w-14 h-8 rounded-full transition ${me.online ? 'bg-emerald' : 'bg-white/20'}`}><span className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${me.online ? 'left-7' : 'left-1'}`} /></button>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 bg-navy-950/95 text-white rounded-2xl px-4 py-2.5 border border-white/10"><p className="text-[10px] font-bold text-white/50">GANHOS PREVISTOS</p><p className="font-extrabold text-emerald">{brl(earn)}</p></div>
          <div className="flex-1 bg-navy-950/95 text-white rounded-2xl px-4 py-2.5 border border-white/10"><p className="text-[10px] font-bold text-white/50">NA FILA</p><p className="font-extrabold text-urgent">{pending.length} {pending.length === 1 ? 'chamado' : 'chamados'}</p></div>
        </div>
      </div>
      <div className="absolute bottom-24 inset-x-4">
        {next && me.online ? (
          <div key={next.id} className="bg-navy-950 text-white rounded-3xl p-4 shadow-[0_16px_40px_-8px_rgba(0,0,0,.7)] border border-white/10 space-y-3 slide-up">
            <p className="flex items-center gap-2 text-xs font-extrabold text-urgent"><span className="w-2 h-2 rounded-full bg-urgent animate-ping" />NOVO SERVIÇO PRÓXIMO</p>
            <div className="flex items-center gap-3">
              <Avatar name={client?.name ?? '?'} photo={client?.photo} className="w-14 h-14" />
              <div className="flex-1 min-w-0"><p className="font-extrabold truncate">{client?.name}</p><p className="text-sm text-white/60 line-clamp-2">{next.description}</p></div>
              <div className="text-right"><p className="text-[10px] font-bold text-white/50">VOCÊ RECEBE</p><p className="text-2xl font-extrabold text-emerald">{brl(next.price)}</p></div>
            </div>
            <div className="text-xs font-semibold text-white/70 space-y-1">
              <p className="flex items-center gap-1.5"><Icon n="cal" className="w-4 h-4 text-urgent" />{fmtWhen(next.serviceAt)}</p>
              <p className="flex items-center gap-1.5"><Icon n="pin" className="w-4 h-4 text-urgent" />{next.address}</p>
            </div>
            <Countdown r={next} now={now} />
            <Actions r={next} />
          </div>
        ) : (
          <div className="bg-navy-950/95 text-white rounded-3xl p-5 text-center border border-white/10"><p className="font-extrabold">{me.online ? 'Sem chamados no momento' : 'Fique online para receber chamados'}</p><p className="text-sm text-white/60 mt-1">{me.online ? 'Avisaremos assim que alguém por perto precisar de você.' : 'Use o botão no topo da tela.'}</p></div>
        )}
      </div>
    </div>
  )
}

function Jobs({ mine, now }: { mine: Request[]; now: number }) {
  const [f, setF] = useState<'pending' | 'accepted' | 'history'>('pending')
  const list = mine.filter((r) => (f === 'history' ? !['pending', 'accepted'].includes(r.status) : r.status === f))
  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-28 bg-navy-950 text-white">
      <header className="px-5 pt-8 pb-4"><h1 className="text-2xl font-extrabold">Solicitações</h1>
        <div className="grid grid-cols-3 bg-white/10 rounded-2xl p-1 mt-4 text-sm font-bold">
          {([['pending', 'Novas'], ['accepted', 'Agendadas'], ['history', 'Histórico']] as const).map(([k, l]) => <button key={k} onClick={() => setF(k)} className={`py-2.5 rounded-xl transition ${f === k ? 'bg-urgent text-white' : 'text-white/60'}`}>{l}</button>)}
        </div></header>
      <div className="px-5 space-y-3">
        {list.length === 0 && <p className="text-center text-white/40 py-16 font-semibold">Nada por aqui.</p>}
        {list.map((r) => {
          const c = userById(r.clientId); const st = STATUS_LABEL[r.status]
          return (
            <article key={r.id} className="bg-navy-800/70 border border-white/10 rounded-3xl p-4 space-y-3">
              <div className="flex items-center gap-3"><Avatar name={c?.name ?? '?'} /><div className="flex-1 min-w-0"><p className="font-extrabold truncate">{c?.name}</p><p className="text-xs text-white/60">{fmtWhen(r.serviceAt)}</p></div><p className="font-extrabold text-emerald">{brl(r.price)}</p></div>
              <p className="text-sm text-white/80">{r.description}</p>
              <p className="text-xs text-white/50 flex items-center gap-1"><Icon n="pin" className="w-3.5 h-3.5" />{r.address}</p>
              {r.status === 'pending' ? <><Countdown r={r} now={now} /><Actions r={r} /></> : <span className={`inline-block text-xs font-extrabold px-2.5 py-1 rounded-full ${st.c}`}>{st.l}</span>}
              {r.status === 'accepted' && <button onClick={() => setStatus(r.id, 'done')} className="w-full rounded-2xl py-3 font-extrabold bg-white/10 hover:bg-white/15 text-sm">Marcar como concluído</button>}
            </article>
          )
        })}
      </div>
    </div>
  )
}

function Me({ me, mine }: { me: User; mine: Request[] }) {
  const done = mine.filter((r) => r.status === 'done').length
  const reviews = mine.filter((r) => r.review).sort((a, b) => b.review!.at - a.review!.at)
  return (
    <div className="h-full bg-navy-950 text-white pb-28 overflow-y-auto no-scrollbar">
      <header className="px-5 pt-10 pb-8 text-center">
        <PhotoPicker user={me} ring="ring-urgent" />
        <h1 className="text-2xl font-extrabold mt-3">{me.name}</h1><p className="text-white/60 text-sm">{me.category} · {brl(me.price ?? 0)} base</p>
        <span className="inline-flex items-center gap-1 mt-2 bg-emerald/20 text-emerald text-xs font-extrabold px-3 py-1.5 rounded-full"><Icon n="shield" className="w-4 h-4" />Identidade Verificada</span>
      </header>
      <div className="px-5 grid grid-cols-3 gap-3 text-center">
        {[[me.rating?.toFixed(1) ?? '5.0', 'Nota'], [String((me.jobs ?? 0) + done), 'Serviços'], [String(mine.length), 'Chamados']].map(([v, l]) => <div key={l} className="rounded-2xl bg-white/5 border border-white/10 py-4"><p className="text-2xl font-extrabold">{v}</p><p className="text-xs text-white/50">{l}</p></div>)}
      </div>
      <div className="px-5">
        <AddressSection user={me} dark />
        <section className="mt-6">
          <h2 className="font-extrabold text-lg mb-3">Avaliações recebidas</h2>
          <div className="space-y-2.5">
            {reviews.length === 0 && <p className="text-sm text-white/55">Ainda sem avaliações.</p>}
            {reviews.map((r) => (
              <article key={r.id} className="rounded-2xl p-4 bg-white/5 border border-white/10">
                <div className="flex items-center justify-between"><p className="font-bold">{userById(r.clientId)?.name}</p><span className="font-extrabold text-amber-400">{'★'.repeat(r.review!.rating)}<span className="text-white/20">{'★'.repeat(5 - r.review!.rating)}</span></span></div>
                {r.review!.comment && <p className="text-sm mt-1.5 text-white/75">{r.review!.comment}</p>}
              </article>
            ))}
          </div>
        </section>
      </div>
      <div className="p-5"><button onClick={logout} className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 font-extrabold bg-white/10 hover:bg-white/15"><Icon n="out" className="w-5 h-5" />Sair da conta</button></div>
    </div>
  )
}

export default function ProviderApp({ me }: { me: User }) {
  const { requests } = useDB()
  const now = useNow()
  const [tab, setTab] = useState<Tab>('dash')
  const mine = requests.filter((r) => r.proId === me.id).sort((a, b) => b.createdAt - a.createdAt)
  const pending = mine.filter((r) => r.status === 'pending').length
  const nav: { t: Tab; l: string; i: string }[] = [{ t: 'dash', l: 'Rotas', i: 'nav' }, { t: 'jobs', l: 'Chamados', i: 'list' }, { t: 'me', l: 'Perfil', i: 'user' }]
  return (
    <div className="h-full relative bg-navy-950">
      <main className="h-full">
        {tab === 'dash' && <Dash me={me} mine={mine} now={now} />}
        {tab === 'jobs' && <Jobs mine={mine} now={now} />}
        {tab === 'me' && <Me me={me} mine={mine} />}
      </main>
      <nav className="absolute bottom-0 inset-x-0 z-30 bg-navy-950/95 backdrop-blur border-t border-white/10 grid grid-cols-3 px-2 pt-2 pb-4">
        {nav.map((n) => (
          <button key={n.t} onClick={() => setTab(n.t)} className={`flex flex-col items-center gap-0.5 py-1.5 text-[11px] font-bold transition ${tab === n.t ? 'text-white' : 'text-white/40'}`}>
            <span className={`relative px-4 py-1 rounded-full transition ${tab === n.t ? 'bg-urgent text-white' : ''}`}><Icon n={n.i} className="w-5 h-5" />{n.t === 'jobs' && pending > 0 && <span className="absolute -top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-emerald text-[10px] grid place-items-center text-white">{pending}</span>}</span>{n.l}
          </button>
        ))}
      </nav>
    </div>
  )
}
