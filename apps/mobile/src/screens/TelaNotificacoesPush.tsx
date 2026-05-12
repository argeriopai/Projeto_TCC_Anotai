import React, { useState, useCallback } from 'react'
import {
  View, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator,
} from 'react-native'
import { AppText } from '../components/AppText'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import * as Notifications from 'expo-notifications'
import { listarNotificacoesAgendadas } from '../services/notificacoes'
import { CORES, FONTES, ESPACOS } from '../constants/cores'

interface Props { navigation: any }

function formatarDataHora(isoString: string): string {
  const d = new Date(isoString)
  const dia  = String(d.getDate()).padStart(2, '0')
  const mes  = String(d.getMonth() + 1).padStart(2, '0')
  const ano  = d.getFullYear()
  return `${dia}/${mes}/${ano} às 08:00`
}

export function TelaNotificacoesPush({ navigation }: Props) {
  const [lista,      setLista]      = useState<Notifications.NotificationRequest[]>([])
  const [carregando, setCarregando] = useState(true)

  useFocusEffect(
    useCallback(() => {
      carregarLista()
    }, [])
  )

  async function carregarLista() {
    setCarregando(true)
    try {
      const agendadas = await listarNotificacoesAgendadas()
      agendadas.sort((a, b) => {
        const dA = (a.content.data as any)?.dataAgendada ?? ''
        const dB = (b.content.data as any)?.dataAgendada ?? ''
        return dA.localeCompare(dB)
      })
      setLista(agendadas)
    } catch {
      setLista([])
    } finally {
      setCarregando(false)
    }
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
            const titulo  = item.content.title?.replace('🔔 ', '') ?? 'Lembrete'
            const corpo   = item.content.body ?? ''
            const dataStr = (item.content.data as any)?.dataAgendada
            return (
              <TouchableOpacity
                key={item.identifier}
                style={es.card}
                onPress={() => navigation.navigate('Revisoes')}
                activeOpacity={0.75}
                accessible
                accessibilityLabel={`Lembrete: ${titulo}. Toque para ver as revisões.`}
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
                <Ionicons name="chevron-forward" size={18} color={CORES.cinzaTexto} />
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

  scroll:         { flex: 1, backgroundColor: CORES.cinzaClaro },
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
})
