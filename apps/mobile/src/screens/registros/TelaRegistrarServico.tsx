import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  View, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Modal, FlatList,
} from 'react-native'
import { AppText } from '../../components/AppText'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { registrarServicoApi, atualizarServicoApi, Servico } from '../../services/api'
import { CORES, FONTES, ESPACOS } from '../../constants/cores'
import { useVoiceInput } from '../../hooks/useVoiceInput'
import { BotaoMic, IndicadorGravando } from '../../components/BotaoMic'
import { CampoData, formatarData } from '../../components/CampoData'
import { mascaraMoeda, mascaraTelefone, parseMoeda } from '../../utils/mascaras'
import { useVeiculo } from '../../contexts/VeiculoContext'
import { useAuth } from '../../contexts/AuthContext'
import { useAuthGuard } from '../../hooks/useAuthGuard'
import { AvatarCircular } from '../../components/AvatarCircular'
import { FotosPicker, FotoSections, FOTOS_VAZIAS } from '../../components/FotosPicker'
import { buscarFotos, salvarFotos, temFotos } from '../../utils/fotosStorage'
import { useConfirmarSaida } from '../../hooks/useConfirmarSaida'
import { TIPOS_VEICULO_CARRO, TIPOS_VEICULO_MOTO } from '../../constants/tiposServico'

interface Props { navigation: any; route: any }

function parseDateStr(dateStr: string): Date {
  const [d, m, y] = dateStr.split('/').map(Number)
  return new Date(y, m - 1, d)
}

function parseGarantia(val: string | undefined): { numero: string; unidade: string } {
  if (!val) return { numero: '', unidade: 'Meses' }
  const parts = val.trim().split(' ')
  const last = parts[parts.length - 1].toLowerCase()
  if (last === 'anos' || last === 'ano') return { numero: parts.slice(0, -1).join(' '), unidade: 'Anos' }
  if (last === 'meses' || last === 'mês' || last === 'mes') return { numero: parts.slice(0, -1).join(' '), unidade: 'Meses' }
  return { numero: val, unidade: 'Meses' }
}

interface DropdownProps {
  label: string
  obrigatorio?: boolean
  valor: string
  placeholder: string
  opcoes: string[]
  erro?: string
  onChange: (v: string) => void
}

