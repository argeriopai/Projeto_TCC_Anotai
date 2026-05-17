import React, { useState, useEffect, useCallback } from 'react'
import {
  View, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Modal, FlatList,
} from 'react-native'
import { AppText } from '../../components/AppText'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { registrarNotificacaoApi, editarNotificacaoApi, Notificacao } from '../../services/api'
import { agendarNotificacao, cancelarNotificacao, salvarMapeamento, buscarOsNotifId } from '../../services/notificacoes'
import { CORES, FONTES, ESPACOS } from '../../constants/cores'
import { useAuth } from '../../contexts/AuthContext'
import { AvatarCircular } from '../../components/AvatarCircular'
import { useVoiceInput } from '../../hooks/useVoiceInput'
import { BotaoMic, IndicadorGravando } from '../../components/BotaoMic'
import { CampoData, formatarData } from '../../components/CampoData'
import { useVeiculo } from '../../contexts/VeiculoContext'
import { useAuthGuard } from '../../hooks/useAuthGuard'
import { useConfirmarSaida } from '../../hooks/useConfirmarSaida'

interface Props { navigation: any; route: any }

function parseDateStr(dateStr: string): Date {
  const [d, m, y] = dateStr.split('/').map(Number)
  return new Date(y, m - 1, d)
}

const TIPOS_REVISAO_CARRO = [
  'Revisão periódica',
  'Troca de óleo',
  'Vencimento do IPVA',
  'Vencimento do seguro',
  'Licenciamento',
  'Pneus',
  'Outro',
]

const TIPOS_REVISAO_MOTO = [
  'Revisão periódica',
  'Troca de óleo',
  'Vencimento do IPVA',
  'Vencimento do seguro',
  'Licenciamento',
  'Pneus',
  'Outro',
]

const OPCOES_DIAS_ANTES = [
  'No dia do evento',
  '1 dia antes',
  '2 dias antes',
  '3 dias antes',
  '4 dias antes',
  '5 dias antes',
]

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

