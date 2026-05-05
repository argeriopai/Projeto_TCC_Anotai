import React, { useState, useEffect } from 'react'
import {
  View, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native'
import { AppText } from '../../components/AppText'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { listarCarrosApi, listarMotosApi, registrarNotificacaoApi, editarNotificacaoApi, Carro, Moto, Notificacao } from '../../services/api'
import { agendarNotificacao } from '../../services/notificacoes'
import { CORES, FONTES, ESPACOS } from '../../constants/cores'
import { useAuth } from '../../contexts/AuthContext'
import { AvatarCircular } from '../../components/AvatarCircular'
import { useVoiceInput } from '../../hooks/useVoiceInput'
import { BotaoMic, IndicadorGravando } from '../../components/BotaoMic'
import { CampoData, formatarData } from '../../components/CampoData'
import { useVeiculo } from '../../contexts/VeiculoContext'
import { useAuthGuard } from '../../hooks/useAuthGuard'

interface Props { navigation: any; route: any }

type VeiculoItem = { id: string; label: string }

function parseDateStr(dateStr: string): Date {
  const [d, m, y] = dateStr.split('/').map(Number)
  return new Date(y, m - 1, d)
}

const TIPOS_REVISAO = [
  'Revisão periódica',
  'Troca de óleo',
  'Vencimento do IPVA',
  'Vencimento do seguro',
  'Licenciamento',
  'Pneus',
  'Outro',
]

export function TelaRegistrarNotificacao({ navigation, route }: Props) {
  const edit: Notificacao | undefined = route.params?.registroParaEditar
  const { proprietario } = useAuth()
  const { veiculoAtivo } = useVeiculo()
  const { requireAuth } = useAuthGuard()
  const apelido = proprietario?.apelido ?? proprietario?.nome?.split(' ')[0] ?? 'Usuário'

  const [tipo,       setTipo]       = useState(edit?.tipo ?? '')
  const [mensagem,   setMensagem]   = useState(edit?.mensagem ?? '')
  const [data,       setData]       = useState(() => edit?.data ? parseDateStr(edit.data) : new Date())
  const [carregando, setCarregando] = useState(false)
  const [erros,      setErros]      = useState<Record<string, string>>({})

  const [veiculos,           setVeiculos]           = useState<VeiculoItem[]>([])
  const [veiculoId,          setVeiculoId]          = useState<string | null>(edit?.veiculoId ?? null)
  const [carregandoVeiculos, setCarregandoVeiculos] = useState(true)

  const { isRecording, startRecording, stopRecording } = useVoiceInput()
  const [gravandoMensagem, setGravandoMensagem] = useState(false)

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
    async function carregarVeiculos() {
      try {
        const [resCarros, resMotos] = await Promise.all([listarCarrosApi(), listarMotosApi()])
        const lista: VeiculoItem[] = [
          ...resCarros.data.map((c: Carro) => ({ id: c.id, label: `🚗 ${c.marca} ${c.modelo} — ${c.placa}` })),
          ...resMotos.data.map((m: Moto)  => ({ id: m.id, label: `🏍️ ${m.marca} ${m.modelo} — ${m.placa}` })),
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

  async function toggleMic() {
    if (isRecording && gravandoMensagem) {
      await stopRecording()
      setGravandoMensagem(false)
    } else {
      setGravandoMensagem(true)
      await startRecording()
    }
  }

  function limparErro(campo: string) {
    setErros(e => ({ ...e, [campo]: '' }))
  }

  function validar(): boolean {
    const e: Record<string, string> = {}
    if (!tipo.trim())     e.tipo     = 'Selecione o tipo de revisão'
    if (!mensagem.trim()) e.mensagem = 'Informe a mensagem'
    setErros(e)
    return Object.keys(e).length === 0
  }

  function handleSalvar() {
    requireAuth(async () => {
      if (!validar()) return
      setCarregando(true)
      const payload = {
        tipo:      tipo.trim(),
        mensagem:  mensagem.trim(),
        data:      formatarData(data),
        veiculoId: veiculoId ?? undefined,
      }
      try {
        if (edit) {
          await editarNotificacaoApi(edit.id, payload)
          Alert.alert('Sucesso!', 'Revisão atualizada com sucesso.', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ])
        } else {
          await registrarNotificacaoApi(payload)
          const notifId = await agendarNotificacao(tipo.trim(), mensagem.trim(), data)
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
        <Ionicons name="calendar-outline" size={24} color={CORES.secundaria} />
        <AppText style={estilos.tituloTexto}>{edit ? 'Editar Revisão' : 'Registrar Revisão'}</AppText>
      </View>
      <View style={estilos.divisoria} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={estilos.scroll} contentContainerStyle={estilos.conteudo} keyboardShouldPersistTaps="handled">

          {/* Tipo de notificação */}
          <AppText style={estilos.label}>Tipo <AppText style={estilos.obrig}>*</AppText></AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={estilos.chipScroll}>
            {TIPOS_REVISAO.map(t => (
              <TouchableOpacity
                key={t}
                style={[estilos.chip, tipo === t && estilos.chipAtivo]}
                onPress={() => { setTipo(t); limparErro('tipo') }}
                accessible={true}
                accessibilityLabel={`Tipo de revisão: ${t}`}
                accessibilityRole="radio"
                accessibilityState={{ selected: tipo === t }}
              >
                <AppText style={[estilos.chipTexto, tipo === t && estilos.chipTextoAtivo]}>{t}</AppText>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {!!erros.tipo && <AppText style={estilos.textoErro}>{erros.tipo}</AppText>}

          <View style={{ height: ESPACOS.md }} />

          {/* Veículo (opcional) */}
          <AppText style={estilos.label}>Veículo <AppText style={estilos.opcional}>(opcional)</AppText></AppText>
          {carregandoVeiculos ? (
            <ActivityIndicator color={CORES.secundaria} style={{ marginVertical: ESPACOS.sm }} />
          ) : veiculos.length === 0 ? (
            <AppText style={estilos.semVeiculo}>Nenhum veículo cadastrado.</AppText>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={estilos.chipScroll}>
              {veiculos.map(v => (
                <TouchableOpacity
                  key={v.id}
                  style={[estilos.chip, veiculoId === v.id && estilos.chipAtivo]}
                  onPress={() => setVeiculoId(prev => prev === v.id ? null : v.id)}
                >
                  <AppText style={[estilos.chipTexto, veiculoId === v.id && estilos.chipTextoAtivo]} numberOfLines={1}>
                    {v.label}
                  </AppText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <View style={{ height: ESPACOS.md }} />

          {/* Mensagem com microfone */}
          <View style={estilos.campo}>
            <View style={estilos.labelRow}>
              <AppText style={estilos.label}>Mensagem <AppText style={estilos.obrig}>*</AppText></AppText>
              <BotaoMic gravando={isRecording && gravandoMensagem} onPress={toggleMic} />
            </View>
            {isRecording && gravandoMensagem && <IndicadorGravando />}
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
})
