import { useSyncExternalStore } from 'react'
import { projectId, publicAnonKey } from '../../utils/supabase/info'
import { buildSeed } from './seed'

const API = `https://${projectId}.supabase.co/functions/v1/make-server-9e4cc32d`
async function api(path: string, method = 'GET', body?: unknown) {
  const res = await fetch(API + path, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${publicAnonKey}` }, body: body ? JSON.stringify(body) : undefined })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}
const pushUser = (u: User) => { api(`/users/${u.id}`, 'PUT', u).catch(console.error) }
const pushReq = (r: Request) => { api(`/requests/${r.id}`, 'PUT', r).catch(console.error) }

export type Role = 'client' | 'pro'
export type Address = { id: string; label: string; cep: string; street: string; number: string; district: string; city: string; complement?: string; isDefault?: boolean }
export type Card = { id: string; type: 'credit' | 'debit'; brand: string; last4: string; holder: string; exp: string; isDefault?: boolean }
export type User = {
  id: string; role: Role; name: string; email: string; password: string
  photo?: string; category?: string; price?: number; rating?: number; jobs?: number
  x?: number; y?: number; eta?: number; online?: boolean
  addresses?: Address[]; cards?: Card[]
}
export type Review = { rating: number; comment: string; at: number }
export type Status = 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled' | 'done'
export type Request = {
  id: string; clientId: string; proId: string; category: string; description: string
  serviceAt: string; waitMinutes: number; createdAt: number; expiresAt: number
  status: Status; price: number; address: string; respondedAt?: number
  payment?: string; review?: Review
}
type DB = { users: User[]; requests: Request[]; session: string | null }

const KEY = 'resolveja-db-v2'
const MIN = 60_000
const seed = (): DB => ({ ...buildSeed(), session: null })

let db: DB = (() => {
  try { const raw = localStorage.getItem(KEY); if (raw) return JSON.parse(raw) as DB } catch { /* noop */ }
  return seed()
})()
const subs = new Set<() => void>()
const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(db)) } catch { /* noop */ } }
function set(next: DB) { db = next; persist(); subs.forEach((f) => f()) }

let lastWrite = 0
async function pull() {
  if (Date.now() - lastWrite < 2500) return
  try {
    const r = await api('/state')
    if (!r.users.length) { await api('/reset', 'POST', { users: seed().users, requests: seed().requests }); return pull() }
    if (Date.now() - lastWrite < 2500) return
    set({ ...db, users: r.users, requests: (r.requests as Request[]).sort((a, b) => b.createdAt - a.createdAt) })
  } catch (e) { console.error('sync', e) }
}
pull()
setInterval(pull, 3000)

// Expire pending requests whose deadline passed
function sweep() {
  const now = Date.now()
  if (db.requests.some((r) => r.status === 'pending' && r.expiresAt <= now)) {
    const next = db.requests.map((r) => (r.status === 'pending' && r.expiresAt <= now ? { ...r, status: 'expired' as Status } : r))
    next.filter((r, i) => r !== db.requests[i]).forEach(pushReq)
    lastWrite = Date.now()
    set({ ...db, requests: next })
  }
}
setInterval(sweep, 1000)
sweep()

export const useDB = () => useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f) }, () => db)
export const useSession = () => { const d = useDB(); return d.users.find((u) => u.id === d.session) ?? null }

export function login(email: string, password: string, role: Role): string | null {
  const u = db.users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase() && x.password === password)
  if (!u) return 'E-mail ou senha incorretos.'
  if (u.role !== role) return u.role === 'pro' ? 'Esta conta é de Prestador. Volte e escolha o perfil Prestador.' : 'Esta conta é de Cliente. Volte e escolha o perfil Cliente.'
  set({ ...db, session: u.id })
  return null
}
export function register(p: { name: string; email: string; password: string; role: Role; category?: string; price?: number }): string | null {
  if (db.users.some((x) => x.email.toLowerCase() === p.email.trim().toLowerCase())) return 'Este e-mail já está cadastrado.'
  const u: User = {
    id: `${p.role[0]}-${Date.now()}`, role: p.role, name: p.name.trim(), email: p.email.trim(), password: p.password,
    ...(p.role === 'pro' ? { category: p.category, price: p.price, rating: 5, jobs: 0, x: 80 + Math.random() * 230, y: 60 + Math.random() * 220, eta: 4 + Math.floor(Math.random() * 14), online: true } : {}),
  }
  pushUser(u); lastWrite = Date.now()
  set({ ...db, users: [...db.users, u], session: u.id })
  return null
}
export const logout = () => set({ ...db, session: null })
export const resetDemo = () => { const s = seed(); lastWrite = Date.now(); api('/reset', 'POST', { users: s.users, requests: s.requests }).catch(console.error); set({ ...s, session: null }) }
export const toggleOnline = (id: string) => {
  const users = db.users.map((u) => (u.id === id ? { ...u, online: !u.online } : u))
  pushUser(users.find((u) => u.id === id)!); lastWrite = Date.now(); set({ ...db, users })
}

export function createRequest(r: { clientId: string; proId: string; description: string; serviceAt: string; waitMinutes: number; address: string; payment?: string }) {
  const pro = db.users.find((u) => u.id === r.proId)!
  const now = Date.now()
  const req: Request = { id: `r-${now}`, ...r, category: pro.category ?? '', createdAt: now, expiresAt: now + r.waitMinutes * MIN, status: 'pending', price: pro.price ?? 0 }
  pushReq(req); lastWrite = Date.now()
  set({ ...db, requests: [req, ...db.requests] })
  return req
}
export function setStatus(id: string, status: Status) {
  const requests = db.requests.map((r) => (r.id === id ? { ...r, status, respondedAt: Date.now() } : r))
  pushReq(requests.find((r) => r.id === id)!); lastWrite = Date.now()
  set({ ...db, requests })
}
export function patchUser(id: string, fn: (u: User) => User) {
  const users = db.users.map((u) => (u.id === id ? fn(u) : u))
  pushUser(users.find((u) => u.id === id)!); lastWrite = Date.now(); set({ ...db, users })
}
const newId = (p: string) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`
const withDefault = <T extends { id: string; isDefault?: boolean }>(list: T[], item: T): T[] => {
  const next = [...list, item]
  return next.map((x) => ({ ...x, isDefault: next.some((y) => y.isDefault) ? x.isDefault : x.id === item.id }))
}
export const setPhoto = (id: string, photo: string | undefined) => patchUser(id, (u) => ({ ...u, photo }))
export const addAddress = (id: string, a: Omit<Address, 'id'>) => patchUser(id, (u) => ({ ...u, addresses: withDefault(u.addresses ?? [], { ...a, id: newId('a'), isDefault: false }) }))
export const removeAddress = (id: string, aid: string) => patchUser(id, (u) => {
  const rest = (u.addresses ?? []).filter((a) => a.id !== aid)
  return { ...u, addresses: rest.some((a) => a.isDefault) || !rest.length ? rest : rest.map((a, i) => ({ ...a, isDefault: i === 0 })) }
})
export const setDefaultAddress = (id: string, aid: string) => patchUser(id, (u) => ({ ...u, addresses: (u.addresses ?? []).map((a) => ({ ...a, isDefault: a.id === aid })) }))
export function addCard(id: string, c: Omit<Card, 'id'>) {
  const cid = newId('k')
  patchUser(id, (u) => ({ ...u, cards: withDefault(u.cards ?? [], { ...c, id: cid, isDefault: false }) }))
  return cid
}
export const removeCard = (id: string, cid: string) => patchUser(id, (u) => {
  const rest = (u.cards ?? []).filter((c) => c.id !== cid)
  return { ...u, cards: rest.some((c) => c.isDefault) || !rest.length ? rest : rest.map((c, i) => ({ ...c, isDefault: i === 0 })) }
})
export const setDefaultCard = (id: string, cid: string) => patchUser(id, (u) => ({ ...u, cards: (u.cards ?? []).map((c) => ({ ...c, isDefault: c.id === cid })) }))

export function reviewRequest(id: string, rating: number, comment: string) {
  const r0 = db.requests.find((r) => r.id === id)
  if (!r0 || r0.status !== 'done' || r0.review) return
  const requests = db.requests.map((r) => (r.id === id ? { ...r, review: { rating, comment: comment.trim(), at: Date.now() } } : r))
  pushReq(requests.find((r) => r.id === id)!)
  const pro = db.users.find((u) => u.id === r0.proId)
  const users = pro ? db.users.map((u) => {
    if (u.id !== pro.id) return u
    const n = u.jobs ?? 0
    return { ...u, rating: Math.round((((u.rating ?? 5) * n + rating) / (n + 1)) * 100) / 100 }
  }) : db.users
  if (pro) pushUser(users.find((u) => u.id === pro.id)!)
  lastWrite = Date.now(); set({ ...db, users, requests })
}
export const needsReview = (r: Request) => r.status === 'done' && !r.review
export const fmtAddress = (a: Address) => `${a.street}, ${a.number}${a.complement ? ` – ${a.complement}` : ''} · ${a.district}`
export const userById = (id: string) => db.users.find((u) => u.id === id)

export function fmtCountdown(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60
  return `${h > 0 ? h + ':' : ''}${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')}`
}
export const fmtWhen = (iso: string) => {
  const d = new Date(iso)
  return `${d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
}
export const brl = (n: number) => `R$ ${n},00`

import { useEffect, useState } from 'react'
export function useNow(interval = 1000) {
  const [n, setN] = useState(Date.now())
  useEffect(() => { const t = setInterval(() => setN(Date.now()), interval); return () => clearInterval(t) }, [interval])
  return n
}
