import axios from 'axios'
import type { InternalAxiosRequestConfig, AxiosResponse } from 'axios'

// ─── Configuração ──────────────────────────────────────────────────────────────
// Mude para false quando o backend estiver rodando
const MOCK_MODE = true

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:3333'

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// ─── Tipos públicos ────────────────────────────────────────────────────────────
export interface LoginResponse {
  token: string
  proprietario: {
    id: string
    nome: string
    apelido: string | null
    email: string
    telefone?: string
  }
}

export interface CadastroPayload {
  nome: string
  email: string
  telefone?: string
  senha: string
  apelido?: string
}

export interface Carro {
  id: string
  proprietarioId: string
  marca: string
  modelo: string
  ano: string
  placa: string
  cor?: string
  combustivel: string
  pneuAro?: string
  motor?: string
  direcao?: string
}

export interface Moto {
  id: string
  proprietarioId: string
  marca: string
  modelo: string
  ano: string
  placa: string
  cor?: string
  freio?: string
  partida?: string
}

export interface Servico {
  id: string
  proprietarioId: string
  veiculoId: string
  tipo: string
  descricao?: string
  data: string
  custo?: number
  estabelecimento?: string
  telefoneEstabelecimento?: string
  profissional?: string
  telefoneProfissional?: string
  garantia?: string
  kilometragem?: string
}

export interface Peca {
  id: string
  proprietarioId: string
  veiculoId: string
  nome: string
  descricao?: string
  data: string
  quantidade?: number
  valorUnitario?: number
  custo?: number // total = quantidade × valorUnitario
  estabelecimento?: string
  telefoneEstabelecimento?: string
}

export interface Notificacao {
  id: string
  proprietarioId: string
  veiculoId?: string
  tipo: string
  mensagem: string
  data: string
  ativo?: boolean
  kilometragem?: string
}

// ─── Funções de API ────────────────────────────────────────────────────────────
export const loginApi = (email: string, senha: string) =>
  api.post<LoginResponse>('/auth/login', { email, senha })

export const cadastrarApi = (dados: CadastroPayload) =>
  api.post('/auth/cadastro', dados)

export const cadastrarCarroApi = (dados: Omit<Carro, 'id' | 'proprietarioId'>) =>
  api.post<Carro>('/carros', dados)

export const cadastrarMotoApi = (dados: Omit<Moto, 'id' | 'proprietarioId'>) =>
  api.post<Moto>('/motos', dados)

export const listarCarrosApi = () =>
  api.get<Carro[]>('/carros')

export const listarMotosApi = () =>
  api.get<Moto[]>('/motos')

export const registrarServicoApi = (dados: Omit<Servico, 'id' | 'proprietarioId'>) =>
  api.post<Servico>('/servicos', dados)

export const registrarPecaApi = (dados: Omit<Peca, 'id' | 'proprietarioId'>) =>
  api.post<Peca>('/pecas', dados)

export const registrarNotificacaoApi = (dados: Omit<Notificacao, 'id' | 'proprietarioId'>) =>
  api.post<Notificacao>('/notificacoes', dados)

export const excluirVeiculoApi = (id: string) =>
  api.delete<void>(`/veiculos/${id}`)

export const listarServicosApi     = () => api.get<Servico[]>('/servicos')
export const listarPecasApi        = () => api.get<Peca[]>('/pecas')
export const listarNotificacoesApi = () => api.get<Notificacao[]>('/notificacoes')

export const excluirServicoApi  = (id: string) => api.delete<void>(`/servicos/${id}`)
export const excluirPecaApi     = (id: string) => api.delete<void>(`/pecas/${id}`)
export const excluirNotificacaoApi = (id: string) => api.delete<void>(`/notificacoes/${id}`)

export const atualizarNotificacaoApi = (id: string, dados: Partial<Pick<Notificacao, 'ativo'>>) =>
  api.patch<Notificacao>(`/notificacoes/${id}`, dados)

export const atualizarServicoApi = (id: string, dados: Partial<Omit<Servico, 'id' | 'proprietarioId'>>) =>
  api.patch<Servico>(`/servicos/${id}`, dados)

