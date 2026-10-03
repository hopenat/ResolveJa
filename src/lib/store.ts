import { useSyncExternalStore } from 'react'
import { projectId, publicAnonKey } from '../../utils/supabase/info'

const API = `https://${projectId}.supabase.co/functions/v1/make-server-9e4cc32d`
async function api(path: string, method = 'GET', body?: unknown) {
  const res = await fetch(API + path, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${publicAnonKey}` }, body: body ? JSON.stringify(body) : undefined })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}
const pushUser = (u: User) => { api(`/users/${u.id}`, 'PUT', u).catch(console.error) }
const pushReq = (r: Request) => { api(`/requests/${r.id}`, 'PUT', r).catch(console.error) }

export type Role = 'client' | 'pro'
export type User = {
  id: string; role: Role; name: string; email: string; password: string
  photo?: string; category?: string; price?: number; rating?: number; jobs?: number
  x?: number; y?: number; eta?: number; online?: boolean
}
export type Status = 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled' | 'done'
export type Request = {
  id: string; clientId: string; proId: string; category: string; description: string
  serviceAt: string; waitMinutes: number; createdAt: number; expiresAt: number
  status: Status; price: number; address: string; respondedAt?: number
}
type DB = { users: User[]; requests: Request[]; session: string | null }

const KEY = 'resolveja-db-v1'
const img = (id: string) => `https://images.unsplash.com/photo-${id}?w=600&h=600&fit=crop&auto=format`
const MIN = 60_000

function seed(): DB {
  const now = Date.now()
  const users: User[] = [
    { id: 'c-demo', role: 'client', name: 'Rafael Moreira', email: 'cliente@resolveja.com', password: '123456' },
    { id: 'p-demo', role: 'pro', name: 'Marcos Oliveira', email: 'prestador@resolveja.com', password: '123456', category: 'Eletricista', price: 80, rating: 4.9, jobs: 120, x: 250, y: 150, eta: 5, online: true, photo: img('1649768870222-17848797d6b4') },
    { id: 'p-2', role: 'pro', name: 'Juliana Prado', email: 'juliana@resolveja.com', password: '123456', category: 'Diarista', price: 120, rating: 4.8, jobs: 214, x: 110, y: 240, eta: 8, online: true, photo: img('1494790108377-be9c29b29330') },
    { id: 'p-3', role: 'pro', name: 'Rogério Santos', email: 'rogerio@resolveja.com', password: '123456', category: 'Encanador', price: 90, rating: 4.7, jobs: 86, x: 290, y: 270, eta: 11, online: true, photo: img('1732395805034-e0bf859665e5') },
    { id: 'p-4', role: 'pro', name: 'Camila Duarte', email: 'camila@resolveja.com', password: '123456', category: 'Montador', price: 70, rating: 5.0, jobs: 63, x: 70, y: 110, eta: 14, online: true, photo: img('1581065178047-8ee15951ede6') },
    { id: 'p-5', role: 'pro', name: 'Wellington Reis', email: 'well@resolveja.com', password: '123456', category: 'Frete', price: 150, rating: 4.6, jobs: 340, x: 200, y: 60, eta: 17, online: true, photo: img('1787672357491-d43acdf974cb') },
    { id: 'c-2', role: 'client', name: 'Patrícia Mendes', email: 'patricia@exemplo.com', password: '123456' },
    { id: 'c-3', role: 'client', name: 'Paulo Henrique', email: 'paulo@exemplo.com', password: '123456' },
  ]
  const day = (d: number, h: number) => { const t = new Date(now + d * 864e5); t.setHours(h, 0, 0, 0); return t.toISOString() }
  const requests: Request[] = [
    { id: 'r1', clientId: 'c-2', proId: 'p-demo', category: 'Eletricista', description: 'Disjuntor desarmando toda vez que ligo o chuveiro.', serviceAt: day(0, 18), waitMinutes: 60, createdAt: now - 4 * MIN, expiresAt: now + 56 * MIN, status: 'pending', price: 95, address: 'Rua Dr. Nilo Peçanha, 210 · Zé Garoto' },
    { id: 'r2', clientId: 'c-3', proId: 'p-demo', category: 'Eletricista', description: 'Instalar 3 tomadas novas na sala e trocar o ventilador de teto.', serviceAt: day(1, 9), waitMinutes: 240, createdAt: now - 20 * MIN, expiresAt: now + 220 * MIN, status: 'pending', price: 140, address: 'Av. Presidente Kennedy, 88 · Centro' },
    { id: 'r3', clientId: 'c-2', proId: 'p-demo', category: 'Eletricista', description: 'Troca de lâmpadas e revisão do quadro de luz.', serviceAt: day(-3, 14), waitMinutes: 60, createdAt: now - 3 * 864e5, expiresAt: now - 3 * 864e5 + 60 * MIN, status: 'done', price: 110, address: 'Rua Feliciano Sodré, 45 · Alcântara', respondedAt: now - 3 * 864e5 + 5 * MIN },
  ]
  return { users, requests, session: null }
}

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

export function createRequest(r: { clientId: string; proId: string; description: string; serviceAt: string; waitMinutes: number; address: string }) {
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
