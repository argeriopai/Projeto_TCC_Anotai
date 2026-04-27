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
import { listarCarrosApi, listarMotosApi, excluirVeiculoApi, Carro, Moto } from '../../services/api'
import { CORES, FONTES, ESPACOS } from '../../constants/cores'
import { BottomNavBar } from '../../components/BottomNavBar'
import IconeNavVeiculo from '../../assets/icons/ICONE_RELATORIO_VEICULOS.svg'

interface Props { navigation: any }

type AbaVeiculo = 'carro' | 'moto'

export function TelaVeiculos({ navigation }: Props) {
  const { proprietario } = useAuth()
  const { requireAuth } = useAuthGuard()
  const { veiculoAtivo, definirVeiculoAtivo } = useVeiculo()
  const apelido = proprietario?.apelido ?? proprietario?.nome?.split(' ')[0] ?? 'Usuário'

  const [abaAtiva,        setAbaAtiva]        = useState<AbaVeiculo>('carro')
  const [carros,          setCarros]          = useState<Carro[]>([])
  const [motos,           setMotos]           = useState<Moto[]>([])
  const [carregando,      setCarregando]      = useState(true)
  const [cardSelecionado, setCardSelecionado] = useState<string | null>(null)

  useFocusEffect(
    useCallback(() => {
      carregarDados()
      setCardSelecionado(null)
    }, [])
  )

  async function carregarDados() {
    setCarregando(true)
    try {
      const [resCarros, resMotos] = await Promise.all([listarCarrosApi(), listarMotosApi()])
      setCarros(resCarros.data)
      setMotos(resMotos.data)
    } catch {
      setCarros([])
      setMotos([])
    } finally {
      setCarregando(false)
    }
  }

  function handleEditar() {
    if (!cardSelecionado) {
      Alert.alert('Atenção', 'Selecione um veículo para editar.')
      return
    }
    requireAuth(() => {
      if (abaAtiva === 'carro') {
        const item = carros.find(c => c.id === cardSelecionado)
        if (item) navigation.navigate('RegistrarCarro', { registroParaEditar: item })
      } else {
        const item = motos.find(m => m.id === cardSelecionado)
        if (item) navigation.navigate('RegistrarMoto', { registroParaEditar: item })
      }
    })
  }

  function handleNovo() {
    requireAuth(() => navigation.navigate(abaAtiva === 'carro' ? 'RegistrarCarro' : 'RegistrarMoto'))
  }

  function handleExcluir() {
    if (!cardSelecionado) {
      Alert.alert('Atenção', 'Selecione um veículo para excluir.')
      return
    }
    requireAuth(() => {
      Alert.alert(
        'Confirmar Exclusão',
        'Deseja realmente excluir este veículo?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Excluir', style: 'destructive',
            onPress: async () => {
              try {
                await excluirVeiculoApi(cardSelecionado)
                if (veiculoAtivo?.id === cardSelecionado) {
                  await definirVeiculoAtivo(null)
                }
                setCardSelecionado(null)
                carregarDados()
              } catch {
                Alert.alert('Erro', 'Não foi possível excluir o veículo.')
              }
            },
          },
        ]
      )
    })
  }

  function handleCardTap(id: string) {
    setCardSelecionado(prev => prev === id ? null : id)
  }

  function handleDefinirAtivo(item: Carro | Moto, tipo: 'carro' | 'moto') {
    requireAuth(() => {
      definirVeiculoAtivo({ id: item.id, tipo, marca: item.marca, modelo: item.modelo, placa: item.placa })
    })
  }

  const listaAtual = abaAtiva === 'carro' ? carros : motos

  function renderCardCarro(item: Carro) {
    const ativo = veiculoAtivo?.id === item.id
    const selecionado = cardSelecionado === item.id
    return (
      <TouchableOpacity
        key={item.id}
        style={[estilos.card, selecionado && estilos.cardAtivo]}
        onPress={() => handleCardTap(item.id)}
        activeOpacity={0.85}
      >
        <View style={estilos.cardTopRow}>
          <Text style={estilos.cardMarcaModelo}>🚗 {item.marca} {item.modelo}</Text>
          <Text style={estilos.cardPlaca}>{item.placa}</Text>
        </View>

        <View style={estilos.cardDivisor} />

        <View style={estilos.cardAtributosGrid}>
          <CampoInfo label="Ano" valor={item.ano} />
          {item.cor        && <CampoInfo label="Cor"        valor={item.cor} />}
          {item.combustivel && <CampoInfo label="Combustível" valor={item.combustivel} />}
          {item.motor      && <CampoInfo label="Motor"      valor={item.motor} />}
          {item.direcao    && <CampoInfo label="Direção"    valor={item.direcao} />}
          {item.pneuAro    && <CampoInfo label="Aro"        valor={item.pneuAro} />}
        </View>

        <View style={estilos.cardBotaoRow}>
          {ativo ? (
            <View style={estilos.tagAtivo}>
              <Ionicons name="checkmark-circle" size={14} color={CORES.secundariaEscuro} />
              <Text style={estilos.tagAtivoTexto}>Veículo ativo</Text>
            </View>
          ) : (
            <TouchableOpacity style={estilos.btnDefinirAtivo} onPress={() => handleDefinirAtivo(item, 'carro')}>
              <Text style={estilos.btnDefinirAtivoTexto}>Definir como ativo</Text>
            </TouchableOpacity>
          )}
        </View>

        <Ionicons name="chevron-forward" size={14} color={CORES.cinzaTexto} style={estilos.cardChevron} />
      </TouchableOpacity>
    )
  }

  function renderCardMoto(item: Moto) {
    const ativo = veiculoAtivo?.id === item.id
    const selecionado = cardSelecionado === item.id
    return (
      <TouchableOpacity
        key={item.id}
        style={[estilos.card, selecionado && estilos.cardAtivo]}
        onPress={() => handleCardTap(item.id)}
        activeOpacity={0.85}
      >
        <View style={estilos.cardTopRow}>
          <Text style={estilos.cardMarcaModelo}>🏍️ {item.marca} {item.modelo}</Text>
          <Text style={estilos.cardPlaca}>{item.placa}</Text>
        </View>

        <View style={estilos.cardDivisor} />

        <View style={estilos.cardAtributosGrid}>
          <CampoInfo label="Ano" valor={item.ano} />
          {item.cor     && <CampoInfo label="Cor"     valor={item.cor} />}
          {item.freio   && <CampoInfo label="Freio"   valor={item.freio} />}
          {item.partida && <CampoInfo label="Partida" valor={item.partida} />}
        </View>

        <View style={estilos.cardBotaoRow}>
          {ativo ? (
            <View style={estilos.tagAtivo}>
              <Ionicons name="checkmark-circle" size={14} color={CORES.secundariaEscuro} />
              <Text style={estilos.tagAtivoTexto}>Veículo ativo</Text>
            </View>
          ) : (
            <TouchableOpacity style={estilos.btnDefinirAtivo} onPress={() => handleDefinirAtivo(item, 'moto')}>
              <Text style={estilos.btnDefinirAtivoTexto}>Definir como ativo</Text>
            </TouchableOpacity>
          )}
        </View>

        <Ionicons name="chevron-forward" size={14} color={CORES.cinzaTexto} style={estilos.cardChevron} />
      </TouchableOpacity>
    )
  }

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
          <IconeNavVeiculo width={22} height={22} color={CORES.secundaria} />
          <Text style={estilos.tituloTexto}>Veículos</Text>
        </View>
      </View>
      <View style={estilos.divisoria} />

      {/* ABAS INTERNAS */}
      <View style={estilos.abas}>
        <TouchableOpacity
          style={[estilos.aba, abaAtiva === 'carro' && estilos.abaAtiva]}
          onPress={() => { setAbaAtiva('carro'); setCardSelecionado(null) }}
        >
          <Text style={[estilos.abaTexto, abaAtiva === 'carro' && estilos.abaTextoAtivo]}>
            🚗 Carro
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[estilos.aba, abaAtiva === 'moto' && estilos.abaAtiva]}
          onPress={() => { setAbaAtiva('moto'); setCardSelecionado(null) }}
        >
          <Text style={[estilos.abaTexto, abaAtiva === 'moto' && estilos.abaTextoAtivo]}>
            🏍️ Moto
          </Text>
        </TouchableOpacity>
      </View>

      {/* LISTA */}
      {carregando ? (
        <View style={estilos.centralizador}>
          <ActivityIndicator size="large" color={CORES.secundaria} />
        </View>
      ) : listaAtual.length === 0 ? (
        <View style={estilos.centralizador}>
          <Ionicons
            name={abaAtiva === 'carro' ? 'car-outline' : 'bicycle-outline'}
            size={52}
            color={CORES.cinzaTexto}
          />
          <Text style={estilos.semDados}>
            Nenhum {abaAtiva === 'carro' ? 'carro' : 'moto'} cadastrado
          </Text>
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
          {abaAtiva === 'carro'
            ? carros.map(renderCardCarro)
            : motos.map(renderCardMoto)
          }
        </ScrollView>
      )}

      <BottomNavBar ativa="veiculo" navigation={navigation} />
    </SafeAreaView>
  )
}

