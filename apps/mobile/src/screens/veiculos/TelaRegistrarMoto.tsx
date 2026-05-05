import React, { useState, useRef } from 'react'
import {
  View, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
  Alert, Modal, FlatList,
} from 'react-native'
import { AppText } from '../../components/AppText'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { cadastrarMotoApi, atualizarMotoApi, Moto } from '../../services/api'
import { CORES, FONTES, ESPACOS } from '../../constants/cores'
import { useAuth } from '../../contexts/AuthContext'
import { useAuthGuard } from '../../hooks/useAuthGuard'
import { AvatarCircular } from '../../components/AvatarCircular'

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

export function TelaRegistrarMoto({ navigation, route }: Props) {
  const edit: Moto | undefined = route.params?.registroParaEditar
  const { proprietario } = useAuth()
  const { requireAuth } = useAuthGuard()
  const apelido = proprietario?.apelido ?? proprietario?.nome?.split(' ')[0] ?? 'Usuário'

  const marcaCustomRef = useRef<TextInput>(null)
  const modeloRef      = useRef<TextInput>(null)
  const placaRef       = useRef<TextInput>(null)
  const corRef         = useRef<TextInput>(null)

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
        <MaterialCommunityIcons name="motorbike" size={24} color={CORES.secundaria} />
        <AppText style={estilos.tituloTexto}>{edit ? 'Editar Moto' : 'Registrar Moto'}</AppText>
      </View>
      <View style={estilos.divisoria} />

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
              <AppText style={estilos.label}>Informe a marca <AppText style={estilos.obrig}>*</AppText></AppText>
              <TextInput
                ref={marcaCustomRef}
                style={[estilos.input, erros.marca ? estilos.inputErro : null]}
                value={marcaCustom}
                onChangeText={t => { setMarcaCustom(t); limparErro('marca') }}
                placeholder="Digite a marca da moto"
                placeholderTextColor={CORES.placeholder}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => modeloRef.current?.focus()}
                autoFocus
              />
              {!!erros.marca && <AppText style={estilos.textoErro}>{erros.marca}</AppText>}
            </View>
          )}

          <View style={estilos.campo}>
            <AppText style={estilos.label}>Modelo <AppText style={estilos.obrig}>*</AppText></AppText>
            <TextInput
              ref={modeloRef}
              style={[estilos.input, erros.modelo ? estilos.inputErro : null]}
              value={modelo}
              onChangeText={t => { setModelo(t); limparErro('modelo') }}
              placeholder="Ex: CB 500"
              placeholderTextColor={CORES.placeholder}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => placaRef.current?.focus()}
            />
            {!!erros.modelo && <AppText style={estilos.textoErro}>{erros.modelo}</AppText>}
          </View>

          <CampoDropdown
            label="Ano"
            valor={ano}
            placeholder="Selecione o ano"
            opcoes={ANOS}
            onChange={setAno}
          />

          <View style={estilos.campo}>
            <AppText style={estilos.label}>Placa <AppText style={estilos.obrig}>*</AppText></AppText>
            <TextInput
              ref={placaRef}
              style={[estilos.input, erros.placa ? estilos.inputErro : null]}
              value={placa}
              onChangeText={t => { setPlaca(t.toUpperCase()); limparErro('placa') }}
              placeholder="Ex: XYZ-5678"
              placeholderTextColor={CORES.placeholder}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => corRef.current?.focus()}
            />
            {!!erros.placa && <AppText style={estilos.textoErro}>{erros.placa}</AppText>}
          </View>

          <View style={estilos.campo}>
            <AppText style={estilos.label}>Cor</AppText>
            <TextInput
              ref={corRef}
              style={estilos.input}
              value={cor}
              onChangeText={setCor}
              placeholder="Ex: Vermelha"
              placeholderTextColor={CORES.placeholder}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
              blurOnSubmit={true}
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
            accessible={true}
            accessibilityLabel={edit ? 'Salvar alterações da moto' : 'Salvar moto'}
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
  headerTitulo:    { color: CORES.branco, fontSize: FONTES.media, fontWeight: '700' },
  headerCentro:    { flexDirection: 'row', alignItems: 'center' },
  headerDireita:   { flexDirection: 'row', alignItems: 'center' },
  headerOla:       { color: CORES.cinzaTexto, fontSize: FONTES.pequena },
  headerNome:      { color: CORES.branco, fontSize: FONTES.normal, fontWeight: '700' },
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
