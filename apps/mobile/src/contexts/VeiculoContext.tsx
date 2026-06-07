import React, { createContext, useContext, useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { listarCarrosApi, listarMotosApi } from '../services/api'
import { useAuth } from './AuthContext'

const STORAGE_KEY = '@anotai:veiculoAtivo'

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
}

const VeiculoContext = createContext<VeiculoContextData>({} as VeiculoContextData)

export function VeiculoProvider({ children }: { children: React.ReactNode }) {
  const { estaLogado, carregando } = useAuth()
  const [veiculoAtivo, setVeiculoAtivoState] = useState<VeiculoAtivo | null>(null)

  useEffect(() => {
    if (carregando) return

    if (!estaLogado) {
      setVeiculoAtivoState(null)
      AsyncStorage.removeItem(STORAGE_KEY)
      return
    }

    // Auth confirmado — restaura o veículo pelo ID persistido
    async function restaurar() {
      const idSalvo = await AsyncStorage.getItem(STORAGE_KEY)
      if (!idSalvo) return

      try {
        const [resCarros, resMotos] = await Promise.all([
          listarCarrosApi(),
          listarMotosApi(),
        ])
        const carro = resCarros.data.find((v: any) => v.id === idSalvo)
        if (carro) {
          setVeiculoAtivoState({ id: carro.id, tipo: 'carro', marca: carro.marca, modelo: carro.modelo, placa: carro.placa })
          return
        }
        const moto = resMotos.data.find((v: any) => v.id === idSalvo)
        if (moto) {
          setVeiculoAtivoState({ id: moto.id, tipo: 'moto', marca: moto.marca, modelo: moto.modelo, placa: moto.placa })
          return
        }
        // Veículo não existe mais — descarta o ID salvo
        await AsyncStorage.removeItem(STORAGE_KEY)
      } catch {
        // Auth ou rede não prontos — mantém o ID salvo para próxima tentativa
      }
    }
    restaurar()
  }, [estaLogado, carregando])

  async function definirVeiculoAtivo(v: VeiculoAtivo | null) {
    setVeiculoAtivoState(v)
    if (v) {
      await AsyncStorage.setItem(STORAGE_KEY, v.id)
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY)
    }
  }

  return (
    <VeiculoContext.Provider value={{
      veiculoAtivo,
      definirVeiculoAtivo,
      veiculoAtivoId: veiculoAtivo?.id ?? null,
    }}>
      {children}
    </VeiculoContext.Provider>
  )
}

export function useVeiculo() {
  return useContext(VeiculoContext)
}