function CampoInfo({ label, valor }: { label: string; valor: string }) {
  return (
    <View style={estilos.campoInfo}>
      <Text style={estilos.campoInfoLabel}>{label}</Text>
      <Text style={estilos.campoInfoValor}>{valor}</Text>
    </View>
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
    paddingHorizontal: ESPACOS.md,
    paddingVertical: ESPACOS.sm,
  },
  tituloEsquerda:  { flexDirection: 'row', alignItems: 'center', gap: ESPACOS.xs },
  tituloTexto:     { fontSize: FONTES.subtitulo, fontWeight: '700', color: CORES.pretinho },
  divisoria:       { height: 2, backgroundColor: CORES.secundaria },

  // Abas internas
  abas: {
    backgroundColor: CORES.branco,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: CORES.borda,
  },
  aba: {
    flex: 1,
    paddingVertical: ESPACOS.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  abaAtiva:     { borderBottomColor: CORES.secundaria },
  abaTexto:     { fontSize: FONTES.normal, color: CORES.cinzaTexto, fontWeight: '500' },
  abaTextoAtivo: { color: CORES.secundariaEscuro, fontWeight: '700' },

  centralizador:     { flex: 1, backgroundColor: CORES.cinzaClaro, justifyContent: 'center', alignItems: 'center', gap: ESPACOS.md },
  semDados:          { fontSize: FONTES.normal, color: CORES.cinzaTexto, fontWeight: '500' },
  btnAdicionar:      { backgroundColor: CORES.secundaria, borderRadius: 20, paddingHorizontal: ESPACOS.lg, paddingVertical: ESPACOS.sm },
  btnAdicionarTexto: { color: CORES.branco, fontSize: FONTES.normal, fontWeight: '700' },

  scroll:         { flex: 1, backgroundColor: CORES.cinzaClaro },
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
  cardAtivo:       { borderColor: CORES.secundaria, shadowOpacity: 0.15 },
  cardTopRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardMarcaModelo: { fontSize: FONTES.media, fontWeight: '700', color: CORES.pretinho, flex: 1 },
  cardPlaca:       { fontSize: FONTES.normal, fontWeight: '700', color: CORES.secundariaEscuro, backgroundColor: '#E8FAF0', paddingHorizontal: ESPACOS.sm, paddingVertical: 2, borderRadius: 6 },
  cardDivisor:     { height: 1, backgroundColor: CORES.borda, marginVertical: ESPACOS.sm },
  cardAtributosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: ESPACOS.sm },
  cardChevron:     { position: 'absolute', right: ESPACOS.sm, top: ESPACOS.md },

  cardBotaoRow:         { flexDirection: 'row', marginTop: ESPACOS.sm },
  tagAtivo:             { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E8FAF0', borderRadius: 10, paddingHorizontal: ESPACOS.sm, paddingVertical: 3 },
  tagAtivoTexto:        { fontSize: FONTES.pequena, color: CORES.secundariaEscuro, fontWeight: '600' },
  btnDefinirAtivo:      { borderWidth: 1, borderColor: CORES.secundaria, borderRadius: 10, paddingHorizontal: ESPACOS.sm, paddingVertical: 3 },
  btnDefinirAtivoTexto: { fontSize: FONTES.pequena, color: CORES.secundaria, fontWeight: '600' },

  // Campo info
  campoInfo:       { minWidth: '30%' },
  campoInfoLabel:  { fontSize: 10, color: CORES.cinzaTexto },
  campoInfoValor:  { fontSize: FONTES.pequena, color: CORES.pretinho, fontWeight: '600' },

  veiculoLabel:    { fontSize: FONTES.pequena, color: CORES.secundaria, fontWeight: '600', flex: 1, textAlign: 'right', marginLeft: ESPACOS.sm },
})
