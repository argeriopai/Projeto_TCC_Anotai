import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface AcessibilidadeContextData {
  fonteGrande: boolean
  toggleFonteGrande: () => void
  escala: number
}

const AcessibilidadeContext = createContext<AcessibilidadeContextData>({} as AcessibilidadeContextData)

export function AcessibilidadeProvider({ children }: { children: ReactNode }) {
  const [fonteGrande, setFonteGrande] = useState(false)

  useEffect(() => {
    AsyncStorage.getItem('@anotai:fonteGrande').then(val => {
      if (val === 'true') setFonteGrande(true)
    })
  }, [])

  const toggleFonteGrande = () => {
    const novo = !fonteGrande
    setFonteGrande(novo)
    AsyncStorage.setItem('@anotai:fonteGrande', String(novo))
  }

  const escala = fonteGrande ? 1.25 : 1.0

  return (
    <AcessibilidadeContext.Provider value={{ fonteGrande, toggleFonteGrande, escala }}>
      {children}
    </AcessibilidadeContext.Provider>
  )
}

export const useAcessibilidade = () => useContext(AcessibilidadeContext)
