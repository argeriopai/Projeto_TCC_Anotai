import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Image, Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { CORES, FONTES, ESPACOS } from '../constants/cores'
import { FotosModal } from './FotosModal'

export interface FotoSections {
  fotosServico: string[]
  fotosNotaFiscal: string[]
  fotosGarantia: string[]
}

export const FOTOS_VAZIAS: FotoSections = {
  fotosServico: [],
  fotosNotaFiscal: [],
  fotosGarantia: [],
}

interface Props {
  fotos: FotoSections
  onFotosChange: (f: FotoSections) => void
  desabilitado?: boolean
  onBloqueado?: () => void
}

type SecaoKey = keyof FotoSections

const MAX = 5

const SECOES: { key: SecaoKey; label: string; icone: string }[] = [
  { key: 'fotosServico',    label: 'Foto do Serviço / Peça', icone: 'camera-outline'        },
  { key: 'fotosNotaFiscal', label: 'Nota Fiscal',            icone: 'receipt-outline'        },
  { key: 'fotosGarantia',   label: 'Garantia',               icone: 'document-text-outline'  },
]

export function FotosPicker({ fotos, onFotosChange, desabilitado, onBloqueado }: Props) {
  const [modalSecao,  setModalSecao]  = useState<SecaoKey>('fotosServico')
  const [modalIndice, setModalIndice] = useState(0)
  const [modalAberto, setModalAberto] = useState(false)

  async function pedirPermissao(tipo: 'camera' | 'galeria'): Promise<boolean> {
    if (tipo === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync()
      return status === 'granted'
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    return status === 'granted'
  }

  async function selecionarFoto(secao: SecaoKey, origem: 'camera' | 'galeria') {
    if (fotos[secao].length >= MAX) {
      Alert.alert('Limite atingido', `Máximo de ${MAX} fotos por categoria.`, [{ text: 'OK' }])
      return
    }

    const ok = await pedirPermissao(origem)
    if (!ok) {
      Alert.alert(
        'Permissão negada',
        `Não foi possível acessar ${origem === 'camera' ? 'a câmera' : 'a galeria'}. Ative nas configurações do seu celular.`,
        [{ text: 'OK' }]
      )
      return
    }

    const res = origem === 'camera'
      ? await ImagePicker.launchCameraAsync({ quality: 0.5, allowsEditing: true, aspect: [4, 3] })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.5, allowsEditing: true, aspect: [4, 3] })

    if (res.canceled || !res.assets?.[0]?.uri) return

    const uri = res.assets[0].uri
    onFotosChange({ ...fotos, [secao]: [...fotos[secao], uri] })
  }

  function mostrarOpcoes(secao: SecaoKey) {
    if (desabilitado) { onBloqueado?.(); return }
    if (fotos[secao].length >= MAX) {
      Alert.alert('Limite atingido', `Máximo de ${MAX} fotos por seção.`)
      return
    }
    Alert.alert(
      'Adicionar Foto',
      'Escolha a origem:',
      [
        { text: 'Tirar Foto',         onPress: () => selecionarFoto(secao, 'camera')  },
        { text: 'Escolher da Galeria', onPress: () => selecionarFoto(secao, 'galeria') },
        { text: 'Cancelar', style: 'cancel' },
      ]
    )
  }

  function abrirModal(secao: SecaoKey, indice: number) {
    setModalSecao(secao)
    setModalIndice(indice)
    setModalAberto(true)
  }

  function removerFoto(secao: SecaoKey, indice: number) {
    Alert.alert(
      'Excluir foto',
      'Deseja excluir esta foto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir', style: 'destructive',
          onPress: () => onFotosChange({ ...fotos, [secao]: fotos[secao].filter((_, i) => i !== indice) }),
        },
      ]
    )
  }

  function handleExcluirModal(indice: number) {
    const novas = fotos[modalSecao].filter((_, i) => i !== indice)
    onFotosChange({ ...fotos, [modalSecao]: novas })
    if (novas.length === 0) setModalAberto(false)
    else if (indice >= novas.length) setModalIndice(novas.length - 1)
  }

  function handleAdicionarModal() {
    setModalAberto(false)
    setTimeout(() => mostrarOpcoes(modalSecao), 300)
  }

  return (
    <View style={es.container}>
      <View style={es.tituloRow}>
        <Ionicons name="camera" size={20} color={CORES.secundaria} />
        <Text style={es.titulo}>Adicionar Fotos</Text>
      </View>
      <View style={es.divisoria} />

      {SECOES.map(({ key, label, icone }) => {
        const lista = fotos[key]
        return (
          <View key={key} style={es.secao}>
            <View style={es.secaoHeader}>
              <Ionicons name={icone as any} size={15} color={CORES.texto} />
              <Text style={es.secaoLabel}>{label}</Text>
              <Text style={es.contador}>{lista.length}/{MAX}</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={es.fotosScroll}>
              {lista.map((uri, idx) => (
                <View key={idx} style={es.thumbWrap}>
                  <TouchableOpacity onPress={() => abrirModal(key, idx)} activeOpacity={0.85}>
                    <Image source={{ uri }} style={es.thumb} />
                  </TouchableOpacity>
                  <TouchableOpacity style={es.btnRemover} onPress={() => removerFoto(key, idx)} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
                    <Ionicons name="trash" size={11} color={CORES.branco} />
                  </TouchableOpacity>
                </View>
              ))}

              {lista.length < MAX && (
                <TouchableOpacity style={es.btnAdicionar} onPress={() => mostrarOpcoes(key)} activeOpacity={0.7}>
                  <Ionicons name="add-circle-outline" size={26} color={CORES.secundaria} />
                  <Text style={es.btnAdicionarTexto}>Adicionar{'\n'}Foto</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        )
      })}

      <FotosModal
        visivel={modalAberto}
        fotos={fotos[modalSecao]}
        indiceInicial={modalIndice}
        categoriaLabel={SECOES.find(s => s.key === modalSecao)?.label ?? ''}
        onFechar={() => setModalAberto(false)}
        onAdicionar={handleAdicionarModal}
        onExcluir={handleExcluirModal}
      />
    </View>
  )
}

const es = StyleSheet.create({
  container: {
    backgroundColor: CORES.branco,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: CORES.borda,
    marginBottom: ESPACOS.md,
    overflow: 'hidden',
  },
  tituloRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACOS.sm,
    paddingHorizontal: ESPACOS.md,
    paddingTop: ESPACOS.md,
    paddingBottom: ESPACOS.sm,
  },
  titulo: {
    fontSize: FONTES.normal,
    fontWeight: '700',
    color: CORES.pretinho,
  },
  divisoria: {
    height: 2,
    backgroundColor: CORES.secundaria,
    marginBottom: ESPACOS.sm,
  },
  secao: {
    paddingHorizontal: ESPACOS.md,
    paddingBottom: ESPACOS.md,
  },
  secaoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACOS.xs,
    marginBottom: ESPACOS.sm,
  },
  secaoLabel: {
    flex: 1,
    fontSize: FONTES.pequena,
    fontWeight: '600',
    color: CORES.texto,
  },
  contador: {
    fontSize: FONTES.pequena,
    color: CORES.textoSecundario,
  },
  fotosScroll: {
    gap: ESPACOS.sm,
    paddingRight: ESPACOS.xs,
  },
  thumbWrap: {
    position: 'relative',
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: CORES.cinzaMedio,
  },
  btnRemover: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: CORES.erro,
    borderRadius: 8,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnAdicionar: {
    width: 72,
    height: 72,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: CORES.secundaria,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  btnAdicionarTexto: {
    fontSize: 9,
    color: CORES.secundaria,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 12,
  },
})
