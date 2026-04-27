import { useCallback } from 'react'
import { Alert } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useAuth } from '../contexts/AuthContext'

export function useAuthGuard() {
  const { estaLogado } = useAuth()
  const navigation = useNavigation<any>()

  const requireAuth = useCallback((action: () => void) => {
    if (estaLogado) {
      action()
      return
    }
    Alert.alert(
      'Acesso Restrito',
      'Essa funcionalidade é exclusiva para usuários cadastrados.\nDeseja fazer login agora?',
      [
        { text: 'Agora não', style: 'cancel' },
        { text: 'Fazer Login', onPress: () => navigation.navigate('Login') },
      ]
    )
  }, [estaLogado, navigation])

  return { estaLogado, requireAuth }
}
