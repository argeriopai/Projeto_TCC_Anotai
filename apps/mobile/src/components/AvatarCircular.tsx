import React from 'react'
import { View, Image, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { CORES } from '../constants/cores'

interface Props {
  uri?: string | null
  size?: number
  borderWidth?: number
  borderColor?: string
}

export function AvatarCircular({ uri, size = 36, borderWidth = 0, borderColor = CORES.secundaria }: Props) {
  const radius = size / 2
  const baseStyle = {
    width: size,
    height: size,
    borderRadius: radius,
    borderWidth,
    borderColor,
  }

  if (uri) {
    return <Image source={{ uri }} style={baseStyle} />
  }

  return (
    <View style={[es.circulo, baseStyle]}>
      <Ionicons name="person" size={size * 0.55} color={CORES.branco} />
    </View>
  )
}

const es = StyleSheet.create({
  circulo: {
    backgroundColor: CORES.primaria,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
