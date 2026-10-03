import { useState, type FormEvent } from 'react'
import { Icon, Logo } from '../components/ui'
import { login, register, resetDemo, type Role } from '../lib/store'

const CATS = ['Eletricista', 'Encanador', 'Diarista', 'Montador', 'Frete']

export function Welcome({ pick }: { pick: (r: Role) => void }) {
  return (
    <div className="h-full overflow-y-auto no-scrollbar bg-navy-950 text-white relative">
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-emerald/20 blur-3xl" />
      <div className="absolute bottom-0 -left-20 w-72 h-72 rounded-full bg-urgent/15 blur-3xl" />
      <div className="relative px-6 pt-12 pb-10 min-h-full flex flex-col">
        <div className="flex flex-col items-center text-center slide-up">
          <Logo className="w-28 shadow-2xl shadow-black/50" />
          <h1 className="text-3xl font-extrabold mt-5">Resolve<span className="text-urgent">Já</span></h1>
          <p className="text-white/70 mt-2 max-w-[18rem]">Serviços urgentes e reparos perto de você, com o profissional certo a minutos de distância.</p>
        </div>
        <p className="mt-10 mb-3 text-xs font-extrabold tracking-widest text-white/50">COMO VOCÊ QUER ENTRAR?</p>
        <div className="space-y-4">
          <button onClick={() => pick('client')} className="slide-up w-full text-left rounded-3xl p-5 bg-white text-navy-900 hover:-translate-y-1 transition shadow-2xl shadow-black/30 group">
            <div className="flex items-center gap-4">
              <span className="w-14 h-14 rounded-2xl bg-emerald text-white grid place-items-center"><Icon n="search" className="w-7 h-7" /></span>
              <div className="flex-1"><p className="text-xl font-extrabold">Sou Cliente</p><p className="text-sm text-navy-900/60">Preciso contratar um serviço agora</p></div>
              <span className="text-emerald group-hover:translate-x-1 transition"><Icon n="arrow" /></span>
            </div>
          </button>
          <button onClick={() => pick('pro')} style={{ animationDelay: '.1s' }} className="slide-up w-full text-left rounded-3xl p-5 bg-navy-800 border border-white/10 hover:-translate-y-1 transition shadow-2xl shadow-black/30 group">
            <div className="flex items-center gap-4">
              <span className="w-14 h-14 rounded-2xl bg-urgent text-white grid place-items-center"><Icon n="tool" className="w-7 h-7" /></span>
              <div className="flex-1"><p className="text-xl font-extrabold">Sou Prestador</p><p className="text-sm text-white/60">Quero receber chamados e ganhar mais</p></div>
              <span className="text-urgent group-hover:translate-x-1 transition"><Icon n="arrow" /></span>
            </div>
          </button>
        </div>
        <div className="mt-auto pt-10 text-center text-xs text-white/40">
          Protótipo · dados de demonstração <button onClick={() => { if (confirm('Restaurar dados de demonstração?')) resetDemo() }} className="underline ml-1">restaurar</button>
        </div>
      </div>
    </div>
  )
}

