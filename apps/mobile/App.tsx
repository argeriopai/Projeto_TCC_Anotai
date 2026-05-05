import React, { useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import * as Notifications from 'expo-notifications'
import { AuthProvider } from './src/contexts/AuthContext'
import { AcessibilidadeProvider } from './src/contexts/AcessibilidadeContext'
import { VeiculoProvider } from './src/contexts/VeiculoContext'
import { RootNavigator } from './src/navigation/RootNavigator'
import { solicitarPermissao } from './src/services/notificacoes'

SplashScreen.preventAutoHideAsync()

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

export default function App() {
  useEffect(() => {
    SplashScreen.hideAsync()
    solicitarPermissao()
  }, [])

  return (
    <AuthProvider>
      <AcessibilidadeProvider>
        <VeiculoProvider>
          <StatusBar style="light" />
          <RootNavigator />
        </VeiculoProvider>
      </AcessibilidadeProvider>
    </AuthProvider>
  )
}
