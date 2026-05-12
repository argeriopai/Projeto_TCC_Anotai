import { useState } from 'react'
import { Alert } from 'react-native'

export function useVoiceInput(onResult: (text: string) => void) {
  const [gravando, setGravando] = useState(false)

  async function iniciarGravacao() {
    Alert.alert(
      'Comando de Voz',
      'Funcionalidade de voz disponível na versão completa do app.',
      [{ text: 'OK' }]
    )
  }

  async function pararGravacao() {
    setGravando(false)
  }

  return { gravando, iniciarGravacao, pararGravacao }
}
