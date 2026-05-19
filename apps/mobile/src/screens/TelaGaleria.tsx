import React, { useState, useCallback } from 'react'
import {
  View, TouchableOpacity, StyleSheet,
  ScrollView, Image, ActivityIndicator, Alert,
} from 'react-native'
import { AppText } from '../components/AppText'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import { useAuth } from '../contexts/AuthContext'
import { useAuthGuard } from '../hooks/useAuthGuard'
import { useVeiculo } from '../contexts/VeiculoContext'
import { listarCarrosApi, listarMotosApi } from '../services/api'
import { listarTodasFotos, FotoRegistro, temFotos, salvarFotos, buscarFotos } from '../utils/fotosStorage'
import { CORES, FONTES, ESPACOS } from '../constants/cores'
import { FotosModal } from '../components/FotosModal'
import { AvatarCircular } from '../components/AvatarCircular'

interface Props { navigation: any }

type FiltroKey = 'todos' | 'servico' | 'notaFiscal' | 'garantia'
type CategoriaFoto = 'fotosServico' | 'fotosNotaFiscal' | 'fotosGarantia'

const FILTROS: { key: FiltroKey; label: string }[] = [
  { key: 'todos',      label: 'Todos'      },
  { key: 'servico',    label: 'Serviço'    },
  { key: 'notaFiscal', label: 'Nota Fiscal'},
  { key: 'garantia',   label: 'Garantia'   },
]

interface VeiculoComFotos {
  id: string
  tipo: 'carro' | 'moto'
  marca: string
  modelo: string
  placa: string
  registros: FotoRegistro[]
}

interface FotoGrupo {
  uris: string[]
  label: string
  categoria: CategoriaFoto
  registroId: string
}

interface ModalState {
  fotos: string[]
  indice: number
  label: string
  registroId: string
  categoria: CategoriaFoto
}

