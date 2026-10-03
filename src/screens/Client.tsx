import { useMemo, useState } from 'react'
import { Avatar, catIcon, Icon, MapSvg, Sheet, Star, STATUS_LABEL } from '../components/ui'
import { AddressSection, cardLabel, PaymentSection, PhotoPicker } from '../components/Account'
import { brl, createRequest, fmtAddress, fmtCountdown, fmtWhen, logout, needsReview, reviewRequest, setStatus, useDB, useNow, userById, type Request, type User } from '../lib/store'

type Tab = 'home' | 'map' | 'orders' | 'me'
const CATS = ['Eletricista', 'Encanador', 'Diarista', 'Montador', 'Frete']
const WAITS = [{ m: 15, l: '15 min' }, { m: 30, l: '30 min' }, { m: 60, l: '1 hora' }, { m: 120, l: '2 horas' }, { m: 240, l: '4 horas' }]

const Stars = ({ n, className = 'w-3.5 h-3.5' }: { n: number; className?: string }) => <span className="flex">{[1, 2, 3, 4, 5].map((i) => <span key={i} className={i <= n ? '' : 'opacity-20 grayscale'}><Star className={className} /></span>)}</span>

function ProCard({ p, onOpen, active }: { p: User; onOpen: () => void; active: boolean }) {
  return (
    <button onClick={onOpen} className={`snap-center shrink-0 w-[78%] text-left bg-white rounded-2xl p-3 shadow-[0_8px_24px_-8px_rgba(11,31,68,.35)] border-2 transition ${active ? 'border-emerald' : 'border-transparent'}`}>
      <div className="flex gap-3">
        <Avatar name={p.name} photo={p.photo} className="w-20 h-20" />
        <div className="min-w-0 flex-1">
          <p className="font-extrabold truncate">{p.name}</p>
          <p className="text-sm text-navy-900/60">{p.category}</p>
          <p className="flex items-center gap-1 text-sm font-bold"><Star />{p.rating?.toFixed(1)}<span className="font-medium text-navy-900/50">({p.jobs})</span></p>
        </div>
        <div className="text-right"><p className="text-[10px] text-navy-900/50 font-semibold">A PARTIR DE</p><p className="font-extrabold text-lg">{brl(p.price ?? 0)}</p></div>
      </div>
      <div className="mt-3 flex items-center gap-2 bg-emerald/10 text-emerald-dark rounded-xl px-3 py-2 text-sm font-bold"><Icon n="car" className="w-5 h-5" />A {p.eta} minutos de distância</div>
    </button>
  )
}

