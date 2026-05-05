import React, { useState, useCallback } from 'react'
import {
  View, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator,
} from 'react-native'
import { AppText } from '../components/AppText'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import { listarServicosApi, listarPecasApi, Servico, Peca } from '../services/api'
import { CORES, FONTES, ESPACOS } from '../constants/cores'

interface Props { navigation: any }

type Filtro = 'mensal' | 'semestral' | 'anual'

type Lancamento = {
  id: string
  tipo: 'servico' | 'peca'
  descricao: string
  data: string
  valor: number
}

function formatarValor(val: number): string {
  return 'R$ ' + val.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

function parseDateStr(str: string): Date {
  const [d, m, y] = str.split('/').map(Number)
  return new Date(y, m - 1, d)
}

function diasDoPeriodo(filtro: Filtro): number {
  if (filtro === 'mensal')    return 30
  if (filtro === 'semestral') return 180
  return 365
}

function dentroDoperiodo(dataStr: string, dias: number): boolean {
  const data    = parseDateStr(dataStr)
  const corte   = new Date()
  corte.setDate(corte.getDate() - dias)
  return data >= corte
}

function valorPeca(p: Peca): number {
  if (p.custo != null) return p.custo
  if (p.valorUnitario != null && p.quantidade != null) return p.valorUnitario * p.quantidade
  if (p.valorUnitario != null) return p.valorUnitario
  return 0
}

export function TelaRelatorio({ navigation }: Props) {
  const [filtro,     setFiltro]     = useState<Filtro>('mensal')
  const [servicos,   setServicos]   = useState<Servico[]>([])
  const [pecas,      setPecas]      = useState<Peca[]>([])
  const [carregando, setCarregando] = useState(true)

  useFocusEffect(
    useCallback(() => {
      async function carregar() {
        setCarregando(true)
        try {
          const [resS, resP] = await Promise.all([listarServicosApi(), listarPecasApi()])
          setServicos(resS.data)
          setPecas(resP.data)
        } catch {
          setServicos([])
          setPecas([])
        } finally {
          setCarregando(false)
        }
      }
      carregar()
    }, [])
  )

  const dias = diasDoPeriodo(filtro)

  const servicosFiltrados = servicos.filter(s => dentroDoperiodo(s.data, dias))
  const pecasFiltradas    = pecas.filter(p => dentroDoperiodo(p.data, dias))

  const totalServicos = servicosFiltrados.reduce((acc, s) => acc + (s.custo ?? 0), 0)
  const totalPecas    = pecasFiltradas.reduce((acc, p) => acc + valorPeca(p), 0)
  const totalGeral    = totalServicos + totalPecas

  const lancamentos: Lancamento[] = [
    ...servicosFiltrados.map(s => ({
      id:       s.id,
      tipo:     'servico' as const,
      descricao: s.tipo + (s.descricao ? ` — ${s.descricao}` : ''),
      data:     s.data,
      valor:    s.custo ?? 0,
    })),
    ...pecasFiltradas.map(p => ({
      id:       p.id,
      tipo:     'peca' as const,
      descricao: p.nome + (p.descricao ? ` — ${p.descricao}` : ''),
      data:     p.data,
      valor:    valorPeca(p),
    })),
  ].sort((a, b) => {
    const da = parseDateStr(a.data)
    const db = parseDateStr(b.data)
    return db.getTime() - da.getTime()
  })

  const filtros: { key: Filtro; label: string }[] = [
    { key: 'mensal',    label: 'Mensal'    },
    { key: 'semestral', label: 'Semestral' },
    { key: 'anual',     label: 'Anual'     },
  ]

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
        <AppText style={es.headerTitulo}>Relatório de Despesas</AppText>
        <View style={{ width: 24 }} />
      </View>

      {/* TÍTULO */}
      <View style={es.tituloRow}>
        <Ionicons name="bar-chart-outline" size={24} color={CORES.secundaria} />
        <AppText style={es.tituloTexto}>Despesas por período</AppText>
      </View>
      <View style={es.divisoria} />

      {carregando ? (
        <View style={es.centralizador}>
          <ActivityIndicator size="large" color={CORES.secundaria} />
        </View>
      ) : (
        <ScrollView style={es.scroll} contentContainerStyle={es.scrollConteudo} showsVerticalScrollIndicator={false}>

          {/* FILTROS */}
          <View style={es.filtrosRow}>
            {filtros.map(f => (
              <TouchableOpacity
                key={f.key}
                style={[es.filtroBotao, filtro === f.key ? es.filtroAtivo : es.filtroInativo]}
                onPress={() => setFiltro(f.key)}
                accessible
                accessibilityLabel={`Filtrar por ${f.label}`}
                accessibilityRole="radio"
                accessibilityState={{ selected: filtro === f.key }}
              >
                <AppText style={[es.filtroTexto, filtro === f.key ? es.filtroTextoAtivo : es.filtroTextoInativo]}>
                  {f.label}
                </AppText>
              </TouchableOpacity>
            ))}
          </View>

          {/* CARDS DE RESUMO */}
          <View style={es.cardsRow}>
            <View style={[es.cardResumo, es.cardServico]}>
              <Ionicons name="wrench-outline" size={20} color={CORES.secundaria} />
              <AppText style={es.cardResumoLabel}>Serviços</AppText>
              <AppText style={[es.cardResumoValor, { color: CORES.secundariaEscuro }]}>
                {formatarValor(totalServicos)}
              </AppText>
            </View>
            <View style={[es.cardResumo, es.cardPeca]}>
              <Ionicons name="cog-outline" size={20} color={CORES.primaria} />
              <AppText style={es.cardResumoLabel}>Peças</AppText>
              <AppText style={[es.cardResumoValor, { color: CORES.primaria }]}>
                {formatarValor(totalPecas)}
              </AppText>
            </View>
          </View>

          <View style={es.cardTotal}>
            <AppText style={es.cardTotalLabel}>Total Geral</AppText>
            <AppText style={es.cardTotalValor}>{formatarValor(totalGeral)}</AppText>
          </View>

          {/* LISTA DE LANÇAMENTOS */}
          <AppText style={es.secaoTitulo}>Lançamentos</AppText>

          {lancamentos.length === 0 ? (
            <View style={es.vazio}>
              <Ionicons name="receipt-outline" size={48} color={CORES.cinzaTexto} />
              <AppText style={es.vazioTexto}>Nenhuma despesa encontrada neste período</AppText>
            </View>
          ) : (
            lancamentos.map(item => (
              <View key={item.id} style={es.lancamento}>
                <View style={[
                  es.lancamentoIcone,
                  { backgroundColor: item.tipo === 'servico' ? '#E8FAF0' : '#EAF0FF' },
                ]}>
                  <Ionicons
                    name={item.tipo === 'servico' ? 'wrench-outline' : 'cog-outline'}
                    size={18}
                    color={item.tipo === 'servico' ? CORES.secundaria : CORES.primaria}
                  />
                </View>
                <View style={es.lancamentoConteudo}>
                  <AppText style={es.lancamentoDesc} numberOfLines={1}>{item.descricao}</AppText>
                  <AppText style={es.lancamentoData}>{item.data}</AppText>
                </View>
                <AppText style={[
                  es.lancamentoValor,
                  { color: item.tipo === 'servico' ? CORES.secundariaEscuro : CORES.primaria },
                ]}>
                  {formatarValor(item.valor)}
                </AppText>
              </View>
            ))
          )}
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
  headerTitulo: { color: CORES.branco, fontSize: FONTES.media, fontWeight: '700' },

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

  centralizador: { flex: 1, backgroundColor: CORES.cinzaClaro, justifyContent: 'center', alignItems: 'center' },

  scroll:        { flex: 1, backgroundColor: CORES.cinzaClaro },
  scrollConteudo: { padding: ESPACOS.md, paddingBottom: ESPACOS.xxl },

  filtrosRow: {
    flexDirection: 'row',
    gap: ESPACOS.sm,
    marginBottom: ESPACOS.md,
  },
  filtroBotao: {
    flex: 1,
    paddingVertical: ESPACOS.sm,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  filtroAtivo:        { backgroundColor: CORES.primaria, borderColor: CORES.primaria },
  filtroInativo:      { backgroundColor: CORES.branco,   borderColor: CORES.primaria },
  filtroTexto:        { fontSize: FONTES.pequena, fontWeight: '700' },
  filtroTextoAtivo:   { color: CORES.branco },
  filtroTextoInativo: { color: CORES.primaria },

  cardsRow: { flexDirection: 'row', gap: ESPACOS.sm, marginBottom: ESPACOS.sm },

  cardResumo: {
    flex: 1,
    borderRadius: 14,
    padding: ESPACOS.md,
    borderWidth: 1.5,
    gap: 4,
  },
  cardServico: { backgroundColor: 'rgba(46,204,113,0.12)', borderColor: CORES.secundaria },
  cardPeca:    { backgroundColor: 'rgba(20,20,80,0.10)',   borderColor: CORES.primaria   },

  cardResumoLabel: { fontSize: FONTES.pequena, fontWeight: '600', color: CORES.textoSecundario },
  cardResumoValor: { fontSize: FONTES.normal,  fontWeight: '800' },

  cardTotal: {
    backgroundColor: CORES.primaria,
    borderRadius: 14,
    padding: ESPACOS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ESPACOS.lg,
  },
  cardTotalLabel: { color: CORES.branco, fontSize: FONTES.media, fontWeight: '600' },
  cardTotalValor: { color: CORES.secundaria, fontSize: FONTES.subtitulo, fontWeight: '900' },

  secaoTitulo: {
    fontSize: FONTES.normal,
    fontWeight: '700',
    color: CORES.pretinho,
    marginBottom: ESPACOS.sm,
  },

  vazio: { alignItems: 'center', gap: ESPACOS.md, paddingVertical: ESPACOS.xl },
  vazioTexto: {
    fontSize: FONTES.normal,
    color: CORES.textoSecundario,
    textAlign: 'center',
    lineHeight: 20,
  },

  lancamento: {
    backgroundColor: CORES.branco,
    borderRadius: 12,
    padding: ESPACOS.md,
    marginBottom: ESPACOS.sm,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: CORES.borda,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  lancamentoIcone: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ESPACOS.sm,
  },
  lancamentoConteudo: { flex: 1 },
  lancamentoDesc:     { fontSize: FONTES.pequena, fontWeight: '600', color: CORES.pretinho },
  lancamentoData:     { fontSize: FONTES.pequena - 1, color: CORES.cinzaTexto, marginTop: 2 },
  lancamentoValor:    { fontSize: FONTES.normal, fontWeight: '800', marginLeft: ESPACOS.sm },
})
