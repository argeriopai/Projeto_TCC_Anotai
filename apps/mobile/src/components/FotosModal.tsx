import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import ImageViewing from 'react-native-image-viewing'
import { CORES, FONTES, ESPACOS } from '../constants/cores'

interface Props {
  visivel: boolean
  fotos: string[]
  indiceInicial: number
  categoriaLabel: string
  onFechar: () => void
  onAdicionar?: () => void
  onExcluir: (indice: number) => void
}

export function FotosModal({
  visivel, fotos, indiceInicial, categoriaLabel, onFechar, onAdicionar, onExcluir,
}: Props) {
  const [indiceAtual, setIndiceAtual] = useState(indiceInicial)

  const images = fotos.map(uri => ({ uri }))

  function confirmarExcluir(idx: number) {
    Alert.alert(
      'Excluir foto',
      'Deseja excluir esta foto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: () => onExcluir(idx) },
      ]
    )
  }

  function Header({ imageIndex }: { imageIndex: number }) {
    return (
      <View style={es.topo}>
        <View>
          <Text style={es.categoria}>{categoriaLabel}</Text>
          <Text style={es.contador}>{imageIndex + 1} / {fotos.length}</Text>
        </View>
        <View style={es.topoAcoes}>
          <TouchableOpacity
            onPress={() => confirmarExcluir(imageIndex)}
            style={es.btnIcone}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={22} color={CORES.branco} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onFechar}
            style={es.btnIcone}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={26} color={CORES.branco} />
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  function Footer({ imageIndex }: { imageIndex: number }) {
    return (
      <View>
        {fotos.length > 1 && (
          <View style={es.dots}>
            {fotos.map((_, i) => (
              <View key={i} style={[es.dot, i === imageIndex && es.dotAtivo]} />
            ))}
          </View>
        )}
        {onAdicionar && (
          <View style={es.rodape}>
            <TouchableOpacity style={es.btnAdicionar} onPress={onAdicionar}>
              <Ionicons name="add" size={18} color={CORES.branco} />
              <Text style={es.btnAdicionarTexto}>Adicionar Foto</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    )
  }

  if (!visivel || fotos.length === 0) return null

  return (
    <ImageViewing
      images={images}
      imageIndex={Math.min(indiceInicial, fotos.length - 1)}
      visible={visivel}
      onRequestClose={onFechar}
      onImageIndexChange={setIndiceAtual}
      HeaderComponent={Header}
      FooterComponent={Footer}
      backgroundColor="black"
      swipeToCloseEnabled
      doubleTapToZoomEnabled
      animationType="fade"
    />
  )
}

const es = StyleSheet.create({
  topo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingHorizontal: ESPACOS.lg,
    paddingBottom: ESPACOS.md,
  },
  categoria: {
    color: CORES.branco,
    fontSize: FONTES.normal,
    fontWeight: '700',
  },
  contador: {
    color: CORES.cinzaTexto,
    fontSize: FONTES.pequena,
    marginTop: 2,
  },
  topoAcoes: {
    flexDirection: 'row',
    gap: ESPACOS.md,
  },
  btnIcone: {
    padding: ESPACOS.xs,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: ESPACOS.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotAtivo: {
    backgroundColor: CORES.secundaria,
  },
  rodape: {
    padding: ESPACOS.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : ESPACOS.lg,
    alignItems: 'center',
  },
  btnAdicionar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACOS.xs,
    backgroundColor: CORES.secundaria,
    paddingHorizontal: ESPACOS.lg,
    paddingVertical: ESPACOS.sm,
    borderRadius: 20,
  },
  btnAdicionarTexto: {
    color: CORES.branco,
    fontSize: FONTES.normal,
    fontWeight: '700',
  },
})
