import React, { useState, useEffect, useRef } from 'react'
import {
  View, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native'
import { AppText } from '../../components/AppText'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { listarCarrosApi, listarMotosApi, registrarPecaApi, atualizarPecaApi, Carro, Moto, Peca } from '../../services/api'
import { useVoiceInput } from '../../hooks/useVoiceInput'
import { BotaoMic, IndicadorGravando } from '../../components/BotaoMic'
import { CampoData, formatarData } from '../../components/CampoData'
import { CORES, FONTES, ESPACOS } from '../../constants/cores'
import { mascaraMoeda, mascaraTelefone, parseMoeda } from '../../utils/mascaras'
import { useVeiculo } from '../../contexts/VeiculoContext'
import { useAuth } from '../../contexts/AuthContext'
import { useAuthGuard } from '../../hooks/useAuthGuard'
import { AvatarCircular } from '../../components/AvatarCircular'
import { FotosPicker, FotoSections, FOTOS_VAZIAS } from '../../components/FotosPicker'
import { buscarFotos, salvarFotos, temFotos } from '../../utils/fotosStorage'

interface Props { navigation: any; route: any }

type VeiculoItem = { id: string; label: string }

function parseDateStr(dateStr: string): Date {
  const [d, m, y] = dateStr.split('/').map(Number)
  return new Date(y, m - 1, d)
}

export function TelaRegistrarPeca({ navigation, route }: Props) {
  const edit: Peca | undefined = route.params?.registroParaEditar
  const { proprietario } = useAuth()
  const { veiculoAtivo } = useVeiculo()
  const { requireAuth, estaLogado } = useAuthGuard()
  const apelido = proprietario?.apelido ?? proprietario?.nome?.split(' ')[0] ?? 'Usuário'
  const [fotos, setFotos] = useState<FotoSections>(FOTOS_VAZIAS)

  const nomeRef           = useRef<TextInput>(null)
  const descricaoRef      = useRef<TextInput>(null)
  const estabelecimentoRef = useRef<TextInput>(null)
  const telEstabRef       = useRef<TextInput>(null)
  const quantidadeRef     = useRef<TextInput>(null)
  const valorUnitRef      = useRef<TextInput>(null)

  // ── Campos do formulário ──────────────────────────────────────────────────
  const [nome,                    setNome]                    = useState(edit?.nome ?? '')
  const [descricao,               setDescricao]               = useState(edit?.descricao ?? '')
  const [data,                    setData]                    = useState(() => edit?.data ? parseDateStr(edit.data) : new Date())
  const [quantidade,              setQuantidade]              = useState(() => edit?.quantidade !== undefined ? String(edit.quantidade) : '')
  const [valorUnitario,           setValorUnitario]           = useState(() => edit?.valorUnitario !== undefined ? mascaraMoeda(Math.round(edit.valorUnitario * 100).toString()) : '')
  const [estabelecimento,         setEstabelecimento]         = useState(edit?.estabelecimento ?? '')
  const [telefoneEstabelecimento, setTelefoneEstabelecimento] = useState(edit?.telefoneEstabelecimento ?? '')
  const [carregando,              setCarregando]              = useState(false)
  const [erros,                   setErros]                   = useState<Record<string, string>>({})
  const [telEstabValido, setTelEstabValido] = useState(false)

  // ── Veículos ──────────────────────────────────────────────────────────────
  const [veiculos,           setVeiculos]           = useState<VeiculoItem[]>([])
  const [veiculoId,          setVeiculoId]          = useState<string | null>(edit?.veiculoId ?? null)
  const [carregandoVeiculos, setCarregandoVeiculos] = useState(true)

  // ── Voz ───────────────────────────────────────────────────────────────────
  const { gravando: gravandoNome, iniciarGravacao: iniciarNome, pararGravacao: pararNome } = useVoiceInput(
    text => setNome(prev => prev ? prev + ' ' + text : text)
  )
  const { gravando: gravandoDesc, iniciarGravacao: iniciarDesc, pararGravacao: pararDesc } = useVoiceInput(
    text => setDescricao(prev => prev ? prev + ' ' + text : text)
  )

  useEffect(() => {
    if (!edit && !veiculoAtivo) {
      Alert.alert(
        'Nenhum veículo selecionado',
        'Você precisa selecionar um veículo ativo antes de fazer um registro. Deseja selecionar agora?',
        [
          { text: 'Agora não', style: 'cancel' },
          { text: 'Selecionar Veículo', onPress: () => navigation.navigate('Veiculos') },
        ]
      )
    }
  }, [])

  useEffect(() => {
    if (edit?.id) {
      buscarFotos(edit.id).then(f => {
        if (f) setFotos({ fotosServico: f.fotosServico, fotosNotaFiscal: f.fotosNotaFiscal, fotosGarantia: f.fotosGarantia })
      })
    }
  }, [edit?.id])

  // Valor total calculado automaticamente
  const qtd      = parseFloat(quantidade.replace(',', '.'))
  const vUnit    = parseMoeda(valorUnitario)
  const totalNum = !isNaN(qtd) && qtd > 0 && !isNaN(vUnit) && vUnit > 0 ? qtd * vUnit : null
  const valorTotalDisplay = totalNum !== null
    ? mascaraMoeda(Math.round(totalNum * 100).toString())
    : '—'

  useEffect(() => {
    async function carregarVeiculos() {
      try {
        const [resCarros, resMotos] = await Promise.all([listarCarrosApi(), listarMotosApi()])
        const lista: VeiculoItem[] = [
          ...resCarros.data.map((c: Carro) => ({ id: c.id, label: `🚗 ${c.marca} ${c.modelo} — ${c.placa}` })),
          ...resMotos.data.map((m: Moto)   => ({ id: m.id, label: `🏍️ ${m.marca} ${m.modelo} — ${m.placa}` })),
        ]
        setVeiculos(lista)
        if (!edit && veiculoAtivo) setVeiculoId(veiculoAtivo.id)
      } catch {
        // sem veículos ainda
      } finally {
        setCarregandoVeiculos(false)
      }
    }
    carregarVeiculos()
  }, [])

  function limparErro(campo: string) {
    setErros(e => ({ ...e, [campo]: '' }))
  }

  function handleTelEstabBlur() {
    const d = telefoneEstabelecimento.replace(/\D/g, '')
    if (telefoneEstabelecimento.length > 0 && d.length !== 11) {
      setErros(e => ({ ...e, telefoneEstabelecimento: 'Telefone inválido. Use o formato (99) 99999-9999' }))
      setTelEstabValido(false)
    } else {
      setTelEstabValido(d.length === 11)
    }
  }


  function validar(): boolean {
    const e: Record<string, string> = {}
    if (!veiculoId)   e.veiculo = 'Selecione um veículo'
    if (!nome.trim()) e.nome    = 'Informe o nome da peça'
    if (telefoneEstabelecimento && telefoneEstabelecimento.replace(/\D/g, '').length !== 11)
      e.telefoneEstabelecimento = 'Telefone inválido. Use o formato (99) 99999-9999'
    setErros(e)
    return Object.keys(e).length === 0
  }

  function handleSalvar() {
    requireAuth(async () => {
      if (!validar()) return
      setCarregando(true)
      const payload = {
        veiculoId:               veiculoId!,
        nome:                    nome.trim(),
        descricao:               descricao.trim() || undefined,
        data:                    formatarData(data),
        quantidade:              !isNaN(qtd)   && qtd   > 0 ? qtd   : undefined,
        valorUnitario:           !isNaN(vUnit) && vUnit > 0 ? vUnit : undefined,
        custo:                   totalNum ?? undefined,
        estabelecimento:         estabelecimento.trim() || undefined,
        telefoneEstabelecimento: telefoneEstabelecimento.trim() || undefined,
      }
      try {
        if (edit) {
          await atualizarPecaApi(edit.id, payload)
          const rec = { veiculoId: veiculoId!, registroId: edit.id, tipoRegistro: 'peca' as const, nomeRegistro: nome.trim(), ...fotos }
          if (temFotos(rec)) await salvarFotos(rec)
          Alert.alert('Sucesso!', 'Peça atualizada com sucesso.', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ])
        } else {
          const res = await registrarPecaApi(payload)
          const rec = { veiculoId: veiculoId!, registroId: res.data.id, tipoRegistro: 'peca' as const, nomeRegistro: nome.trim(), ...fotos }
          if (temFotos(rec)) await salvarFotos(rec)
          Alert.alert('Sucesso!', 'Peça registrada com sucesso.', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ])
        }
      } catch (error: any) {
        Alert.alert('Erro', error.response?.data?.erro ?? 'Não foi possível salvar a peça.')
      } finally {
        setCarregando(false)
      }
    })
  }

  return (
    <SafeAreaView style={estilos.safe} edges={['top']}>
      <View style={estilos.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessible={true}
          accessibilityLabel="Voltar"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color={CORES.branco} />
        </TouchableOpacity>
        <View style={estilos.headerDireita}>
          <AvatarCircular uri={proprietario?.fotoPerfil} size={34} />
          <View style={{ marginLeft: ESPACOS.xs }}>
            <AppText style={estilos.headerOla}>Olá,</AppText>
            <AppText style={estilos.headerNome}>{apelido}</AppText>
          </View>
        </View>
      </View>

      {/* TÍTULO */}
      <View style={estilos.tituloRow}>
        <Ionicons name="cog-outline" size={24} color={CORES.secundaria} />
        <AppText style={estilos.tituloTexto}>{edit ? 'Editar Peça' : 'Registrar Peça'}</AppText>
      </View>
      <View style={estilos.divisoria} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={estilos.scroll} contentContainerStyle={estilos.conteudo} keyboardShouldPersistTaps="handled">

          {/* ── Seletor de veículo ─────────────────────────────────────── */}
          <AppText style={estilos.label}>Veículo <AppText style={estilos.obrig}>*</AppText></AppText>
          {carregandoVeiculos ? (
            <ActivityIndicator color={CORES.secundaria} style={{ marginVertical: ESPACOS.md }} />
          ) : veiculos.length === 0 ? (
            <TouchableOpacity style={estilos.avisoVeiculo} onPress={() => navigation.navigate('RegistrarCarro')}>
              <Ionicons name="alert-circle-outline" size={18} color={CORES.atencao} />
              <AppText style={estilos.avisoTexto}>Nenhum veículo cadastrado. Toque para cadastrar.</AppText>
            </TouchableOpacity>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={estilos.chipScroll}>
              {veiculos.map(v => (
                <TouchableOpacity
                  key={v.id}
                  style={[estilos.chip, veiculoId === v.id && estilos.chipAtivo]}
                  onPress={() => { setVeiculoId(v.id); limparErro('veiculo') }}
                  accessible={true}
                  accessibilityLabel={`Selecionar veículo ${v.label}`}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: veiculoId === v.id }}
                >
                  <AppText style={[estilos.chipTexto, veiculoId === v.id && estilos.chipTextoAtivo]} numberOfLines={1}>
                    {v.label}
                  </AppText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
          {!!erros.veiculo && <AppText style={estilos.textoErro}>{erros.veiculo}</AppText>}

          <View style={{ height: ESPACOS.md }} />

          {/* ── Nome da peça com microfone ─────────────────────────────── */}
          <View style={estilos.campo}>
            <AppText style={estilos.label}>Nome da peça <AppText style={estilos.obrig}>*</AppText></AppText>
            <View style={[estilos.inputRow, erros.nome ? estilos.inputErro : null]}>
              <TextInput
                ref={nomeRef}
                style={estilos.inputFlex}
                value={nome}
                onChangeText={t => { setNome(t); limparErro('nome') }}
                placeholder="Ex: Filtro de ar"
                placeholderTextColor={CORES.placeholder}
                autoCapitalize="sentences"
                autoCorrect={false}
                maxLength={50}
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => descricaoRef.current?.focus()}
              />
              <BotaoMic gravando={gravandoNome} onPress={() => gravandoNome ? pararNome() : iniciarNome()} />
            </View>
            {gravandoNome && <IndicadorGravando />}
            {!!erros.nome && <AppText style={estilos.textoErro}>{erros.nome}</AppText>}
          </View>

          {/* ── Descrição com microfone ────────────────────────────────── */}
          <View style={estilos.campo}>
            <View style={estilos.labelRow}>
              <AppText style={estilos.label}>Descrição</AppText>
              <BotaoMic gravando={gravandoDesc} onPress={() => gravandoDesc ? pararDesc() : iniciarDesc()} />
            </View>
            {gravandoDesc && <IndicadorGravando />}
            <TextInput
              ref={descricaoRef}
              style={estilos.inputMultiline}
              value={descricao}
              onChangeText={setDescricao}
              placeholder="Detalhes adicionais..."
              placeholderTextColor={CORES.placeholder}
              multiline
              maxLength={300}
              autoCapitalize="sentences"
              returnKeyType="next"
              blurOnSubmit={false}
            />
          </View>

          {/* ── Estabelecimento ────────────────────────────────────────── */}
          <View style={estilos.campo}>
            <AppText style={estilos.label}>Estabelecimento</AppText>
            <TextInput
              ref={estabelecimentoRef}
              style={estilos.input}
              value={estabelecimento}
              onChangeText={setEstabelecimento}
              placeholder="Ex: Auto Peças Central"
              placeholderTextColor={CORES.placeholder}
              autoCapitalize="words"
              autoCorrect={false}
              maxLength={60}
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => telEstabRef.current?.focus()}
            />
          </View>

          <View style={estilos.campo}>
            <AppText style={estilos.label}>Telefone do estabelecimento</AppText>
            <TextInput
              ref={telEstabRef}
              style={[estilos.input, erros.telefoneEstabelecimento ? estilos.inputErro : telEstabValido ? estilos.inputValido : null]}
              value={telefoneEstabelecimento}
              onChangeText={t => { setTelefoneEstabelecimento(mascaraTelefone(t)); limparErro('telefoneEstabelecimento'); setTelEstabValido(false) }}
              placeholder="(00) 00000-0000"
              placeholderTextColor={CORES.placeholder}
              keyboardType="phone-pad"
              maxLength={15}
              onBlur={handleTelEstabBlur}
              onFocus={() => limparErro('telefoneEstabelecimento')}
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => quantidadeRef.current?.focus()}
            />
            {!!erros.telefoneEstabelecimento && <AppText style={estilos.textoErro}>{erros.telefoneEstabelecimento}</AppText>}
          </View>

          {/* ── Data ──────────────────────────────────────────────────── */}
          <CampoData label="Data" obrigatorio valor={data} onChange={setData} />

          {/* ── Quantidade e Valor unitário ────────────────────────────── */}
          <View style={estilos.linha}>
            <View style={[estilos.campo, { flex: 1, marginRight: ESPACOS.sm }]}>
              <AppText style={estilos.label}>Quantidade</AppText>
              <TextInput
                ref={quantidadeRef}
                style={estilos.input}
                value={quantidade}
                onChangeText={setQuantidade}
                placeholder="Ex: 2"
                placeholderTextColor={CORES.placeholder}
                keyboardType="decimal-pad"
                maxLength={4}
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => valorUnitRef.current?.focus()}
              />
            </View>
            <View style={[estilos.campo, { flex: 1 }]}>
              <AppText style={estilos.label}>Valor unit. (R$)</AppText>
              <TextInput
                ref={valorUnitRef}
                style={estilos.input}
                value={valorUnitario}
                onChangeText={t => setValorUnitario(mascaraMoeda(t))}
                placeholder="R$ 0,00"
                placeholderTextColor={CORES.placeholder}
                keyboardType="numeric"
                maxLength={12}
                returnKeyType="done"
                blurOnSubmit={true}
              />
            </View>
          </View>

          {/* ── Valor total (somente leitura) ──────────────────────────── */}
          <View style={estilos.campo}>
            <AppText style={estilos.label}>Valor total (R$)</AppText>
            <View style={estilos.inputLeitura}>
              <AppText style={estilos.inputLeituraTexto}>{valorTotalDisplay}</AppText>
              <Ionicons name="calculator-outline" size={18} color={CORES.cinzaTexto} />
            </View>
            <AppText style={estilos.hintLeitura}>Calculado automaticamente: Quantidade × Valor unit.</AppText>
          </View>

          {/* ── Fotos ─────────────────────────────────────────────────── */}
          <FotosPicker
            fotos={fotos}
            onFotosChange={setFotos}
            desabilitado={!estaLogado}
            onBloqueado={() => requireAuth(() => {})}
          />

          {/* ── Salvar ────────────────────────────────────────────────── */}
          <TouchableOpacity
            style={[estilos.botao, carregando && { opacity: 0.6 }]}
            onPress={handleSalvar}
            disabled={carregando}
          >
            {carregando
              ? <ActivityIndicator color={CORES.branco} />
              : <AppText style={estilos.textoBotao}>{edit ? 'Salvar Alterações' : 'Salvar'}</AppText>
            }
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const estilos = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: CORES.primaria },
  header: {
    backgroundColor: CORES.primaria,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ESPACOS.lg,
    paddingVertical: ESPACOS.md,
  },
  headerTitulo:  { color: CORES.branco, fontSize: FONTES.media, fontWeight: '700' },
  headerCentro:  { flexDirection: 'row', alignItems: 'center' },
  headerDireita: { flexDirection: 'row', alignItems: 'center' },
  headerOla:     { color: CORES.cinzaTexto, fontSize: FONTES.pequena },
  headerNome:    { color: CORES.branco, fontSize: FONTES.normal, fontWeight: '700' },
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
  scroll:        { flex: 1, backgroundColor: CORES.cinzaClaro },
  conteudo:      { padding: ESPACOS.lg, paddingBottom: ESPACOS.xxl },
  campo:         { marginBottom: ESPACOS.md },
  linha:         { flexDirection: 'row' },
  labelRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: ESPACOS.xs },
  label:         { fontSize: FONTES.normal, fontWeight: '600', color: CORES.texto, marginBottom: ESPACOS.xs },
  obrig:         { color: CORES.erro, fontWeight: '700' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CORES.branco,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: CORES.borda,
    paddingHorizontal: ESPACOS.md,
    height: 50,
  },
  inputFlex:     { flex: 1, fontSize: FONTES.normal, color: CORES.texto },
  input: {
    backgroundColor: CORES.branco,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: CORES.borda,
    paddingHorizontal: ESPACOS.md,
    height: 50,
    fontSize: FONTES.normal,
    color: CORES.texto,
  },
  inputMultiline: {
    backgroundColor: CORES.branco,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: CORES.borda,
    paddingHorizontal: ESPACOS.md,
    paddingTop: ESPACOS.sm,
    height: 90,
    fontSize: FONTES.normal,
    color: CORES.texto,
    textAlignVertical: 'top',
  },
  inputErro:     { borderColor: CORES.erro },
  inputValido:   { borderColor: CORES.secundaria },
  textoErro:     { color: CORES.erro, fontSize: FONTES.pequena, marginTop: ESPACOS.xs },
  inputLeitura: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: CORES.cinzaMedio,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: CORES.borda,
    paddingHorizontal: ESPACOS.md,
    height: 50,
  },
  inputLeituraTexto: { fontSize: FONTES.media, color: CORES.texto, fontWeight: '700' },
  hintLeitura:       { fontSize: 11, color: CORES.textoSecundario, marginTop: ESPACOS.xs },
  chipScroll:    { marginBottom: ESPACOS.xs },
  chip: {
    borderWidth: 1.5,
    borderColor: CORES.borda,
    borderRadius: 20,
    paddingHorizontal: ESPACOS.md,
    paddingVertical: ESPACOS.sm,
    marginRight: ESPACOS.sm,
    backgroundColor: CORES.branco,
    maxWidth: 220,
  },
  chipAtivo:      { borderColor: CORES.secundaria, backgroundColor: '#E8FAF0' },
  chipTexto:      { fontSize: FONTES.pequena, color: CORES.texto },
  chipTextoAtivo: { color: CORES.secundariaEscuro, fontWeight: '700' },
  avisoVeiculo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACOS.xs,
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: ESPACOS.md,
    marginBottom: ESPACOS.xs,
  },
  avisoTexto:    { fontSize: FONTES.pequena, color: CORES.texto, flex: 1 },
  botao: {
    backgroundColor: CORES.secundaria,
    borderRadius: 20,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: ESPACOS.md,
  },
  textoBotao:    { color: CORES.branco, fontSize: FONTES.media, fontWeight: '700' },
})
