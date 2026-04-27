import React, { useState, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import { useAuth } from '../../contexts/AuthContext'
import { useAuthGuard } from '../../hooks/useAuthGuard'
import { useVeiculo } from '../../contexts/VeiculoContext'
import { listarServicosApi, excluirServicoApi, Servico } from '../../services/api'
import { CORES, FONTES, ESPACOS } from '../../constants/cores'
import { BottomNavBar } from '../../components/BottomNavBar'
import { FotosViewerModal } from '../../components/FotosViewerModal'
import { listarTodasFotos, FotoRegistro, temFotos } from '../../utils/fotosStorage'
import IconeNavServicos from '../../assets/icons/ICONE_RELATORIO_SERVIÇOS.svg'

interface Props { navigation: any }

export function TelaServicos({ navigation }: Props) {
  const { proprietario } = useAuth()
  const { requireAuth } = useAuthGuard()
  const { veiculoAtivo } = useVeiculo()
  const apelido = proprietario?.apelido ?? proprietario?.nome?.split(' ')[0] ?? 'Usuário'

  const [lista,           setLista]           = useState<Servico[]>([])
  const [carregando,      setCarregando]      = useState(true)
  const [cardSelecionado, setCardSelecionado] = useState<string | null>(null)
  const [fotosMap,        setFotosMap]        = useState<Map<string, FotoRegistro>>(new Map())
  const [viewerId,        setViewerId]        = useState<string | null>(null)
  const [viewerVeiculoId, setViewerVeiculoId] = useState<string>('')

  useFocusEffect(
    useCallback(() => {
      carregarDados()
      setCardSelecionado(null)
    }, [veiculoAtivo?.id])
  )

  async function carregarDados() {
    setCarregando(true)
    try {
      if (!veiculoAtivo) {
        setLista([])
        return
      }
      const [res, todasFotos] = await Promise.all([listarServicosApi(), listarTodasFotos()])
      const dados = res.data.filter(s => s.veiculoId === veiculoAtivo.id)
      setLista([...dados].sort((a, b) => b.data.localeCompare(a.data)))
      const mapa = new Map<string, FotoRegistro>()
      for (const f of todasFotos) mapa.set(f.registroId, f)
      setFotosMap(mapa)
    } catch {
      setLista([])
    } finally {
      setCarregando(false)
    }
  }

  function handleEditar() {
    if (!cardSelecionado) {
      Alert.alert('Atenção', 'Selecione um registro para editar.')
      return
    }
    requireAuth(() => {
      const item = lista.find(s => s.id === cardSelecionado)
      if (item) navigation.navigate('RegistrarServico', { registroParaEditar: item })
    })
  }

  function handleNovo() {
    requireAuth(() => navigation.navigate('RegistrarServico'))
  }

  function handleExcluir() {
    if (!cardSelecionado) {
      Alert.alert('Atenção', 'Selecione um registro para excluir.')
      return
    }
    requireAuth(() => {
      Alert.alert(
        'Confirmar Exclusão',
        'Deseja realmente excluir este registro?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Excluir', style: 'destructive',
            onPress: async () => {
              try {
                await excluirServicoApi(cardSelecionado)
                setCardSelecionado(null)
                carregarDados()
              } catch {
                Alert.alert('Erro', 'Não foi possível excluir o registro.')
              }
            },
          },
        ]
      )
    })
  }

  const veiculoLabel = veiculoAtivo
    ? `${veiculoAtivo.marca} ${veiculoAtivo.modelo} ${veiculoAtivo.placa}`
    : null

  return (
    <SafeAreaView style={estilos.safe} edges={['top']}>

      {/* HEADER */}
      <View style={estilos.header}>
        <View style={estilos.headerEsquerda}>
          <Ionicons name="person-circle-outline" size={34} color={CORES.branco} />
          <View style={{ marginLeft: ESPACOS.xs }}>
            <Text style={estilos.headerOla}>Olá,</Text>
            <Text style={estilos.headerNome}>{apelido}</Text>
          </View>
        </View>
        <View style={estilos.headerAcoes}>
          <TouchableOpacity style={estilos.btnAcao} onPress={handleEditar}>
            <View style={[estilos.btnCirculo, { backgroundColor: CORES.secundaria }]}>
              <Ionicons name="pencil" size={15} color={CORES.branco} />
            </View>
            <Text style={estilos.btnLabel}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={estilos.btnAcao} onPress={handleNovo}>
            <View style={[estilos.btnCirculo, { backgroundColor: CORES.secundaria }]}>
              <Ionicons name="add" size={20} color={CORES.branco} />
            </View>
            <Text style={estilos.btnLabel}>Novo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={estilos.btnAcao} onPress={handleExcluir}>
            <View style={[estilos.btnCirculo, { backgroundColor: CORES.erro }]}>
              <Ionicons name="trash-outline" size={15} color={CORES.branco} />
            </View>
            <Text style={estilos.btnLabel}>Excluir</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* TÍTULO */}
      <View style={estilos.tituloRow}>
        <View style={estilos.tituloEsquerda}>
          <IconeNavServicos width={22} height={22} color={CORES.secundaria} />
          <Text style={estilos.tituloTexto}>Serviços</Text>
        </View>
        {veiculoLabel && (
          <Text style={estilos.veiculoLabel} numberOfLines={1}>{veiculoLabel}</Text>
        )}
      </View>
      <View style={estilos.divisoria} />

      {/* CONTEÚDO */}
      {!veiculoAtivo ? (
        <View style={estilos.centralizador}>
          <Ionicons name="car-outline" size={56} color={CORES.cinzaTexto} />
          <Text style={estilos.semDadosTitulo}>Nenhum veículo selecionado</Text>
          <Text style={estilos.semDadosSub}>
            Acesse Veículo e selecione um veículo para visualizar seus registros
          </Text>
          <TouchableOpacity style={estilos.btnAdicionar} onPress={() => navigation.navigate('Veiculos')}>
            <Text style={estilos.btnAdicionarTexto}>Selecionar Veículo</Text>
          </TouchableOpacity>
        </View>
      ) : carregando ? (
        <View style={estilos.centralizador}>
          <ActivityIndicator size="large" color={CORES.secundaria} />
        </View>
      ) : lista.length === 0 ? (
        <View style={estilos.centralizador}>
          <Ionicons name="construct-outline" size={52} color={CORES.cinzaTexto} />
          <Text style={estilos.semDados}>Nenhum serviço encontrado</Text>
          <TouchableOpacity style={estilos.btnAdicionar} onPress={handleNovo}>
            <Text style={estilos.btnAdicionarTexto}>Adicionar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={estilos.scroll}
          contentContainerStyle={estilos.scrollConteudo}
          showsVerticalScrollIndicator={false}
        >
          {lista.map(item => (
            <TouchableOpacity
              key={item.id}
              style={[estilos.card, cardSelecionado === item.id && estilos.cardAtivo]}
              onPress={() => setCardSelecionado(p => p === item.id ? null : item.id)}
              activeOpacity={0.85}
            >
              {/* Data + Oficina */}
              <View style={estilos.cardTopRow}>
                <Text style={estilos.cardData}>{item.data}</Text>
                <View style={{ alignItems: 'flex-end', flex: 1, marginLeft: ESPACOS.sm }}>
                  {item.estabelecimento && (
                    <Text style={estilos.cardEstabelecimento} numberOfLines={1}>
                      {item.estabelecimento}
                    </Text>
                  )}
                  {item.telefoneEstabelecimento && (
                    <Text style={estilos.cardTelefone}>{item.telefoneEstabelecimento}</Text>
                  )}
                </View>
              </View>

              {/* Profissional */}
              {(item.profissional || item.telefoneProfissional) && (
                <View style={[estilos.cardTopRow, { marginTop: 2 }]}>
                  <View style={{ flex: 1 }} />
                  <View style={{ alignItems: 'flex-end' }}>
                    {item.profissional && (
                      <Text style={estilos.cardProfissional}>{item.profissional}</Text>
                    )}
                    {item.telefoneProfissional && (
                      <Text style={estilos.cardTelefone}>{item.telefoneProfissional}</Text>
                    )}
                  </View>
                </View>
              )}

              <View style={estilos.cardDivisor} />

              {/* Tipo + Descrição */}
              <Text style={estilos.cardTipo}>{item.tipo}</Text>
              {item.descricao && (
                <Text style={estilos.cardDescricao}>{item.descricao}</Text>
              )}

              {/* Garantia + Km */}
              {(item.garantia || item.kilometragem) && (
                <View style={estilos.cardMetaRow}>
                  <Text style={estilos.cardMeta}>
                    {item.garantia ? `Garantia: ${item.garantia}` : ''}
                  </Text>
                  <Text style={estilos.cardMeta}>
                    {item.kilometragem ? `Km: ${item.kilometragem}` : ''}
                  </Text>
                </View>
              )}

              {/* Valor */}
              {item.custo !== undefined && (
                <Text style={estilos.cardValor}>
                  R$ {item.custo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              )}

              {/* Botão fotos */}
              {(() => {
                const reg = fotosMap.get(item.id)
                const possuiFotos = reg && temFotos(reg)
                return (
                  <TouchableOpacity
                    style={[estilos.btnFotos, !possuiFotos && estilos.btnFotosSemFotos]}
                    onPress={() => { setViewerId(item.id); setViewerVeiculoId(item.veiculoId) }}
                  >
                    <Ionicons name="camera-outline" size={13} color={possuiFotos ? CORES.branco : CORES.secundaria} />
                    <Text style={[estilos.btnFotosTexto, !possuiFotos && estilos.btnFotosTextoSemFotos]}>
                      {possuiFotos ? 'Ver Fotos' : 'Adicionar Fotos'}
                    </Text>
                  </TouchableOpacity>
                )
              })()}

              <Ionicons name="chevron-forward" size={14} color={CORES.cinzaTexto} style={estilos.cardChevron} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <BottomNavBar ativa="servicos" navigation={navigation} />

      {viewerId && (
        <FotosViewerModal
          visivel={!!viewerId}
          registroId={viewerId}
          veiculoId={viewerVeiculoId}
          tipoRegistro="servico"
          onFechar={() => { setViewerId(null); carregarDados() }}
        />
      )}
    </SafeAreaView>
  )
}

const estilos = StyleSheet.create({
  safe: { flex: 1, backgroundColor: CORES.primaria },

  // Header
  header: {
    backgroundColor: CORES.primaria,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ESPACOS.md,
    paddingVertical: ESPACOS.sm,
  },
  headerEsquerda:  { flexDirection: 'row', alignItems: 'center' },
  headerOla:       { color: CORES.cinzaTexto, fontSize: FONTES.pequena },
  headerNome:      { color: CORES.branco, fontSize: FONTES.normal, fontWeight: '700' },
  headerAcoes:     { flexDirection: 'row', gap: ESPACOS.sm },
  btnAcao:         { alignItems: 'center', gap: 2 },
  btnCirculo:      { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  btnLabel:        { color: CORES.branco, fontSize: 9, fontWeight: '600' },

  // Título
  tituloRow: {
    backgroundColor: CORES.branco,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ESPACOS.md,
    paddingVertical: ESPACOS.sm,
  },
  tituloEsquerda:  { flexDirection: 'row', alignItems: 'center', gap: ESPACOS.xs },
  tituloTexto:     { fontSize: FONTES.subtitulo, fontWeight: '700', color: CORES.pretinho },
  veiculoLabel:    { fontSize: FONTES.pequena, color: CORES.secundaria, fontWeight: '600', flex: 1, textAlign: 'right', marginLeft: ESPACOS.sm },
  divisoria:       { height: 2, backgroundColor: CORES.secundaria },

  // Estado vazio / carregando
  centralizador:     { flex: 1, backgroundColor: CORES.cinzaClaro, justifyContent: 'center', alignItems: 'center', gap: ESPACOS.md, paddingHorizontal: ESPACOS.xl },
  semDadosTitulo:    { fontSize: FONTES.media, color: CORES.pretinho, fontWeight: '700', textAlign: 'center' },
  semDadosSub:       { fontSize: FONTES.pequena, color: CORES.cinzaTexto, textAlign: 'center', lineHeight: 18 },
  semDados:          { fontSize: FONTES.normal, color: CORES.cinzaTexto, fontWeight: '500' },
  btnAdicionar:      { backgroundColor: CORES.secundaria, borderRadius: 20, paddingHorizontal: ESPACOS.lg, paddingVertical: ESPACOS.sm },
  btnAdicionarTexto: { color: CORES.branco, fontSize: FONTES.normal, fontWeight: '700' },

  // Scroll
  scroll:        { flex: 1, backgroundColor: CORES.cinzaClaro },
  scrollConteudo: { padding: ESPACOS.md, paddingBottom: ESPACOS.xxl },

  // Cards
  card: {
    backgroundColor: CORES.branco,
    borderRadius: 12,
    padding: ESPACOS.md,
    marginBottom: ESPACOS.sm,
    borderWidth: 1.5,
    borderColor: CORES.borda,
    shadowColor: CORES.sombra,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardAtivo:        { borderColor: CORES.secundaria, shadowOpacity: 0.15 },
  cardTopRow:       { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  cardData:         { fontSize: FONTES.pequena, color: CORES.cinzaTexto, fontWeight: '600' },
  cardEstabelecimento: { fontSize: FONTES.pequena, color: CORES.pretinho, fontWeight: '600' },
  cardProfissional: { fontSize: FONTES.pequena, color: CORES.texto },
  cardTelefone:     { fontSize: 11, color: CORES.cinzaTexto },
  cardDivisor:      { height: 1, backgroundColor: CORES.borda, marginVertical: ESPACOS.sm },
  cardTipo:         { fontSize: FONTES.normal, fontWeight: '700', color: CORES.pretinho, marginBottom: 2 },
  cardDescricao:    { fontSize: FONTES.pequena, color: CORES.cinzaTexto, marginBottom: ESPACOS.xs },
  cardMetaRow:      { flexDirection: 'row', justifyContent: 'space-between', marginTop: ESPACOS.xs },
  cardMeta:         { fontSize: FONTES.pequena, color: CORES.texto },
  cardValor:        { fontSize: FONTES.media, fontWeight: '700', color: CORES.secundariaEscuro, textAlign: 'right', marginTop: ESPACOS.xs },
  cardChevron:      { position: 'absolute', right: ESPACOS.sm, top: ESPACOS.md },
  btnFotos: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: CORES.secundaria,
    borderRadius: 10,
    paddingHorizontal: ESPACOS.sm,
    paddingVertical: 4,
    marginTop: ESPACOS.sm,
  },
  btnFotosSemFotos: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: CORES.secundaria,
    borderStyle: 'dashed',
  },
  btnFotosTexto: {
    color: CORES.branco,
    fontSize: FONTES.pequena,
    fontWeight: '600',
  },
  btnFotosTextoSemFotos: {
    color: CORES.secundaria,
  },
})
