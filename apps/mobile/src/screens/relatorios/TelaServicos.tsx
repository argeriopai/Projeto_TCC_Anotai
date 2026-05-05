import React, { useState, useCallback } from 'react'
import {
  View, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native'
import { AppText } from '../../components/AppText'
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
import { AvatarCircular } from '../../components/AvatarCircular'
import { listarTodasFotos, FotoRegistro, temFotos } from '../../utils/fotosStorage'

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
          <AvatarCircular uri={proprietario?.fotoPerfil} size={34} />
          <View style={{ marginLeft: ESPACOS.xs }}>
            <AppText style={estilos.headerOla}>Olá,</AppText>
            <AppText style={estilos.headerNome}>{apelido}</AppText>
          </View>
        </View>
        <View style={estilos.headerAcoes}>
          <TouchableOpacity
            style={estilos.btnAcao}
            onPress={handleEditar}
            accessible={true}
            accessibilityLabel="Editar registro selecionado"
            accessibilityRole="button"
          >
            <View style={[estilos.btnCirculo, { backgroundColor: CORES.secundaria }]}>
              <Ionicons name="pencil" size={15} color={CORES.branco} />
            </View>
            <AppText style={estilos.btnLabel}>Editar</AppText>
          </TouchableOpacity>
          <TouchableOpacity
            style={estilos.btnAcao}
            onPress={handleNovo}
            accessible={true}
            accessibilityLabel="Adicionar novo registro"
            accessibilityRole="button"
          >
            <View style={[estilos.btnCirculo, { backgroundColor: CORES.secundaria }]}>
              <Ionicons name="add" size={20} color={CORES.branco} />
            </View>
            <AppText style={estilos.btnLabel}>Novo</AppText>
          </TouchableOpacity>
          <TouchableOpacity
            style={estilos.btnAcao}
            onPress={handleExcluir}
            accessible={true}
            accessibilityLabel="Excluir registro selecionado"
            accessibilityRole="button"
          >
            <View style={[estilos.btnCirculo, { backgroundColor: CORES.erro }]}>
              <Ionicons name="trash-outline" size={15} color={CORES.branco} />
            </View>
            <AppText style={estilos.btnLabel}>Excluir</AppText>
          </TouchableOpacity>
        </View>
      </View>

      {/* TÍTULO */}
      <View style={estilos.tituloRow}>
        <View style={estilos.tituloEsquerda}>
          <Ionicons name="construct-outline" size={24} color={CORES.secundaria} />
          <AppText style={estilos.tituloTexto}>Serviços</AppText>
        </View>
        {veiculoLabel && (
          <AppText style={estilos.veiculoLabel} numberOfLines={1}>{veiculoLabel}</AppText>
        )}
      </View>
      <View style={estilos.divisoria} />

      {/* CONTEÚDO */}
      {!veiculoAtivo ? (
        <View style={estilos.centralizador}>
          <Ionicons name="car-outline" size={56} color={CORES.cinzaTexto} />
          <AppText style={estilos.semDadosTitulo}>Nenhum veículo selecionado</AppText>
          <AppText style={estilos.semDadosSub}>
            Acesse Veículo e selecione um veículo para visualizar seus registros
          </AppText>
          <TouchableOpacity style={estilos.btnAdicionar} onPress={() => navigation.navigate('Veiculos')}>
            <AppText style={estilos.btnAdicionarTexto}>Selecionar Veículo</AppText>
          </TouchableOpacity>
        </View>
      ) : carregando ? (
        <View style={estilos.centralizador}>
          <ActivityIndicator size="large" color={CORES.secundaria} />
        </View>
      ) : lista.length === 0 ? (
        <View style={estilos.centralizador}>
          <Ionicons name="construct-outline" size={52} color={CORES.cinzaTexto} />
          <AppText style={estilos.semDados}>Nenhum serviço encontrado</AppText>
          <TouchableOpacity style={estilos.btnAdicionar} onPress={handleNovo}>
            <AppText style={estilos.btnAdicionarTexto}>Adicionar</AppText>
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
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Serviço ${item.tipo}, ${item.data}${item.custo !== undefined ? `, R$ ${item.custo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}`}
              accessibilityHint="Toque para selecionar o registro"
            >
              {/* Data + Oficina */}
              <View style={estilos.cardTopRow}>
                <AppText style={estilos.cardData}>{item.data}</AppText>
                <View style={{ alignItems: 'flex-end', flex: 1, marginLeft: ESPACOS.sm }}>
                  {item.estabelecimento && (
                    <AppText style={estilos.cardEstabelecimento} numberOfLines={1}>
                      {item.estabelecimento}
                    </AppText>
                  )}
                  {item.telefoneEstabelecimento && (
                    <AppText style={estilos.cardTelefone}>{item.telefoneEstabelecimento}</AppText>
                  )}
                </View>
              </View>

              {/* Profissional */}
              {(item.profissional || item.telefoneProfissional) && (
                <View style={[estilos.cardTopRow, { marginTop: 2 }]}>
                  <View style={{ flex: 1 }} />
                  <View style={{ alignItems: 'flex-end' }}>
                    {item.profissional && (
                      <AppText style={estilos.cardProfissional}>{item.profissional}</AppText>
                    )}
                    {item.telefoneProfissional && (
                      <AppText style={estilos.cardTelefone}>{item.telefoneProfissional}</AppText>
                    )}
                  </View>
                </View>
              )}

              <View style={estilos.cardDivisor} />

              {/* Tipo + Descrição */}
              <AppText style={estilos.cardTipo}>{item.tipo}</AppText>
              {item.descricao && (
                <AppText style={estilos.cardDescricao}>{item.descricao}</AppText>
              )}

              {/* Garantia + Km */}
              {(item.garantia || item.kilometragem) && (
                <View style={estilos.cardMetaRow}>
                  <AppText style={estilos.cardMeta}>
                    {item.garantia ? `Garantia: ${item.garantia}` : ''}
                  </AppText>
                  <AppText style={estilos.cardMeta}>
                    {item.kilometragem ? `Km: ${item.kilometragem}` : ''}
                  </AppText>
                </View>
              )}

              {/* Valor */}
              {item.custo !== undefined && (
                <AppText style={estilos.cardValor}>
                  R$ {item.custo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </AppText>
              )}

              {/* Botão fotos — só exibido quando há fotos */}
              {fotosMap.get(item.id) && temFotos(fotosMap.get(item.id)!) && (
                <TouchableOpacity
                  style={estilos.btnFotos}
                  onPress={() => { setViewerId(item.id); setViewerVeiculoId(item.veiculoId) }}
                >
                  <Ionicons name="camera-outline" size={13} color={CORES.branco} />
                  <AppText style={estilos.btnFotosTexto}>Ver Fotos</AppText>
                </TouchableOpacity>
              )}

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
  semDadosSub:       { fontSize: FONTES.pequena, color: CORES.textoSecundario, textAlign: 'center', lineHeight: 18 },
  semDados:          { fontSize: FONTES.normal, color: CORES.textoSecundario, fontWeight: '500' },
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
  cardData:         { fontSize: FONTES.pequena, color: CORES.textoSecundario, fontWeight: '600' },
  cardEstabelecimento: { fontSize: FONTES.pequena, color: CORES.pretinho, fontWeight: '600' },
  cardProfissional: { fontSize: FONTES.pequena, color: CORES.texto },
  cardTelefone:     { fontSize: 11, color: CORES.textoSecundario },
  cardDivisor:      { height: 1, backgroundColor: CORES.borda, marginVertical: ESPACOS.sm },
  cardTipo:         { fontSize: FONTES.normal, fontWeight: '700', color: CORES.pretinho, marginBottom: 2 },
  cardDescricao:    { fontSize: FONTES.pequena, color: CORES.textoSecundario, marginBottom: ESPACOS.xs },
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
  btnFotosTexto: {
    color: CORES.branco,
    fontSize: FONTES.pequena,
    fontWeight: '600',
  },
})
