import React, { useState, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Image, Alert, Modal, ActivityIndicator, Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { CORES, FONTES, ESPACOS } from '../constants/cores'
import { FotoRegistro, buscarFotos, salvarFotos } from '../utils/fotosStorage'
import { FotosModal } from './FotosModal'

type SecaoKey = 'fotosServico' | 'fotosNotaFiscal' | 'fotosGarantia'

const SECOES: { key: SecaoKey; label: string; icone: string }[] = [
  { key: 'fotosServico',    label: 'Foto do Serviço / Peça', icone: 'camera-outline'       },
  { key: 'fotosNotaFiscal', label: 'Nota Fiscal',            icone: 'receipt-outline'       },
  { key: 'fotosGarantia',   label: 'Garantia',               icone: 'document-text-outline' },
]

interface Props {
  visivel: boolean
  registroId: string
  veiculoId: string
  tipoRegistro: 'servico' | 'peca'
  onFechar: () => void
}

export function FotosViewerModal({ visivel, registroId, veiculoId, tipoRegistro, onFechar }: Props) {
  const [registro, setRegistro]   = useState<FotoRegistro>({
    veiculoId, registroId, tipoRegistro,
    fotosServico: [], fotosNotaFiscal: [], fotosGarantia: [],
  })
  const [carregando, setCarregando] = useState(true)
  const [modalSecao,  setModalSecao]  = useState<SecaoKey>('fotosServico')
  const [modalIndice, setModalIndice] = useState(0)
  const [modalAberto, setModalAberto] = useState(false)

  useEffect(() => {
    if (visivel) carregarFotos()
  }, [visivel, registroId])

  async function carregarFotos() {
    setCarregando(true)
    const found = await buscarFotos(registroId)
    if (found) {
      setRegistro(found)
    } else {
      setRegistro({ veiculoId, registroId, tipoRegistro, fotosServico: [], fotosNotaFiscal: [], fotosGarantia: [] })
    }
    setCarregando(false)
  }

  async function atualizar(novoRegistro: FotoRegistro) {
    setRegistro(novoRegistro)
    await salvarFotos(novoRegistro)
  }

  function removerFoto(secao: SecaoKey, indice: number) {
    Alert.alert(
      'Excluir foto',
      'Deseja excluir esta foto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir', style: 'destructive',
          onPress: async () => {
            const novo = { ...registro, [secao]: registro[secao].filter((_, i) => i !== indice) }
            await atualizar(novo)
          },
        },
      ]
    )
  }

  function abrirModal(secao: SecaoKey, indice: number) {
    setModalSecao(secao)
    setModalIndice(indice)
    setModalAberto(true)
  }

  function handleExcluirModal(indice: number) {
    const novas = registro[modalSecao].filter((_, i) => i !== indice)
    const novo = { ...registro, [modalSecao]: novas }
    atualizar(novo)
    if (novas.length === 0) setModalAberto(false)
    else if (indice >= novas.length) setModalIndice(novas.length - 1)
  }

  return (
    <Modal visible={visivel} animationType="slide" onRequestClose={onFechar}>
      <View style={es.container}>

        {/* Header */}
        <View style={es.header}>
          <Text style={es.headerTitulo}>Fotos do Registro</Text>
          <TouchableOpacity onPress={onFechar} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={26} color={CORES.branco} />
          </TouchableOpacity>
        </View>

        {carregando ? (
          <View style={es.carregando}>
            <ActivityIndicator size="large" color={CORES.secundaria} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={es.conteudo} showsVerticalScrollIndicator={false}>
            {SECOES.map(({ key, label, icone }) => {
              const lista = registro[key]
              return (
                <View key={key} style={es.secao}>
                  <View style={es.secaoHeader}>
                    <Ionicons name={icone as any} size={16} color={CORES.secundaria} />
                    <Text style={es.secaoLabel}>{label}</Text>
                    <Text style={es.contador}>{lista.length}/5</Text>
                  </View>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={es.fotosScroll}>
                    {lista.length === 0 ? (
                      <Text style={es.semFotos}>Sem fotos</Text>
                    ) : lista.map((uri, idx) => (
                      <View key={idx} style={es.thumbWrap}>
                        <TouchableOpacity onPress={() => abrirModal(key, idx)} activeOpacity={0.85}>
                          <Image source={{ uri }} style={es.thumb} />
                        </TouchableOpacity>
                        <TouchableOpacity style={es.btnRemover} onPress={() => removerFoto(key, idx)} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
                          <Ionicons name="trash" size={11} color={CORES.branco} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )
            })}
          </ScrollView>
        )}

        <FotosModal
          visivel={modalAberto}
          fotos={registro[modalSecao]}
          indiceInicial={modalIndice}
          categoriaLabel={SECOES.find(s => s.key === modalSecao)?.label ?? ''}
          onFechar={() => setModalAberto(false)}
          onExcluir={handleExcluirModal}
        />
      </View>
    </Modal>
  )
}

const es = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CORES.cinzaClaro,
  },
  header: {
    backgroundColor: CORES.primaria,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ESPACOS.lg,
    paddingVertical: ESPACOS.md,
    paddingTop: Platform.OS === 'ios' ? 56 : ESPACOS.md,
  },
  headerTitulo: {
    color: CORES.branco,
    fontSize: FONTES.media,
    fontWeight: '700',
  },
  carregando: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  conteudo: {
    padding: ESPACOS.md,
    paddingBottom: ESPACOS.xxl,
  },
  secao: {
    backgroundColor: CORES.branco,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: CORES.borda,
    padding: ESPACOS.md,
    marginBottom: ESPACOS.md,
  },
  secaoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACOS.xs,
    marginBottom: ESPACOS.sm,
  },
  secaoLabel: {
    flex: 1,
    fontSize: FONTES.normal,
    fontWeight: '600',
    color: CORES.pretinho,
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
    width: 80,
    height: 80,
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
  semFotos: {
    fontSize: FONTES.pequena,
    color: CORES.textoSecundario,
    fontStyle: 'italic',
    paddingVertical: ESPACOS.sm,
  },
})
