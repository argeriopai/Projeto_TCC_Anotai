import { useState, useCallback, useEffect, useRef } from 'react'
import { Alert } from 'react-native'

// Carregamento defensivo: o módulo nativo não existe no Expo Go
let Voice: any = null
try {
  Voice = require('@react-native-voice/voice').default
} catch {
  Voice = null
}

export interface UseVoiceInputReturn {
  isRecording:    boolean
  transcript:     string
  startRecording: () => Promise<void>
  stopRecording:  () => Promise<void>
}

export function useVoiceInput(): UseVoiceInputReturn {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript,  setTranscript]  = useState('')
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function cancelTimeout() {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  useEffect(() => {
    if (!Voice) return

    try {
      Voice.onSpeechResults = (e: any) => {
        const texto = e.value?.[0] ?? ''
        if (texto) setTranscript(texto)
        setIsRecording(false)
        cancelTimeout()
      }

      Voice.onSpeechError = (_e: any) => {
        setIsRecording(false)
        cancelTimeout()
        Alert.alert('Erro', 'Não foi possível capturar o áudio. Tente novamente.', [{ text: 'OK' }])
      }

      Voice.onSpeechEnd = () => {
        setIsRecording(false)
        cancelTimeout()
      }
    } catch (e) {
      console.log('[useVoiceInput] Erro ao registrar listeners:', e)
    }

    return () => {
      cancelTimeout()
      try {
        Voice.destroy().catch(() => {})
        Voice.removeAllListeners()
      } catch {}
    }
  }, [])

  const startRecording = useCallback(async () => {
    if (!Voice) {
      Alert.alert(
        'Não disponível',
        'O comando de voz requer o build nativo do app. Esta funcionalidade não está disponível no Expo Go.',
        [{ text: 'OK' }]
      )
      return
    }

    try {
      setTranscript('')
      await Voice.start('pt-BR')
      setIsRecording(true)

      timeoutRef.current = setTimeout(async () => {
        try { await Voice.stop() } catch {}
        setIsRecording(false)
      }, 10_000)
    } catch {
      setIsRecording(false)
      Alert.alert('Erro', 'Não foi possível iniciar a gravação.', [{ text: 'OK' }])
    }
  }, [])

  const stopRecording = useCallback(async () => {
    if (!Voice) return
    cancelTimeout()
    try { await Voice.stop() } catch {}
    setIsRecording(false)
  }, [])

  return { isRecording, transcript, startRecording, stopRecording }
}
