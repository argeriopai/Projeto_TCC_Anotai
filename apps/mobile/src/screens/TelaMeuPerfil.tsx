import React, { useState } from 'react'
import {
  View, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, KeyboardAvoidingView, Platform, Image, Modal, TouchableWithoutFeedback,
} from 'react-native'
import { AppText } from '../components/AppText'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { useAuth } from '../contexts/AuthContext'
import { CORES, FONTES, ESPACOS } from '../constants/cores'
import { mascaraTelefone } from '../utils/mascaras'
import { auth } from '../services/firebase'

interface Props { navigation: any }

// ── Campo reutilizável ────────────────────────────────────────────────────────

interface CampoInfoProps {
  label: string
  icone: string
  valor: string
  editavel: boolean
  onChange: (t: string) => void
  keyboardType?: 'default' | 'phone-pad' | 'email-address'
  autoCapitalize?: 'none' | 'words' | 'sentences'
  erro?: string
  onBlur?: () => void
  onFocus?: () => void
}

function CampoInfo({ label, icone, valor, editavel, onChange, keyboardType, autoCapitalize, erro, onBlur, onFocus }: CampoInfoProps) {
  return (
    <View style={estilos.campoRow}>
      <View style={estilos.campoIcone}>
        <Ionicons name={icone as any} size={17} color={CORES.secundaria} />
      </View>
      <View style={estilos.campoConteudo}>
        <AppText style={estilos.campoLabel}>{label}</AppText>
        {editavel ? (
          <>
            <TextInput
              style={[estilos.campoInput, erro ? { borderBottomColor: CORES.erro } : null]}
              value={valor}
              onChangeText={onChange}
              keyboardType={keyboardType ?? 'default'}
              autoCapitalize={autoCapitalize ?? 'none'}
              autoCorrect={false}
              onBlur={onBlur}
              onFocus={onFocus}
              blurOnSubmit={false}
              accessibilityLabel={`Campo ${label}`}
              accessibilityHint={`Editar ${label}`}
            />
            {!!erro && <AppText style={estilos.campoErro}>{erro}</AppText>}
          </>
        ) : (
          <AppText style={estilos.campoValor}>{valor || '—'}</AppText>
        )}
      </View>
    </View>
  )
}

// ── Tela principal ────────────────────────────────────────────────────────────