function CampoDropdown({ label, obrigatorio, valor, placeholder, opcoes, erro, onChange }: DropdownProps) {
  const [aberto, setAberto] = useState(false)
  return (
    <View style={estilos.campo}>
      <AppText style={estilos.label}>
        {label}{obrigatorio && <AppText style={estilos.obrig}> *</AppText>}
      </AppText>
      <TouchableOpacity
        style={[estilos.dropdownBtn, erro ? estilos.inputErro : null]}
        onPress={() => setAberto(true)}
        activeOpacity={0.7}
      >
        <AppText style={[estilos.dropdownTexto, !valor && { color: CORES.placeholder }]}>
          {valor || placeholder}
        </AppText>
        <Ionicons name="chevron-down" size={18} color={CORES.cinzaTexto} />
      </TouchableOpacity>
      {!!erro && <AppText style={estilos.textoErro}>{erro}</AppText>}
      <Modal visible={aberto} transparent animationType="fade" onRequestClose={() => setAberto(false)}>
        <TouchableOpacity style={estilos.overlay} activeOpacity={1} onPress={() => setAberto(false)}>
          <View style={estilos.modalBox}>
            <AppText style={estilos.modalTitulo}>{label}</AppText>
            <FlatList
              data={opcoes}
              keyExtractor={item => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[estilos.opcaoItem, valor === item && estilos.opcaoAtiva]}
                  onPress={() => { onChange(item); setAberto(false) }}
                >
                  <AppText style={[estilos.opcaoTexto, valor === item && estilos.opcaoTextoAtivo]}>
                    {item}
                  </AppText>
                  {valor === item && (
                    <Ionicons name="checkmark" size={18} color={CORES.secundaria} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}

export function TelaRegistrarServico({ navigation, route }: Props) {
  const edit: Servico | undefined = route.params?.registroParaEditar
  const { proprietario } = useAuth()
  const { veiculoAtivo } = useVeiculo()
  const { requireAuth, estaLogado } = useAuthGuard()
  const apelido = proprietario?.apelido ?? proprietario?.nome?.split(' ')[0] ?? 'Usuário'
  const [fotos, setFotos] = useState<FotoSections>(FOTOS_VAZIAS)

  const tipoRef           = useRef<TextInput>(null)
  const descricaoRef      = useRef<TextInput>(null)
  const custoRef          = useRef<TextInput>(null)
  const estabelecimentoRef = useRef<TextInput>(null)
  const telEstabRef       = useRef<TextInput>(null)
  const profissionalRef   = useRef<TextInput>(null)
  const telProfRef        = useRef<TextInput>(null)
  const garantiaRef       = useRef<TextInput>(null)
  const kilometragemRef   = useRef<TextInput>(null)

  const tipoInicial = edit
    ? ([...TIPOS_VEICULO_CARRO, ...TIPOS_VEICULO_MOTO].includes(edit.tipo ?? '')
        ? edit.tipo ?? ''
        : 'Outro')
    : ''
  const [tipo,                    setTipo]                    = useState(tipoInicial)
  const [tipoOutro, setTipoOutro] = useState(
    edit && ![...TIPOS_VEICULO_CARRO, ...TIPOS_VEICULO_MOTO]
      .includes(edit.tipo ?? '') ? edit.tipo ?? '' : ''
  )
  const [descricao,               setDescricao]               = useState(edit?.descricao ?? '')
  const [data,                    setData]                    = useState(() => edit?.data ? parseDateStr(edit.data) : new Date())
  const [custo,                   setCusto]                   = useState(() => edit?.custo !== undefined ? mascaraMoeda(Math.round(edit.custo * 100).toString()) : '')
  const [estabelecimento,         setEstabelecimento]         = useState(edit?.estabelecimento ?? '')
  const [telefoneEstabelecimento, setTelefoneEstabelecimento] = useState(edit?.telefoneEstabelecimento ?? '')
  const [profissional,            setProfissional]            = useState(edit?.profissional ?? '')
  const [telefoneProfissional,    setTelefoneProfissional]    = useState(edit?.telefoneProfissional ?? '')
  const [garantiaNumero,          setGarantiaNumero]          = useState(() => parseGarantia(edit?.garantia).numero)
  const [garantiaUnidade,         setGarantiaUnidade]         = useState(() => parseGarantia(edit?.garantia).unidade)
  const [garantiaUnidadeAberta,   setGarantiaUnidadeAberta]   = useState(false)
  const [kilometragem,            setKilometragem]            = useState(edit?.kilometragem ?? '')
  const [carregando,              setCarregando]              = useState(false)
  const [erros,                   setErros]                   = useState<Record<string, string>>({})
  const [telEstabValido, setTelEstabValido] = useState(false)
  const [telProfValido,  setTelProfValido]  = useState(false)

  const [veiculoId] = useState<string | null>(edit?.veiculoId ?? veiculoAtivo?.id ?? null)

  const { gravando: gravandoDescricao, iniciarGravacao, pararGravacao } = useVoiceInput(
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

  async function toggleMic() {
    if (gravandoDescricao) {
      await pararGravacao()
    } else {
      await iniciarGravacao()
    }
  }

  const temAlteracao = useCallback(() => {
    if (edit) return true
    return !!tipo.trim() || !!descricao.trim() || !!custo ||
      !!estabelecimento.trim() || !!telefoneEstabelecimento ||
      !!profissional.trim() || !!telefoneProfissional ||
      !!garantiaNumero.trim() || !!kilometragem.trim()
  }, [edit, tipo, descricao, custo, estabelecimento,
      telefoneEstabelecimento, profissional,
      telefoneProfissional, garantiaNumero, kilometragem])
  const handleVoltar = useConfirmarSaida(navigation, temAlteracao)

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

  function handleTelProfBlur() {
    const d = telefoneProfissional.replace(/\D/g, '')
    if (telefoneProfissional.length > 0 && d.length !== 11) {
      setErros(e => ({ ...e, telefoneProfissional: 'Telefone inválido. Use o formato (99) 99999-9999' }))
      setTelProfValido(false)
    } else {
      setTelProfValido(d.length === 11)
    }
  }

  function validar(): boolean {
    const e: Record<string, string> = {}
    if (!veiculoAtivo) {
      Alert.alert(
        'Nenhum veículo ativo',
        'Ative um veículo na página inicial antes de registrar.'
      )
      return false
    }
    if (!tipo.trim()) e.tipo    = 'Informe o tipo de serviço'
    if (tipo === 'Outro' && !tipoOutro.trim()) {
      Alert.alert('Campo obrigatório', 'Descreva o tipo de serviço.')
      return false
    }
    if (telefoneEstabelecimento && telefoneEstabelecimento.replace(/\D/g, '').length !== 11)
      e.telefoneEstabelecimento = 'Telefone inválido. Use o formato (99) 99999-9999'
    if (telefoneProfissional && telefoneProfissional.replace(/\D/g, '').length !== 11)
      e.telefoneProfissional = 'Telefone inválido. Use o formato (99) 99999-9999'
    setErros(e)
    return Object.keys(e).length === 0
  }

  function handleSalvar() {
    requireAuth(async () => {
      if (!validar()) return
      setCarregando(true)
      const payload = {
        veiculoId:               veiculoAtivo?.id ?? veiculoId!,
        tipo:                    tipo === 'Outro' ? tipoOutro.trim() : tipo,
        descricao:               descricao.trim()               || undefined,
        data:                    formatarData(data),
        custo:                   custo ? parseMoeda(custo) : undefined,
        estabelecimento:         estabelecimento.trim()         || undefined,
        telefoneEstabelecimento: telefoneEstabelecimento.trim() || undefined,
        profissional:            profissional.trim()            || undefined,
        telefoneProfissional:    telefoneProfissional.trim()    || undefined,
        garantia:                garantiaNumero.trim() ? `${garantiaNumero.trim()} ${garantiaUnidade}` : undefined,
        kilometragem:            kilometragem.trim()            || undefined,
      }
      try {
        if (edit) {
          await atualizarServicoApi(edit.id, payload)
          const rec = { veiculoId: veiculoId!, registroId: edit.id, tipoRegistro: 'servico' as const, nomeRegistro: tipo.trim(), ...fotos }
          if (temFotos(rec)) await salvarFotos(rec)
          Alert.alert('Sucesso!', 'Serviço atualizado com sucesso.', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ])
        } else {
          const res = await registrarServicoApi(payload)
          const rec = { veiculoId: veiculoId!, registroId: res.data.id, tipoRegistro: 'servico' as const, nomeRegistro: tipo.trim(), ...fotos }
          if (temFotos(rec)) await salvarFotos(rec)
          Alert.alert('Sucesso!', 'Serviço registrado com sucesso.', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ])
        }
      } catch (error: any) {
        Alert.alert('Erro', error.response?.data?.erro ?? 'Não foi possível salvar o serviço.')
      } finally {
        setCarregando(false)
      }
    })
  }

  return (
    <SafeAreaView style={estilos.safe} edges={['top']}>
      <View style={estilos.header}>
        <TouchableOpacity
          onPress={handleVoltar}
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
        <Ionicons name="construct-outline" size={24} color={CORES.secundaria} />
        <AppText style={estilos.tituloTexto}>{edit ? 'Editar Serviço' : 'Registrar Serviço'}</AppText>
      </View>
      <View style={estilos.divisoria} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={estilos.scroll} contentContainerStyle={estilos.conteudo} keyboardShouldPersistTaps="handled">

          <AppText style={estilos.label}>Veículo ativo</AppText>
          <View style={estilos.cardVeiculoAtivo}>
            <Ionicons
              name={veiculoAtivo ? 'checkmark-circle' : 'alert-circle-outline'}
              size={18}
              color={veiculoAtivo ? CORES.secundaria : CORES.atencao}
            />
            <AppText style={estilos.cardVeiculoTexto} numberOfLines={1}>
              {veiculoAtivo
                ? `${veiculoAtivo.marca} ${veiculoAtivo.modelo} — ${veiculoAtivo.placa}`
                : 'Nenhum veículo ativo. Ative um na página inicial.'}
            </AppText>
          </View>

          <View style={{ height: ESPACOS.md }} />

          <CampoDropdown
            label="Tipo de serviço"
            obrigatorio
            valor={tipo}
            placeholder="Selecione o tipo de serviço"
            opcoes={veiculoAtivo?.tipo === 'moto' ? TIPOS_VEICULO_MOTO : TIPOS_VEICULO_CARRO}
            erro={erros.tipo}
            onChange={t => { setTipo(t); limparErro('tipo') }}
          />
          {tipo === 'Outro' && (
            <TextInput
              style={[estilos.input, !tipoOutro.trim() && estilos.inputErro, { marginBottom: ESPACOS.md }]}
              placeholder="Descreva o tipo de serviço..."
              placeholderTextColor={CORES.placeholder}
              value={tipoOutro}
              onChangeText={setTipoOutro}
              autoCapitalize="sentences"
              maxLength={50}
            />
          )}

          {/* Descrição com microfone */}
          <View style={estilos.campo}>
            <View style={estilos.labelRow}>
              <AppText style={estilos.label}>Descrição</AppText>
              <BotaoMic gravando={gravandoDescricao} onPress={toggleMic} />
            </View>
            {gravandoDescricao && <IndicadorGravando />}
            <TextInput
              ref={descricaoRef}
              style={[estilos.input, { height: 80, textAlignVertical: 'top', paddingTop: ESPACOS.sm }]}
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

          {/* Data + Custo lado a lado */}
          <View style={estilos.linha}>
            <View style={{ flex: 1, marginRight: ESPACOS.sm }}>
              <CampoData
                label="Data"
                obrigatorio
                valor={data}
                onChange={setData}
              />
            </View>
            <View style={[estilos.campo, { flex: 1 }]}>
              <AppText style={estilos.label}>Custo (R$)</AppText>
              <TextInput
                ref={custoRef}
                style={estilos.input}
                value={custo}
                onChangeText={t => setCusto(mascaraMoeda(t))}
                placeholder="R$ 0,00"
                placeholderTextColor={CORES.placeholder}
                keyboardType="numeric"
                maxLength={12}
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => estabelecimentoRef.current?.focus()}
              />
            </View>
          </View>

          <View style={estilos.campo}>
            <AppText style={estilos.label}>Estabelecimento</AppText>
            <TextInput
              ref={estabelecimentoRef}
              style={estilos.input}
              value={estabelecimento}
              onChangeText={setEstabelecimento}
              placeholder="Ex: Auto Center Silva"
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
              onSubmitEditing={() => profissionalRef.current?.focus()}
            />
            {!!erros.telefoneEstabelecimento && <AppText style={estilos.textoErro}>{erros.telefoneEstabelecimento}</AppText>}
          </View>

          <View style={estilos.campo}>
            <AppText style={estilos.label}>Profissional</AppText>
            <TextInput
              ref={profissionalRef}
              style={estilos.input}
              value={profissional}
              onChangeText={setProfissional}
              placeholder="Ex: João Mecânico"
              placeholderTextColor={CORES.placeholder}
              autoCapitalize="words"
              autoCorrect={false}
              maxLength={60}
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => telProfRef.current?.focus()}
            />
          </View>

          <View style={estilos.campo}>
            <AppText style={estilos.label}>Telefone do profissional</AppText>
            <TextInput
              ref={telProfRef}
              style={[estilos.input, erros.telefoneProfissional ? estilos.inputErro : telProfValido ? estilos.inputValido : null]}
              value={telefoneProfissional}
              onChangeText={t => { setTelefoneProfissional(mascaraTelefone(t)); limparErro('telefoneProfissional'); setTelProfValido(false) }}
              placeholder="(00) 00000-0000"
              placeholderTextColor={CORES.placeholder}
              keyboardType="phone-pad"
              maxLength={15}
              onBlur={handleTelProfBlur}
              onFocus={() => limparErro('telefoneProfissional')}
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => garantiaRef.current?.focus()}
            />
            {!!erros.telefoneProfissional && <AppText style={estilos.textoErro}>{erros.telefoneProfissional}</AppText>}
          </View>

          <View style={estilos.campo}>
            <AppText style={estilos.label}>Garantia</AppText>
            <View style={estilos.linha}>
              <TextInput
                ref={garantiaRef}
                style={[estilos.input, { flex: 1, marginRight: ESPACOS.sm }]}
                value={garantiaNumero}
                onChangeText={v => setGarantiaNumero(v.replace(/\D/g, ''))}
                placeholder="Ex: 6"
                placeholderTextColor={CORES.placeholder}
                keyboardType="numeric"
                maxLength={3}
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => kilometragemRef.current?.focus()}
              />
              <TouchableOpacity
                style={[estilos.dropdownBtn, { flex: 1 }]}
                onPress={() => setGarantiaUnidadeAberta(true)}
                activeOpacity={0.7}
              >
                <AppText style={estilos.dropdownTexto}>{garantiaUnidade}</AppText>
                <Ionicons name="chevron-down" size={18} color={CORES.cinzaTexto} />
              </TouchableOpacity>
              <Modal visible={garantiaUnidadeAberta} transparent animationType="fade" onRequestClose={() => setGarantiaUnidadeAberta(false)}>
                <TouchableOpacity style={estilos.overlay} activeOpacity={1} onPress={() => setGarantiaUnidadeAberta(false)}>
                  <View style={estilos.modalBox}>
                    <AppText style={estilos.modalTitulo}>Unidade</AppText>
                    <FlatList
                      data={['Meses', 'Anos']}
                      keyExtractor={item => item}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={[estilos.opcaoItem, garantiaUnidade === item && estilos.opcaoAtiva]}
                          onPress={() => { setGarantiaUnidade(item); setGarantiaUnidadeAberta(false) }}
                        >
                          <AppText style={[estilos.opcaoTexto, garantiaUnidade === item && estilos.opcaoTextoAtivo]}>
                            {item}
                          </AppText>
                          {garantiaUnidade === item && <Ionicons name="checkmark" size={18} color={CORES.secundaria} />}
                        </TouchableOpacity>
                      )}
                    />
                  </View>
                </TouchableOpacity>
              </Modal>
            </View>
          </View>

          <View style={estilos.campo}>
            <AppText style={estilos.label}>Kilometragem</AppText>
            <TextInput
              ref={kilometragemRef}
              style={estilos.input}
              value={kilometragem}
              onChangeText={setKilometragem}
              placeholder="Ex: 45000"
              placeholderTextColor={CORES.placeholder}
              keyboardType="numeric"
              maxLength={7}
              returnKeyType="done"
              blurOnSubmit={true}
            />
          </View>

          <FotosPicker
            fotos={fotos}
            onFotosChange={setFotos}
            desabilitado={!estaLogado}
            onBloqueado={() => requireAuth(() => {})}
          />

          <TouchableOpacity
            style={[estilos.botao, carregando && { opacity: 0.6 }]}
            onPress={handleSalvar}
            disabled={carregando}
            accessible={true}
            accessibilityLabel={edit ? 'Salvar alterações do serviço' : 'Salvar serviço'}
            accessibilityRole="button"
            accessibilityState={{ disabled: carregando }}
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
  safe:         { flex: 1, backgroundColor: CORES.primaria },
  header: {
    backgroundColor: CORES.primaria,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ESPACOS.lg,
    paddingVertical: ESPACOS.md,
  },
  headerTitulo:   { color: CORES.branco, fontSize: FONTES.media, fontWeight: '700' },
  headerCentro:   { flexDirection: 'row', alignItems: 'center' },
  headerDireita:  { flexDirection: 'row', alignItems: 'center' },
  headerOla:      { color: CORES.cinzaTexto, fontSize: FONTES.pequena },
  headerNome:     { color: CORES.branco, fontSize: FONTES.normal, fontWeight: '700' },
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
  scroll:         { flex: 1, backgroundColor: CORES.cinzaClaro },
  conteudo:       { padding: ESPACOS.lg, paddingBottom: ESPACOS.xxl },
  campo:          { marginBottom: ESPACOS.md },
  linha:          { flexDirection: 'row' },
  labelRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: ESPACOS.xs },
  label:          { fontSize: FONTES.normal, fontWeight: '600', color: CORES.texto, marginBottom: ESPACOS.xs },
  obrig:          { color: CORES.erro, fontWeight: '700' },
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
  inputErro:      { borderColor: CORES.erro },
  inputValido:    { borderColor: CORES.secundaria },
  textoErro:      { color: CORES.erro, fontSize: FONTES.pequena, marginTop: ESPACOS.xs },
  chipScroll:     { marginBottom: ESPACOS.xs },
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
  avisoTexto:     { fontSize: FONTES.pequena, color: CORES.texto, flex: 1 },
  botao: {
    backgroundColor: CORES.secundaria,
    borderRadius: 20,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: ESPACOS.md,
  },
  textoBotao:     { color: CORES.branco, fontSize: FONTES.media, fontWeight: '700' },
  cardVeiculoAtivo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8FAF0',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: CORES.secundaria,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    marginBottom: ESPACOS.sm,
  },
  cardVeiculoTexto: {
    flex: 1,
    fontSize: FONTES.normal,
    color: CORES.primaria,
    fontWeight: '600',
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: CORES.branco,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: CORES.borda,
    paddingHorizontal: ESPACOS.md,
    height: 50,
  },
  dropdownTexto: { fontSize: FONTES.normal, color: CORES.texto, flex: 1 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: ESPACOS.md,
  },
  modalBox: {
    backgroundColor: CORES.branco,
    borderRadius: 16,
    maxHeight: 400,
    paddingVertical: ESPACOS.sm,
  },
  modalTitulo: {
    fontSize: FONTES.normal,
    fontWeight: '700',
    color: CORES.primaria,
    padding: ESPACOS.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  opcaoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ESPACOS.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  opcaoAtiva:      { backgroundColor: '#E8FAF0' },
  opcaoTexto:      { fontSize: FONTES.normal, color: CORES.texto, flex: 1 },
  opcaoTextoAtivo: { color: CORES.primaria, fontWeight: '600' },
})