export function TelaGaleria({ navigation }: Props) {
  const { proprietario } = useAuth()
  const { requireAuth }  = useAuthGuard()
  const { veiculoAtivo } = useVeiculo()

  const [carregando,     setCarregando]    = useState(true)
  const [veiculos,       setVeiculos]      = useState<VeiculoComFotos[]>([])
  const [expandidos,     setExpandidos]    = useState<Set<string>>(new Set())
  const [filtro,         setFiltro]        = useState<FiltroKey>('todos')
  const [modalState,     setModalState]    = useState<ModalState | null>(null)

  useFocusEffect(
    useCallback(() => {
      requireAuth(() => {})
      carregarGaleria()
    }, [])
  )

  async function carregarGaleria() {
    setCarregando(true)
    try {
      const [resCarros, resMotos, todasFotos] = await Promise.all([
        listarCarrosApi(),
        listarMotosApi(),
        listarTodasFotos(),
      ])

      const fotosMap = new Map<string, FotoRegistro[]>()
      for (const f of todasFotos) {
        if (!temFotos(f)) continue
        const arr = fotosMap.get(f.veiculoId) ?? []
        arr.push(f)
        fotosMap.set(f.veiculoId, arr)
      }

      const lista: VeiculoComFotos[] = [
        ...resCarros.data.map(c => ({
          id: c.id, tipo: 'carro' as const,
          marca: c.marca, modelo: c.modelo, placa: c.placa,
          registros: fotosMap.get(c.id) ?? [],
        })),
        ...resMotos.data.map(m => ({
          id: m.id, tipo: 'moto' as const,
          marca: m.marca, modelo: m.modelo, placa: m.placa,
          registros: fotosMap.get(m.id) ?? [],
        })),
      ].filter(v => v.registros.length > 0)

      const listaFiltrada = veiculoAtivo
        ? lista.filter(v => v.id === veiculoAtivo.id)
        : lista
      setVeiculos(listaFiltrada)
    } catch {
      setVeiculos([])
    } finally {
      setCarregando(false)
    }
  }

  function toggleExpandido(id: string) {
    setExpandidos(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function fotosParaFiltro(reg: FotoRegistro): FotoGrupo[] {
    const resultado: FotoGrupo[] = []
    if ((filtro === 'todos' || filtro === 'servico') && reg.fotosServico.length > 0)
      resultado.push({ uris: reg.fotosServico, label: reg.nomeRegistro || 'Sem descrição', categoria: 'fotosServico', registroId: reg.registroId })
    if ((filtro === 'todos' || filtro === 'notaFiscal') && reg.fotosNotaFiscal.length > 0)
      resultado.push({ uris: reg.fotosNotaFiscal, label: 'Nota Fiscal', categoria: 'fotosNotaFiscal', registroId: reg.registroId })
    if ((filtro === 'todos' || filtro === 'garantia') && reg.fotosGarantia.length > 0)
      resultado.push({ uris: reg.fotosGarantia, label: 'Garantia', categoria: 'fotosGarantia', registroId: reg.registroId })
    return resultado
  }

  function abrirFoto(uris: string[], indice: number, label: string, registroId: string, categoria: CategoriaFoto) {
    setModalState({ fotos: uris, indice, label, registroId, categoria })
  }

  function handleExcluirDaGaleria(indice: number) {
    if (!modalState) return
    const { registroId, categoria } = modalState
    Alert.alert(
      'Excluir foto',
      'Deseja excluir esta foto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir', style: 'destructive',
          onPress: async () => {
            try {
              const registro = await buscarFotos(registroId)
              if (!registro) return
              const novasFotos = registro[categoria].filter((_, i) => i !== indice)
              await salvarFotos({ ...registro, [categoria]: novasFotos })
              if (novasFotos.length === 0) {
                setModalState(null)
              } else {
                setModalState(prev => prev ? {
                  ...prev,
                  fotos: novasFotos,
                  indice: indice >= novasFotos.length ? novasFotos.length - 1 : indice,
                } : null)
              }
              await carregarGaleria()
            } catch {
              Alert.alert('Erro', 'Não foi possível excluir a foto.', [{ text: 'OK' }])
            }
          },
        },
      ]
    )
  }

  const totalFotos = veiculos.reduce((acc, v) =>
    acc + v.registros.reduce((a, r) =>
      a + r.fotosServico.length + r.fotosNotaFiscal.length + r.fotosGarantia.length, 0), 0)

  return (
    <SafeAreaView style={es.safe} edges={['top']}>

      {/* HEADER */}
      <View style={es.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessible={true}
          accessibilityLabel="Voltar"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color={CORES.branco} />
        </TouchableOpacity>
        <View style={es.headerCentro}>
          <AvatarCircular uri={proprietario?.fotoPerfil} size={28} />
          <View style={{ marginLeft: ESPACOS.xs }}>
            <AppText style={es.headerOla}>Olá,</AppText>
            <AppText style={es.headerNome}>{proprietario?.apelido ?? proprietario?.nome?.split(' ')[0] ?? 'Usuário'}</AppText>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('Home')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessible={true}
          accessibilityLabel="Ir para Início"
          accessibilityRole="button"
        >
          <Ionicons name="home-outline" size={24} color={CORES.secundaria} />
        </TouchableOpacity>
      </View>

      {/* TÍTULO */}
      <View style={es.tituloRow}>
        <View style={es.tituloEsquerda}>
          <Ionicons name="images-outline" size={22} color={CORES.secundaria} />
          <AppText style={es.tituloTexto}>Galeria</AppText>
        </View>
        {!carregando && <AppText style={es.totalFotos}>{totalFotos} foto{totalFotos !== 1 ? 's' : ''}</AppText>}
      </View>
      <View style={es.divisoria} />

      {/* FILTROS */}
      <View style={es.filtrosWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={es.filtros}>
          {FILTROS.map(f => (
            <TouchableOpacity
              key={f.key}
              style={[es.chip, filtro === f.key && es.chipAtivo]}
              onPress={() => setFiltro(f.key)}
              accessible={true}
              accessibilityLabel={`Filtrar por ${f.label}`}
              accessibilityRole="tab"
              accessibilityState={{ selected: filtro === f.key }}
            >
              <AppText style={[es.chipTexto, filtro === f.key && es.chipTextoAtivo]}>{f.label}</AppText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* CONTEÚDO */}
      {!veiculoAtivo ? (
        <View style={es.centralizador}>
          <Ionicons name="car-outline" size={56} color={CORES.cinzaTexto} />
          <AppText style={es.semDadosTitulo}>Ative um veículo para ver as fotos</AppText>
          <AppText style={es.semDadosSub}>Vá em Início e toque no seu veículo para ativá-lo</AppText>
        </View>
      ) : carregando ? (
        <View style={es.centralizador}>
          <ActivityIndicator size="large" color={CORES.secundaria} />
        </View>
      ) : veiculos.length === 0 ? (
        <View style={es.centralizador}>
          <Ionicons name="images-outline" size={64} color={CORES.cinzaTexto} />
          <AppText style={es.semDadosTitulo}>Nenhuma foto encontrada</AppText>
          <AppText style={es.semDadosSub}>Adicione fotos ao registrar serviços e peças</AppText>
        </View>
      ) : (
        <ScrollView style={es.scroll} contentContainerStyle={es.scrollConteudo} showsVerticalScrollIndicator={false}>
          {veiculos.map(veiculo => {
            const aberto = expandidos.has(veiculo.id)
            const secoesFiltradas = veiculo.registros.flatMap(r => fotosParaFiltro(r))
            if (secoesFiltradas.length === 0) return null

            return (
              <View key={veiculo.id} style={es.veiculoCard}>
                {/* Header do veículo */}
                <TouchableOpacity style={es.veiculoHeader} onPress={() => toggleExpandido(veiculo.id)} activeOpacity={0.85}>
                  <Ionicons name={veiculo.tipo === 'carro' ? 'car' : 'bicycle'} size={20} color={CORES.branco} />
                  <View style={{ flex: 1, marginLeft: ESPACOS.sm }}>
                    <AppText style={es.veiculoNome}>{veiculo.marca} {veiculo.modelo}</AppText>
                    <AppText style={es.veiculoPlaca}>{veiculo.placa}</AppText>
                  </View>
                  <Ionicons name={aberto ? 'chevron-up' : 'chevron-down'} size={18} color={CORES.branco} />
                </TouchableOpacity>

                {/* Conteúdo expansível */}
                {aberto && (
                  <View style={es.veiculoConteudo}>
                    {veiculo.registros.map(reg => {
                      const grupos = fotosParaFiltro(reg)
                      if (grupos.length === 0) return null
                      return (
                        <View key={reg.registroId} style={es.registroSecao}>
                          <View style={es.registroHeader}>
                            <Ionicons
                              name={reg.tipoRegistro === 'servico' ? 'construct-outline' : 'hardware-chip-outline'}
                              size={14}
                              color={CORES.cinzaTexto}
                            />
                            <AppText style={es.registroLabel}>
                              {reg.tipoRegistro === 'servico' ? 'Serviço' : 'Peça'}
                            </AppText>
                          </View>

                          {grupos.map(({ uris, label, categoria, registroId }) => (
                            <View key={label} style={es.grupoFotos}>
                              <AppText style={es.grupoLabel}>{label} ({uris.length})</AppText>
                              <View style={es.grade}>
                                {uris.map((uri, idx) => (
                                  <TouchableOpacity key={idx} onPress={() => abrirFoto(uris, idx, label, registroId, categoria)} activeOpacity={0.85}>
                                    <Image source={{ uri }} style={es.thumbnail} />
                                  </TouchableOpacity>
                                ))}
                              </View>
                            </View>
                          ))}
                        </View>
                      )
                    })}
                  </View>
                )}
              </View>
            )
          })}
        </ScrollView>
      )}

      {/* Modal full-screen */}
      {modalState && (
        <FotosModal
          visivel={!!modalState}
          fotos={modalState.fotos}
          indiceInicial={modalState.indice}
          categoriaLabel={modalState.label}
          onFechar={() => setModalState(null)}
          onExcluir={handleExcluirDaGaleria}
        />
      )}

    </SafeAreaView>
  )
}

const THUMB_SIZE = 96

const es = StyleSheet.create({
  safe: { flex: 1, backgroundColor: CORES.primaria },

  header: {
    backgroundColor: CORES.primaria,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ESPACOS.lg,
    paddingVertical: ESPACOS.md,
  },
  headerCentro: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerOla:  { color: CORES.cinzaTexto, fontSize: FONTES.pequena },
  headerNome: { color: CORES.branco, fontSize: FONTES.normal, fontWeight: '700' },

  tituloRow: {
    backgroundColor: CORES.branco,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ESPACOS.md,
    paddingVertical: ESPACOS.sm,
  },
  tituloEsquerda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACOS.xs,
  },
  tituloTexto: {
    fontSize: FONTES.subtitulo,
    fontWeight: '700',
    color: CORES.pretinho,
  },
  totalFotos: {
    fontSize: FONTES.pequena,
    color: CORES.textoSecundario,
  },
  divisoria: {
    height: 2,
    backgroundColor: CORES.secundaria,
  },

  filtrosWrap: {
    backgroundColor: CORES.branco,
    borderBottomWidth: 1,
    borderBottomColor: CORES.borda,
  },
  filtros: {
    paddingHorizontal: ESPACOS.md,
    paddingVertical: ESPACOS.sm,
    gap: ESPACOS.sm,
  },
  chip: {
    paddingHorizontal: ESPACOS.md,
    paddingVertical: ESPACOS.xs,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: CORES.borda,
    backgroundColor: CORES.branco,
  },
  chipAtivo: {
    borderColor: CORES.secundaria,
    backgroundColor: '#E8FAF0',
  },
  chipTexto: {
    fontSize: FONTES.pequena,
    color: CORES.textoSecundario,
    fontWeight: '600',
  },
  chipTextoAtivo: {
    color: CORES.secundariaEscuro,
  },

  centralizador: {
    flex: 1,
    backgroundColor: CORES.cinzaClaro,
    justifyContent: 'center',
    alignItems: 'center',
    gap: ESPACOS.md,
    padding: ESPACOS.lg,
  },
  semDadosTitulo: {
    fontSize: FONTES.media,
    fontWeight: '700',
    color: CORES.pretinho,
    textAlign: 'center',
  },
  semDadosSub: {
    fontSize: FONTES.pequena,
    color: CORES.textoSecundario,
    textAlign: 'center',
    lineHeight: 18,
  },

  scroll: { flex: 1, backgroundColor: CORES.cinzaClaro },
  scrollConteudo: { padding: ESPACOS.md, paddingBottom: ESPACOS.xxl },

  veiculoCard: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: ESPACOS.md,
    borderWidth: 1.5,
    borderColor: CORES.borda,
  },
  veiculoHeader: {
    backgroundColor: CORES.primaria,
    flexDirection: 'row',
    alignItems: 'center',
    padding: ESPACOS.md,
  },
  veiculoNome: {
    color: CORES.branco,
    fontSize: FONTES.normal,
    fontWeight: '700',
  },
  veiculoPlaca: {
    color: CORES.cinzaTexto,
    fontSize: FONTES.pequena,
    marginTop: 2,
  },
  veiculoConteudo: {
    backgroundColor: CORES.branco,
    padding: ESPACOS.md,
    gap: ESPACOS.md,
  },

  registroSecao: {
    gap: ESPACOS.sm,
  },
  registroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACOS.xs,
  },
  registroLabel: {
    fontSize: FONTES.pequena,
    fontWeight: '700',
    color: CORES.textoSecundario,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  grupoFotos: {
    gap: ESPACOS.xs,
  },
  grupoLabel: {
    fontSize: FONTES.pequena,
    color: CORES.texto,
    fontWeight: '600',
  },
  grade: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ESPACOS.sm,
  },
  thumbnail: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 8,
    backgroundColor: CORES.cinzaMedio,
  },
})
