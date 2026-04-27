import React, { useState, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { listarCarrosApi, listarMotosApi, registrarNotificacaoApi, editarNotificacaoApi, Carro, Moto, Notificacao } from '../../services/api'
import { CORES, FONTES, ESPACOS } from '../../constants/cores'
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
  const { veiculoAtivo } = useVeiculo()
  const { requireAuth } = useAuthGuard()

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
          Alert.alert('Sucesso!', 'Revisão registrada com sucesso.', [
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
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={CORES.branco} />
        </TouchableOpacity>
        <Text style={estilos.headerTitulo}>{edit ? 'Editar Revisão' : 'Registrar Revisão'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={estilos.scroll} contentContainerStyle={estilos.conteudo} keyboardShouldPersistTaps="handled">

          {/* Tipo de notificação */}
          <Text style={estilos.label}>Tipo <Text style={estilos.obrig}>*</Text></Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={estilos.chipScroll}>
            {TIPOS_REVISAO.map(t => (
              <TouchableOpacity
                key={t}
                style={[estilos.chip, tipo === t && estilos.chipAtivo]}
                onPress={() => { setTipo(t); limparErro('tipo') }}
              >
                <Text style={[estilos.chipTexto, tipo === t && estilos.chipTextoAtivo]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {!!erros.tipo && <Text style={estilos.textoErro}>{erros.tipo}</Text>}

          <View style={{ height: ESPACOS.md }} />

          {/* Veículo (opcional) */}
          <Text style={estilos.label}>Veículo <Text style={estilos.opcional}>(opcional)</Text></Text>
          {carregandoVeiculos ? (
            <ActivityIndicator color={CORES.secundaria} style={{ marginVertical: ESPACOS.sm }} />
          ) : veiculos.length === 0 ? (
            <Text style={estilos.semVeiculo}>Nenhum veículo cadastrado.</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={estilos.chipScroll}>
              {veiculos.map(v => (
                <TouchableOpacity
                  key={v.id}
                  style={[estilos.chip, veiculoId === v.id && estilos.chipAtivo]}
                  onPress={() => setVeiculoId(prev => prev === v.id ? null : v.id)}
                >
                  <Text style={[estilos.chipTexto, veiculoId === v.id && estilos.chipTextoAtivo]} numberOfLines={1}>
                    {v.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <View style={{ height: ESPACOS.md }} />

          {/* Mensagem com microfone */}
          <View style={estilos.campo}>
            <View style={estilos.labelRow}>
              <Text style={estilos.label}>Mensagem <Text style={estilos.obrig}>*</Text></Text>
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
              placeholderTextColor={CORES.cinzaTexto}
              multiline
              autoCapitalize="sentences"
              blurOnSubmit={false}
            />
            {!!erros.mensagem && <Text style={estilos.textoErro}>{erros.mensagem}</Text>}
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
          >
            {carregando
              ? <ActivityIndicator color={CORES.branco} />
              : <Text style={estilos.textoBotao}>{edit ? 'Salvar Alterações' : 'Salvar'}</Text>
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
  scroll:        { flex: 1, backgroundColor: CORES.cinzaClaro },
  conteudo:      { padding: ESPACOS.lg, paddingBottom: ESPACOS.xxl },
  campo:         { marginBottom: ESPACOS.md },
  labelRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: ESPACOS.xs },
  label:         { fontSize: FONTES.normal, fontWeight: '600', color: CORES.texto },
  obrig:         { color: CORES.erro, fontWeight: '700' },
  opcional:      { color: CORES.cinzaTexto, fontWeight: '400' },
  semVeiculo:    { fontSize: FONTES.pequena, color: CORES.cinzaTexto, marginBottom: ESPACOS.sm },
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
