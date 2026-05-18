import {
  collection, doc, addDoc, getDocs, updateDoc, deleteDoc,
  query, where, getDoc,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Carro, Moto, Servico, Peca, Notificacao } from './api'

// ─── CARROS ───────────────────────────────────────────────────────────────────

export async function cadastrarCarroFirestore(
  proprietarioId: string,
  dados: Omit<Carro, 'id' | 'proprietarioId'>,
): Promise<Carro> {
  const ref = await addDoc(collection(db, 'carros'), { ...dados, proprietarioId })
  return { id: ref.id, proprietarioId, ...dados }
}

export async function listarCarrosFirestore(proprietarioId: string): Promise<Carro[]> {
  const q = query(collection(db, 'carros'), where('proprietarioId', '==', proprietarioId))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Carro))
}

export async function atualizarCarroFirestore(id: string, dados: Partial<Carro>): Promise<Carro> {
  const ref = doc(db, 'carros', id)
  await updateDoc(ref, dados as Record<string, unknown>)
  const snap = await getDoc(ref)
  return { id: snap.id, ...snap.data() } as Carro
}

// ─── MOTOS ────────────────────────────────────────────────────────────────────

export async function cadastrarMotoFirestore(
  proprietarioId: string,
  dados: Omit<Moto, 'id' | 'proprietarioId'>,
): Promise<Moto> {
  const ref = await addDoc(collection(db, 'motos'), { ...dados, proprietarioId })
  return { id: ref.id, proprietarioId, ...dados }
}

export async function listarMotosFirestore(proprietarioId: string): Promise<Moto[]> {
  const q = query(collection(db, 'motos'), where('proprietarioId', '==', proprietarioId))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Moto))
}

export async function atualizarMotoFirestore(id: string, dados: Partial<Moto>): Promise<Moto> {
  const ref = doc(db, 'motos', id)
  await updateDoc(ref, dados as Record<string, unknown>)
  const snap = await getDoc(ref)
  return { id: snap.id, ...snap.data() } as Moto
}

// ─── VEÍCULOS ─────────────────────────────────────────────────────────────────

export async function excluirVeiculoFirestore(id: string, tipo: 'carro' | 'moto'): Promise<void> {
  await deleteDoc(doc(db, tipo === 'carro' ? 'carros' : 'motos', id))
}

// ─── SERVIÇOS ─────────────────────────────────────────────────────────────────

export async function registrarServicoFirestore(
  proprietarioId: string,
  dados: Omit<Servico, 'id' | 'proprietarioId'>,
): Promise<Servico> {
  const ref = await addDoc(collection(db, 'servicos'), { ...dados, proprietarioId })
  return { id: ref.id, proprietarioId, ...dados }
}

export async function listarServicosFirestore(
  proprietarioId: string,
  veiculoId?: string,
): Promise<Servico[]> {
  const constraints = [where('proprietarioId', '==', proprietarioId)]
  if (veiculoId) constraints.push(where('veiculoId', '==', veiculoId))
  const q = query(collection(db, 'servicos'), ...constraints)
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Servico))
}

export async function atualizarServicoFirestore(id: string, dados: Partial<Servico>): Promise<Servico> {
  const ref = doc(db, 'servicos', id)
  await updateDoc(ref, dados as Record<string, unknown>)
  const snap = await getDoc(ref)
  return { id: snap.id, ...snap.data() } as Servico
}

export async function excluirServicoFirestore(id: string): Promise<void> {
  await deleteDoc(doc(db, 'servicos', id))
}

// ─── PEÇAS ────────────────────────────────────────────────────────────────────

export async function registrarPecaFirestore(
  proprietarioId: string,
  dados: Omit<Peca, 'id' | 'proprietarioId'>,
): Promise<Peca> {
  const ref = await addDoc(collection(db, 'pecas'), { ...dados, proprietarioId })
  return { id: ref.id, proprietarioId, ...dados }
}

export async function listarPecasFirestore(
  proprietarioId: string,
  veiculoId?: string,
): Promise<Peca[]> {
  const constraints = [where('proprietarioId', '==', proprietarioId)]
  if (veiculoId) constraints.push(where('veiculoId', '==', veiculoId))
  const q = query(collection(db, 'pecas'), ...constraints)
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Peca))
}

export async function atualizarPecaFirestore(id: string, dados: Partial<Peca>): Promise<Peca> {
  const ref = doc(db, 'pecas', id)
  await updateDoc(ref, dados as Record<string, unknown>)
  const snap = await getDoc(ref)
  return { id: snap.id, ...snap.data() } as Peca
}

export async function excluirPecaFirestore(id: string): Promise<void> {
  await deleteDoc(doc(db, 'pecas', id))
}

// ─── NOTIFICAÇÕES ─────────────────────────────────────────────────────────────

export async function registrarNotificacaoFirestore(
  proprietarioId: string,
  dados: Omit<Notificacao, 'id' | 'proprietarioId'>,
): Promise<Notificacao> {
  const ref = await addDoc(collection(db, 'notificacoes'), { ...dados, proprietarioId })
  return { id: ref.id, proprietarioId, ...dados }
}

export async function listarNotificacoesFirestore(proprietarioId: string): Promise<Notificacao[]> {
  const q = query(collection(db, 'notificacoes'), where('proprietarioId', '==', proprietarioId))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Notificacao))
}

export async function atualizarNotificacaoFirestore(
  id: string,
  dados: Partial<Notificacao>,
): Promise<Notificacao> {
  const ref = doc(db, 'notificacoes', id)
  await updateDoc(ref, dados as Record<string, unknown>)
  const snap = await getDoc(ref)
  return { id: snap.id, ...snap.data() } as Notificacao
}

export async function excluirNotificacaoFirestore(id: string): Promise<void> {
  await deleteDoc(doc(db, 'notificacoes', id))
}