export function Auth({ role, back }: { role: Role; back: () => void }) {
  const pro = role === 'pro'
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [f, setF] = useState({ name: '', email: '', password: '', category: CATS[0], price: '80' })
  const [err, setErr] = useState<string | null>(null)
  const up = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }))
  const accent = pro ? 'bg-urgent hover:brightness-110 shadow-urgent/40' : 'bg-emerald hover:bg-emerald-dark shadow-emerald/40'

  function submit(e: FormEvent) {
    e.preventDefault()
    if (f.password.length < 6 && mode === 'signup') return setErr('A senha precisa ter ao menos 6 caracteres.')
    const r = mode === 'login'
      ? login(f.email, f.password, role)
      : register({ name: f.name, email: f.email, password: f.password, role, category: f.category, price: Number(f.price) || 80 })
    setErr(r)
  }
  const demo = () => { setMode('login'); setF((s) => ({ ...s, email: pro ? 'prestador@resolveja.com' : 'cliente@resolveja.com', password: '123456' })); setErr(null) }

  const field = 'w-full rounded-2xl bg-navy-100/70 pl-12 pr-4 py-3.5 font-semibold outline-none focus:ring-2 focus:ring-emerald placeholder:text-navy-900/35'
  const plain = field.replace('pl-12', 'px-4')
  const iconCls = 'absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-900/40 pointer-events-none'
  return (
    <div className="h-full overflow-y-auto no-scrollbar bg-gradient-to-b from-white to-navy-100/40">
      <div className="min-h-full flex flex-col">
        <div className={`${pro ? 'bg-navy-950' : 'bg-navy-900'} text-white px-6 pt-8 pb-16 rounded-b-[32px] relative`}>
          <button onClick={back} aria-label="Voltar" className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition grid place-items-center"><Icon n="back" /></button>
          <div className="flex items-center gap-4 mt-5">
            <Logo className="w-14 shrink-0" />
            <div>
              <p className={`text-xs font-extrabold tracking-widest ${pro ? 'text-urgent' : 'text-emerald'}`}>{pro ? 'ÁREA DO PRESTADOR' : 'ÁREA DO CLIENTE'}</p>
              <h1 className="text-2xl font-extrabold leading-tight">{mode === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta'}</h1>
              {mode === 'signup' && <p className="text-sm text-white/60 mt-0.5">{pro ? 'Receba chamados perto de você' : 'Leva menos de 1 minuto'}</p>}
            </div>
          </div>
        </div>
        <form onSubmit={submit} className="relative z-10 flex-1 flex flex-col px-6 -mt-8 pb-8">
          <div className="bg-white rounded-3xl p-5 shadow-[0_16px_40px_-12px_rgba(11,31,68,.35)] space-y-3">
            <div className="grid grid-cols-2 bg-navy-100/70 rounded-2xl p-1 text-sm font-bold">
              {(['login', 'signup'] as const).map((m) => (
                <button type="button" key={m} onClick={() => { setMode(m); setErr(null) }} className={`py-2.5 rounded-xl transition ${mode === m ? 'bg-white shadow text-navy-900' : 'text-navy-900/50'}`}>{m === 'login' ? 'Entrar' : 'Cadastrar'}</button>
              ))}
            </div>
            {mode === 'signup' && <div className="relative"><Icon n="user" className={iconCls} /><input required className={field} placeholder="Nome completo" value={f.name} onChange={(e) => up('name', e.target.value)} /></div>}
            <div className="relative"><Icon n="mail" className={iconCls} /><input required type="email" autoComplete="email" className={field} placeholder="E-mail" value={f.email} onChange={(e) => up('email', e.target.value)} /></div>
            <div className="relative"><Icon n="lock" className={iconCls} /><input required type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} className={field} placeholder="Senha" value={f.password} onChange={(e) => up('password', e.target.value)} /></div>
            {mode === 'signup' && <p className="text-xs font-semibold text-navy-900/50 px-1 -mt-1">Mínimo de 6 caracteres</p>}
            {mode === 'signup' && pro && (
              <div className="space-y-3 pt-2 border-t border-navy-100">
                <p className="text-xs font-extrabold tracking-widest text-navy-900/50 pt-1">SUA ESPECIALIDADE</p>
                <div className="flex flex-wrap gap-2">
                  {CATS.map((c) => <button type="button" key={c} onClick={() => up('category', c)} className={`px-3.5 py-2 rounded-full text-sm font-bold transition ${f.category === c ? 'bg-urgent text-white shadow-md shadow-urgent/30' : 'bg-navy-100/70 hover:bg-navy-100'}`}>{c}</button>)}
                </div>
                <p className="text-xs font-extrabold tracking-widest text-navy-900/50 pt-1">PREÇO BASE</p>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-extrabold text-navy-900/50 pointer-events-none">R$</span>
                  <input type="number" min={20} inputMode="numeric" className={`${field} !pl-12`} value={f.price} onChange={(e) => up('price', e.target.value)} />
                </div>
              </div>
            )}
            {err && <p role="alert" className="text-sm font-semibold text-red-600 bg-red-50 rounded-xl px-3 py-2">{err}</p>}
            <button className={`w-full rounded-2xl py-4 font-extrabold text-white text-lg shadow-lg active:scale-95 transition ${accent}`}>{mode === 'login' ? 'Entrar' : 'Criar conta e entrar'}</button>
          </div>
          {mode === 'login' ? (
            <>
              <div className="flex items-center gap-3 mt-6 text-xs font-bold text-navy-900/40">
                <span className="flex-1 h-px bg-navy-900/10" />OU<span className="flex-1 h-px bg-navy-900/10" />
              </div>
              <button type="button" onClick={demo} className="mt-4 w-full rounded-2xl bg-white border border-navy-100 shadow-sm py-3.5 text-sm font-bold text-navy-900/80 hover:border-emerald transition">
                Usar conta de demonstração {pro ? '(Marcos, eletricista)' : '(Rafael)'}
              </button>
            </>
          ) : (
            <p className="mt-6 text-center text-sm font-semibold text-navy-900/60">
              Já tem conta? <button type="button" onClick={() => { setMode('login'); setErr(null) }} className={`font-extrabold underline ${pro ? 'text-urgent' : 'text-emerald-dark'}`}>Entrar</button>
            </p>
          )}
          <p className="mt-auto pt-8 text-center text-xs text-navy-900/40">Protótipo · dados de demonstração</p>
        </form>
      </div>
    </div>
  )
}
