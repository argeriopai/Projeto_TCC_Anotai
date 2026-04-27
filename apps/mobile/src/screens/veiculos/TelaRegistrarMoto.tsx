import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
  Alert, Modal, FlatList,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { cadastrarMotoApi, atualizarMotoApi, Moto } from '../../services/api'
import { CORES, FONTES, ESPACOS } from '../../constants/cores'
import { useAuthGuard } from '../../hooks/useAuthGuard'

interface Props { navigation: any; route: any }

const FREIOS      = ['Tambor', 'Disco', 'Combinado', 'ABS']
const PARTIDAS    = ['Elétrica', 'Pedal', 'Ambas']
const ANOS        = Array.from({ length: 2026 - 1980 + 1 }, (_, i) => String(2026 - i))
const MARCAS_MOTO = [
  'Benelli', 'BMW', 'CF Moto', 'Dafra', 'Ducati', 'Harley-Davidson',
  'Honda', 'Husqvarna', 'Indian', 'Kawasaki', 'KTM', 'Shineray',
  'Suzuki', 'Traxx', 'Triumph', 'Yamaha', 'Outra',
]

interface DropdownProps {
  label:        string
  obrigatorio?: boolean
  valor:        string
  placeholder:  string
  opcoes:       string[]
  erro?:        string
  onChange:     (v: string) => void
}

