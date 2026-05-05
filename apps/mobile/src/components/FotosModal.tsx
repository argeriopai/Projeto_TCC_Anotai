import React, { useRef, useState, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, Image, ScrollView, Dimensions, Alert, Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { CORES, FONTES, ESPACOS } from '../constants/cores'

const { width: SW } = Dimensions.get('window')

interface Props {
  visivel: boolean
  fotos: string[]
  indiceInicial: number
  categoriaLabel: string
  onFechar: () => void
  onAdicionar?: () => void
  onExcluir: (indice: number) => void
}

export function FotosModal({ visivel, fotos, indiceInicial, categoriaLabel, onFechar, onAdicionar, onExcluir }: Props) {
  const [indiceAtual, setIndiceAtual] = useState(indiceInicial)
  const scrollRef = useRef<ScrollView>(null)

  useEffect(() => {
    if (visivel && fotos.length > 0) {
      const idx = Math.min(indiceInicial, fotos.length - 1)
      setIndiceAtual(idx)
      setTimeout(() => {
        scrollRef.current?.scrollTo({ x: idx * SW, animated: false })
      }, 50)
    }
  }, [visivel, indiceInicial])

  function handleScroll(e: any) {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SW)
    if (idx >= 0 && idx < fotos.length) setIndiceAtual(idx)
  }

  function confirmarExcluir() {
    Alert.alert(
      'Excluir foto',
      'Deseja excluir esta foto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: () => onExcluir(indiceAtual) },
      ]
    )
  }

  if (!visivel || fotos.length === 0) return null

  return (
    <Modal visible={visivel} transparent animationType="fade" statusBarTranslucent onRequestClose={onFechar}>
      <View style={es.container}>

        {/* Topo */}
        <View style={es.topo}>
          <View>
            <Text style={es.categoria}>{categoriaLabel}</Text>
            <Text style={es.contador}>{indiceAtual + 1} / {fotos.length}</Text>
          </View>
          <View style={es.topoAcoes}>
            <TouchableOpacity onPress={confirmarExcluir} style={es.btnIcone} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="trash-outline" size={22} color={CORES.branco} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onFechar} style={es.btnIcone} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={26} color={CORES.branco} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Fotos com swipe */}
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          scrollEventThrottle={16}
          style={es.scroll}
        >
          {fotos.map((uri, i) => (
            <View key={i} style={es.slide}>
              <Image source={{ uri }} style={es.foto} resizeMode="contain" />
            </View>
          ))}
        </ScrollView>

        {/* Pontos indicadores */}
        {fotos.length > 1 && (
          <View style={es.dots}>
            {fotos.map((_, i) => (
              <View key={i} style={[es.dot, i === indiceAtual && es.dotAtivo]} />
            ))}
          </View>
        )}

        {/* Rodapé — só exibido quando adição é permitida */}
        {onAdicionar && (
          <View style={es.rodape}>
            <TouchableOpacity style={es.btnAdicionar} onPress={onAdicionar}>
              <Ionicons name="add" size={18} color={CORES.branco} />
              <Text style={es.btnAdicionarTexto}>Adicionar Foto</Text>
            </TouchableOpacity>
          </View>
        )}

      </View>
    </Modal>
  )
}

const es = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'space-between',
  },
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
  scroll: {
    flex: 1,
  },
  slide: {
    width: SW,
    justifyContent: 'center',
    alignItems: 'center',
  },
  foto: {
    width: SW,
    height: SW,
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
