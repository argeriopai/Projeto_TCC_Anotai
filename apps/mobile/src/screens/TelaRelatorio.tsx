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
import { useVeiculo } from '../contexts/VeiculoContext'

interface Props { navigation: any }

type Aba = 'juntos' | 'separados'

type Lancamento = {
  id: string
  tipo: 'servico' | 'peca'
  descricao: string
  data: string
  valor: number
}

type GrupoMesData = {
  chave: string
  label: string
  items: Lancamento[]
}

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function formatarValor(val: number): string {
  return 'R$ ' + val.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

function parseDateStr(str: string): Date {
  const [d, m, y] = str.split('/').map(Number)
  return new Date(y, m - 1, d)
}

function valorPeca(p: Peca): number {
  if (p.custo != null) return p.custo
  if (p.valorUnitario != null && p.quantidade != null) return p.valorUnitario * p.quantidade
  if (p.valorUnitario != null) return p.valorUnitario
  return 0
}

function chaveMes(dataStr: string): string {
  const [, m, y] = dataStr.split('/').map(Number)
  return `${String(m).padStart(2, '0')}/${y}`
}

function labelMes(chave: string): string {
  const [m, y] = chave.split('/')
  return `${MESES[parseInt(m, 10) - 1]} ${y}`
}

function agruparPorMes(items: Lancamento[]): GrupoMesData[] {
  const mapa = new Map<string, Lancamento[]>()
  for (const item of items) {
    const chave = chaveMes(item.data)
    if (!mapa.has(chave)) mapa.set(chave, [])
    mapa.get(chave)!.push(item)
  }
  return Array.from(mapa.entries())
    .map(([chave, its]) => ({ chave, label: labelMes(chave), items: its }))
    .sort((a, b) => {
      const [ma, ya] = a.chave.split('/').map(Number)
      const [mb, yb] = b.chave.split('/').map(Number)
      return ya !== yb ? yb - ya : mb - ma
    })
}

function ItemLancamento({ item, navigation }: { item: Lancamento; navigation: any }) {
  return (
    <TouchableOpacity
      style={es.lancamento}
      onPress={() => navigation.navigate(item.tipo === 'servico' ? 'Servicos' : 'Pecas')}
      accessible
      accessibilityRole="button"
      accessibilityLabel={item.descricao}
    >
      <View style={[
        es.lancamentoIcone,
        { backgroundColor: item.tipo === 'servico' ? '#E8FAF0' : '#EAF0FF' },
      ]}>
        <Ionicons
          name={item.tipo === 'servico' ? 'construct-outline' : 'cog-outline'}
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
    </TouchableOpacity>
  )
}

function GrupoMesView({ grupo, navigation }: { grupo: GrupoMesData; navigation: any }) {
  const total = grupo.items.reduce((acc, i) => acc + i.valor, 0)
  return (
    <View style={es.grupoMes}>
      <View style={es.grupoMesCabecalho}>
        <AppText style={es.grupoMesLabel}>{grupo.label}</AppText>
        <AppText style={es.grupoMesTotal}>{formatarValor(total)}</AppText>
      </View>
      {grupo.items.map(item => (
        <ItemLancamento key={item.id} item={item} navigation={navigation} />
      ))}
      <View style={es.grupoMesRodape}>
        <AppText style={es.grupoMesRodapeLabel}>Subtotal</AppText>
        <AppText style={es.grupoMesRodapeValor}>{formatarValor(total)}</AppText>
      </View>
    </View>
  )
}

export function TelaRelatorio({ navigation }: Props) {
  const { veiculoAtivoId, veiculoAtivo } = useVeiculo()
  const [aba,        setAba]        = useState<Aba>('juntos')
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

  const servicosFiltrados = veiculoAtivoId
    ? servicos.filter(s => s.veiculoId === veiculoAtivoId)
    : []
  const pecasFiltradas = veiculoAtivoId
    ? pecas.filter(p => p.veiculoId === veiculoAtivoId)
    : []

  const totalServicos = servicosFiltrados.reduce((acc, s) => acc + (s.custo ?? 0), 0)
  const totalPecas    = pecasFiltradas.reduce((acc, p) => acc + valorPeca(p), 0)
  const totalGeral    = totalServicos + totalPecas

  const lancamentosServicos: Lancamento[] = servicosFiltrados.map(s => ({
    id:        s.id,
    tipo:      'servico' as const,
    descricao: s.tipo + (s.descricao ? ` — ${s.descricao}` : ''),
    data:      s.data,
    valor:     s.custo ?? 0,
  }))

  const lancamentosPecas: Lancamento[] = pecasFiltradas.map(p => ({
    id:        p.id,
    tipo:      'peca' as const,
    descricao: p.nome + (p.descricao ? ` — ${p.descricao}` : ''),
    data:      p.data,
    valor:     valorPeca(p),
  }))

  const lancamentosJuntos = [...lancamentosServicos, ...lancamentosPecas]
    .sort((a, b) => parseDateStr(b.data).getTime() - parseDateStr(a.data).getTime())

  const gruposJuntos   = agruparPorMes(lancamentosJuntos)
  const gruposServicos = agruparPorMes(lancamentosServicos)
  const gruposPecas    = agruparPorMes(lancamentosPecas)

  const nomeVeiculo = veiculoAtivo
    ? `${veiculoAtivo.marca} ${veiculoAtivo.modelo} — ${veiculoAtivo.placa}`
    : ''

  const abas: { key: Aba; label: string }[] = [
    { key: 'juntos',    label: 'Juntos'    },
    { key: 'separados', label: 'Separados' },
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
        <AppText style={es.tituloTexto}>Despesas por veículo</AppText>
      </View>
      <View style={es.divisoria} />

      {carregando ? (
        <View style={es.centralizador}>
          <ActivityIndicator size="large" color={CORES.secundaria} />
        </View>
      ) : !veiculoAtivoId ? (
        <View style={es.centralizador}>
          <Ionicons name="car-outline" size={56} color={CORES.cinzaTexto} />
          <AppText style={es.semVeiculoTexto}>
            Nenhum veículo ativo. Ative um veículo na página inicial para ver o relatório.
          </AppText>
        </View>
      ) : (
        <ScrollView
          style={es.scroll}
          contentContainerStyle={es.scrollConteudo}
          showsVerticalScrollIndicator={false}
        >
          {/* BANNER VEÍCULO ATIVO */}
          <View style={es.veiculoAtivoBanner}>
            <Ionicons name="car-sport-outline" size={20} color={CORES.branco} />
            <AppText style={es.veiculoAtivoTexto} numberOfLines={1}>{nomeVeiculo}</AppText>
          </View>

          {/* CARDS DE RESUMO */}
          <View style={es.cardsRow}>
            <View style={[es.cardResumo, es.cardServico]}>
              <Ionicons name="construct-outline" size={20} color={CORES.secundaria} />
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

          {/* ABAS */}
          <View style={es.abasRow}>
            {abas.map(a => (
              <TouchableOpacity
                key={a.key}
                style={[es.abaBotao, aba === a.key ? es.abaAtiva : es.abaInativa]}
                onPress={() => setAba(a.key)}
                accessible
                accessibilityRole="tab"
                accessibilityState={{ selected: aba === a.key }}
                accessibilityLabel={a.label}
              >
                <AppText style={[es.abaTexto, aba === a.key ? es.abaTextoAtivo : es.abaTextoInativo]}>
                  {a.label}
                </AppText>
              </TouchableOpacity>
            ))}
          </View>

          {/* ABA: JUNTOS */}
          {aba === 'juntos' && (
            gruposJuntos.length === 0 ? (
              <View style={es.vazio}>
                <Ionicons name="receipt-outline" size={48} color={CORES.cinzaTexto} />
                <AppText style={es.vazioTexto}>Nenhuma despesa registrada para este veículo</AppText>
              </View>
            ) : (
              gruposJuntos.map(grupo => (
                <GrupoMesView key={grupo.chave} grupo={grupo} navigation={navigation} />
              ))
            )
          )}

          {/* ABA: SEPARADOS */}
          {aba === 'separados' && (
            <>
              <View style={es.secao}>
                <View style={es.secaoHeader}>
                  <Ionicons name="construct-outline" size={16} color={CORES.secundaria} />
                  <AppText style={es.secaoTitulo}>Serviços</AppText>
                  <AppText style={[es.secaoTotalValor, { color: CORES.secundariaEscuro }]}>
                    {formatarValor(totalServicos)}
                  </AppText>
                </View>
                {gruposServicos.length === 0 ? (
                  <View style={es.vazioPequeno}>
                    <AppText style={es.vazioTexto}>Nenhum serviço registrado</AppText>
                  </View>
                ) : (
                  gruposServicos.map(grupo => (
                    <GrupoMesView key={grupo.chave} grupo={grupo} navigation={navigation} />
                  ))
                )}
              </View>

              <View style={es.secao}>
                <View style={es.secaoHeader}>
                  <Ionicons name="cog-outline" size={16} color={CORES.primaria} />
                  <AppText style={es.secaoTitulo}>Peças</AppText>
                  <AppText style={[es.secaoTotalValor, { color: CORES.primaria }]}>
                    {formatarValor(totalPecas)}
                  </AppText>
                </View>
                {gruposPecas.length === 0 ? (
                  <View style={es.vazioPequeno}>
                    <AppText style={es.vazioTexto}>Nenhuma peça registrada</AppText>
                  </View>
                ) : (
                  gruposPecas.map(grupo => (
                    <GrupoMesView key={grupo.chave} grupo={grupo} navigation={navigation} />
                  ))
                )}
              </View>
            </>
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

  centralizador: {
    flex: 1,
    backgroundColor: CORES.cinzaClaro,
    justifyContent: 'center',
    alignItems: 'center',
    padding: ESPACOS.xl,
    gap: ESPACOS.md,
  },
  semVeiculoTexto: {
    fontSize: FONTES.normal,
    color: CORES.textoSecundario,
    textAlign: 'center',
    lineHeight: 22,
  },

  scroll:         { flex: 1, backgroundColor: CORES.cinzaClaro },
  scrollConteudo: { padding: ESPACOS.md, paddingBottom: ESPACOS.xxl },

  veiculoAtivoBanner: {
    backgroundColor: CORES.primaria,
    borderRadius: 12,
    paddingHorizontal: ESPACOS.md,
    paddingVertical: ESPACOS.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACOS.xs,
    marginBottom: ESPACOS.md,
  },
  veiculoAtivoTexto: {
    color: CORES.branco,
    fontSize: FONTES.normal,
    fontWeight: '700',
    flex: 1,
  },

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

  abasRow: { flexDirection: 'row', gap: ESPACOS.sm, marginBottom: ESPACOS.md },
  abaBotao: {
    flex: 1,
    paddingVertical: ESPACOS.sm,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  abaAtiva:        { backgroundColor: CORES.primaria, borderColor: CORES.primaria },
  abaInativa:      { backgroundColor: CORES.branco,   borderColor: CORES.primaria },
  abaTexto:        { fontSize: FONTES.pequena, fontWeight: '700' },
  abaTextoAtivo:   { color: CORES.branco },
  abaTextoInativo: { color: CORES.primaria },

  grupoMes: {
    marginBottom: ESPACOS.md,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: CORES.borda,
  },
  grupoMesCabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: CORES.primaria,
    paddingHorizontal: ESPACOS.md,
    paddingVertical: ESPACOS.sm,
  },
  grupoMesLabel: { color: CORES.branco,     fontSize: FONTES.pequena, fontWeight: '700' },
  grupoMesTotal: { color: CORES.secundaria, fontSize: FONTES.pequena, fontWeight: '800' },

  grupoMesRodape: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(20,20,80,0.05)',
    paddingHorizontal: ESPACOS.md,
    paddingVertical: ESPACOS.sm,
    borderTopWidth: 1,
    borderTopColor: CORES.borda,
  },
  grupoMesRodapeLabel: { fontSize: FONTES.pequena, fontWeight: '600', color: CORES.textoSecundario },
  grupoMesRodapeValor: { fontSize: FONTES.pequena, fontWeight: '800', color: CORES.pretinho },

  secao: { marginBottom: ESPACOS.lg },
  secaoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACOS.xs,
    marginBottom: ESPACOS.sm,
    paddingBottom: ESPACOS.xs,
    borderBottomWidth: 1.5,
    borderBottomColor: CORES.borda,
  },
  secaoTitulo:    { fontSize: FONTES.normal, fontWeight: '700', color: CORES.pretinho, flex: 1 },
  secaoTotalValor: { fontSize: FONTES.normal, fontWeight: '800' },

  vazio: { alignItems: 'center', gap: ESPACOS.md, paddingVertical: ESPACOS.xl },
  vazioPequeno: { paddingVertical: ESPACOS.md, alignItems: 'center' },
  vazioTexto: {
    fontSize: FONTES.normal,
    color: CORES.textoSecundario,
    textAlign: 'center',
    lineHeight: 20,
  },

  lancamento: {
    backgroundColor: CORES.branco,
    padding: ESPACOS.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: CORES.borda,
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
