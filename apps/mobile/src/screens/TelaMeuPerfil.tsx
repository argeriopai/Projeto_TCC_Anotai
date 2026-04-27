import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../contexts/AuthContext'
import { CORES, FONTES, ESPACOS } from '../constants/cores'
import { mascaraTelefone } from '../utils/mascaras'

interface Props { navigation: any }

function extrairDataCadastro(id: string): string {
  const ts = parseInt(id.split('-')[0])
  if (!isNaN(ts) && ts > 1_000_000_000_000) {
    return new Date(ts).toLocaleDateString('pt-BR')
  }
  return '—'
}

// ── Campos reutilizáveis ──────────────────────────────────────────────────────

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
        <Text style={estilos.campoLabel}>{label}</Text>
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
            />
            {!!erro && <Text style={estilos.campoErro}>{erro}</Text>}
          </>
        ) : (
          <Text style={estilos.campoValor}>{valor || '—'}</Text>
        )}
      </View>
    </View>
  )
}

interface CampoSenhaProps {
  label: string
  valor: string
  onChange: (t: string) => void
  mostrar: boolean
  onToggle: () => void
}

function CampoSenha({ label, valor, onChange, mostrar, onToggle }: CampoSenhaProps) {
  return (
    <View style={estilos.campoRow}>
      <View style={estilos.campoIcone}>
        <Ionicons name="lock-closed-outline" size={17} color={CORES.secundaria} />
      </View>
      <View style={estilos.campoConteudo}>
        <Text style={estilos.campoLabel}>{label}</Text>
        <View style={estilos.senhaLinha}>
          <TextInput
            style={[estilos.campoInput, { flex: 1, marginBottom: 0 }]}
            value={valor}
            onChangeText={onChange}
            secureTextEntry={!mostrar}
            autoCapitalize="none"
            autoCorrect={false}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            onPress={onToggle}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{ paddingLeft: ESPACOS.sm }}
          >
            <Ionicons name={mostrar ? 'eye-off-outline' : 'eye-outline'} size={18} color={CORES.cinzaTexto} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

// ── Tela principal ────────────────────────────────────────────────────────────

export function TelaMeuPerfil({ navigation }: Props) {
  const { proprietario, atualizarPerfil } = useAuth()

  const [modoEditar, setModoEditar] = useState(false)
  const [modoSenha,  setModoSenha]  = useState(false)
  const [carregando, setCarregando] = useState(false)

  const [nome,     setNome]     = useState(proprietario?.nome     ?? '')
  const [telefone, setTelefone] = useState(proprietario?.telefone ?? '')

  const [telefoneErro, setTelefoneErro] = useState('')

  const [senhaAtual,     setSenhaAtual]     = useState('')
  const [novaSenha,      setNovaSenha]      = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [mostrarSenhas,  setMostrarSenhas]  = useState(false)

  const apelido      = proprietario?.apelido ?? proprietario?.nome?.split(' ')[0] ?? 'Usuário'
  const dataCadastro = proprietario?.id ? extrairDataCadastro(proprietario.id) : '—'

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

  function cancelarSenha() {
    setSenhaAtual('')
    setNovaSenha('')
    setConfirmarSenha('')
    setMostrarSenhas(false)
    setModoSenha(false)
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

  function salvarSenha() {
    if (!senhaAtual) {
      Alert.alert('Atenção', 'Informe a senha atual.')
      return
    }
    if (novaSenha.length < 6) {
      Alert.alert('Atenção', 'A nova senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (novaSenha !== confirmarSenha) {
      Alert.alert('Atenção', 'As senhas não coincidem.')
      return
    }
    Alert.alert('Sucesso', 'Senha alterada com sucesso!')
    cancelarSenha()
  }

  return (
    <SafeAreaView style={estilos.safe} edges={['top']}>

      {/* HEADER */}
      <View style={estilos.header}>
        <View style={estilos.headerEsquerda}>
          <Ionicons name="person-circle-outline" size={34} color={CORES.branco} />
          <View style={{ marginLeft: ESPACOS.xs }}>
            <Text style={estilos.headerSubtitulo}>Meu Perfil</Text>
            <Text style={estilos.headerNome}>{apelido}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={estilos.botaoHome}
          onPress={() => navigation.navigate('Home')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="home" size={20} color={CORES.secundaria} />
        </TouchableOpacity>
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
              <View style={estilos.avatarCirculo}>
                <Ionicons name="person" size={52} color={CORES.branco} />
              </View>
              <Text style={estilos.avatarNome}>{proprietario?.nome ?? apelido}</Text>
              <Text style={estilos.avatarEmail}>{proprietario?.email ?? ''}</Text>
            </View>

            <View style={estilos.divisoria} />

            {/* Campos */}
            <View style={estilos.camposSection}>
              <Text style={estilos.sectionTitulo}>Dados pessoais</Text>

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
            {!modoEditar && !modoSenha && (
              <View style={estilos.botoesSection}>
                <TouchableOpacity
                  style={estilos.botaoPrimario}
                  onPress={() => setModoEditar(true)}
                >
                  <Ionicons name="pencil" size={16} color={CORES.branco} style={{ marginRight: ESPACOS.xs }} />
                  <Text style={estilos.botaoPrimarioTexto}>Editar Perfil</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={estilos.botaoSecundario}
                  onPress={() => setModoSenha(true)}
                >
                  <Ionicons name="lock-closed-outline" size={16} color={CORES.primaria} style={{ marginRight: ESPACOS.xs }} />
                  <Text style={estilos.botaoSecundarioTexto}>Alterar Senha</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Botões — modo editar perfil */}
            {modoEditar && (
              <View style={estilos.botoesLinha}>
                <TouchableOpacity style={estilos.botaoCancelar} onPress={cancelarEditar}>
                  <Text style={estilos.botaoCancelarTexto}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[estilos.botaoSalvar, carregando && { opacity: 0.6 }]}
                  onPress={salvarPerfil}
                  disabled={carregando}
                >
                  <Text style={estilos.botaoSalvarTexto}>Salvar Alterações</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* CARD ALTERAR SENHA */}
          {modoSenha && (
            <View style={[estilos.card, { marginTop: ESPACOS.md }]}>
              <View style={estilos.camposSection}>
                <Text style={estilos.sectionTitulo}>Alterar Senha</Text>
                <CampoSenha
                  label="Senha atual"
                  valor={senhaAtual}
                  onChange={setSenhaAtual}
                  mostrar={mostrarSenhas}
                  onToggle={() => setMostrarSenhas(v => !v)}
                />
                <CampoSenha
                  label="Nova senha"
                  valor={novaSenha}
                  onChange={setNovaSenha}
                  mostrar={mostrarSenhas}
                  onToggle={() => setMostrarSenhas(v => !v)}
                />
                <CampoSenha
                  label="Confirmar nova senha"
                  valor={confirmarSenha}
                  onChange={setConfirmarSenha}
                  mostrar={mostrarSenhas}
                  onToggle={() => setMostrarSenhas(v => !v)}
                />
              </View>
              <View style={estilos.botoesLinha}>
                <TouchableOpacity style={estilos.botaoCancelar} onPress={cancelarSenha}>
                  <Text style={estilos.botaoCancelarTexto}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={estilos.botaoSalvar} onPress={salvarSenha}>
                  <Text style={estilos.botaoSalvarTexto}>Salvar Senha</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
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
    justifyContent: 'space-between',
    paddingHorizontal: ESPACOS.md,
    paddingVertical: ESPACOS.sm,
  },
  headerEsquerda:  { flexDirection: 'row', alignItems: 'center' },
  headerSubtitulo: { color: CORES.cinzaTexto, fontSize: FONTES.pequena },
  headerNome:      { color: CORES.branco, fontSize: FONTES.normal, fontWeight: '700' },
  botaoHome: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: CORES.secundaria,
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
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: CORES.primaria,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: ESPACOS.sm,
    shadowColor: CORES.primaria,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarNome:  { fontSize: FONTES.subtitulo, fontWeight: '700', color: CORES.pretinho, marginBottom: 2 },
  avatarEmail: { fontSize: FONTES.pequena,   color: CORES.cinzaTexto },

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
  campoLabel:    { fontSize: FONTES.pequena, color: CORES.cinzaTexto, marginBottom: 2 },
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

  // Campo senha
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
  botaoPrimarioTexto:   { color: CORES.branco, fontSize: FONTES.normal, fontWeight: '700' },
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
  botoesLinha:          { flexDirection: 'row', gap: ESPACOS.sm },
  botaoCancelar: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: CORES.cinzaMedio,
    borderRadius: 20,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botaoCancelarTexto: { color: CORES.cinzaTexto, fontSize: FONTES.normal, fontWeight: '600' },
  botaoSalvar: {
    flex: 2,
    backgroundColor: CORES.secundaria,
    borderRadius: 20,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botaoSalvarTexto: { color: CORES.branco, fontSize: FONTES.normal, fontWeight: '700' },
})
