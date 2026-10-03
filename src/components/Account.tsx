import { useRef, useState, type ReactNode } from 'react'
import { addAddress, addCard, fmtAddress, removeAddress, removeCard, setDefaultAddress, setDefaultCard, setPhoto, type Card, type User } from '../lib/store'
import { Icon, Sheet } from './ui'

type Theme = { dark: boolean }
const BRAND_PREFIX: [string, RegExp][] = [['Elo', /^(4011|4312|4389|4514|4576|5041|5067|509|6277|6362|6363|650|6516|6550)/], ['Visa', /^4/], ['Amex', /^3[47]/], ['Mastercard', /^(5[1-5]|2[2-7])/]]
export const detectBrand = (n: string) => BRAND_PREFIX.find(([, re]) => re.test(n))?.[0] ?? 'Cartão'
const luhn = (n: string) => { let s = 0; n.split('').reverse().forEach((d, i) => { let x = +d; if (i % 2) { x *= 2; if (x > 9) x -= 9 } s += x }); return s % 10 === 0 }
export const cardLabel = (c: Card) => `${c.brand} ${c.type === 'credit' ? 'crédito' : 'débito'} •••• ${c.last4}`

function resizeImage(file: File, size = 320): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const im = new Image()
    im.onload = () => {
      const s = Math.min(im.width, im.height)
      const c = document.createElement('canvas'); c.width = c.height = size
      c.getContext('2d')!.drawImage(im, (im.width - s) / 2, (im.height - s) / 2, s, s, 0, 0, size, size)
      URL.revokeObjectURL(url); resolve(c.toDataURL('image/jpeg', 0.82))
    }
    im.onerror = () => { URL.revokeObjectURL(url); reject(new Error('img')) }
    im.src = url
  })
}

export function PhotoPicker({ user, ring = 'ring-emerald' }: { user: User; ring?: string }) {
  const input = useRef<HTMLInputElement>(null)
  const [err, setErr] = useState('')
  async function onFile(f?: File) {
    if (!f) return
    if (!f.type.startsWith('image/')) return setErr('Escolha um arquivo de imagem.')
    try { setPhoto(user.id, await resizeImage(f)); setErr('') } catch { setErr('Não foi possível ler essa imagem.') }
  }
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        {user.photo
          ? <img src={user.photo} alt={user.name} className={`w-24 h-24 rounded-full object-cover ring-4 ${ring} bg-navy-100`} />
          : <div className={`w-24 h-24 rounded-full bg-navy-800 text-white ring-4 ${ring} grid place-items-center text-3xl font-extrabold`}>{user.name.split(' ').map((s) => s[0]).slice(0, 2).join('')}</div>}
        <button type="button" onClick={() => input.current?.click()} aria-label="Alterar foto de perfil" className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-emerald text-white grid place-items-center shadow-lg ring-2 ring-white active:scale-95 transition">
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>
        </button>
        <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = '' }} />
      </div>
      <div className="flex gap-3 mt-3 text-xs font-bold">
        <button type="button" onClick={() => input.current?.click()} className="underline underline-offset-2">{user.photo ? 'Trocar foto' : 'Adicionar foto'}</button>
        {user.photo && <button type="button" onClick={() => setPhoto(user.id, undefined)} className="underline underline-offset-2 opacity-70">Remover</button>}
      </div>
      {err && <p role="alert" className="text-xs font-semibold text-red-500 mt-2">{err}</p>}
    </div>
  )
}

