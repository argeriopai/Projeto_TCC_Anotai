import AsyncStorage from '@react-native-async-storage/async-storage'
import * as FileSystem from 'expo-file-system'

const STORAGE_KEY = '@anotai:fotos'

export interface FotoRegistro {
  veiculoId: string
  registroId: string
  tipoRegistro: 'servico' | 'peca'
  nomeRegistro?: string
  fotosServico: string[]
  fotosNotaFiscal: string[]
  fotosGarantia: string[]
}

export type TipoFoto = 'servico' | 'notaFiscal' | 'garantia'

export interface GaleriaVeiculo {
  veiculoId: string
  tipo: 'carro' | 'moto'
  marca: string
  modelo: string
  placa: string
  registros: FotoRegistro[]
}

async function ler(): Promise<FotoRegistro[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY)
  return raw ? JSON.parse(raw) : []
}

async function gravar(lista: FotoRegistro[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(lista))
}

export async function buscarFotos(registroId: string): Promise<FotoRegistro | null> {
  const lista = await ler()
  return lista.find(f => f.registroId === registroId) ?? null
}

export async function salvarFotos(registro: FotoRegistro): Promise<void> {
  const lista = await ler()
  const idx = lista.findIndex(f => f.registroId === registro.registroId)
  if (idx >= 0) lista[idx] = registro
  else lista.push(registro)
  await gravar(lista)
}

export async function excluirFotosRegistro(registroId: string): Promise<void> {
  const lista = await ler()
  await gravar(lista.filter(f => f.registroId !== registroId))
}

export async function listarTodasFotos(): Promise<FotoRegistro[]> {
  return ler()
}

export async function copiarFotoLocal(uri: string): Promise<string> {
  const dir = `${FileSystem.documentDirectory}anotai/fotos/`
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true })
  const nome = `foto_${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`
  const dest = dir + nome
  await FileSystem.copyAsync({ from: uri, to: dest })
  return dest
}

export function temFotos(registro: FotoRegistro): boolean {
  return (
    registro.fotosServico.length > 0 ||
    registro.fotosNotaFiscal.length > 0 ||
    registro.fotosGarantia.length > 0
  )
}
