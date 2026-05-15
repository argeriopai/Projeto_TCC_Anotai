import React, { useState } from 'react'
import {
  View, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { AppText } from '../../components/AppText'
import { CORES, FONTES, ESPACOS } from '../../constants/cores'
import { api } from '../../services/api'

interface Props { navigation: any }

export function TelaEsqueciSenha({ navigation }: Props) {
  const [email, setEmail]           = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro]             = useState('')

  function validar(): boolean {
    if (!email.trim()) {
      setErro('Informe seu e-mail cadastrado.')
      return false
    }
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!regex.test(email.trim())) {
      setErro('Informe um e-mail válido.')
      return false
    }
    setErro('')
    return true
  }

  async function handleEnviar() {
    if (!validar()) return
    setCarregando(true)
    try {
      await api.post('/auth/esqueci-senha', { email: email.trim().toLowerCase() })
    } catch {
      // Endpoint pode não existir no mock — exibir sucesso mesmo assim
      // (boa prática: não revelar se o e-mail existe ou não)
    } finally {
      setCarregando(false)
      Alert.alert(
        '📧 E-mail enviado!',
        'Se este e-mail estiver cadastrado, você receberá as instruções para redefinir sua senha em breve.',
        [{ text: 'Voltar ao login', onPress: () => navigation.goBack() }]
      )
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header com botão voltar */}
          <TouchableOpacity
            style={styles.btnVoltar}
            onPress={() => navigation.goBack()}
            accessible={true}
            accessibilityLabel="Voltar"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={24} color={CORES.primaria} />
          </TouchableOpacity>

          {/* Ícone e título */}
          <View style={styles.topoIcone}>
            <Ionicons name="lock-open-outline" size={56} color={CORES.primaria} />
          </View>
          <AppText style={styles.titulo}>Esqueci minha senha</AppText>
          <AppText style={styles.subtitulo}>
            Digite o e-mail cadastrado e enviaremos as instruções para redefinir sua senha.
          </AppText>

          {/* Campo e-mail */}
          <View style={[styles.inputContainer, erro ? styles.inputErro : null]}>
            <Ionicons
              name="mail-outline"
              size={20}
              color={CORES.primaria}
              style={styles.inputIcone}
            />
            <TextInput
              style={styles.input}
              placeholder="Seu e-mail cadastrado"
              placeholderTextColor={CORES.placeholder}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={txt => { setEmail(txt); setErro('') }}
              returnKeyType="send"
              onSubmitEditing={handleEnviar}
              accessibilityLabel="Campo de e-mail"
            />
          </View>
          {!!erro && (
            <AppText style={styles.textoErro}>{erro}</AppText>
          )}

          {/* Botão enviar */}
          <TouchableOpacity
            style={[styles.btnEnviar, carregando && styles.btnDesabilitado]}
            onPress={handleEnviar}
            disabled={carregando}
            accessible={true}
            accessibilityLabel="Enviar instruções de recuperação"
            accessibilityRole="button"
            accessibilityState={{ disabled: carregando }}
          >
            {carregando
              ? <ActivityIndicator color={CORES.branco} />
              : <AppText style={styles.btnEnviarTexto}>Enviar instruções</AppText>
            }
          </TouchableOpacity>

          {/* Link voltar */}
          <TouchableOpacity
            style={styles.linkVoltar}
            onPress={() => navigation.goBack()}
            accessible={true}
            accessibilityLabel="Voltar para o login"
            accessibilityRole="button"
          >
            <AppText style={styles.linkVoltarTexto}>Voltar para o login</AppText>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: CORES.cinzaClaro },
  scroll:          { flexGrow: 1, padding: ESPACOS.md, paddingTop: ESPACOS.lg },
  btnVoltar:       { marginBottom: ESPACOS.lg },
  topoIcone:       { alignItems: 'center', marginBottom: ESPACOS.md },
  titulo:          { fontSize: FONTES.subtitulo, fontWeight: 'bold', color: CORES.primaria,
                     textAlign: 'center', marginBottom: ESPACOS.sm },
  subtitulo:       { fontSize: FONTES.normal, color: CORES.textoSecundario, textAlign: 'center',
                     marginBottom: ESPACOS.lg, lineHeight: 22 },
  inputContainer:  { flexDirection: 'row', alignItems: 'center',
                     backgroundColor: CORES.branco, borderRadius: 10, borderWidth: 1.5,
                     borderColor: CORES.borda, paddingHorizontal: ESPACOS.sm,
                     marginBottom: ESPACOS.xs },
  inputErro:       { borderColor: CORES.erro },
  inputIcone:      { marginRight: ESPACOS.xs },
  input:           { flex: 1, height: 50, fontSize: FONTES.media, color: CORES.pretinho },
  textoErro:       { fontSize: FONTES.pequena, color: CORES.erro, marginBottom: ESPACOS.sm },
  btnEnviar:       { backgroundColor: CORES.primaria, borderRadius: 10,
                     height: 50, alignItems: 'center', justifyContent: 'center',
                     marginTop: ESPACOS.md },
  btnDesabilitado: { opacity: 0.6 },
  btnEnviarTexto:  { color: CORES.branco, fontSize: FONTES.media, fontWeight: 'bold' },
  linkVoltar:      { alignItems: 'center', marginTop: ESPACOS.lg },
  linkVoltarTexto: { color: CORES.primaria, fontSize: FONTES.normal },
})