function Section({ title, action, dark, children }: { title: string; action: ReactNode; dark: boolean; children: ReactNode }) {
  return (
    <section className="mt-6">
      <div className="flex items-center justify-between mb-3"><h2 className="font-extrabold text-lg">{title}</h2>{action}</div>
      <div className={dark ? 'space-y-2.5' : 'space-y-2.5'}>{children}</div>
    </section>
  )
}
const addBtn = (dark: boolean) => `text-sm font-extrabold px-3.5 py-1.5 rounded-full transition active:scale-95 ${dark ? 'bg-urgent text-white' : 'bg-emerald text-white'}`
const rowCls = (dark: boolean) => `rounded-2xl p-4 flex items-center gap-3 ${dark ? 'bg-white/5 border border-white/10' : 'bg-navy-100/50'}`
const muted = (dark: boolean) => (dark ? 'text-white/55' : 'text-navy-900/55')
const Badge = ({ dark }: Theme) => <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${dark ? 'bg-urgent/20 text-urgent' : 'bg-emerald/15 text-emerald-dark'}`}>PADRÃO</span>

function RowActions({ isDefault, onDefault, onRemove, dark }: { isDefault?: boolean; onDefault: () => void; onRemove: () => void; dark: boolean }) {
  return (
    <div className="flex flex-col items-end gap-1 text-xs font-bold shrink-0">
      {!isDefault && <button type="button" onClick={onDefault} className="underline underline-offset-2">Tornar padrão</button>}
      <button type="button" onClick={() => { if (confirm('Remover?')) onRemove() }} className={`underline underline-offset-2 ${dark ? 'text-red-400' : 'text-red-600'}`}>Remover</button>
    </div>
  )
}

const field = 'w-full rounded-2xl bg-navy-100/70 px-4 py-3 font-semibold outline-none focus:ring-2 focus:ring-emerald text-navy-900 placeholder:text-navy-900/35'
const Lbl = ({ t, children }: { t: string; children: ReactNode }) => <label className="block"><span className="text-xs font-bold text-navy-900/60">{t}</span><div className="mt-1.5">{children}</div></label>
const SheetHead = ({ title, onClose }: { title: string; onClose: () => void }) => (
  <div className="flex items-center justify-between mb-4"><h3 className="text-xl font-extrabold text-navy-900">{title}</h3><button type="button" onClick={onClose} aria-label="Fechar" className="w-9 h-9 rounded-full bg-navy-100 grid place-items-center text-navy-900"><Icon n="x" className="w-4 h-4" /></button></div>
)
const primary = 'w-full rounded-2xl py-4 font-extrabold text-white text-lg bg-emerald hover:bg-emerald-dark active:scale-95 transition shadow-lg shadow-emerald/40'
const maskCep = (v: string) => { const d = v.replace(/\D/g, '').slice(0, 8); return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d }

export function AddressForm({ onSave, onClose }: { onSave: (a: Parameters<typeof addAddress>[1]) => void; onClose: () => void }) {
  const [f, setF] = useState({ label: 'Casa', cep: '', street: '', number: '', district: '', city: 'São Gonçalo', complement: '' })
  const [err, setErr] = useState('')
  const up = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }))
  function save() {
    if (f.cep.replace(/\D/g, '').length !== 8) return setErr('Informe um CEP válido (8 dígitos).')
    if (!f.street.trim() || !f.number.trim() || !f.district.trim() || !f.city.trim()) return setErr('Preencha rua, número, bairro e cidade.')
    onSave({ label: f.label, cep: f.cep, street: f.street.trim(), number: f.number.trim(), district: f.district.trim(), city: f.city.trim(), complement: f.complement.trim() || undefined })
  }
  return (
    <>
      <SheetHead title="Novo endereço" onClose={onClose} />
      <div className="space-y-3.5">
        <div className="flex gap-2">{['Casa', 'Trabalho', 'Outro'].map((l) => <button type="button" key={l} onClick={() => up('label', l)} className={`px-4 py-2 rounded-full text-sm font-extrabold transition ${f.label === l ? 'bg-navy-900 text-white' : 'bg-navy-100/70 text-navy-900'}`}>{l}</button>)}</div>
        <Lbl t="CEP"><input className={field} inputMode="numeric" placeholder="00000-000" value={f.cep} onChange={(e) => up('cep', maskCep(e.target.value))} /></Lbl>
        <Lbl t="RUA"><input className={field} placeholder="Nome da rua" value={f.street} onChange={(e) => up('street', e.target.value)} /></Lbl>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-1"><Lbl t="NÚMERO"><input className={field} value={f.number} onChange={(e) => up('number', e.target.value)} /></Lbl></div>
          <div className="col-span-2"><Lbl t="COMPLEMENTO"><input className={field} placeholder="Apto, bloco… (opcional)" value={f.complement} onChange={(e) => up('complement', e.target.value)} /></Lbl></div>
        </div>
        <Lbl t="BAIRRO"><input className={field} value={f.district} onChange={(e) => up('district', e.target.value)} /></Lbl>
        <Lbl t="CIDADE"><input className={field} value={f.city} onChange={(e) => up('city', e.target.value)} /></Lbl>
        {err && <p role="alert" className="text-sm font-semibold text-red-600 bg-red-50 rounded-xl px-3 py-2">{err}</p>}
        <button type="button" onClick={save} className={primary}>Salvar endereço</button>
      </div>
    </>
  )
}

export function CardForm({ holderHint, onSave, onClose }: { holderHint: string; onSave: (c: Parameters<typeof addCard>[1]) => void; onClose: () => void }) {
  const [type, setType] = useState<'credit' | 'debit'>('credit')
  const [num, setNum] = useState('')
  const [holder, setHolder] = useState(holderHint.toUpperCase())
  const [exp, setExp] = useState('')
  const [cvv, setCvv] = useState('')
  const [err, setErr] = useState('')
  const digits = num.replace(/\D/g, '')
  const brand = detectBrand(digits)
  function save() {
    if (digits.length < 13 || digits.length > 16 || !luhn(digits)) return setErr('Número de cartão inválido.')
    if (!holder.trim()) return setErr('Informe o nome impresso no cartão.')
    const m = exp.match(/^(\d{2})\/(\d{2})$/)
    if (!m || +m[1] < 1 || +m[1] > 12) return setErr('Validade inválida (use MM/AA).')
    if (new Date(2000 + +m[2], +m[1], 1).getTime() <= Date.now()) return setErr('Este cartão está vencido.')
    if (!/^\d{3,4}$/.test(cvv)) return setErr('CVV inválido.')
    // Protótipo: só marca, final e validade são guardados. Número completo e CVV nunca são salvos.
    onSave({ type, brand, last4: digits.slice(-4), holder: holder.trim().toUpperCase(), exp })
  }
  return (
    <>
      <SheetHead title="Novo cartão" onClose={onClose} />
      <div className="space-y-3.5">
        <div className="grid grid-cols-2 bg-navy-100/70 rounded-2xl p-1 text-sm font-bold text-navy-900">
          {(['credit', 'debit'] as const).map((t) => <button type="button" key={t} onClick={() => setType(t)} className={`py-2.5 rounded-xl transition ${type === t ? 'bg-white shadow' : 'text-navy-900/50'}`}>{t === 'credit' ? 'Crédito' : 'Débito'}</button>)}
        </div>
        <Lbl t={`NÚMERO DO CARTÃO${digits ? ` · ${brand.toUpperCase()}` : ''}`}><input className={field} inputMode="numeric" autoComplete="cc-number" placeholder="0000 0000 0000 0000" value={num} onChange={(e) => setNum(e.target.value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim())} /></Lbl>
        <Lbl t="NOME NO CARTÃO"><input className={`${field} uppercase`} autoComplete="cc-name" value={holder} onChange={(e) => setHolder(e.target.value)} /></Lbl>
        <div className="grid grid-cols-2 gap-3">
          <Lbl t="VALIDADE"><input className={field} inputMode="numeric" autoComplete="cc-exp" placeholder="MM/AA" value={exp} onChange={(e) => { const d = e.target.value.replace(/\D/g, '').slice(0, 4); setExp(d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d) }} /></Lbl>
          <Lbl t="CVV"><input className={field} inputMode="numeric" type="password" autoComplete="cc-csc" placeholder="•••" value={cvv} onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))} /></Lbl>
        </div>
        <p className="text-xs text-navy-900/50 flex items-center gap-1.5"><Icon n="lock" className="w-4 h-4" />Protótipo: guardamos só a bandeira, os 4 últimos dígitos e a validade. Use números de teste (ex.: 4242 4242 4242 4242).</p>
        {err && <p role="alert" className="text-sm font-semibold text-red-600 bg-red-50 rounded-xl px-3 py-2">{err}</p>}
        <button type="button" onClick={save} className={primary}>Salvar cartão</button>
      </div>
    </>
  )
}

export function AddressSection({ user, dark = false }: { user: User; dark?: boolean }) {
  const [open, setOpen] = useState(false)
  const list = user.addresses ?? []
  return (
    <Section title="Meus endereços" dark={dark} action={<button type="button" onClick={() => setOpen(true)} className={addBtn(dark)}>+ Adicionar</button>}>
      {list.length === 0 && <p className={`text-sm ${muted(dark)}`}>Nenhum endereço cadastrado ainda.</p>}
      {list.map((a) => (
        <div key={a.id} className={rowCls(dark)}>
          <span className={`w-10 h-10 rounded-xl grid place-items-center shrink-0 ${dark ? 'bg-urgent/20 text-urgent' : 'bg-emerald/15 text-emerald-dark'}`}><Icon n={a.label === 'Trabalho' ? 'tool' : 'home'} className="w-5 h-5" /></span>
          <div className="min-w-0 flex-1">
            <p className="font-extrabold flex items-center gap-2">{a.label}{a.isDefault && <Badge dark={dark} />}</p>
            <p className={`text-sm truncate ${muted(dark)}`}>{fmtAddress(a)}</p>
            <p className={`text-xs ${muted(dark)}`}>{a.city} · CEP {a.cep}</p>
          </div>
          <RowActions dark={dark} isDefault={a.isDefault} onDefault={() => setDefaultAddress(user.id, a.id)} onRemove={() => removeAddress(user.id, a.id)} />
        </div>
      ))}
      <Sheet open={open} onClose={() => setOpen(false)}><AddressForm onClose={() => setOpen(false)} onSave={(a) => { addAddress(user.id, a); setOpen(false) }} /></Sheet>
    </Section>
  )
}

export function PaymentSection({ user, dark = false }: { user: User; dark?: boolean }) {
  const [open, setOpen] = useState(false)
  const list = user.cards ?? []
  return (
    <Section title="Formas de pagamento" dark={dark} action={<button type="button" onClick={() => setOpen(true)} className={addBtn(dark)}>+ Adicionar</button>}>
      {list.length === 0 && <p className={`text-sm ${muted(dark)}`}>Nenhum cartão cadastrado ainda.</p>}
      {list.map((c) => (
        <div key={c.id} className={rowCls(dark)}>
          <span className={`w-10 h-10 rounded-xl grid place-items-center shrink-0 ${c.type === 'credit' ? 'bg-navy-900 text-white' : 'bg-urgent/20 text-urgent'}`}><Icon n="wallet" className="w-5 h-5" /></span>
          <div className="min-w-0 flex-1">
            <p className="font-extrabold flex items-center gap-2">{c.brand} •••• {c.last4}{c.isDefault && <Badge dark={dark} />}</p>
            <p className={`text-sm ${muted(dark)}`}>{c.type === 'credit' ? 'Crédito' : 'Débito'} · vence {c.exp}</p>
            <p className={`text-xs truncate ${muted(dark)}`}>{c.holder}</p>
          </div>
          <RowActions dark={dark} isDefault={c.isDefault} onDefault={() => setDefaultCard(user.id, c.id)} onRemove={() => removeCard(user.id, c.id)} />
        </div>
      ))}
      <Sheet open={open} onClose={() => setOpen(false)}><CardForm holderHint={user.name} onClose={() => setOpen(false)} onSave={(c) => { addCard(user.id, c); setOpen(false) }} /></Sheet>
    </Section>
  )
}