export function TelaMeuPerfil({ navigation }: Props) {
  const { proprietario, atualizarPerfil, atualizarFotoPerfil, excluirConta } = useAuth()

  const [modoEditar, setModoEditar] = useState(false)
  const [carregando, setCarregando] = useState(false)

  const [nome,        setNome]        = useState(proprietario?.nome     ?? '')
  const [telefone,    setTelefone]    = useState(proprietario?.telefone ?? '')
  const [telefoneErro, setTelefoneErro] = useState('')

  const [modalFoto,            setModalFoto]            = useState(false)
  const [modalExcluir,         setModalExcluir]         = useState(false)
  const [senhaExclusao,        setSenhaExclusao]        = useState('')
  const [mostrarSenhaExclusao, setMostrarSenhaExclusao] = useState(false)

  const creationTime = auth.currentUser?.metadata?.creationTime
  const dataCadastro = creationTime
    ? new Date(creationTime).toLocaleDateString('pt-BR')
    : '—'

  async function capturarFoto(origem: 'camera' | 'galeria') {
    const perm = origem === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (perm.status !== 'granted') {
      Alert.alert('Permissão negada', `Não foi possível acessar ${origem === 'camera' ? 'a câmera' : 'a galeria'}. Ative nas configurações do seu celular.`)
      return
    }
    const res = origem === 'camera'
      ? await ImagePicker.launchCameraAsync({ quality: 0.5, allowsEditing: true, aspect: [1, 1] })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.5, allowsEditing: true, aspect: [1, 1] })
    if (res.canceled || !res.assets?.[0]?.uri) return
    await atualizarFotoPerfil(res.assets[0].uri)
  }

  function selecionarFoto() {
    setModalFoto(true)
  }

  function handleTelefoneBlur() {
    const d = telefone.replace(/\D/g, '')
    if (telefone.length > 0 && d.length !== 11) {
      setTelefoneErro('Telefone inválido. Use o formato (99) 99999-9999')
    } else {
      setTelefoneErro('')
    }
  }

  function cancelarEditar() {
    setNome(proprietario?.nome ?? '')
    setTelefone(proprietario?.telefone ?? '')
    setTelefoneErro('')
    setModoEditar(false)
  }

  async function salvarPerfil() {
    if (!nome.trim()) {
      Alert.alert('Atenção', 'O nome não pode estar vazio.')
      return
    }
    if (telefone && telefone.replace(/\D/g, '').length !== 11) {
      Alert.alert('Atenção', 'Telefone inválido. Use o formato (99) 99999-9999')
      return
    }
    setCarregando(true)
    try {
      await atualizarPerfil({
        nome:     nome.trim(),
        apelido:  nome.trim().split(' ')[0],
        telefone: telefone || undefined,
      })
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!')
      setModoEditar(false)
    } finally {
      setCarregando(false)
    }
  }

  async function confirmarExclusao() {
    if (!senhaExclusao.trim()) {
      Alert.alert('Atenção', 'Digite sua senha para confirmar.')
      return
    }
    setCarregando(true)
    try {
      await excluirConta(senhaExclusao)
      setModalExcluir(false)
      setSenhaExclusao('')
    } catch (e: any) {
      Alert.alert(
        'Erro',
        e.message === 'Senha incorreta'
          ? 'Senha incorreta. Verifique e tente novamente.'
          : 'Não foi possível excluir a conta. Tente novamente.',
      )
    } finally {
      setCarregando(false)
    }
  }

  return (
    <SafeAreaView style={estilos.safe} edges={['top']}>

      {/* HEADER */}
      <View style={estilos.header}>
        <AppText style={estilos.headerTitulo}>Meu Perfil</AppText>
        <View style={estilos.headerDireita}>
          {!modoEditar && (
            <TouchableOpacity
              style={estilos.botaoEditar}
              onPress={() => setModoEditar(true)}
              accessible
              accessibilityLabel="Editar perfil"
              accessibilityRole="button"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="pencil" size={18} color={CORES.secundaria} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={estilos.botaoHome}
            onPress={() => navigation.navigate('Home')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessible={true}
            accessibilityLabel="Ir para Início"
            accessibilityRole="button"
          >
            <Ionicons name="home" size={20} color={CORES.secundaria} />
          </TouchableOpacity>
          <TouchableOpacity
            style={estilos.botaoExcluirHeader}
            onPress={() => setModalExcluir(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessible={true}
            accessibilityLabel="Excluir minha conta"
            accessibilityRole="button"
          >
            <Ionicons name="trash-outline" size={18} color={CORES.erro} />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={estilos.scroll}
          contentContainerStyle={estilos.conteudo}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* CARD DADOS PESSOAIS */}
          <View style={estilos.card}>

            {/* Avatar */}
            <View style={estilos.avatarContainer}>
              <TouchableOpacity
                onPress={selecionarFoto}
                accessible={true}
                accessibilityLabel="Foto de perfil. Toque para alterar"
                accessibilityRole="button"
                style={{ position: 'relative' }}
              >
                {proprietario?.fotoPerfil ? (
                  <Image source={{ uri: proprietario.fotoPerfil }} style={estilos.avatarImagem} />
                ) : (
                  <View style={estilos.avatarCirculo}>
                    <Ionicons name="person" size={52} color={CORES.branco} />
                  </View>
                )}
                <View style={estilos.avatarCameraBadge}>
                  <Ionicons name="camera" size={14} color={CORES.branco} />
                </View>
              </TouchableOpacity>
              <AppText style={estilos.avatarEmail}>{proprietario?.email ?? ''}</AppText>
            </View>

            <View style={estilos.divisoria} />

            {/* Campos */}
            <View style={estilos.camposSection}>
              <AppText style={estilos.sectionTitulo}>Dados pessoais</AppText>

              <CampoInfo
                label="Nome completo"
                icone="person-outline"
                valor={nome}
                editavel={modoEditar}
                onChange={setNome}
                autoCapitalize="words"
              />
              <CampoInfo
                label="E-mail"
                icone="mail-outline"
                valor={proprietario?.email ?? ''}
                editavel={false}
                onChange={() => {}}
              />
              <CampoInfo
                label="Telefone"
                icone="call-outline"
                valor={telefone}
                editavel={modoEditar}
                onChange={t => { setTelefone(mascaraTelefone(t)); setTelefoneErro('') }}
                keyboardType="phone-pad"
                erro={modoEditar ? telefoneErro : undefined}
                onBlur={handleTelefoneBlur}
                onFocus={() => setTelefoneErro('')}
              />
              <CampoInfo
                label="Membro desde"
                icone="calendar-outline"
                valor={dataCadastro}
                editavel={false}
                onChange={() => {}}
              />
            </View>

            {/* Botões — modo visualização */}
            {!modoEditar && (
              <View style={estilos.botoesSection}>
                <TouchableOpacity
                  style={estilos.botaoPrimario}
                  onPress={() => navigation.navigate('AlterarSenha')}
                  accessible={true}
                  accessibilityLabel="Alterar senha"
                  accessibilityRole="button"
                >
                  <Ionicons name="lock-closed-outline" size={16} color={CORES.primaria} style={{ marginRight: ESPACOS.xs }} />
                  <AppText style={estilos.botaoPrimarioTexto}>Alterar Senha</AppText>
                </TouchableOpacity>
              </View>
            )}

            {/* Botões — modo editar perfil */}
            {modoEditar && (
              <View style={estilos.botoesLinha}>
                <TouchableOpacity style={estilos.botaoCancelar} onPress={cancelarEditar}>
                  <AppText style={estilos.botaoCancelarTexto}>Cancelar</AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[estilos.botaoSalvar, carregando && { opacity: 0.6 }]}
                  onPress={salvarPerfil}
                  disabled={carregando}
                >
                  <AppText style={estilos.botaoSalvarTexto}>Salvar Alterações</AppText>
                </TouchableOpacity>
              </View>
            )}
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* MODAL FOTO DE PERFIL */}
      <Modal
        visible={modalFoto}
        transparent
        animationType="fade"
        onRequestClose={() => setModalFoto(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalFoto(false)}>
          <View style={estilos.fotoModalOverlay}>
            <TouchableWithoutFeedback>
              <View style={estilos.fotoModalCard}>
                <AppText style={estilos.fotoModalTitulo}>Foto de Perfil</AppText>
                <AppText style={estilos.fotoModalSubtitulo}>Escolha uma opção</AppText>

                {proprietario?.fotoPerfil && (
                  <TouchableOpacity
                    style={estilos.fotoModalOpcao}
                    onPress={() => { setModalFoto(false); atualizarFotoPerfil(null) }}
                    accessible
                    accessibilityLabel="Remover foto de perfil"
                    accessibilityRole="button"
                  >
                    <Ionicons name="trash-outline" size={20} color={CORES.erro} />
                    <AppText style={[estilos.fotoModalOpcaoTexto, { color: CORES.erro }]}>Remover foto</AppText>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={estilos.fotoModalOpcao}
                  onPress={() => { setModalFoto(false); setTimeout(() => capturarFoto('galeria'), 300) }}
                  accessible
                  accessibilityLabel="Escolher foto da galeria"
                  accessibilityRole="button"
                >
                  <Ionicons name="images-outline" size={20} color={CORES.primaria} />
                  <AppText style={estilos.fotoModalOpcaoTexto}>Escolher da galeria</AppText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={estilos.fotoModalOpcao}
                  onPress={() => { setModalFoto(false); setTimeout(() => capturarFoto('camera'), 300) }}
                  accessible
                  accessibilityLabel="Tirar foto com a câmera"
                  accessibilityRole="button"
                >
                  <Ionicons name="camera-outline" size={20} color={CORES.primaria} />
                  <AppText style={estilos.fotoModalOpcaoTexto}>Tirar foto</AppText>
                </TouchableOpacity>

                <View style={estilos.fotoModalDivisoria} />

                <TouchableOpacity
                  style={estilos.fotoModalCancelar}
                  onPress={() => setModalFoto(false)}
                  accessible
                  accessibilityLabel="Cancelar"
                  accessibilityRole="button"
                >
                  <AppText style={estilos.fotoModalCancelarTexto}>Cancelar</AppText>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* MODAL EXCLUIR CONTA */}
      <Modal
        visible={modalExcluir}
        transparent
        animationType="fade"
        onRequestClose={() => { setModalExcluir(false); setSenhaExclusao('') }}
      >
        <View style={estilos.modalOverlay}>
          <View style={estilos.modalCard}>
            <AppText style={estilos.modalTitulo}>Confirmar exclusão</AppText>
            <AppText style={estilos.modalDescricao}>
              Todos os seus dados serão apagados permanentemente. Digite sua senha para confirmar.
            </AppText>
            <View style={estilos.senhaLinha}>
              <TextInput
                style={[estilos.campoInput, { flex: 1 }]}
                value={senhaExclusao}
                onChangeText={setSenhaExclusao}
                secureTextEntry={!mostrarSenhaExclusao}
                placeholder="Sua senha"
                placeholderTextColor={CORES.cinzaTexto}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setMostrarSenhaExclusao(v => !v)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={{ paddingLeft: ESPACOS.sm }}
              >
                <Ionicons
                  name={mostrarSenhaExclusao ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={CORES.cinzaTexto}
                />
              </TouchableOpacity>
            </View>
            <View style={[estilos.botoesLinha, { marginTop: ESPACOS.md }]}>
              <TouchableOpacity
                style={estilos.botaoCancelar}
                onPress={() => { setModalExcluir(false); setSenhaExclusao(''); setMostrarSenhaExclusao(false) }}
              >
                <AppText style={estilos.botaoCancelarTexto}>Cancelar</AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[estilos.botaoSalvar, { backgroundColor: CORES.erro }, carregando && { opacity: 0.6 }]}
                onPress={confirmarExclusao}
                disabled={carregando}
              >
                <AppText style={estilos.botaoSalvarTexto}>Confirmar</AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  )
}

const estilos = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: CORES.primaria },

  // Header
  header: {
    backgroundColor: CORES.primaria,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ESPACOS.md,
    paddingVertical: ESPACOS.sm,
  },
  headerTitulo:    { color: CORES.branco, fontSize: 18, fontWeight: '700' },
  headerEsquerda:  { flexDirection: 'row', alignItems: 'center' },
  headerDireita:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: ESPACOS.sm },
  headerSubtitulo: { color: CORES.cinzaTexto, fontSize: FONTES.pequena },
  headerNome:      { color: CORES.branco, fontSize: FONTES.normal, fontWeight: '700' },
  botaoEditar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: CORES.secundaria,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botaoHome: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: CORES.secundaria,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botaoExcluirHeader: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: CORES.erro,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Layout
  scroll:   { flex: 1, backgroundColor: CORES.cinzaClaro },
  conteudo: { padding: ESPACOS.md, paddingBottom: ESPACOS.xxl },

  // Card
  card: {
    backgroundColor: CORES.branco,
    borderRadius: 16,
    padding: ESPACOS.lg,
    shadowColor: CORES.sombra,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },

  // Avatar
  avatarContainer: { alignItems: 'center', marginBottom: ESPACOS.md },
  avatarCirculo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: CORES.primaria,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: CORES.secundaria,
    shadowColor: CORES.primaria,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarImagem: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: CORES.secundaria,
  },
  avatarCameraBadge: {
    position: 'absolute',
    bottom: ESPACOS.sm,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: CORES.secundaria,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: CORES.branco,
  },
  avatarNome:  { fontSize: FONTES.subtitulo, fontWeight: '700', color: CORES.pretinho, marginBottom: 2, marginTop: ESPACOS.sm },
  avatarEmail: { fontSize: FONTES.pequena,   color: CORES.textoSecundario },

  // Divisória
  divisoria: {
    height: 2,
    backgroundColor: CORES.secundaria,
    borderRadius: 1,
    marginBottom: ESPACOS.md,
  },

  // Seção de campos
  camposSection: { marginBottom: ESPACOS.md },
  sectionTitulo: {
    fontSize: FONTES.normal,
    fontWeight: '700',
    color: CORES.pretinho,
    marginBottom: ESPACOS.md,
  },

  // Campo individual
  campoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: ESPACOS.md,
  },
  campoIcone: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8FAF0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ESPACOS.sm,
    marginTop: 2,
  },
  campoConteudo: { flex: 1 },
  campoLabel:    { fontSize: FONTES.pequena, color: CORES.textoSecundario, marginBottom: 2 },
  campoValor:    { fontSize: FONTES.normal, color: CORES.pretinho, fontWeight: '500' },
  campoErro:     { color: CORES.erro, fontSize: FONTES.pequena, marginTop: 2 },
  campoInput: {
    fontSize: FONTES.normal,
    color: CORES.pretinho,
    fontWeight: '500',
    borderBottomWidth: 1.5,
    borderBottomColor: CORES.secundaria,
    paddingBottom: 4,
    marginBottom: 0,
  },

  // Campo senha (modal)
  senhaLinha: { flexDirection: 'row', alignItems: 'center' },

  // Seção de botões
  botoesSection: { gap: ESPACOS.sm },
  botaoPrimario: {
    backgroundColor: CORES.secundaria,
    borderRadius: 20,
    height: 48,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  botaoPrimarioTexto:   { color: CORES.primaria, fontSize: FONTES.normal, fontWeight: '700' },
  botaoSecundario: {
    borderWidth: 1.5,
    borderColor: CORES.primaria,
    borderRadius: 20,
    height: 48,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: ESPACOS.xs,
  },
  botaoSecundarioTexto: { color: CORES.primaria, fontSize: FONTES.normal, fontWeight: '700' },

  // Botões inline (Cancelar + Salvar)
  botoesLinha:      { flexDirection: 'row', gap: ESPACOS.sm },
  botaoCancelar: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: CORES.cinzaMedio,
    borderRadius: 20,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botaoCancelarTexto: { color: CORES.textoSecundario, fontSize: FONTES.normal, fontWeight: '600' },
  botaoSalvar: {
    flex: 2,
    backgroundColor: CORES.secundaria,
    borderRadius: 20,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botaoSalvarTexto: { color: CORES.primaria, fontSize: FONTES.normal, fontWeight: '700' },

  // Modal foto de perfil
  fotoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  fotoModalCard: {
    backgroundColor: CORES.branco,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: ESPACOS.md,
    paddingHorizontal: ESPACOS.lg,
    paddingBottom: Platform.OS === 'ios' ? 36 : ESPACOS.lg,
  },
  fotoModalTitulo: {
    fontSize: FONTES.normal,
    fontWeight: '700',
    color: CORES.pretinho,
    textAlign: 'center',
    marginBottom: 2,
  },
  fotoModalSubtitulo: {
    fontSize: FONTES.pequena,
    color: CORES.textoSecundario,
    textAlign: 'center',
    marginBottom: ESPACOS.md,
  },
  fotoModalOpcao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACOS.sm,
    paddingVertical: ESPACOS.md,
    borderBottomWidth: 1,
    borderBottomColor: CORES.cinzaClaro,
  },
  fotoModalOpcaoTexto: {
    fontSize: FONTES.normal,
    fontWeight: '500',
    color: CORES.pretinho,
  },
  fotoModalDivisoria: {
    height: 6,
    backgroundColor: CORES.cinzaClaro,
    marginHorizontal: -ESPACOS.lg,
    marginTop: ESPACOS.sm,
  },
  fotoModalCancelar: {
    paddingVertical: ESPACOS.md,
    alignItems: 'center',
  },
  fotoModalCancelarTexto: {
    fontSize: FONTES.normal,
    fontWeight: '700',
    color: CORES.textoSecundario,
  },

  // Modal excluir conta
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: ESPACOS.lg,
  },
  modalCard: {
    backgroundColor: CORES.branco,
    borderRadius: 16,
    padding: ESPACOS.lg,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitulo: {
    fontSize: FONTES.subtitulo,
    fontWeight: '700',
    color: CORES.pretinho,
    marginBottom: ESPACOS.sm,
  },
  modalDescricao: {
    fontSize: FONTES.normal,
    color: CORES.textoSecundario,
    marginBottom: ESPACOS.md,
    lineHeight: 20,
  },
})
