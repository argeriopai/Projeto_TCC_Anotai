import React, { useEffect, useRef } from 'react'
import { TouchableOpacity, Animated, View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { CORES, FONTES, ESPACOS } from '../constants/cores'

interface Props {
  gravando: boolean
  onPress:  () => void
  tamanho?: number
}

export function BotaoMic({ gravando, onPress, tamanho = 22 }: Props) {
  const escala    = useRef(new Animated.Value(1)).current
  const animacao  = useRef<Animated.CompositeAnimation | null>(null)

  useEffect(() => {
    if (gravando) {
      animacao.current = Animated.loop(
        Animated.sequence([
          Animated.timing(escala, { toValue: 1.35, duration: 450, useNativeDriver: true }),
          Animated.timing(escala, { toValue: 1,    duration: 450, useNativeDriver: true }),
        ])
      )
      animacao.current.start()
    } else {
      animacao.current?.stop()
      escala.setValue(1)
    }
  }, [gravando])

  return (
    <TouchableOpacity onPress={onPress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
      <Animated.View style={{ transform: [{ scale: escala }] }}>
        <Ionicons
          name={gravando ? 'mic' : 'mic-outline'}
          size={tamanho}
          color={gravando ? CORES.erro : CORES.cinzaTexto}
        />
      </Animated.View>
    </TouchableOpacity>
  )
}

export function IndicadorGravando() {
  const opacidade = useRef(new Animated.Value(1)).current

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacidade, { toValue: 0.2, duration: 500, useNativeDriver: true }),
        Animated.timing(opacidade, { toValue: 1,   duration: 500, useNativeDriver: true }),
      ])
    )
    anim.start()
    return () => anim.stop()
  }, [])

  return (
    <View style={estilos.row}>
      <Animated.View style={[estilos.ponto, { opacity: opacidade }]} />
      <Text style={estilos.texto}>Gravando...</Text>
    </View>
  )
}

const estilos = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: ESPACOS.xs, marginTop: 4, marginBottom: 4 },
  ponto: { width: 8, height: 8, borderRadius: 4, backgroundColor: CORES.erro },
  texto: { fontSize: FONTES.pequena, color: CORES.erro, fontWeight: '600' },
})
