import React, { useState, useCallback, useEffect } from 'react'
import {
  View, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Alert,
} from 'react-native'
import { AppText } from '../components/AppText'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import * as Notifications from 'expo-notifications'
import { cancelarNotificacao, listarNotificacoesAgendadas, removerMapeamento } from '../services/notificacoes'
import { listarNotificacoesApi } from '../services/api'
import { CORES, FONTES, ESPACOS } from '../constants/cores'
import { useAuth } from '../contexts/AuthContext'

interface Props { navigation: any }

function formatarDataHora(isoString: string): string {
  const d = new Date(isoString)
  const dia  = String(d.getDate()).padStart(2, '0')
  const mes  = String(d.getMonth() + 1).padStart(2, '0')
  const ano  = d.getFullYear()
  return `${dia}/${mes}/${ano} às 08:00`
}

export function TelaNotificacoesPush({ navigation }: Props) {
  const { estaLogado } = useAuth()
  const [lista,      setLista]      = useState<Notifications.NotificationRequest[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    if (!estaLogado) setLista([])
  }, [estaLogado])

  useFocusEffect(
    useCallback(() => {
      carregarLista()
    }, [estaLogado])
  )

  async function carregarLista() {
    if (!estaLogado) { setLista([]); setCarregando(false); return }
    setCarregando(true)
    try {
      const todas = await listarNotificacoesAgendadas()
      const agora = new Date()

      const validas: typeof todas = []
      for (const n of todas) {
        const trigger = n.trigger as any
        const dataDisparo: Date | null =
          trigger?.value       ? new Date(trigger.value * 1000)
          : trigger?.seconds   ? new Date(trigger.seconds * 1000)
          : trigger?.dateComponents ? null
          : trigger?.date      ? new Date(trigger.date)
          : null

        if (dataDisparo && dataDisparo <= agora) {
          try {
            await cancelarNotificacao(n.identifier)
            await removerMapeamento(n.identifier)
          } catch { /* ignora erros silenciosos */ }
        } else {
          validas.push(n)
        }
      }

      validas.sort((a, b) => {
        const dA = (a.content.data as any)?.dataAgendada ?? ''
        const dB = (b.content.data as any)?.dataAgendada ?? ''
        return dA.localeCompare(dB)
      })
      setLista(validas)
    } catch {
      setLista([])
    } finally {
      setCarregando(false)
    }
  }

  function handleCancelar(id: string, titulo: string) {
    Alert.alert(
      'Cancelar notificação',
      `Deseja cancelar o lembrete "${titulo}"?`,
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim, cancelar',
          style: 'destructive',
          onPress: async () => {
            await cancelarNotificacao(id)
            setLista(prev => prev.filter(n => n.identifier !== id))
          },
        },
      ]
    )
  }

  async function handleAbrirRevisao(item: Notifications.NotificationRequest) {
    const notificacaoId: string | undefined = (item.content.data as any)?.notificacaoId
    if (!notificacaoId) {
      Alert.alert('Registro não encontrado', 'Este registro foi excluído e não está mais disponível.')
      return
    }
    try {
      const res = await listarNotificacoesApi()
      const encontrada = res.data.find(n => n.id === notificacaoId)
      if (encontrada) {
        navigation.navigate('RegistrarRevisao', { registroParaEditar: encontrada })
      } else {
        await cancelarNotificacao(item.identifier)
        await removerMapeamento(notificacaoId)
        setLista(prev => prev.filter(n => n.identifier !== item.identifier))
        Alert.alert('Registro não encontrado', 'Este registro foi excluído e não está mais disponível.')
      }
    } catch {
      Alert.alert('Registro não encontrado', 'Este registro foi excluído e não está mais disponível.')
    }
  }

  function handleCancelarTodos() {
    if (lista.length === 0) return
    Alert.alert(
      'Cancelar todos',
      'Deseja cancelar todos os lembretes agendados?',
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Cancelar todos',
          style: 'destructive',
          onPress: async () => {
            await Notifications.cancelAllScheduledNotificationsAsync()
            setLista([])
          },
        },
      ]
    )
  }

  return (
    <SafeAreaView style={es.safe} edges={['top']}>

      {/* HEADER */}
      <View style={es.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessible
          accessibilityLabel="Voltar"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color={CORES.branco} />
        </TouchableOpacity>
        {lista.length > 0 && (
          <TouchableOpacity
            onPress={handleCancelarTodos}
            accessible
            accessibilityLabel="Cancelar todos os lembretes"
            accessibilityRole="button"
          >
            <AppText style={es.btnCancelarTodos}>Cancelar todos</AppText>
          </TouchableOpacity>
        )}
      </View>

      {/* TÍTULO */}
      <View style={es.tituloRow}>
        <Ionicons name="notifications-outline" size={24} color={CORES.secundaria} />
        <AppText style={es.tituloTexto}>Lembretes Agendados</AppText>
      </View>
      <View style={es.divisoria} />

      {/* CONTEÚDO */}
      {carregando ? (
        <View style={es.centralizador}>
          <ActivityIndicator size="large" color={CORES.secundaria} />
        </View>
      ) : lista.length === 0 ? (
        <View style={es.centralizador}>
          <Ionicons name="notifications-off-outline" size={56} color={CORES.cinzaTexto} />
          <AppText style={es.semDadosTitulo}>Nenhum lembrete agendado</AppText>
          <AppText style={es.semDadosSub}>
            Ao registrar uma revisão com data futura, um lembrete será agendado automaticamente.
          </AppText>
          <TouchableOpacity style={es.btnAdicionar} onPress={() => navigation.navigate('RegistrarRevisao')}>
            <AppText style={es.btnAdicionarTexto}>Registrar Revisão</AppText>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={es.scroll} contentContainerStyle={es.scrollConteudo} showsVerticalScrollIndicator={false}>
          <AppText style={es.contador}>{lista.length} lembrete{lista.length !== 1 ? 's' : ''} agendado{lista.length !== 1 ? 's' : ''}</AppText>
          {lista.map(item => {
            const titulo = item.content.title?.replace('🔔 ', '') ?? 'Lembrete'
            const corpo  = item.content.body ?? ''
            const dataStr = (item.content.data as any)?.dataAgendada
            return (
              <TouchableOpacity
                key={item.identifier}
                style={es.card}
                onPress={() => handleAbrirRevisao(item)}
                activeOpacity={0.85}
                accessible
                accessibilityLabel={`Abrir revisão: ${titulo}`}
                accessibilityRole="button"
              >
                <View style={es.cardIcone}>
                  <Ionicons name="notifications" size={22} color={CORES.secundaria} />
                </View>
                <View style={es.cardConteudo}>
                  <AppText style={es.cardTitulo} numberOfLines={1}>{titulo}</AppText>
                  {!!corpo && (
                    <AppText style={es.cardCorpo} numberOfLines={2}>{corpo}</AppText>
                  )}
                  {!!dataStr && (
                    <View style={es.cardDataRow}>
                      <Ionicons name="calendar-outline" size={13} color={CORES.textoSecundario} />
                      <AppText style={es.cardData}>{formatarDataHora(dataStr)}</AppText>
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  style={es.btnExcluir}
                  onPress={() => handleCancelar(item.identifier, titulo)}
                  accessible
                  accessibilityLabel={`Cancelar lembrete ${titulo}`}
                  accessibilityRole="button"
                >
                  <Ionicons name="trash-outline" size={18} color={CORES.erro} />
                </TouchableOpacity>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

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
  btnCancelarTodos: {
    color: CORES.erro,
    fontSize: FONTES.pequena,
    fontWeight: '600',
  },

  tituloRow: {
    backgroundColor: CORES.branco,
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACOS.xs,
    paddingHorizontal: ESPACOS.md,
    paddingVertical: ESPACOS.sm,
  },
  tituloTexto: { fontSize: FONTES.subtitulo, fontWeight: '700', color: CORES.pretinho },
  divisoria:   { height: 2, backgroundColor: CORES.secundaria },

  centralizador: {
    flex: 1,
    backgroundColor: CORES.cinzaClaro,
    justifyContent: 'center',
    alignItems: 'center',
    gap: ESPACOS.md,
    paddingHorizontal: ESPACOS.xl,
  },
  semDadosTitulo: { fontSize: FONTES.media, color: CORES.pretinho, fontWeight: '700', textAlign: 'center' },
  semDadosSub:    { fontSize: FONTES.pequena, color: CORES.textoSecundario, textAlign: 'center', lineHeight: 18 },
  btnAdicionar:      { backgroundColor: CORES.secundaria, borderRadius: 20, paddingHorizontal: ESPACOS.lg, paddingVertical: ESPACOS.sm },
  btnAdicionarTexto: { color: CORES.branco, fontSize: FONTES.normal, fontWeight: '700' },

  scroll:        { flex: 1, backgroundColor: CORES.cinzaClaro },
  scrollConteudo: { padding: ESPACOS.md, paddingBottom: ESPACOS.xxl },

  contador: {
    fontSize: FONTES.pequena,
    color: CORES.textoSecundario,
    fontWeight: '600',
    marginBottom: ESPACOS.sm,
  },

  card: {
    backgroundColor: CORES.branco,
    borderRadius: 12,
    padding: ESPACOS.md,
    marginBottom: ESPACOS.sm,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: CORES.borda,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardIcone: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8FAF0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ESPACOS.sm,
  },
  cardConteudo: { flex: 1 },
  cardTitulo:   { fontSize: FONTES.normal, fontWeight: '700', color: CORES.pretinho },
  cardCorpo:    { fontSize: FONTES.pequena, color: CORES.textoSecundario, marginTop: 2, lineHeight: 17 },
  cardDataRow:  { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: ESPACOS.xs },
  cardData:     { fontSize: FONTES.pequena, color: CORES.textoSecundario },

  btnExcluir: {
    padding: ESPACOS.sm,
    marginLeft: ESPACOS.xs,
  },
})
