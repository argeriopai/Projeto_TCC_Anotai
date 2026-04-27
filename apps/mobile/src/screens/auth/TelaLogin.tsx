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
import LogomarcaIcone1 from '../../assets/icons/LOGOMARCA_ICONE1.svg'
import IconeUsuario from '../../assets/icons/ICONE_MENU_LATERAL_USUARIO.svg'
import IconeInicio from '../../assets/icons/ICONE_MENU_LATERAL_INICIO.svg'

interface Props {
  navigation: any
}

export function TelaLogin({ navigation }: Props) {
  const [email,        setEmail]        = useState('')
  const [senha,        setSenha]        = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [carregando,   setCarregando]   = useState(false)
  const [erros,        setErros]        = useState<{ email?: string; senha?: string }>({})

  const refSenha = useRef<TextInputType>(null)
  const { login, estaLogado } = useAuth()

  // Navega para Home quando o contexto confirmar o login — garante render após setState
  useEffect(() => {
    if (estaLogado) {
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] })
    }
  }, [estaLogado])

  function validar(): boolean {
    const novosErros: typeof erros = {}
    if (!email.trim()) {
      novosErros.email = 'Informe seu e-mail'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      novosErros.email = 'E-mail inválido'
    }
    if (!senha) {
      novosErros.senha = 'Informe sua senha'
    } else if (senha.length < 6) {
      novosErros.senha = 'Senha deve ter pelo menos 6 caracteres'
    }
    setErros(novosErros)
    return Object.keys(novosErros).length === 0
  }

  async function handleLogin() {
    if (!validar()) return
    setCarregando(true)
    try {
      await login(email.trim().toLowerCase(), senha)
      // navegação tratada pelo useEffect que observa estaLogado
    } catch (error: any) {
      const mensagem = error.response?.data?.erro || 'Erro ao conectar. Verifique sua internet.'
      Alert.alert('Não foi possível entrar', mensagem)
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
          <Text style={estilos.headerTitulo}>Bem vindo!</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Home')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <IconeInicio width={26} height={26} color="white" />
        </TouchableOpacity>
      </View>

      {/* CORPO */}
      <KeyboardAvoidingView style={estilos.corpo} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={estilos.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Título da página */}
          <View style={estilos.tituloRow}>
            <IconeUsuario width={26} height={26} color={CORES.secundaria} />
            <Text style={estilos.tituloPagina}>Proprietário / Login</Text>
          </View>
          <View style={estilos.divisoria} />
          <Text style={estilos.subtitulo}>Acesse sua conta para continuar</Text>

          {/* Campo E-mail */}
          <View style={estilos.campoWrapper}>
            <View style={[estilos.inputContainer, erros.email ? estilos.inputErro : null]}>
              <Ionicons name="mail-outline" size={20} color={CORES.cinzaTexto} style={estilos.iconeInput} />
              <TextInput
                style={estilos.input}
                value={email}
                onChangeText={(t) => { setEmail(t); setErros(e => ({ ...e, email: undefined })) }}
                placeholder="seu@email.com"
                placeholderTextColor={CORES.cinzaTexto}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                blurOnSubmit={false}
                returnKeyType="next"
                onSubmitEditing={() => refSenha.current?.focus()}
                accessibilityLabel="Campo de e-mail"
              />
            </View>
            {erros.email && <Text style={estilos.textoErro}>{erros.email}</Text>}
          </View>

          {/* Campo Senha */}
          <View style={estilos.campoWrapper}>
            <View style={[estilos.inputContainer, erros.senha ? estilos.inputErro : null]}>
              <Ionicons name="lock-closed-outline" size={20} color={CORES.cinzaTexto} style={estilos.iconeInput} />
              <TextInput
                ref={refSenha}
                style={estilos.input}
                value={senha}
                onChangeText={(t) => { setSenha(t); setErros(e => ({ ...e, senha: undefined })) }}
                placeholder="sua senha"
                placeholderTextColor={CORES.cinzaTexto}
                autoCorrect={false}
                secureTextEntry={!mostrarSenha}
                blurOnSubmit={false}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                accessibilityLabel="Campo de senha"
              />
              <TouchableOpacity onPress={() => setMostrarSenha(v => !v)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name={mostrarSenha ? 'eye-off-outline' : 'eye-outline'} size={20} color={CORES.cinzaTexto} />
              </TouchableOpacity>
            </View>
            {erros.senha && <Text style={estilos.textoErro}>{erros.senha}</Text>}
          </View>

          {/* Esqueci a senha */}
          <TouchableOpacity style={estilos.linkEsqueceu}>
            <Text style={estilos.textoLinkEsqueceu}>Esqueci minha senha</Text>
          </TouchableOpacity>

          {/* Botão Entrar */}
          <TouchableOpacity
            style={[estilos.botaoEntrar, carregando && estilos.botaoDesabilitado]}
            onPress={handleLogin}
            disabled={carregando}
            accessibilityRole="button"
          >
            {carregando ? (
              <ActivityIndicator color={CORES.branco} size="small" />
            ) : (
              <Text style={estilos.textoBotao}>Entrar</Text>
            )}
          </TouchableOpacity>

          {/* Rodapé */}
          <View style={estilos.rodape}>
            <Text style={estilos.textoRodape}>Ainda não tem conta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Cadastro')}>
              <Text style={estilos.linkCadastro}>Criar conta grátis</Text>
            </TouchableOpacity>
          </View>

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
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  scroll: {
    padding: ESPACOS.lg,
    paddingTop: ESPACOS.xl,
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
    marginBottom: ESPACOS.md,
    borderRadius: 1,
  },
  subtitulo: {
    fontSize: FONTES.normal,
    color: CORES.cinzaTexto,
    marginBottom: ESPACOS.lg,
  },
  campoWrapper: {
    marginBottom: ESPACOS.md,
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
  linkEsqueceu: {
    alignSelf: 'flex-end',
    marginBottom: ESPACOS.lg,
  },
  textoLinkEsqueceu: {
    fontSize: FONTES.normal,
    color: CORES.cinzaTexto,
  },
  botaoEntrar: {
    backgroundColor: CORES.primaria,
    borderRadius: 20,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: ESPACOS.lg,
  },
  botaoDesabilitado: {
    opacity: 0.6,
  },
  textoBotao: {
    color: CORES.branco,
    fontSize: FONTES.media,
    fontWeight: '700',
  },
  rodape: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoRodape: {
    fontSize: FONTES.normal,
    color: CORES.cinzaTexto,
  },
  linkCadastro: {
    fontSize: FONTES.normal,
    fontWeight: '700',
    color: CORES.secundaria,
  },
})