export const atualizarPecaApi = (id: string, dados: Partial<Omit<Peca, 'id' | 'proprietarioId'>>) =>
  api.patch<Peca>(`/pecas/${id}`, dados)

export const editarNotificacaoApi = (id: string, dados: Partial<Omit<Notificacao, 'id' | 'proprietarioId'>>) =>
  api.patch<Notificacao>(`/notificacoes/${id}`, dados)

export const atualizarCarroApi = (id: string, dados: Partial<Omit<Carro, 'id' | 'proprietarioId'>>) =>
  api.patch<Carro>(`/carros/${id}`, dados)

export const atualizarMotoApi = (id: string, dados: Partial<Omit<Moto, 'id' | 'proprietarioId'>>) =>
  api.patch<Moto>(`/motos/${id}`, dados)

// ─── Mock local ────────────────────────────────────────────────────────────────
if (MOCK_MODE) {
  interface UsuarioMock {
    id: string
    nome: string
    apelido: string
    email: string
    telefone?: string
    senha: string
  }

  const usuarios:  UsuarioMock[] = []
  const tokenMap   = new Map<string, string>() // token → proprietarioId
  const carros:    Carro[]       = []
  const motos:     Moto[]        = []
  const servicos:  Servico[]     = []
  const pecas:     Peca[]        = []
  const notifs:    Notificacao[] = []

  const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))

  const gerarId = () => `${Date.now()}-${Math.floor(Math.random() * 100000)}`

  function erroHttp(config: InternalAxiosRequestConfig, status: number, mensagem: string): never {
    const err: any = new Error(mensagem)
    err.isAxiosError = true
    err.config = config
    err.response = {
      status,
      statusText: String(status),
      headers: {},
      config,
      data: { erro: mensagem },
    } satisfies Partial<AxiosResponse>
    throw err
  }

  function ok(config: InternalAxiosRequestConfig, data: unknown, status = 200): AxiosResponse {
    const statusText = status === 201 ? 'Created' : status === 204 ? 'No Content' : 'OK'
    return { data, status, statusText, headers: {} as any, config }
  }

  function getPid(config: InternalAxiosRequestConfig): string {
    const h = config.headers as any
    const raw = (typeof h?.get === 'function' ? h.get('Authorization') : null)
      ?? h?.['Authorization'] ?? h?.authorization ?? ''
    const token = String(raw).replace('Bearer ', '').trim()

    if (!token) erroHttp(config, 401, 'Token não fornecido')

    const pid = tokenMap.get(token)
    if (!pid) erroHttp(config, 401, 'Token inválido ou expirado')

    return pid
  }

  api.defaults.adapter = async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
    await delay(1000)

    const url    = config.url ?? ''
    const method = (config.method ?? 'get').toLowerCase()
    const body   = config.data
      ? (typeof config.data === 'string' ? JSON.parse(config.data) : config.data)
      : {}

    // ── POST /auth/cadastro ────────────────────────────────────────────────────
    if (url === '/auth/cadastro' && method === 'post') {
      const { nome, email, telefone, senha, apelido } = body as CadastroPayload
      if (usuarios.some(u => u.email === email)) erroHttp(config, 409, 'E-mail já cadastrado')
      usuarios.push({
        id: gerarId(),
        nome,
        apelido: apelido ?? nome.split(' ')[0],
        email,
        telefone,
        senha,
      })
      return ok(config, { mensagem: 'Cadastro realizado com sucesso' }, 201)
    }

    // ── POST /auth/login ───────────────────────────────────────────────────────
    if (url === '/auth/login' && method === 'post') {
      const { email, senha } = body as { email: string; senha: string }
      const usuario = usuarios.find(u => u.email === email && u.senha === senha)
      if (!usuario) erroHttp(config, 401, 'E-mail ou senha incorretos')
      const token = `mock-token-${usuario.id}-${Date.now()}`
      tokenMap.set(token, usuario.id)
      return ok(config, {
        token,
        proprietario: {
          id: usuario.id,
          nome: usuario.nome,
          apelido: usuario.apelido,
          email: usuario.email,
          telefone: usuario.telefone,
        },
      } satisfies LoginResponse)
    }

    // ── GET /servicos ──────────────────────────────────────────────────────────
    if (url === '/servicos' && method === 'get') {
      const pid = getPid(config)
      return ok(config, servicos.filter(s => s.proprietarioId === pid))
    }

    // ── GET /pecas ─────────────────────────────────────────────────────────────
    if (url === '/pecas' && method === 'get') {
      const pid = getPid(config)
      return ok(config, pecas.filter(p => p.proprietarioId === pid))
    }

    // ── GET /notificacoes ──────────────────────────────────────────────────────
    if (url === '/notificacoes' && method === 'get') {
      const pid = getPid(config)
      return ok(config, notifs.filter(n => n.proprietarioId === pid))
    }

    // ── DELETE /servicos/:id ───────────────────────────────────────────────────
    if (url.startsWith('/servicos/') && method === 'delete') {
      const pid = getPid(config)
      const id  = url.replace('/servicos/', '')
      const idx = servicos.findIndex(s => s.id === id && s.proprietarioId === pid)
      if (idx === -1) erroHttp(config, 404, 'Serviço não encontrado')
      servicos.splice(idx, 1)
      return ok(config, { mensagem: 'Serviço excluído' })
    }

    // ── DELETE /pecas/:id ──────────────────────────────────────────────────────
    if (url.startsWith('/pecas/') && method === 'delete') {
      const pid = getPid(config)
      const id  = url.replace('/pecas/', '')
      const idx = pecas.findIndex(p => p.id === id && p.proprietarioId === pid)
      if (idx === -1) erroHttp(config, 404, 'Peça não encontrada')
      pecas.splice(idx, 1)
      return ok(config, { mensagem: 'Peça excluída' })
    }

    // ── DELETE /notificacoes/:id ───────────────────────────────────────────────
    if (url.startsWith('/notificacoes/') && method === 'delete') {
      const pid = getPid(config)
      const id  = url.replace('/notificacoes/', '')
      const idx = notifs.findIndex(n => n.id === id && n.proprietarioId === pid)
      if (idx === -1) erroHttp(config, 404, 'Notificação não encontrada')
      notifs.splice(idx, 1)
      return ok(config, { mensagem: 'Notificação excluída' })
    }

    // ── PATCH /notificacoes/:id ────────────────────────────────────────────────
    if (url.startsWith('/notificacoes/') && method === 'patch') {
      const pid   = getPid(config)
      const id    = url.replace('/notificacoes/', '')
      const notif = notifs.find(n => n.id === id && n.proprietarioId === pid)
      if (!notif) erroHttp(config, 404, 'Notificação não encontrada')
      Object.assign(notif!, body)
      return ok(config, notif!)
    }

    // ── PATCH /servicos/:id ────────────────────────────────────────────────────
    if (url.startsWith('/servicos/') && method === 'patch') {
      const pid  = getPid(config)
      const id   = url.replace('/servicos/', '')
      const serv = servicos.find(s => s.id === id && s.proprietarioId === pid)
      if (!serv) erroHttp(config, 404, 'Serviço não encontrado')
      Object.assign(serv!, body)
      return ok(config, serv!)
    }

    // ── PATCH /pecas/:id ───────────────────────────────────────────────────────
    if (url.startsWith('/pecas/') && method === 'patch') {
      const pid  = getPid(config)
      const id   = url.replace('/pecas/', '')
      const peca = pecas.find(p => p.id === id && p.proprietarioId === pid)
      if (!peca) erroHttp(config, 404, 'Peça não encontrada')
      Object.assign(peca!, body)
      return ok(config, peca!)
    }

    // ── PATCH /carros/:id ──────────────────────────────────────────────────────
    if (url.startsWith('/carros/') && method === 'patch') {
      const pid   = getPid(config)
      const id    = url.replace('/carros/', '')
      const carro = carros.find(c => c.id === id && c.proprietarioId === pid)
      if (!carro) erroHttp(config, 404, 'Carro não encontrado')
      Object.assign(carro!, body)
      return ok(config, carro!)
    }

    // ── PATCH /motos/:id ───────────────────────────────────────────────────────
    if (url.startsWith('/motos/') && method === 'patch') {
      const pid  = getPid(config)
      const id   = url.replace('/motos/', '')
      const moto = motos.find(m => m.id === id && m.proprietarioId === pid)
      if (!moto) erroHttp(config, 404, 'Moto não encontrada')
      Object.assign(moto!, body)
      return ok(config, moto!)
    }

    // ── GET /carros ────────────────────────────────────────────────────────────
    if (url === '/carros' && method === 'get') {
      const pid = getPid(config)
      return ok(config, carros.filter(c => c.proprietarioId === pid))
    }

    // ── POST /carros ───────────────────────────────────────────────────────────
    if (url === '/carros' && method === 'post') {
      const pid = getPid(config)
      const { marca, modelo, ano, placa, cor, combustivel, pneuAro, motor, direcao } = body as Omit<Carro, 'id' | 'proprietarioId'>
      const novo: Carro = { id: gerarId(), proprietarioId: pid, marca, modelo, ano, placa, cor, combustivel, pneuAro, motor, direcao }
      carros.push(novo)
      return ok(config, novo, 201)
    }

    // ── GET /motos ─────────────────────────────────────────────────────────────
    if (url === '/motos' && method === 'get') {
      const pid = getPid(config)
      return ok(config, motos.filter(m => m.proprietarioId === pid))
    }

    // ── POST /motos ────────────────────────────────────────────────────────────
    if (url === '/motos' && method === 'post') {
      const pid = getPid(config)
      const { marca, modelo, ano, placa, cor, freio, partida } = body as Omit<Moto, 'id' | 'proprietarioId'>
      const nova: Moto = { id: gerarId(), proprietarioId: pid, marca, modelo, ano, placa, cor, freio, partida }
      motos.push(nova)
      return ok(config, nova, 201)
    }

    // ── DELETE /veiculos/:id ───────────────────────────────────────────────────
    if (url.startsWith('/veiculos/') && method === 'delete') {
      const pid = getPid(config)
      const id  = url.replace('/veiculos/', '')
      const ic = carros.findIndex(c => c.id === id && c.proprietarioId === pid)
      const im = motos.findIndex(m => m.id === id && m.proprietarioId === pid)
      if (ic === -1 && im === -1) erroHttp(config, 404, 'Veículo não encontrado')
      if (ic !== -1) carros.splice(ic, 1)
      if (im !== -1) motos.splice(im, 1)
      return ok(config, { mensagem: 'Veículo excluído' })
    }

    // ── POST /servicos ─────────────────────────────────────────────────────────
    if (url === '/servicos' && method === 'post') {
      const pid = getPid(config)
      const {
        veiculoId, tipo, descricao, data, custo,
        estabelecimento, telefoneEstabelecimento,
        profissional, telefoneProfissional,
        garantia, kilometragem,
      } = body as Omit<Servico, 'id' | 'proprietarioId'>
      const novo: Servico = {
        id: gerarId(), proprietarioId: pid,
        veiculoId, tipo, descricao, data, custo,
        estabelecimento, telefoneEstabelecimento,
        profissional, telefoneProfissional,
        garantia, kilometragem,
      }
      servicos.push(novo)
      return ok(config, novo, 201)
    }

    // ── POST /pecas ────────────────────────────────────────────────────────────
    if (url === '/pecas' && method === 'post') {
      const pid = getPid(config)
      const { veiculoId, nome, descricao, data, quantidade, valorUnitario, custo, estabelecimento, telefoneEstabelecimento } = body as Omit<Peca, 'id' | 'proprietarioId'>
      const nova: Peca = { id: gerarId(), proprietarioId: pid, veiculoId, nome, descricao, data, quantidade, valorUnitario, custo, estabelecimento, telefoneEstabelecimento }
      pecas.push(nova)
      return ok(config, nova, 201)
    }

    // ── POST /notificacoes ─────────────────────────────────────────────────────
    if (url === '/notificacoes' && method === 'post') {
      const pid = getPid(config)
      const { veiculoId, tipo, mensagem, data, ativo, kilometragem } = body as Omit<Notificacao, 'id' | 'proprietarioId'>
      const nova: Notificacao = { id: gerarId(), proprietarioId: pid, veiculoId, tipo, mensagem, data, ativo: ativo ?? true, kilometragem }
      notifs.push(nova)
      return ok(config, nova, 201)
    }

    erroHttp(config, 404, 'Endpoint não encontrado no mock')
  }
}
