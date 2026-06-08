import axios from 'axios'
import { auth } from './firebase'
import {
  cadastrarCarroFirestore, listarCarrosFirestore, atualizarCarroFirestore,
  cadastrarMotoFirestore,  listarMotosFirestore,  atualizarMotoFirestore,
  excluirVeiculoFirestore,
  registrarServicoFirestore, listarServicosFirestore, atualizarServicoFirestore, excluirServicoFirestore,
  registrarPecaFirestore,    listarPecasFirestore,    atualizarPecaFirestore,    excluirPecaFirestore,
  registrarNotificacaoFirestore, listarNotificacoesFirestore,
  atualizarNotificacaoFirestore, excluirNotificacaoFirestore,
} from './firestoreService'

// ─── Instância axios (mantida — pode ser usada em outros lugares) ──────────────
export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:3333',
  headers: { 'Content-Type': 'application/json' },
})

// ─── Interfaces exportadas (idênticas — nenhuma tela quebra) ──────────────────

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
  fotosServico?: string[]
  fotosNotaFiscal?: string[]
  fotosGarantia?: string[]
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
  custo?: number
  estabelecimento?: string
  telefoneEstabelecimento?: string
  fotosServico?: string[]
  fotosNotaFiscal?: string[]
  fotosGarantia?: string[]
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

// ─── Helper: uid do usuário autenticado no Firebase ───────────────────────────
const getPid = () => auth.currentUser?.uid ?? ''

// ─── Helper: envolve resultado em { data } para manter padrão AxiosResponse ───
const wrap = <T>(data: T) => ({ data })

// ─── Auth (stub — autenticação é feita pelo Firebase diretamente) ─────────────
export const loginApi    = async () => wrap({})
export const cadastrarApi = async () => wrap({})

// ─── CARROS ───────────────────────────────────────────────────────────────────
export const cadastrarCarroApi = (dados: Omit<Carro, 'id' | 'proprietarioId'>) =>
  cadastrarCarroFirestore(getPid(), dados).then(wrap)

export const listarCarrosApi = () =>
  listarCarrosFirestore(getPid()).then(wrap)

export const atualizarCarroApi = (id: string, dados: Partial<Omit<Carro, 'id' | 'proprietarioId'>>) =>
  atualizarCarroFirestore(id, dados).then(wrap)

// ─── MOTOS ────────────────────────────────────────────────────────────────────
export const cadastrarMotoApi = (dados: Omit<Moto, 'id' | 'proprietarioId'>) =>
  cadastrarMotoFirestore(getPid(), dados).then(wrap)

export const listarMotosApi = () =>
  listarMotosFirestore(getPid()).then(wrap)

export const atualizarMotoApi = (id: string, dados: Partial<Omit<Moto, 'id' | 'proprietarioId'>>) =>
  atualizarMotoFirestore(id, dados).then(wrap)

// ─── VEÍCULOS ─────────────────────────────────────────────────────────────────
export const excluirVeiculoApi = (id: string, tipo: 'carro' | 'moto') =>
  excluirVeiculoFirestore(id, tipo).then(wrap)

// ─── SERVIÇOS ─────────────────────────────────────────────────────────────────
export const registrarServicoApi = (dados: Omit<Servico, 'id' | 'proprietarioId'>) =>
  registrarServicoFirestore(getPid(), dados).then(wrap)

export const listarServicosApi = (veiculoId?: string) =>
  listarServicosFirestore(getPid(), veiculoId).then(wrap)

export const atualizarServicoApi = (id: string, dados: Partial<Omit<Servico, 'id' | 'proprietarioId'>>) =>
  atualizarServicoFirestore(id, dados).then(wrap)

export const excluirServicoApi = (id: string) =>
  excluirServicoFirestore(id).then(wrap)

// ─── PEÇAS ────────────────────────────────────────────────────────────────────
export const registrarPecaApi = (dados: Omit<Peca, 'id' | 'proprietarioId'>) =>
  registrarPecaFirestore(getPid(), dados).then(wrap)

export const listarPecasApi = (veiculoId?: string) =>
  listarPecasFirestore(getPid(), veiculoId).then(wrap)

export const atualizarPecaApi = (id: string, dados: Partial<Omit<Peca, 'id' | 'proprietarioId'>>) =>
  atualizarPecaFirestore(id, dados).then(wrap)

export const excluirPecaApi = (id: string) =>
  excluirPecaFirestore(id).then(wrap)

// ─── NOTIFICAÇÕES ─────────────────────────────────────────────────────────────
export const registrarNotificacaoApi = (dados: Omit<Notificacao, 'id' | 'proprietarioId'>) =>
  registrarNotificacaoFirestore(getPid(), dados).then(wrap)

export const listarNotificacoesApi = () =>
  listarNotificacoesFirestore(getPid()).then(wrap)

export const atualizarNotificacaoApi = (id: string, dados: Partial<Pick<Notificacao, 'ativo'>>) =>
  atualizarNotificacaoFirestore(id, dados).then(wrap)

export const editarNotificacaoApi = (id: string, dados: Partial<Omit<Notificacao, 'id' | 'proprietarioId'>>) =>
  atualizarNotificacaoFirestore(id, dados).then(wrap)

export const excluirNotificacaoApi = (id: string) =>
  excluirNotificacaoFirestore(id).then(wrap)
