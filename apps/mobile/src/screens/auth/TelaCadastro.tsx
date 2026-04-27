import React, { useState, useRef, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
  Alert, TextInput as TextInputType,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../contexts/AuthContext'
import { CORES, FONTES, ESPACOS } from '../../constants/cores'
import { mascaraTelefone } from '../../utils/mascaras'
import LogomarcaIcone1 from '../../assets/icons/LOGOMARCA_ICONE1.svg'
import IconeUsuario from '../../assets/icons/ICONE_MENU_LATERAL_USUARIO.svg'
import IconeInicio from '../../assets/icons/ICONE_MENU_LATERAL_INICIO.svg'

interface Props {
  navigation: any
}

interface CampoProps {
  label: string
  icone: string
  valor: string
  onChange: (t: string) => void
  erro?: string
  refCampo?: React.RefObject<TextInputType | null>
  proximoRef?: React.RefObject<TextInputType | null>
  aoSubmeter?: () => void
  tipo?: 'email' | 'senha' | 'confirmar' | 'phone'
  mostrar?: boolean
  onToggleMostrar?: () => void
  placeholder?: string
  onBlur?: () => void
  onFocus?: () => void
  valido?: boolean
}

// Componente definido fora de TelaCadastro para evitar remontagem a cada keystroke
function Campo({
  label, icone, valor, onChange, erro, refCampo, proximoRef, aoSubmeter,
  tipo, mostrar, onToggleMostrar, placeholder, onBlur, onFocus, valido,
}: CampoProps) {
  const eSenha = tipo === 'senha' || tipo === 'confirmar'
  return (
    <View style={estilos.campoWrapper}>
      <View style={estilos.labelRow}>
        <Text style={estilos.label}>{label}</Text>
        <Text style={estilos.obrigatorio}> *</Text>
      </View>
      <View style={[estilos.inputContainer, erro ? estilos.inputErro : valido ? estilos.inputValido : null]}>
        <Ionicons name={icone as any} size={20} color={CORES.cinzaTexto} style={estilos.iconeInput} />
        <TextInput
          ref={refCampo}
          style={estilos.input}
          value={valor}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={CORES.cinzaTexto}
          keyboardType={tipo === 'email' ? 'email-address' : tipo === 'phone' ? 'phone-pad' : 'default'}
          autoCapitalize={tipo === 'email' || eSenha ? 'none' : 'words'}
          secureTextEntry={eSenha && !mostrar}
          returnKeyType={proximoRef ? 'next' : 'done'}
          onSubmitEditing={proximoRef ? () => proximoRef.current?.focus() : aoSubmeter}
          onBlur={onBlur}
          onFocus={onFocus}
          blurOnSubmit={false}
          autoCorrect={false}
          accessibilityLabel={`Campo ${label}`}
        />
        {eSenha && (
          <TouchableOpacity onPress={onToggleMostrar} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name={mostrar ? 'eye-off-outline' : 'eye-outline'} size={20} color={CORES.cinzaTexto} />
          </TouchableOpacity>
        )}
      </View>
      {erro && <Text style={estilos.textoErro}>{erro}</Text>}
    </View>
  )
}

export function TelaCadastro({ navigation }: Props) {
  const [nome,           setNome]           = useState('')
  const [email,          setEmail]          = useState('')
  const [telefone,       setTelefone]       = useState('')
  const [senha,          setSenha]          = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [mostrarSenha,   setMostrarSenha]   = useState(false)
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false)
  const [carregando,     setCarregando]     = useState(false)
  const [erros,          setErros]          = useState<Record<string, string>>({})
  const [telefoneValido, setTelefoneValido] = useState(false)

  const refEmail     = useRef<TextInputType>(null)
  const refTelefone  = useRef<TextInputType>(null)
  const refSenha     = useRef<TextInputType>(null)
  const refConfirmar = useRef<TextInputType>(null)

  const { cadastrar, estaLogado } = useAuth()

  // Navega para Home quando o contexto confirmar o cadastro — garante render após setState
  useEffect(() => {
    if (estaLogado) {
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] })
    }
  }, [estaLogado])

  function validar(): boolean {
    const novosErros: Record<string, string> = {}
    if (!nome.trim() || nome.trim().length < 2) novosErros.nome = 'Informe seu nome completo'
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) novosErros.email = 'Informe um e-mail válido'
    if (!telefone || telefone.replace(/\D/g, '').length !== 11) novosErros.telefone = 'Telefone inválido. Use o formato (99) 99999-9999'
    if (senha.length < 6) novosErros.senha = 'Mínimo 6 caracteres'
    if (senha !== confirmarSenha) novosErros.confirmarSenha = 'As senhas não coincidem'
    setErros(novosErros)
    return Object.keys(novosErros).length === 0
  }

  function handleTelBlur() {
    const d = telefone.replace(/\D/g, '')
    if (telefone.length > 0 && d.length !== 11) {
      setErros(e => ({ ...e, telefone: 'Telefone inválido. Use o formato (99) 99999-9999' }))
      setTelefoneValido(false)
    } else {
      setTelefoneValido(d.length === 11)
    }
  }

  async function handleCadastro() {
    if (!validar()) return
    setCarregando(true)
    try {
      await cadastrar({
        nome:    nome.trim(),
        email:   email.trim().toLowerCase(),
        senha,
        apelido: nome.trim().split(' ')[0],
        telefone,
      })
      // navegação tratada pelo useEffect que observa estaLogado
    } catch (error: any) {
      const mensagem = error.response?.data?.erro || 'Erro ao criar conta. Tente novamente.'
      Alert.alert('Não foi possível criar a conta', mensagem)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <SafeAreaView style={estilos.safeArea} edges={['top']}>
      {/* HEADER */}
      <View style={estilos.header}>
        <View style={estilos.headerEsquerda}>
          <LogomarcaIcone1 width={38} height={38} color="white" />
          <Text style={estilos.headerTitulo}>Criar conta</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Home')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <IconeInicio width={26} height={26} color="white" />
        </TouchableOpacity>
      </View>

      {/* CORPO */}
      <KeyboardAvoidingView style={estilos.corpo} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={estilos.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Título */}
          <View style={estilos.tituloRow}>
            <IconeUsuario width={26} height={26} color={CORES.secundaria} />
            <Text style={estilos.tituloPagina}>Proprietário / Cadastro</Text>
          </View>
          <View style={estilos.divisoria} />

          <Campo
            label="Nome completo"
            icone="person-outline"
            valor={nome}
            onChange={(t) => { setNome(t); setErros(e => ({ ...e, nome: '' })) }}
            erro={erros.nome}
            proximoRef={refEmail}
            placeholder="digite aqui seu nome"
          />

          <Campo
            label="E-mail"
            icone="mail-outline"
            valor={email}
            onChange={(t) => { setEmail(t); setErros(e => ({ ...e, email: '' })) }}
            erro={erros.email}
            refCampo={refEmail}
            proximoRef={refTelefone}
            tipo="email"
            placeholder="seu@email.com"
          />

          <Campo
            label="Telefone"
            icone="call-outline"
            valor={telefone}
            onChange={(t) => { setTelefone(mascaraTelefone(t)); setErros(e => ({ ...e, telefone: '' })); setTelefoneValido(false) }}
            erro={erros.telefone}
            refCampo={refTelefone}
            proximoRef={refSenha}
            tipo="phone"
            placeholder="(00) 00000-0000"
            onBlur={handleTelBlur}
            onFocus={() => setErros(e => ({ ...e, telefone: '' }))}
            valido={telefoneValido}
          />

          <Campo
            label="Senha"
            icone="lock-closed-outline"
            valor={senha}
            onChange={(t) => { setSenha(t); setErros(e => ({ ...e, senha: '' })) }}
            erro={erros.senha}
            refCampo={refSenha}
            proximoRef={refConfirmar}
            tipo="senha"
            mostrar={mostrarSenha}
            onToggleMostrar={() => setMostrarSenha(v => !v)}
            placeholder="mínimo 6 caracteres"
          />

          <Campo
            label="Confirmar Senha"
            icone="lock-closed-outline"
            valor={confirmarSenha}
            onChange={(t) => { setConfirmarSenha(t); setErros(e => ({ ...e, confirmarSenha: '' })) }}
            erro={erros.confirmarSenha}
            refCampo={refConfirmar}
            aoSubmeter={handleCadastro}
            tipo="confirmar"
            mostrar={mostrarConfirmar}
            onToggleMostrar={() => setMostrarConfirmar(v => !v)}
            placeholder="Confirmar senha"
          />

          {/* Termos */}
          <Text style={estilos.termos}>
            Ao criar sua conta, você concorda com nossos{' '}
            <Text style={estilos.linkTermos}>Termos de Uso</Text>
            {' '}e{' '}
            <Text style={estilos.linkTermos}>Política de Privacidade</Text>
          </Text>

          {/* Botão Confirmar */}
          <TouchableOpacity
            style={[estilos.botaoConfirmar, carregando && estilos.botaoDesabilitado]}
            onPress={handleCadastro}
            disabled={carregando}
            accessibilityRole="button"
          >
            {carregando ? (
              <ActivityIndicator color={CORES.branco} />
            ) : (
              <Text style={estilos.textoBotao}>Confirmar</Text>
            )}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const estilos = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: CORES.primaria,
  },
  header: {
    backgroundColor: CORES.primaria,
    paddingHorizontal: ESPACOS.lg,
    paddingVertical: ESPACOS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerEsquerda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACOS.sm,
  },
  headerTitulo: {
    color: CORES.branco,
    fontSize: FONTES.subtitulo,
    fontWeight: '700',
  },
  corpo: {
    flex: 1,
    backgroundColor: CORES.branco,
  },
  scroll: {
    padding: ESPACOS.lg,
    paddingTop: ESPACOS.xl,
    paddingBottom: ESPACOS.xxl,
  },
  tituloRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACOS.sm,
    marginBottom: ESPACOS.sm,
  },
  tituloPagina: {
    fontSize: FONTES.subtitulo,
    fontWeight: '700',
    color: CORES.pretinho,
  },
  divisoria: {
    height: 2,
    backgroundColor: CORES.secundaria,
    marginBottom: ESPACOS.lg,
    borderRadius: 1,
  },
  campoWrapper: {
    marginBottom: ESPACOS.md,
  },
  labelRow: {
    flexDirection: 'row',
    marginBottom: ESPACOS.xs,
  },
  label: {
    fontSize: FONTES.normal,
    fontWeight: '600',
    color: CORES.pretinho,
  },
  obrigatorio: {
    fontSize: FONTES.normal,
    fontWeight: '700',
    color: CORES.erro,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CORES.cinzaClaro,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: CORES.borda,
    paddingHorizontal: ESPACOS.md,
    height: 52,
  },
  inputErro: {
    borderColor: CORES.erro,
  },
  inputValido: {
    borderColor: CORES.secundaria,
  },
  iconeInput: {
    marginRight: ESPACOS.sm,
  },
  input: {
    flex: 1,
    fontSize: FONTES.media,
    color: CORES.pretinho,
  },
  textoErro: {
    fontSize: FONTES.pequena,
    color: CORES.erro,
    marginTop: ESPACOS.xs,
  },
  termos: {
    fontSize: 11,
    color: CORES.cinzaTexto,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: ESPACOS.md,
    marginTop: ESPACOS.xs,
  },
  linkTermos: {
    color: CORES.primaria,
    fontWeight: 'bold',
  },
  botaoConfirmar: {
    backgroundColor: CORES.primaria,
    borderRadius: 20,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botaoDesabilitado: {
    opacity: 0.6,
  },
  textoBotao: {
    color: CORES.branco,
    fontSize: FONTES.media,
    fontWeight: '700',
  },
})
