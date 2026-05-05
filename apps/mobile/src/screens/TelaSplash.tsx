import React, { useEffect, useRef } from 'react'
import { View, Animated, StyleSheet } from 'react-native'
import { AppText } from '../components/AppText'
import LogomarcaIcone from '../assets/icons/LOGOMARCA_ICONE1.svg'
import Logomarca1 from '../assets/icons/LOGOMARCA_1.svg'

interface Props {
  navigation: any
}

export function TelaSplash({ navigation }: Props) {
  const opacidade = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(opacidade, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start()

    const timer = setTimeout(() => {
      navigation.replace('Home')
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <View style={estilos.container}>
      {/* Marca d'água de fundo */}
      <View style={estilos.marcaDagua}>
        <LogomarcaIcone width={400} height={400} color="white" />
      </View>

      {/* Conteúdo com fade-in */}
      <Animated.View style={[estilos.conteudo, { opacity: opacidade }]}>
        {/* SVG já contém carro + letras "ANOTAÍ" + prancheta como paths */}
        <Logomarca1 width={260} height={260} color="white" />
        <AppText style={estilos.slogan}>Manutenção organizada, veículo protegido.</AppText>
      </Animated.View>
    </View>
  )
}

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#100050',
    justifyContent: 'center',
    alignItems: 'center',
  },
  marcaDagua: {
    position: 'absolute',
    opacity: 0.08,
  },
  conteudo: {
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 20,
  },
  slogan: {
    color: '#33CC33',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
})
