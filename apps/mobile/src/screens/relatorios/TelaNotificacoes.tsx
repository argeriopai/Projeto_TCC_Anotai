import React, { useState, useCallback, useEffect } from 'react'
import {
  View, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, Switch,
} from 'react-native'
import { AppText } from '../../components/AppText'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import { useAuth } from '../../contexts/AuthContext'
import { useAuthGuard } from '../../hooks/useAuthGuard'
import { useVeiculo } from '../../contexts/VeiculoContext'
import { listarNotificacoesApi, excluirNotificacaoApi, atualizarNotificacaoApi, Notificacao } from '../../services/api'
import { cancelarNotificacao, buscarOsNotifId, removerMapeamento } from '../../services/notificacoes'
import { CORES, FONTES, ESPACOS } from '../../constants/cores'
import { BottomNavBar } from '../../components/BottomNavBar'
import { AvatarCircular } from '../../components/AvatarCircular'

interface Props { navigation: any; route?: any }

const TIPOS_PERIODICOS = ['Revisão periódica', 'Troca de óleo', 'Vencimento do IPVA', 'Vencimento do seguro', 'Licenciamento', 'Pneus']

function categoriaTipo(tipo: string): string {
  return TIPOS_PERIODICOS.includes(tipo) ? 'Periódica' : 'Preventiva'
}

