import React, { createContext, useContext, useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { listarCarrosApi, listarMotosApi } from '../services/api'

const STORAGE_KEY = '@anotai:veiculo_ativo'

export interface VeiculoAtivo {
  id: string
  tipo: 'carro' | 'moto'
  marca: string
  modelo: string
  placa: string
}

interface VeiculoContextData {
  veiculoAtivo: VeiculoAtivo | null
  definirVeiculoAtivo: (v: VeiculoAtivo | null) => Promise<void>
  veiculoAtivoId: string | null
  ativarVeiculo: (id: string) => Promise<void>
}

const VeiculoContext = createContext<VeiculoContextData>({} as VeiculoContextData)

export function VeiculoProvider({ children }: { children: React.ReactNode }) {
  const [veiculoAtivo,   setVeiculoAtivoState] = useState<VeiculoAtivo | null>(null)
  const [veiculoAtivoId, setVeiculoAtivoId]    = useState<string | null>(null)

  useEffect(() => {
    async function carregarEValidar() {
      const idSalvo = await AsyncStorage.getItem('@anotai:veiculoAtivo')
      if (idSalvo) setVeiculoAtivoId(idSalvo)

      const raw = await AsyncStorage.getItem(STORAGE_KEY)
      if (!raw) return

      try {
        const veiculo = JSON.parse(raw) as VeiculoAtivo
        const [resCarros, resMotos] = await Promise.all([
          listarCarrosApi(),
          listarMotosApi(),
        ])
        const existe = [...resCarros.data, ...resMotos.data].some(v => v.id === veiculo.id)
        if (existe) {
          setVeiculoAtivoState(veiculo)
        } else {
          await AsyncStorage.removeItem(STORAGE_KEY)
        }
      } catch {
        await AsyncStorage.removeItem(STORAGE_KEY)
      }
    }
    carregarEValidar()
  }, [])

  async function ativarVeiculo(id: string) {
    setVeiculoAtivoId(id)
    await AsyncStorage.setItem('@anotai:veiculoAtivo', id)
  }

  async function definirVeiculoAtivo(v: VeiculoAtivo | null) {
    setVeiculoAtivoState(v)
    if (v) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(v))
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY)
    }
  }

  return (
    <VeiculoContext.Provider value={{ veiculoAtivo, definirVeiculoAtivo, veiculoAtivoId, ativarVeiculo }}>
      {children}
    </VeiculoContext.Provider>
  )
}

export function useVeiculo() {
  return useContext(VeiculoContext)
}