function CampoDropdown({ label, obrigatorio, valor, placeholder, opcoes, erro, onChange }: DropdownProps) {
  const [aberto, setAberto] = useState(false)

  return (
    <View style={estilos.campo}>
      <Text style={estilos.label}>
        {label}{obrigatorio && <Text style={estilos.obrig}> *</Text>}
      </Text>
      <TouchableOpacity
        style={[estilos.dropdownBtn, erro ? estilos.inputErro : null]}
        onPress={() => setAberto(true)}
        activeOpacity={0.7}
      >
        <Text style={[estilos.dropdownTexto, !valor && { color: CORES.cinzaTexto }]}>
          {valor || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={CORES.cinzaTexto} />
      </TouchableOpacity>
      {!!erro && <Text style={estilos.textoErro}>{erro}</Text>}

      <Modal visible={aberto} transparent animationType="fade" onRequestClose={() => setAberto(false)}>
        <TouchableOpacity style={estilos.overlay} activeOpacity={1} onPress={() => setAberto(false)}>
          <View style={estilos.modalBox}>
            <Text style={estilos.modalTitulo}>{label}</Text>
            <FlatList
              data={opcoes}
              keyExtractor={item => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[estilos.opcaoItem, valor === item && estilos.opcaoAtiva]}
                  onPress={() => { onChange(item); setAberto(false) }}
                >
                  <Text style={[estilos.opcaoTexto, valor === item && estilos.opcaoTextoAtivo]}>
                    {item}
                  </Text>
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

export function TelaRegistrarMoto({ navigation, route }: Props) {
  const edit: Moto | undefined = route.params?.registroParaEditar
  const { requireAuth } = useAuthGuard()

  const [marcaSel,    setMarcaSel]    = useState(() => {
    const m = edit?.marca ?? ''
    return m && !MARCAS_MOTO.slice(0, -1).includes(m) ? 'Outra' : m
  })
  const [marcaCustom, setMarcaCustom] = useState(() => {
    const m = edit?.marca ?? ''
    return m && !MARCAS_MOTO.slice(0, -1).includes(m) ? m : ''
  })
  const [modelo,     setModelo]     = useState(edit?.modelo  ?? '')
  const [ano,        setAno]        = useState(edit?.ano     ?? '')
  const [placa,      setPlaca]      = useState(edit?.placa   ?? '')
  const [cor,        setCor]        = useState(edit?.cor     ?? '')
  const [freio,      setFreio]      = useState(edit?.freio   ?? '')
  const [partida,    setPartida]    = useState(edit?.partida ?? '')
  const [carregando, setCarregando] = useState(false)
  const [erros,      setErros]      = useState<Record<string, string>>({})

  function limparErro(campo: string) {
    setErros(e => ({ ...e, [campo]: '' }))
  }

  function validar(): boolean {
    const e: Record<string, string> = {}
    if (!marcaSel)
      e.marca = 'Selecione a marca'
    else if (marcaSel === 'Outra' && !marcaCustom.trim())
      e.marca = 'Por favor, informe a marca do veículo'
    if (!modelo.trim()) e.modelo = 'Informe o modelo'
    if (!placa.trim())  e.placa  = 'Informe a placa'
    setErros(e)
    return Object.keys(e).length === 0
  }

  function handleSalvar() {
    requireAuth(async () => {
      if (!validar()) return
      setCarregando(true)
      const payload = {
        marca:   marcaSel === 'Outra' ? marcaCustom.trim() : marcaSel,
        modelo:  modelo.trim(),
        ano:     ano.trim() || undefined,
        placa:   placa.trim().toUpperCase(),
        cor:     cor.trim()  || undefined,
        freio:   freio       || undefined,
        partida: partida     || undefined,
      }
      try {
        if (edit) {
          await atualizarMotoApi(edit.id, payload)
          Alert.alert('Sucesso!', 'Moto atualizada com sucesso.', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ])
        } else {
          await cadastrarMotoApi(payload)
          Alert.alert('Sucesso!', 'Moto cadastrada com sucesso.', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ])
        }
      } catch (error: any) {
        Alert.alert('Erro', error.response?.data?.erro ?? 'Não foi possível salvar a moto.')
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
        <Text style={estilos.headerTitulo}>{edit ? 'Editar Moto' : 'Registrar Moto'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={estilos.scroll} contentContainerStyle={estilos.conteudo} keyboardShouldPersistTaps="handled">

          <CampoDropdown
            label="Marca"
            obrigatorio
            valor={marcaSel}
            placeholder="Selecione a marca"
            opcoes={MARCAS_MOTO}
            erro={marcaSel !== 'Outra' ? erros.marca : undefined}
            onChange={v => { setMarcaSel(v); setMarcaCustom(''); limparErro('marca') }}
          />
          {marcaSel === 'Outra' && (
            <View style={estilos.campo}>
              <Text style={estilos.label}>Informe a marca <Text style={estilos.obrig}>*</Text></Text>
              <TextInput
                style={[estilos.input, erros.marca ? estilos.inputErro : null]}
                value={marcaCustom}
                onChangeText={t => { setMarcaCustom(t); limparErro('marca') }}
                placeholder="Digite a marca da moto"
                placeholderTextColor={CORES.cinzaTexto}
                autoCapitalize="words"
                autoCorrect={false}
                blurOnSubmit={false}
                autoFocus
              />
              {!!erros.marca && <Text style={estilos.textoErro}>{erros.marca}</Text>}
            </View>
          )}

          <View style={estilos.campo}>
            <Text style={estilos.label}>Modelo <Text style={estilos.obrig}>*</Text></Text>
            <TextInput
              style={[estilos.input, erros.modelo ? estilos.inputErro : null]}
              value={modelo}
              onChangeText={t => { setModelo(t); limparErro('modelo') }}
              placeholder="Ex: CB 500"
              placeholderTextColor={CORES.cinzaTexto}
              autoCapitalize="words"
              autoCorrect={false}
              blurOnSubmit={false}
            />
            {!!erros.modelo && <Text style={estilos.textoErro}>{erros.modelo}</Text>}
          </View>

          <CampoDropdown
            label="Ano"
            valor={ano}
            placeholder="Selecione o ano"
            opcoes={ANOS}
            onChange={setAno}
          />

          <View style={estilos.campo}>
            <Text style={estilos.label}>Placa <Text style={estilos.obrig}>*</Text></Text>
            <TextInput
              style={[estilos.input, erros.placa ? estilos.inputErro : null]}
              value={placa}
              onChangeText={t => { setPlaca(t.toUpperCase()); limparErro('placa') }}
              placeholder="Ex: XYZ-5678"
              placeholderTextColor={CORES.cinzaTexto}
              autoCapitalize="characters"
              autoCorrect={false}
              blurOnSubmit={false}
            />
            {!!erros.placa && <Text style={estilos.textoErro}>{erros.placa}</Text>}
          </View>

          <View style={estilos.campo}>
            <Text style={estilos.label}>Cor</Text>
            <TextInput
              style={estilos.input}
              value={cor}
              onChangeText={setCor}
              placeholder="Ex: Vermelha"
              placeholderTextColor={CORES.cinzaTexto}
              autoCapitalize="words"
              autoCorrect={false}
              blurOnSubmit={false}
            />
          </View>

          <CampoDropdown
            label="Freio"
            valor={freio}
            placeholder="Selecione o tipo de freio"
            opcoes={FREIOS}
            onChange={setFreio}
          />

          <CampoDropdown
            label="Partida"
            valor={partida}
            placeholder="Selecione o tipo de partida"
            opcoes={PARTIDAS}
            onChange={setPartida}
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
  headerTitulo:    { color: CORES.branco, fontSize: FONTES.media, fontWeight: '700' },
  scroll:          { flex: 1, backgroundColor: CORES.cinzaClaro },
  conteudo:        { padding: ESPACOS.lg, paddingBottom: ESPACOS.xxl },
  campo:           { marginBottom: ESPACOS.md },
  label:           { fontSize: FONTES.normal, fontWeight: '600', color: CORES.texto, marginBottom: ESPACOS.xs },
  obrig:           { color: CORES.erro, fontWeight: '700' },
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
  inputErro:       { borderColor: CORES.erro },
  textoErro:       { color: CORES.erro, fontSize: FONTES.pequena, marginTop: ESPACOS.xs },
  dropdownBtn: {
    backgroundColor: CORES.branco,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: CORES.borda,
    paddingHorizontal: ESPACOS.md,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownTexto:   { fontSize: FONTES.normal, color: CORES.texto, flex: 1 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: ESPACOS.xl,
  },
  modalBox: {
    backgroundColor: CORES.branco,
    borderRadius: 14,
    overflow: 'hidden',
    maxHeight: 360,
  },
  modalTitulo: {
    fontSize: FONTES.media,
    fontWeight: '700',
    color: CORES.texto,
    paddingHorizontal: ESPACOS.lg,
    paddingVertical: ESPACOS.md,
    borderBottomWidth: 1,
    borderBottomColor: CORES.borda,
  },
  opcaoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ESPACOS.lg,
    paddingVertical: ESPACOS.md,
    borderBottomWidth: 1,
    borderBottomColor: CORES.cinzaClaro,
  },
  opcaoAtiva:      { backgroundColor: '#E8FAF0' },
  opcaoTexto:      { fontSize: FONTES.normal, color: CORES.texto },
  opcaoTextoAtivo: { color: CORES.secundaria, fontWeight: '700' },
  botao: {
    backgroundColor: CORES.secundaria,
    borderRadius: 20,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: ESPACOS.md,
  },
  textoBotao:      { color: CORES.branco, fontSize: FONTES.media, fontWeight: '700' },
})
