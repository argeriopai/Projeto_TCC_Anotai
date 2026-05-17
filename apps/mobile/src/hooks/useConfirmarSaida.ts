import { useCallback } from 'react'
import { Alert } from 'react-native'

export function useConfirmarSaida(
  navigation: any,
  temAlteracao: () => boolean
) {
  return useCallback(() => {
    if (!temAlteracao()) {
      navigation.goBack()
      return
    }
    Alert.alert(
      'Descartar alterações?',
      'Você preencheu ou alterou campos neste formulário. Deseja descartar as alterações?',
      [
        { text: 'Continuar editando', style: 'cancel' },
        { text: 'Descartar', style: 'destructive',
          onPress: () => navigation.goBack() },
      ]
    )
  }, [navigation, temAlteracao])
}
