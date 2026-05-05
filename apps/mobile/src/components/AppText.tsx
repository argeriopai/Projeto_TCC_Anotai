import React from 'react'
import { Text, TextProps } from 'react-native'
import { useAcessibilidade } from '../contexts/AcessibilidadeContext'

interface Props extends TextProps {
  children: React.ReactNode
}

export function AppText({ children, style, ...props }: Props) {
  const { escala } = useAcessibilidade()

  return (
    <Text
      style={[
        style,
        style && (style as any).fontSize
          ? { fontSize: (style as any).fontSize * escala }
          : undefined,
      ]}
      {...props}
    >
      {children}
    </Text>
  )
}