export function TelaRegistrarNotificacao({ navigation, route }: Props) {
  const edit: Notificacao | undefined = route.params?.registroParaEditar
  const { proprietario } = useAuth()
  const { veiculoAtivo } = useVeiculo()
  const { requireAuth } = useAuthGuard()
  const apelido = proprietario?.apelido ?? proprietario?.nome?.split(' ')[0] ?? 'Usuário'

  const todostipos = [...TIPOS_REVISAO_CARRO, ...TIPOS_REVISAO_MOTO]
  const tipoInicial = edit
    ? (todostipos.includes(edit.tipo) ? edit.tipo : 'Outro')
    : ''
  const [tipo,      setTipo]      = useState(tipoInicial)
  const [tipoOutro, setTipoOutro] = useState(
    edit && !TIPOS_REVISAO_CARRO.slice(0, -1).includes(edit.tipo) ? edit.tipo : ''
  )
  const [mensagem,   setMensagem]   = useState(edit?.mensagem ?? '')
  const [data,       setData]       = useState(() => edit?.data ? parseDateStr(edit.data) : new Date())
  const [diasAntesStr, setDiasAntesStr] = useState(
    edit ? (
      (edit as any).diasAntes === 0 ? 'No dia do evento' :
      `${(edit as any).diasAntes ?? 1} dia${((edit as any).diasAntes ?? 1) > 1 ? 's' : ''} antes`
    ) : '1 dia antes'
  )
  const [carregando, setCarregando] = useState(false)
  const [erros,      setErros]      = useState<Record<string, string>>({})

  const [veiculoId] = useState<string | null>(edit?.veiculoId ?? veiculoAtivo?.id ?? null)

  const { gravando: gravandoMensagem, iniciarGravacao, pararGravacao } = useVoiceInput(
    text => setMensagem(prev => prev ? prev + ' ' + text : text)
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

  async function toggleMic() {
    if (gravandoMensagem) {
      await pararGravacao()
    } else {
      await iniciarGravacao()
    }
  }

  const temAlteracao = useCallback(() => {
    if (edit) return true
    return !!tipo || !!mensagem.trim()
  }, [edit, tipo, mensagem])
  const handleVoltar = useConfirmarSaida(navigation, temAlteracao)

  function parseDiasAntes(str: string): number {
    if (str === 'No dia do evento') return 0
    return parseInt(str) || 1
  }

  function limparErro(campo: string) {
    setErros(e => ({ ...e, [campo]: '' }))
  }

  function validar(): boolean {
    const e: Record<string, string> = {}
    if (!tipo.trim())     e.tipo     = 'Selecione o tipo de revisão'
    if (tipo === 'Outro' && !tipoOutro.trim()) {
      Alert.alert('Campo obrigatório', 'Descreva o tipo de revisão.')
      return false
    }
    setErros(e)
    return Object.keys(e).length === 0
  }

  function handleSalvar() {
    requireAuth(async () => {
      if (!validar()) return
      setCarregando(true)
      const payload = {
        tipo:      tipo === 'Outro' ? tipoOutro.trim() : tipo,
        mensagem:  mensagem.trim(),
        data:      formatarData(data),
        veiculoId: veiculoAtivo?.id ?? veiculoId ?? undefined,
      }
      try {
        if (edit) {
          await editarNotificacaoApi(edit.id, payload)
          const osAntigo = await buscarOsNotifId(edit.id)
          if (osAntigo) await cancelarNotificacao(osAntigo)
          const novoNotifId = await agendarNotificacao(tipo.trim(), mensagem.trim(), data, { notificacaoId: edit.id, veiculoId: veiculoAtivo?.id ?? veiculoId ?? null, diasAntes: parseDiasAntes(diasAntesStr) }, proprietario?.id ?? undefined, parseDiasAntes(diasAntesStr))
          if (novoNotifId) await salvarMapeamento(edit.id, novoNotifId)
          Alert.alert('Sucesso!', 'Revisão atualizada com sucesso.', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ])
        } else {
          const apiRes = await registrarNotificacaoApi(payload)
          const notifId = await agendarNotificacao(tipo.trim(), mensagem.trim(), data, { notificacaoId: apiRes.data.id, veiculoId: veiculoAtivo?.id ?? null, diasAntes: parseDiasAntes(diasAntesStr) }, proprietario?.id ?? undefined, parseDiasAntes(diasAntesStr))
          if (notifId) await salvarMapeamento(apiRes.data.id, notifId)
          const msg = notifId
            ? 'Revisão registrada! Você receberá uma notificação no dia agendado.'
            : 'Revisão registrada com sucesso.'
          Alert.alert('Sucesso!', msg, [
            { text: 'OK', onPress: () => navigation.goBack() },
          ])
        }
      } catch (error: any) {
        Alert.alert('Erro', error.response?.data?.erro ?? 'Não foi possível salvar a revisão.')
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
        <Ionicons name="calendar-outline" size={24} color={CORES.secundaria} />
        <AppText style={estilos.tituloTexto}>{edit ? 'Editar Revisão' : 'Registrar Revisão'}</AppText>
      </View>
      <View style={estilos.divisoria} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={estilos.scroll} contentContainerStyle={estilos.conteudo} keyboardShouldPersistTaps="handled">

          {/* Tipo de notificação */}
          <CampoDropdown
            label="Tipo"
            obrigatorio
            valor={tipo === 'Outro' ? '' : tipo}
            placeholder="Selecione o tipo de revisão"
            opcoes={veiculoAtivo?.tipo === 'moto' ? TIPOS_REVISAO_MOTO : TIPOS_REVISAO_CARRO}
            erro={erros.tipo}
            onChange={t => { setTipo(t); limparErro('tipo') }}
          />
          {tipo === 'Outro' && (
            <TextInput
              style={[estilos.input, !tipoOutro.trim() && estilos.inputErro, { marginBottom: ESPACOS.md }]}
              placeholder="Descreva o tipo de revisão..."
              placeholderTextColor={CORES.placeholder}
              value={tipoOutro}
              onChangeText={setTipoOutro}
              autoCapitalize="sentences"
              autoCorrect={false}
              maxLength={50}
            />
          )}

          <View style={{ height: ESPACOS.md }} />

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

          {/* Mensagem com microfone */}
          <View style={estilos.campo}>
            <View style={estilos.labelRow}>
              <AppText style={estilos.label}>Mensagem</AppText>
              <BotaoMic gravando={gravandoMensagem} onPress={toggleMic} />
            </View>
            {gravandoMensagem && <IndicadorGravando />}
            <TextInput
              style={[
                estilos.input,
                { height: 90, textAlignVertical: 'top', paddingTop: ESPACOS.sm },
                erros.mensagem ? estilos.inputErro : null,
              ]}
              value={mensagem}
              onChangeText={t => { setMensagem(t); limparErro('mensagem') }}
              placeholder="Descreva o lembrete..."
              placeholderTextColor={CORES.placeholder}
              multiline
              maxLength={200}
              autoCapitalize="sentences"
              returnKeyType="done"
              blurOnSubmit={false}
            />
            {!!erros.mensagem && <AppText style={estilos.textoErro}>{erros.mensagem}</AppText>}
          </View>

          {/* Data do lembrete — pode ser futura */}
          <CampoData
            label="Data do lembrete"
            obrigatorio
            valor={data}
            onChange={setData}
            permitirFuturo
          />
          <CampoDropdown
            label="Notificar com antecedência"
            valor={diasAntesStr}
            placeholder="Selecione a antecedência"
            opcoes={OPCOES_DIAS_ANTES}
            onChange={setDiasAntesStr}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, marginBottom: 8 }}>
            <Ionicons name="information-circle-outline" size={14} color="#666" style={{ marginRight: 4 }} />
            <AppText style={{ fontSize: 12, color: '#666' }}>
              {parseDiasAntes(diasAntesStr) === 0
                ? 'Você será notificado no dia do evento às 08:00'
                : `Você será notificado ${diasAntesStr} às 08:00`}
            </AppText>
          </View>

          <TouchableOpacity
            style={[estilos.botao, carregando && { opacity: 0.6 }]}
            onPress={handleSalvar}
            disabled={carregando}
            accessible={true}
            accessibilityLabel={edit ? 'Salvar alterações da revisão' : 'Salvar revisão'}
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
  labelRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: ESPACOS.xs },
  label:         { fontSize: FONTES.normal, fontWeight: '600', color: CORES.texto },
  obrig:         { color: CORES.erro, fontWeight: '700' },
  opcional:      { color: CORES.textoSecundario, fontWeight: '400' },
  semVeiculo:    { fontSize: FONTES.pequena, color: CORES.textoSecundario, marginBottom: ESPACOS.sm },
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
