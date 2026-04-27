import { Alert } from 'react-native'

export interface UseVoiceInputReturn {
  isRecording:    boolean
  transcript:     string
  startRecording: () => Promise<void>
  stopRecording:  () => Promise<void>
}

export function useVoiceInput(): UseVoiceInputReturn {
  async function startRecording() {
    Alert.alert(
      'Reconhecimento de voz',
      'Funcionalidade de voz será disponibilizada na versão final do app.',
    )
  }

  async function stopRecording() {}

  return {
    isRecording:    false,
    transcript:     '',
    startRecording,
    stopRecording,
  }
}