function Home({ me, pros, go, pick, filter }: { me: User; pros: User[]; go: (t: Tab) => void; pick: (p: User) => void; filter: (c: string | null) => void }) {
  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-28 bg-white">
      <header className="bg-navy-900 text-white px-5 pt-8 pb-16 rounded-b-[32px]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-navy-100/70">Olá, {me.name.split(' ')[0]} 👋</p>
            <p className="flex items-center gap-1 font-bold text-lg mt-0.5"><span className="text-emerald"><Icon n="pin" className="w-5 h-5" /></span>São Gonçalo, RJ</p>
          </div>
          <button onClick={() => go('me')} aria-label="Perfil" className="w-11 h-11 rounded-full bg-white/10 grid place-items-center ring-2 ring-emerald font-extrabold overflow-hidden">{me.photo ? <img src={me.photo} alt="" className="w-full h-full object-cover" /> : me.name[0]}</button>
        </div>
      </header>
      <button onClick={() => { filter(null); go('map') }} className="mx-5 -mt-8 w-[calc(100%-2.5rem)] flex items-center gap-3 bg-white rounded-2xl px-5 py-5 shadow-[0_12px_32px_-8px_rgba(11,31,68,.35)] text-left hover:-translate-y-0.5 transition">
        <span className="text-emerald"><Icon n="search" /></span>
        <span className="font-semibold text-navy-900/60">Do que você precisa agora?</span>
        <span className="ml-auto text-xs font-bold bg-urgent/15 text-urgent px-2 py-1 rounded-full">URGENTE</span>
      </button>
      <section className="px-5 mt-7">
        <h2 className="font-extrabold text-lg mb-3">Categorias</h2>
        <div className="grid grid-cols-3 gap-3">
          {CATS.map((c) => (
            <button key={c} onClick={() => { filter(c); go('map') }} className="rounded-2xl bg-navy-100/60 hover:bg-navy-900 hover:text-white transition py-4 flex flex-col items-center gap-2 font-semibold text-sm">
              <span className="w-11 h-11 rounded-xl bg-white text-navy-800 grid place-items-center shadow-sm"><Icon n={catIcon(c)} /></span>{c}
            </button>
          ))}
          <div className="rounded-2xl bg-emerald text-white p-3 text-xs font-bold flex flex-col justify-center">Chegada média<span className="text-2xl font-extrabold">7 min</span></div>
        </div>
      </section>
      <section className="mt-7">
        <h2 className="font-extrabold text-lg px-5 mb-3">Profissionais Verificados perto de você</h2>
        <div className="flex gap-3 overflow-x-auto no-scrollbar px-5 snap-x pb-3">
          {pros.map((p) => (
            <button key={p.id} onClick={() => pick(p)} className="snap-start shrink-0 w-36 text-left rounded-2xl bg-white shadow-[0_8px_24px_-8px_rgba(11,31,68,.3)] overflow-hidden">
              <div className="relative">
                {p.photo ? <img src={p.photo} alt={p.name} className="w-full h-36 object-cover bg-navy-100" /> : <div className="w-full h-36 bg-navy-800 text-white grid place-items-center text-3xl font-extrabold">{p.name[0]}</div>}
                <span className="absolute top-2 left-2 text-emerald-dark bg-white rounded-full p-0.5"><Icon n="shield" className="w-4 h-4" /></span>
              </div>
              <div className="p-3">
                <p className="font-bold text-sm truncate">{p.name}</p>
                <p className="text-xs text-navy-900/60">{p.category}</p>
                <p className="flex items-center gap-1 text-xs font-bold mt-1"><Star className="w-3 h-3" />{p.rating?.toFixed(1)} · <span className="text-emerald-dark">{p.eta} min</span></p>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

function MapScreen({ pros, pick, cat, setCat }: { pros: User[]; pick: (p: User) => void; cat: string | null; setCat: (c: string | null) => void }) {
  const list = pros.filter((p) => !cat || p.category === cat)
  const [sel, setSel] = useState<string | null>(null)
  const active = sel ?? list[0]?.id
  return (
    <div className="h-full flex flex-col bg-navy-100">
      <div className="relative flex-1 min-h-0">
        <MapSvg>
          <circle cx="180" cy="200" r="34" fill="#2563eb" opacity=".15" className="pulse-ring" style={{ transformOrigin: '180px 200px' }} />
          <circle cx="180" cy="200" r="9" fill="#2563eb" stroke="#fff" strokeWidth="4" />
          <text x="180" y="226" textAnchor="middle" fontSize="11" fontWeight="800" fill="#0b1f44">Você</text>
        </MapSvg>
        {list.map((p) => (
          <button key={p.id} onClick={() => setSel(p.id)} aria-label={p.name} style={{ left: `${((p.x ?? 0) / 360) * 100}%`, top: `${((p.y ?? 0) / 340) * 100}%` }} className={`absolute -translate-x-1/2 -translate-y-full transition ${active === p.id ? 'scale-125 z-10' : ''}`}>
            <span className={`block w-11 h-11 rounded-full rounded-bl-none rotate-[-45deg] overflow-hidden border-[3px] shadow-lg bg-navy-800 ${active === p.id ? 'border-emerald' : 'border-navy-900'}`}>
              {p.photo ? <img src={p.photo} alt="" className="w-full h-full object-cover rotate-45 scale-150" /> : <span className="grid place-items-center w-full h-full text-white font-extrabold rotate-45">{p.name[0]}</span>}
            </span>
          </button>
        ))}
        <div className="absolute top-4 inset-x-4 space-y-2">
          <div className="flex items-center gap-2 bg-white rounded-2xl px-4 py-3 shadow-[0_8px_24px_-6px_rgba(11,31,68,.4)]">
            <span className="text-emerald"><Icon n="search" className="w-5 h-5" /></span>
            <span className="font-bold text-sm">{cat ?? 'Todos os serviços'} · São Gonçalo</span>
            <span className="ml-auto flex items-center gap-1 text-xs font-bold text-emerald-dark"><span className="w-2 h-2 rounded-full bg-emerald animate-pulse" />{list.length} ao vivo</span>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {[null, ...CATS].map((c) => <button key={c ?? 'all'} onClick={() => setCat(c)} className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-extrabold shadow transition ${cat === c ? 'bg-navy-900 text-white' : 'bg-white'}`}>{c ?? 'Todos'}</button>)}
          </div>
        </div>
      </div>
      <div className="relative -mt-6 bg-white rounded-t-[28px] pt-3 pb-24 shadow-[0_-12px_32px_-12px_rgba(11,31,68,.35)]">
        <div className="mx-auto w-10 h-1.5 rounded-full bg-navy-100 mb-3" />
        <p className="px-5 font-extrabold mb-3">Profissionais encontrados</p>
        {list.length === 0 ? <p className="px-5 text-sm text-navy-900/60 pb-4">Nenhum profissional disponível agora nesta categoria.</p> : (
          <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x px-5">
            {list.map((p) => <ProCard key={p.id} p={p} active={active === p.id} onOpen={() => (active === p.id ? pick(p) : setSel(p.id))} />)}
          </div>
        )}
      </div>
    </div>
  )
}

function defaultDateTime() {
  const d = new Date(Date.now() + 2 * 3600_000); d.setMinutes(0, 0, 0)
  const pad = (n: number) => String(n).padStart(2, '0')
  return { date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, time: `${pad(d.getHours())}:00` }
}

function RequestSheet({ pro, me, onClose, onDone }: { pro: User; me: User; onClose: () => void; onDone: () => void }) {
  const dt = useMemo(defaultDateTime, [])
  const [desc, setDesc] = useState('')
  const [date, setDate] = useState(dt.date)
  const [time, setTime] = useState(dt.time)
  const [wait, setWait] = useState(60)
  const defAddr = me.addresses?.find((a) => a.isDefault) ?? me.addresses?.[0]
  const [addr, setAddr] = useState(defAddr ? fmtAddress(defAddr) : '')
  const defCard = me.cards?.find((c) => c.isDefault) ?? me.cards?.[0]
  const [cardId, setCardId] = useState(defCard?.id ?? '')
  const [err, setErr] = useState('')
  const field = 'w-full rounded-2xl bg-navy-100/70 px-4 py-3 font-semibold outline-none focus:ring-2 focus:ring-emerald'

  function send() {
    const at = new Date(`${date}T${time}`)
    if (!desc.trim()) return setErr('Descreva rapidamente o que você precisa.')
    if (!addr.trim()) return setErr('Informe o endereço do serviço.')
    if (isNaN(at.getTime()) || at.getTime() < Date.now()) return setErr('Escolha uma data e hora no futuro.')
    createRequest({ clientId: me.id, proId: pro.id, description: desc.trim(), serviceAt: at.toISOString(), waitMinutes: wait, address: addr.trim(), payment: me.cards?.find((c) => c.id === cardId) ? cardLabel(me.cards!.find((c) => c.id === cardId)!) : undefined })
    onDone()
  }
  return (
    <>
      <div className="flex items-center gap-3">
        <Avatar name={pro.name} photo={pro.photo} className="w-14 h-14" />
        <div className="flex-1"><p className="text-xs font-extrabold text-emerald-dark">SOLICITAR SERVIÇO</p><p className="font-extrabold text-lg leading-tight">{pro.name}</p><p className="text-sm text-navy-900/60">{pro.category} · a partir de {brl(pro.price ?? 0)}</p></div>
        <button onClick={onClose} aria-label="Fechar" className="w-9 h-9 rounded-full bg-navy-100 grid place-items-center"><Icon n="x" className="w-4 h-4" /></button>
      </div>
      <div className="mt-5 space-y-4">
        <label className="block"><span className="text-xs font-bold text-navy-900/60">O QUE PRECISA SER FEITO?</span>
          <textarea rows={2} className={`${field} mt-1.5 resize-none`} placeholder="Ex.: chuveiro não esquenta, disjuntor desarma…" value={desc} onChange={(e) => setDesc(e.target.value)} /></label>
        <label className="block"><span className="text-xs font-bold text-navy-900/60">ENDEREÇO</span>
          {!!me.addresses?.length && <div className="flex gap-2 mt-1.5 flex-wrap">{me.addresses.map((a) => <button type="button" key={a.id} onClick={() => setAddr(fmtAddress(a))} className={`px-3.5 py-2 rounded-full text-sm font-extrabold transition ${addr === fmtAddress(a) ? 'bg-navy-900 text-white' : 'bg-navy-100/70'}`}>{a.label}</button>)}</div>}
          <input className={`${field} mt-1.5`} placeholder="Rua, número, bairro" value={addr} onChange={(e) => setAddr(e.target.value)} /></label>
        <div>
          <span className="text-xs font-bold text-navy-900/60 flex items-center gap-1"><Icon n="wallet" className="w-4 h-4" />FORMA DE PAGAMENTO</span>
          {me.cards?.length ? (
            <div className="flex gap-2 mt-1.5 flex-wrap">{me.cards.map((c) => <button type="button" key={c.id} onClick={() => setCardId(c.id)} className={`px-3.5 py-2 rounded-full text-sm font-extrabold transition ${cardId === c.id ? 'bg-navy-900 text-white' : 'bg-navy-100/70'}`}>{c.brand} {c.type === 'credit' ? 'créd.' : 'déb.'} {c.last4}</button>)}</div>
          ) : <p className="text-xs text-navy-900/50 mt-1.5">Nenhum cartão cadastrado. Adicione em Perfil → Formas de pagamento, ou combine direto com o profissional.</p>}
        </div>
        <div>
          <span className="text-xs font-bold text-navy-900/60 flex items-center gap-1"><Icon n="cal" className="w-4 h-4" />QUANDO O SERVIÇO DEVE ACONTECER?</span>
          <div className="grid grid-cols-2 gap-3 mt-1.5">
            <input type="date" className={field} value={date} onChange={(e) => setDate(e.target.value)} />
            <input type="time" className={field} value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>
        <div>
          <span className="text-xs font-bold text-navy-900/60 flex items-center gap-1"><Icon n="clock" className="w-4 h-4" />ESPERAR A RESPOSTA ATÉ…</span>
          <div className="flex gap-2 mt-1.5 flex-wrap">
            {WAITS.map((w) => <button key={w.m} onClick={() => setWait(w.m)} className={`px-4 py-2.5 rounded-full text-sm font-extrabold transition ${wait === w.m ? 'bg-navy-900 text-white' : 'bg-navy-100/70'}`}>{w.l}{w.m === 60 && wait !== 60 ? '' : ''}</button>)}
          </div>
          <p className="text-xs text-navy-900/50 mt-2">Se {pro.name.split(' ')[0]} não responder nesse prazo, o pedido expira automaticamente. Padrão: 1 hora.</p>
        </div>
        {err && <p role="alert" className="text-sm font-semibold text-red-600 bg-red-50 rounded-xl px-3 py-2">{err}</p>}
        <button onClick={send} className="w-full rounded-2xl py-4 font-extrabold text-white text-lg bg-emerald hover:bg-emerald-dark active:scale-95 transition shadow-lg shadow-emerald/40">Enviar solicitação</button>
      </div>
    </>
  )
}

function Profile({ p, back, request }: { p: User; back: () => void; request: () => void }) {
  const { requests } = useDB()
  const reviews = requests.filter((r) => r.proId === p.id && r.review).sort((a, b) => b.review!.at - a.review!.at)
  return (
    <div className="h-full overflow-y-auto no-scrollbar bg-white pb-44">
      <div className="relative h-80 bg-navy-900">
        {p.photo ? <img src={p.photo.replace('w=600&h=600', 'w=900&h=900')} alt={p.name} className="w-full h-full object-cover" /> : <div className="w-full h-full grid place-items-center text-white text-7xl font-extrabold">{p.name[0]}</div>}
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-transparent to-navy-950/30" />
        <button onClick={back} aria-label="Voltar" className="absolute top-5 left-5 w-10 h-10 rounded-full bg-white grid place-items-center shadow-lg"><Icon n="back" /></button>
        <div className="absolute bottom-5 left-5 right-5 text-white">
          <span className="inline-flex items-center gap-1.5 bg-emerald text-white text-xs font-extrabold px-3 py-1.5 rounded-full"><Icon n="shield" className="w-4 h-4" />Identidade Verificada</span>
          <h1 className="text-3xl font-extrabold mt-2">{p.name}</h1>
          <p className="text-white/80 font-semibold">{p.category} · a {p.eta} min de você</p>
        </div>
      </div>
      <div className="px-5 -mt-6 relative grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-[0_10px_28px_-8px_rgba(11,31,68,.35)]"><p className="text-xs font-bold text-navy-900/50">NOTA MÉDIA</p><p className="flex items-center gap-1.5 text-3xl font-extrabold">{p.rating?.toFixed(1)}<Star className="w-6 h-6" /></p><p className="text-xs text-navy-900/50">de 5.0</p></div>
        <div className="bg-white rounded-2xl p-4 shadow-[0_10px_28px_-8px_rgba(11,31,68,.35)]"><p className="text-xs font-bold text-navy-900/50">SERVIÇOS</p><p className="text-3xl font-extrabold">{p.jobs}</p><p className="text-xs text-navy-900/50">realizados</p></div>
      </div>
      <section className="px-5 mt-7">
        <h2 className="font-extrabold text-lg mb-3">Avaliações da comunidade</h2>
        <div className="space-y-3">
          {reviews.length === 0 && <p className="text-sm text-navy-900/50">Ainda sem avaliações.</p>}
          {reviews.map((r) => (
            <article key={r.id} className="rounded-2xl bg-navy-100/50 p-4">
              <div className="flex items-center justify-between"><p className="font-bold">{userById(r.clientId)?.name.split(' ')[0]} {userById(r.clientId)?.name.split(' ').slice(-1)[0][0]}.</p><Stars n={r.review!.rating} /></div>
              {r.review!.comment && <p className="text-sm mt-1.5 text-navy-900/80">{r.review!.comment}</p>}<p className="text-xs text-navy-900/50 mt-2">{new Date(r.review!.at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
            </article>
          ))}
        </div>
      </section>
      <div className="absolute bottom-20 inset-x-0 px-5 z-20">
        <div className="flex items-center gap-3 bg-white rounded-3xl p-3 shadow-[0_-8px_32px_-6px_rgba(11,31,68,.4)]">
          <div className="pl-2"><p className="text-[10px] font-bold text-navy-900/50">A PARTIR DE</p><p className="font-extrabold text-xl">{brl(p.price ?? 0)}</p></div>
          <button onClick={request} className="flex-1 rounded-2xl py-4 font-extrabold text-white text-lg bg-emerald hover:bg-emerald-dark active:scale-95 transition shadow-lg shadow-emerald/40">Chamar Profissional Agora</button>
        </div>
      </div>
    </div>
  )
}

function OrderCard({ r, now, onReview }: { r: Request; now: number; onReview: () => void }) {
  const pro = userById(r.proId)
  const st = STATUS_LABEL[r.status]
  const left = r.expiresAt - now, total = r.expiresAt - r.createdAt
  return (
    <article className="bg-white rounded-3xl p-4 shadow-[0_8px_24px_-8px_rgba(11,31,68,.3)] slide-up">
      <div className="flex items-center gap-3">
        <Avatar name={pro?.name ?? '?'} photo={pro?.photo} />
        <div className="flex-1 min-w-0"><p className="font-extrabold truncate">{pro?.name}</p><p className="text-sm text-navy-900/60">{r.category}</p></div>
        <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${st.c}`}>{st.l}</span>
      </div>
      <p className="text-sm mt-3 text-navy-900/80">{r.description}</p>
      <p className="flex items-center gap-1.5 text-sm font-bold mt-2"><Icon n="cal" className="w-4 h-4 text-emerald-dark" />{fmtWhen(r.serviceAt)}</p>
      {r.status === 'pending' && (
        <div className="mt-3 rounded-2xl bg-urgent/10 p-3">
          <div className="flex items-center justify-between text-sm font-bold text-urgent"><span className="flex items-center gap-1.5"><Icon n="clock" className="w-4 h-4" />Prazo para o profissional aceitar</span><span className="tabular-nums">{fmtCountdown(left)}</span></div>
          <div className="h-1.5 rounded-full bg-urgent/20 mt-2 overflow-hidden"><div className="h-full bg-urgent transition-all" style={{ width: `${Math.max(0, (left / total) * 100)}%` }} /></div>
          <div className="flex gap-2 mt-3">
            <button onClick={() => setStatus(r.id, 'cancelled')} className="flex-1 rounded-xl py-2.5 text-sm font-extrabold bg-white">Cancelar</button>
            <button onClick={() => setStatus(r.id, 'accepted')} className="flex-1 rounded-xl py-2.5 text-xs font-bold border-2 border-dashed border-urgent/50 text-urgent" title="Atalho de demonstração">Simular: aceitar</button>
          </div>
        </div>
      )}
      {r.status === 'accepted' && <p className="mt-3 flex items-center gap-2 rounded-2xl bg-emerald/10 text-emerald-dark px-3 py-2.5 text-sm font-bold"><Icon n="car" className="w-5 h-5" />Confirmado! {pro?.name.split(' ')[0]} vai até você na data combinada.</p>}
      {r.payment && r.status !== 'cancelled' && r.status !== 'declined' && r.status !== 'expired' && <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-navy-900/55"><Icon n="wallet" className="w-4 h-4" />{r.payment} · {brl(r.price)}</p>}
      {needsReview(r) && (
        <button onClick={onReview} className="mt-3 w-full flex items-center justify-center gap-2 rounded-2xl py-3 font-extrabold text-white bg-urgent hover:brightness-110 active:scale-95 transition shadow-lg shadow-urgent/30"><Star className="w-5 h-5" />Avaliar atendimento</button>
      )}
      {r.status === 'done' && r.review && (
        <div className="mt-3 rounded-2xl bg-navy-100/50 p-3"><div className="flex items-center justify-between"><p className="text-xs font-extrabold text-navy-900/60">SUA AVALIAÇÃO</p><Stars n={r.review.rating} /></div>{r.review.comment && <p className="text-sm mt-1.5 text-navy-900/80">{r.review.comment}</p>}</div>
      )}
      {r.status === 'expired' && <p className="mt-3 text-sm text-navy-900/60">O profissional não respondeu a tempo. Que tal chamar outro?</p>}
    </article>
  )
}

function ReviewSheet({ r, onClose }: { r: Request; onClose: () => void }) {
  const pro = userById(r.proId)
  const [stars, setStars] = useState(0)
  const [text, setText] = useState('')
  const [err, setErr] = useState('')
  const labels = ['', 'Ruim', 'Regular', 'Bom', 'Muito bom', 'Excelente']
  return (
    <>
      <div className="flex items-center gap-3">
        <Avatar name={pro?.name ?? '?'} photo={pro?.photo} className="w-14 h-14" />
        <div className="flex-1 min-w-0"><p className="text-xs font-extrabold text-urgent">AVALIAR ATENDIMENTO</p><p className="font-extrabold text-lg leading-tight truncate">{pro?.name}</p><p className="text-sm text-navy-900/60">{r.category} · {fmtWhen(r.serviceAt)}</p></div>
        <button onClick={onClose} aria-label="Fechar" className="w-9 h-9 rounded-full bg-navy-100 grid place-items-center"><Icon n="x" className="w-4 h-4" /></button>
      </div>
      <p className="text-sm text-navy-900/70 mt-4">{r.description}</p>
      <div className="mt-5 flex flex-col items-center">
        <div className="flex gap-1.5" role="radiogroup" aria-label="Nota">
          {[1, 2, 3, 4, 5].map((i) => <button key={i} type="button" role="radio" aria-checked={stars === i} aria-label={`${i} estrela${i > 1 ? 's' : ''}`} onClick={() => { setStars(i); setErr('') }} className={`transition active:scale-90 ${i <= stars ? '' : 'opacity-25 grayscale'}`}><Star className="w-11 h-11" /></button>)}
        </div>
        <p className="h-5 mt-2 text-sm font-extrabold text-navy-900/70">{labels[stars]}</p>
      </div>
      <textarea rows={3} className="w-full mt-3 rounded-2xl bg-navy-100/70 px-4 py-3 font-semibold outline-none focus:ring-2 focus:ring-emerald resize-none" placeholder="Conte como foi (opcional)" value={text} onChange={(e) => setText(e.target.value)} />
      {err && <p role="alert" className="text-sm font-semibold text-red-600 bg-red-50 rounded-xl px-3 py-2 mt-3">{err}</p>}
      <button onClick={() => { if (!stars) return setErr('Escolha uma nota de 1 a 5 estrelas.'); reviewRequest(r.id, stars, text); onClose() }} className="mt-4 w-full rounded-2xl py-4 font-extrabold text-white text-lg bg-emerald hover:bg-emerald-dark active:scale-95 transition shadow-lg shadow-emerald/40">Enviar avaliação</button>
    </>
  )
}

function Orders() {
  const { requests, session } = useDB()
  const now = useNow()
  const [f, setF] = useState<'open' | 'toRate' | 'history'>('open')
  const [rate, setRate] = useState<string | null>(null)
  const mine = requests.filter((r) => r.clientId === session).sort((a, b) => b.createdAt - a.createdAt)
  const toRate = mine.filter(needsReview)
  const list = mine.filter((r) => (f === 'open' ? r.status === 'pending' || r.status === 'accepted' : f === 'toRate' ? needsReview(r) : r.status !== 'pending' && r.status !== 'accepted'))
  const tabs = [['open', 'Em andamento'], ['toRate', `A avaliar${toRate.length ? ` (${toRate.length})` : ''}`], ['history', 'Histórico']] as const
  const rating = mine.find((r) => r.id === rate)
  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-28 bg-navy-100/40">
      <header className="bg-navy-900 text-white px-5 pt-8 pb-6 rounded-b-[28px]"><h1 className="text-2xl font-extrabold">Meus pedidos</h1><p className="text-sm text-white/60">Acompanhe prazos, histórico e avaliações</p>
        <div className="grid grid-cols-3 bg-white/10 rounded-2xl p-1 mt-4 text-[13px] font-bold">
          {tabs.map(([k, l]) => <button key={k} onClick={() => setF(k)} className={`py-2.5 rounded-xl transition ${f === k ? 'bg-white text-navy-900' : 'text-white/70'}`}>{l}</button>)}
        </div>
      </header>
      <div className="p-5 space-y-4">
        {f === 'open' && toRate.length > 0 && <button onClick={() => setF('toRate')} className="w-full text-left rounded-2xl bg-urgent/10 text-urgent px-4 py-3 text-sm font-extrabold flex items-center gap-2"><Star className="w-5 h-5" />{toRate.length} {toRate.length === 1 ? 'atendimento aguarda' : 'atendimentos aguardam'} sua avaliação<span className="ml-auto"><Icon n="arrow" className="w-4 h-4" /></span></button>}
        {list.length === 0 && <p className="text-center text-navy-900/50 py-16 font-semibold">{f === 'toRate' ? 'Tudo avaliado por aqui. 🎉' : f === 'history' ? 'Nenhum pedido no histórico.' : 'Nenhum pedido em andamento.'}</p>}
        {list.map((r) => <OrderCard key={r.id} r={r} now={now} onReview={() => setRate(r.id)} />)}
      </div>
      <Sheet open={!!rating && needsReview(rating)} onClose={() => setRate(null)}>{rating && <ReviewSheet r={rating} onClose={() => setRate(null)} />}</Sheet>
    </div>
  )
}

function Me({ me }: { me: User }) {
  const { requests } = useDB()
  const mine = requests.filter((r) => r.clientId === me.id)
  const stats = [[String(mine.length), 'Pedidos'], [String(mine.filter((r) => r.status === 'done').length), 'Concluídos'], [String(mine.filter(needsReview).length), 'A avaliar']]
  return (
    <div className="h-full bg-white pb-28 overflow-y-auto no-scrollbar">
      <header className="bg-navy-900 text-white px-5 pt-10 pb-12 rounded-b-[32px] text-center">
        <PhotoPicker user={me} />
        <h1 className="text-2xl font-extrabold mt-3">{me.name}</h1><p className="text-white/60 text-sm">{me.email} · Cliente</p>
      </header>
      <div className="px-5 -mt-6 grid grid-cols-3 gap-3 text-center relative">
        {stats.map(([v, l]) => <div key={l} className="bg-white rounded-2xl py-3 shadow-[0_10px_28px_-8px_rgba(11,31,68,.35)]"><p className="text-2xl font-extrabold">{v}</p><p className="text-xs text-navy-900/50 font-semibold">{l}</p></div>)}
      </div>
      <div className="px-5 pb-2">
        <AddressSection user={me} />
        <PaymentSection user={me} />
      </div>
      <div className="p-5"><button onClick={logout} className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 font-extrabold bg-navy-100 hover:bg-navy-100/70"><Icon n="out" className="w-5 h-5" />Sair da conta</button></div>
    </div>
  )
}

export default function ClientApp({ me }: { me: User }) {
  const { users, requests } = useDB()
  const [tab, setTab] = useState<Tab>('home')
  const [pro, setPro] = useState<User | null>(null)
  const [req, setReq] = useState(false)
  const [cat, setCat] = useState<string | null>(null)
  const pros = users.filter((u) => u.role === 'pro' && u.online)
  const pending = requests.filter((r) => r.clientId === me.id && (r.status === 'pending' || needsReview(r))).length
  const nav: { t: Tab; l: string; i: string }[] = [{ t: 'home', l: 'Início', i: 'home' }, { t: 'map', l: 'Mapa', i: 'pin' }, { t: 'orders', l: 'Pedidos', i: 'list' }, { t: 'me', l: 'Perfil', i: 'user' }]
  const view = pro ? 'pro' : tab
  return (
    <div className="h-full relative">
      <main className="h-full">
        {view === 'home' && <Home me={me} pros={pros} go={setTab} pick={setPro} filter={setCat} />}
        {view === 'map' && <MapScreen pros={pros} pick={setPro} cat={cat} setCat={setCat} />}
        {view === 'pro' && pro && <Profile p={pro} back={() => setPro(null)} request={() => setReq(true)} />}
        {view === 'orders' && <Orders />}
        {view === 'me' && <Me me={me} />}
      </main>
      <Sheet open={req && !!pro} onClose={() => setReq(false)}>
        {pro && <RequestSheet pro={pro} me={me} onClose={() => setReq(false)} onDone={() => { setReq(false); setPro(null); setTab('orders') }} />}
      </Sheet>
      <nav className="absolute bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-navy-100 grid grid-cols-4 px-2 pt-2 pb-4">
        {nav.map((n) => (
          <button key={n.t} onClick={() => { setPro(null); setTab(n.t) }} className={`flex flex-col items-center gap-0.5 py-1.5 text-[11px] font-bold transition ${view === n.t ? 'text-navy-900' : 'text-navy-900/40'}`}>
            <span className={`relative px-4 py-1 rounded-full transition ${view === n.t ? 'bg-emerald text-white' : ''}`}><Icon n={n.i} className="w-5 h-5" />{n.t === 'orders' && pending > 0 && <span className="absolute -top-0.5 right-2 w-2.5 h-2.5 rounded-full bg-urgent ring-2 ring-white" />}</span>{n.l}
          </button>
        ))}
      </nav>
    </div>
  )
}
