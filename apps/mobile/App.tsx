import React, { useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { AuthProvider } from './src/contexts/AuthContext'
import { VeiculoProvider } from './src/contexts/VeiculoContext'
import { RootNavigator } from './src/navigation/RootNavigator'

SplashScreen.preventAutoHideAsync()

export default function App() {
  useEffect(() => {
    // Esconde o splash nativo imediatamente para mostrar nosso TelaSplash customizado
    SplashScreen.hideAsync()
  }, [])

  return (
    <AuthProvider>
      <VeiculoProvider>
        <StatusBar style="light" />
        <RootNavigator />
      </VeiculoProvider>
    </AuthProvider>
  )
}
