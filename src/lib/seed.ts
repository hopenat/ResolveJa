import type { Request, User } from './store'

const img = (id: string) => `https://images.unsplash.com/photo-${id}?w=600&h=600&fit=crop&auto=format`
const MIN = 60_000
const DAY = 864e5

export function buildSeed(now = Date.now()): { users: User[]; requests: Request[] } {
  const users: User[] = [
    {
      id: 'c-demo', role: 'client', name: 'Rafael Moreira', email: 'cliente@resolveja.com', password: '123456',
      addresses: [
        { id: 'a-casa', label: 'Casa', cep: '24435-000', street: 'Rua Dr. Nilo Peçanha', number: '210', district: 'Zé Garoto', city: 'São Gonçalo', complement: 'Apto 302', isDefault: true },
        { id: 'a-trab', label: 'Trabalho', cep: '24445-000', street: 'Av. Presidente Kennedy', number: '88', district: 'Centro', city: 'São Gonçalo' },
      ],
      cards: [
        { id: 'k-visa', type: 'credit', brand: 'Visa', last4: '4242', holder: 'RAFAEL MOREIRA', exp: '08/29', isDefault: true },
        { id: 'k-master', type: 'debit', brand: 'Mastercard', last4: '8210', holder: 'RAFAEL MOREIRA', exp: '03/28' },
      ],
    },
    { id: 'p-demo', role: 'pro', name: 'Marcos Oliveira', email: 'prestador@resolveja.com', password: '123456', category: 'Eletricista', price: 80, rating: 4.9, jobs: 120, x: 250, y: 150, eta: 5, online: true, photo: img('1649768870222-17848797d6b4'), addresses: [{ id: 'a-base', label: 'Base', cep: '24440-000', street: 'Rua Coronel Moreira César', number: '120', district: 'Centro', city: 'São Gonçalo', isDefault: true }] },
    { id: 'p-2', role: 'pro', name: 'Juliana Prado', email: 'juliana@resolveja.com', password: '123456', category: 'Diarista', price: 120, rating: 4.8, jobs: 214, x: 110, y: 240, eta: 8, online: true, photo: img('1494790108377-be9c29b29330') },
    { id: 'p-3', role: 'pro', name: 'Rogério Santos', email: 'rogerio@resolveja.com', password: '123456', category: 'Encanador', price: 90, rating: 4.7, jobs: 86, x: 290, y: 270, eta: 11, online: true, photo: img('1732395805034-e0bf859665e5') },
    { id: 'p-4', role: 'pro', name: 'Camila Duarte', email: 'camila@resolveja.com', password: '123456', category: 'Montador', price: 70, rating: 5.0, jobs: 63, x: 70, y: 110, eta: 14, online: true, photo: img('1581065178047-8ee15951ede6') },
    { id: 'p-5', role: 'pro', name: 'Wellington Reis', email: 'well@resolveja.com', password: '123456', category: 'Frete', price: 150, rating: 4.6, jobs: 340, x: 200, y: 60, eta: 17, online: true, photo: img('1787672357491-d43acdf974cb') },
    { id: 'c-2', role: 'client', name: 'Patrícia Mendes', email: 'patricia@exemplo.com', password: '123456' },
    { id: 'c-3', role: 'client', name: 'Paulo Henrique', email: 'paulo@exemplo.com', password: '123456' },
  ]
  const day = (d: number, h: number) => { const t = new Date(now + d * DAY); t.setHours(h, 0, 0, 0); return t.toISOString() }
  const VISA = 'Visa crédito •••• 4242', MC = 'Mastercard débito •••• 8210'
  const mk = (id: string, clientId: string, proId: string, category: string, description: string, d: number, h: number, status: Request['status'], price: number, address: string, extra: Partial<Request> = {}): Request => {
    const createdAt = now + d * DAY - 3 * 3600_000
    return { id, clientId, proId, category, description, serviceAt: day(d, h), waitMinutes: 60, createdAt, expiresAt: createdAt + 60 * MIN, status, price, address, respondedAt: createdAt + 5 * MIN, ...extra }
  }
  const rev = (rating: number, comment: string, d: number) => ({ review: { rating, comment, at: now + d * DAY + 2 * 3600_000 } })
  const CASA = 'Rua Dr. Nilo Peçanha, 210 · Zé Garoto', TRAB = 'Av. Presidente Kennedy, 88 · Centro'

  const requests: Request[] = [
    { id: 'r1', clientId: 'c-2', proId: 'p-demo', category: 'Eletricista', description: 'Disjuntor desarmando toda vez que ligo o chuveiro.', serviceAt: day(0, 18), waitMinutes: 60, createdAt: now - 4 * MIN, expiresAt: now + 56 * MIN, status: 'pending', price: 95, address: 'Rua Dr. Nilo Peçanha, 210 · Zé Garoto' },
    { id: 'r2', clientId: 'c-3', proId: 'p-demo', category: 'Eletricista', description: 'Instalar 3 tomadas novas na sala e trocar o ventilador de teto.', serviceAt: day(1, 9), waitMinutes: 240, createdAt: now - 20 * MIN, expiresAt: now + 220 * MIN, status: 'pending', price: 140, address: 'Av. Presidente Kennedy, 88 · Centro' },
    mk('r3', 'c-2', 'p-demo', 'Eletricista', 'Troca de lâmpadas e revisão do quadro de luz.', -3, 14, 'done', 110, 'Rua Feliciano Sodré, 45 · Alcântara', rev(5, 'Rápido e muito educado. Explicou tudo o que fez no quadro.', -3)),
    // Histórico do cliente de teste (Rafael)
    mk('h1', 'c-demo', 'p-2', 'Diarista', 'Faxina completa do apartamento (2 quartos).', -2, 9, 'done', 120, CASA, { payment: VISA }),
    mk('h2', 'c-demo', 'p-3', 'Encanador', 'Vazamento embaixo da pia da cozinha.', -5, 15, 'done', 90, CASA, { payment: MC }),
    mk('h3', 'c-demo', 'p-demo', 'Eletricista', 'Instalação de chuveiro elétrico e troca de tomada.', -8, 10, 'done', 110, TRAB, { payment: VISA }),
    mk('h4', 'c-demo', 'p-4', 'Montador', 'Montagem de guarda-roupa de 6 portas.', -15, 13, 'done', 140, CASA, { payment: VISA, ...rev(5, 'Montou tudo certinho e ainda alinhou as portas. Recomendo!', -15) }),
    mk('h5', 'c-demo', 'p-5', 'Frete', 'Frete de sofá e mesa para o novo apartamento.', -25, 8, 'done', 150, CASA, { payment: MC, ...rev(4, 'Cuidou bem dos móveis, só atrasou uns 15 minutos.', -25) }),
    mk('h6', 'c-demo', 'p-2', 'Diarista', 'Limpeza pós-obra na sala e cozinha.', -40, 9, 'done', 160, CASA, { payment: VISA, ...rev(5, 'Deixou tudo brilhando. Super caprichosa.', -40) }),
    mk('h7', 'c-demo', 'p-demo', 'Eletricista', 'Revisão geral do quadro de luz.', -60, 16, 'done', 100, CASA, { payment: VISA, ...rev(5, 'Profissional excelente, pontual e preço justo.', -60) }),
    mk('h8', 'c-demo', 'p-3', 'Encanador', 'Troca da descarga do banheiro.', -12, 11, 'cancelled', 90, CASA),
    mk('h9', 'c-demo', 'p-4', 'Montador', 'Montagem de estante.', -20, 10, 'declined', 70, TRAB),
    mk('h10', 'c-demo', 'p-5', 'Frete', 'Pequena mudança de escritório.', -30, 9, 'expired', 150, TRAB, { respondedAt: undefined }),
    mk('h11', 'c-demo', 'p-3', 'Encanador', 'Instalar torneira nova na área de serviço.', 2, 10, 'accepted', 90, CASA, { payment: VISA }),
    // Avaliações de outros clientes (perfis dos prestadores)
    mk('h12', 'c-2', 'p-2', 'Diarista', 'Limpeza semanal.', -10, 9, 'done', 120, 'Rua Feliciano Sodré, 45 · Alcântara', rev(5, 'Chegou rápido, resolveu tudo e deixou tudo limpo. Super educada.', -10)),
    mk('h13', 'c-3', 'p-3', 'Encanador', 'Desentupir ralo do banheiro.', -7, 14, 'done', 90, TRAB, rev(4, 'Preço justo e explicou tudo antes de começar.', -7)),
    mk('h14', 'c-2', 'p-4', 'Montador', 'Montar cama e criado-mudo.', -18, 10, 'done', 70, 'Rua Feliciano Sodré, 45 · Alcântara', rev(5, 'Perfeita! Muito cuidadosa com os móveis.', -18)),
    mk('h15', 'c-3', 'p-5', 'Frete', 'Frete de geladeira.', -14, 15, 'done', 150, TRAB, rev(5, 'Acompanhei o trajeto no mapa até a minha porta. Passa muita segurança.', -14)),
  ]
  return { users, requests }
}