export function TelaNotificacoes({ navigation, route }: Props) {
  const { proprietario } = useAuth()
  const { requireAuth } = useAuthGuard()
  const { veiculoAtivo } = useVeiculo()
  const apelido = proprietario?.apelido ?? proprietario?.nome?.split(' ')[0] ?? 'Usuário'

  const [lista,           setLista]           = useState<Notificacao[]>([])
  const [carregando,      setCarregando]      = useState(true)
  const [cardSelecionado, setCardSelecionado] = useState<string | null>(null)

  useFocusEffect(
    useCallback(() => {
      carregarDados()
      setCardSelecionado(null)
    }, [veiculoAtivo?.id])
  )

  useEffect(() => {
    const id: string | undefined = route?.params?.notificacaoDestaque
    if (id) setCardSelecionado(id)
  }, [route?.params?.notificacaoDestaque])

  async function carregarDados() {
    setCarregando(true)
    try {
      const res = await listarNotificacoesApi()
      const dados = veiculoAtivo
        ? res.data.filter(n => !n.veiculoId || n.veiculoId === veiculoAtivo.id)
        : res.data
      setLista([...dados].sort((a, b) => b.data.localeCompare(a.data)))
    } catch {
      setLista([])
    } finally {
      setCarregando(false)
    }
  }

  async function handleToggle(id: string, ativo: boolean) {
    try {
      await atualizarNotificacaoApi(id, { ativo })
      setLista(prev => prev.map(n => n.id === id ? { ...n, ativo } : n))
    } catch {
      Alert.alert('Erro', 'Não foi possível atualizar a revisão.')
    }
  }

  function handleEditar() {
    if (!cardSelecionado) {
      Alert.alert('Atenção', 'Selecione uma revisão para editar.')
      return
    }
    requireAuth(() => {
      const item = lista.find(n => n.id === cardSelecionado)
      if (item) navigation.navigate('RegistrarRevisao', { registroParaEditar: item })
    })
  }

  function handleNovo() {
    requireAuth(() => navigation.navigate('RegistrarRevisao'))
  }

  function handleExcluir() {
    if (!cardSelecionado) {
      Alert.alert('Atenção', 'Selecione uma revisão para excluir.')
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
                await excluirNotificacaoApi(cardSelecionado)
                const osId = await buscarOsNotifId(cardSelecionado)
                if (osId) await cancelarNotificacao(osId)
                await removerMapeamento(cardSelecionado)
                setCardSelecionado(null)
                carregarDados()
              } catch {
                Alert.alert('Erro', 'Não foi possível excluir a revisão.')
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
          <TouchableOpacity style={estilos.btnAcao} onPress={handleEditar} accessible accessibilityLabel="Editar revisão selecionada" accessibilityRole="button">
            <View style={[estilos.btnCirculo, { backgroundColor: CORES.secundaria }]}>
              <Ionicons name="pencil" size={15} color={CORES.branco} />
            </View>
            <AppText style={estilos.btnLabel}>Editar</AppText>
          </TouchableOpacity>
          <TouchableOpacity style={estilos.btnAcao} onPress={handleNovo} accessible accessibilityLabel="Nova revisão" accessibilityRole="button">
            <View style={[estilos.btnCirculo, { backgroundColor: CORES.secundaria }]}>
              <Ionicons name="add" size={20} color={CORES.branco} />
            </View>
            <AppText style={estilos.btnLabel}>Novo</AppText>
          </TouchableOpacity>
          <TouchableOpacity style={estilos.btnAcao} onPress={handleExcluir} accessible accessibilityLabel="Excluir revisão selecionada" accessibilityRole="button">
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
          <Ionicons name="calendar-outline" size={24} color={CORES.secundaria} />
          <AppText style={estilos.tituloTexto}>Revisões</AppText>
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
          <AppText style={estilos.semDadosTitulo}>Ative um veículo para ver as revisões</AppText>
          <AppText style={estilos.semDadosSub}>Vá em Início e toque no seu veículo para ativá-lo</AppText>
        </View>
      ) : carregando ? (
        <View style={estilos.centralizador}>
          <ActivityIndicator size="large" color={CORES.secundaria} />
        </View>
      ) : lista.length === 0 ? (
        <View style={estilos.centralizador}>
          <Ionicons name="notifications-off-outline" size={52} color={CORES.cinzaTexto} />
          <AppText style={estilos.semDados}>Nenhuma revisão encontrada</AppText>
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
          {lista.map(item => {
            const ativo = item.ativo !== false
            return (
              <TouchableOpacity
                key={item.id}
                style={[estilos.card, cardSelecionado === item.id && estilos.cardAtivo]}
                onPress={() => setCardSelecionado(p => p === item.id ? null : item.id)}
                activeOpacity={0.85}
                accessible
                accessibilityLabel={`Revisão ${item.tipo}, ${item.data}${item.kilometragem ? `, Km ${item.kilometragem}` : ''}. ${item.ativo !== false ? 'Ativa' : 'Inativa'}`}
                accessibilityRole="button"
                accessibilityState={{ selected: cardSelecionado === item.id }}
              >
                {/* Linha principal: data + título + toggle */}
                <View style={estilos.cardTopRow}>
                  <View style={{ flex: 1 }}>
                    <AppText style={estilos.cardData}>{item.data}</AppText>
                    <AppText style={estilos.cardTitulo} numberOfLines={1}>{item.tipo}</AppText>
                  </View>
                  <Switch
                    value={ativo}
                    onValueChange={val => requireAuth(() => handleToggle(item.id, val))}
                    trackColor={{ false: CORES.cinzaMedio, true: CORES.secundaria }}
                    thumbColor={CORES.branco}
                  />
                </View>

                {/* Categoria + Km */}
                <View style={estilos.cardTagRow}>
                  <View style={[estilos.cardTag, { backgroundColor: ativo ? '#E8FAF0' : CORES.cinzaMedio }]}>
                    <AppText style={[estilos.cardTagTexto, { color: ativo ? CORES.secundariaEscuro : CORES.cinzaTexto }]}>
                      {categoriaTipo(item.tipo)}
                    </AppText>
                  </View>
                  {item.kilometragem && (
                    <AppText style={estilos.cardMeta}>Km {item.kilometragem}</AppText>
                  )}
                </View>

                <View style={estilos.cardDivisor} />

                {/* Mensagem */}
                <AppText style={estilos.cardMensagem}>{item.mensagem}</AppText>

                <Ionicons name="chevron-forward" size={14} color={CORES.cinzaTexto} style={estilos.cardChevron} />
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      )}

      <BottomNavBar ativa="revisoes" navigation={navigation} />
    </SafeAreaView>
  )
}

const estilos = StyleSheet.create({
  safe: { flex: 1, backgroundColor: CORES.primaria },

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

  centralizador:     { flex: 1, backgroundColor: CORES.cinzaClaro, justifyContent: 'center', alignItems: 'center', gap: ESPACOS.md, paddingHorizontal: ESPACOS.xl },
  semDadosTitulo:    { fontSize: FONTES.media, color: CORES.pretinho, fontWeight: '700', textAlign: 'center' },
  semDadosSub:       { fontSize: FONTES.pequena, color: CORES.textoSecundario, textAlign: 'center', lineHeight: 18 },
  semDados:          { fontSize: FONTES.normal, color: CORES.textoSecundario, fontWeight: '500' },
  btnAdicionar:      { backgroundColor: CORES.secundaria, borderRadius: 20, paddingHorizontal: ESPACOS.lg, paddingVertical: ESPACOS.sm },
  btnAdicionarTexto: { color: CORES.branco, fontSize: FONTES.normal, fontWeight: '700' },

  scroll:        { flex: 1, backgroundColor: CORES.cinzaClaro },
  scrollConteudo: { padding: ESPACOS.md, paddingBottom: ESPACOS.xxl },

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
  cardAtivo:    { borderColor: CORES.secundaria, shadowOpacity: 0.15 },
  cardTopRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardData:     { fontSize: FONTES.pequena, color: CORES.textoSecundario },
  cardTitulo:   { fontSize: FONTES.normal, fontWeight: '700', color: CORES.pretinho, marginTop: 2 },
  cardTagRow:   { flexDirection: 'row', alignItems: 'center', gap: ESPACOS.sm, marginTop: ESPACOS.xs },
  cardTag:      { borderRadius: 10, paddingHorizontal: ESPACOS.sm, paddingVertical: 2 },
  cardTagTexto: { fontSize: FONTES.pequena, fontWeight: '600' },
  cardMeta:     { fontSize: FONTES.pequena, color: CORES.texto },
  cardDivisor:  { height: 1, backgroundColor: CORES.borda, marginVertical: ESPACOS.sm },
  cardMensagem: { fontSize: FONTES.pequena, color: CORES.textoSecundario, lineHeight: 18 },
  cardChevron:  { position: 'absolute', right: ESPACOS.sm, top: ESPACOS.md },
})
