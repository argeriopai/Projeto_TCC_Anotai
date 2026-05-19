import React, { useState, useRef } from 'react'
import {
  View, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native'
import { AppText } from '../../components/AppText'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth'
import { auth } from '../../services/firebase'
import { CORES, FONTES, ESPACOS } from '../../constants/cores'

interface Props { navigation: any }

export function TelaAlterarSenha({ navigation }: Props) {
  const [senhaAtual,    setSenhaAtual]    = useState('')
  const [novaSenha,     setNovaSenha]     = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [mostrar,       setMostrar]       = useState(false)
  const [carregando,    setCarregando]    = useState(false)

  const refNova      = useRef<TextInput>(null)
  const refConfirmar = useRef<TextInput>(null)

  async function salvar() {
    if (!senhaAtual.trim()) {
      Alert.alert('Atenção', 'Digite sua senha atual.')
      return
    }
    if (novaSenha.length < 6) {
      Alert.alert('Atenção', 'A nova senha deve ter no mínimo 6 caracteres.')
      return
    }
    if (novaSenha !== confirmarSenha) {
      Alert.alert('Atenção', 'A nova senha e a confirmação não coincidem.')
      return
    }

    const user = auth.currentUser
    if (!user || !user.email) {
      Alert.alert('Erro', 'Usuário não autenticado.')
      return
    }

    setCarregando(true)
    try {
      const credential = EmailAuthProvider.credential(user.email, senhaAtual)
      await reauthenticateWithCredential(user, credential)
    } catch (e: any) {
      const code = e?.code ?? ''
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        Alert.alert('Erro', 'Senha atual incorreta.')
      } else {
        Alert.alert('Erro', 'Não foi possível verificar sua senha. Tente novamente.')
      }
      setCarregando(false)
      return
    }

    try {
      await updatePassword(user, novaSenha)
      Alert.alert('Sucesso', 'Senha alterada com sucesso!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ])
    } catch {
      Alert.alert('Erro', 'Não foi possível alterar a senha. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <SafeAreaView style={es.safe} edges={['top']}>

      {/* HEADER */}
      <View style={es.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessible
          accessibilityLabel="Voltar"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={22} color={CORES.branco} />
        </TouchableOpacity>
        <AppText style={es.headerTitulo}>Alterar Senha</AppText>
        <View style={{ width: 22 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={es.scroll}
          contentContainerStyle={es.conteudo}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={es.card}>
            <AppText style={es.cardTitulo}>Nova senha</AppText>
            <AppText style={es.cardSubtitulo}>
              Confirme sua senha atual antes de definir uma nova.
            </AppText>

            {/* Senha atual */}
            <View style={es.campoGroup}>
              <AppText style={es.campoLabel}>Senha atual</AppText>
              <View style={es.campoLinha}>
                <TextInput
                  style={es.campoInput}
                  value={senhaAtual}
                  onChangeText={setSenhaAtual}
                  secureTextEntry={!mostrar}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  onSubmitEditing={() => refNova.current?.focus()}
                  blurOnSubmit={false}
                  placeholder="••••••"
                  placeholderTextColor={CORES.cinzaTexto}
                  accessibilityLabel="Senha atual"
                />
                <TouchableOpacity
                  onPress={() => setMostrar(v => !v)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={es.olhoBtn}
                >
                  <Ionicons
                    name={mostrar ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={CORES.cinzaTexto}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Nova senha */}
            <View style={es.campoGroup}>
              <AppText style={es.campoLabel}>Nova senha</AppText>
              <View style={es.campoLinha}>
                <TextInput
                  ref={refNova}
                  style={es.campoInput}
                  value={novaSenha}
                  onChangeText={setNovaSenha}
                  secureTextEntry={!mostrar}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  onSubmitEditing={() => refConfirmar.current?.focus()}
                  blurOnSubmit={false}
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor={CORES.cinzaTexto}
                  accessibilityLabel="Nova senha"
                />
              </View>
            </View>

            {/* Confirmar nova senha */}
            <View style={[es.campoGroup, { marginBottom: 0 }]}>
              <AppText style={es.campoLabel}>Confirmar nova senha</AppText>
              <View style={es.campoLinha}>
                <TextInput
                  ref={refConfirmar}
                  style={es.campoInput}
                  value={confirmarSenha}
                  onChangeText={setConfirmarSenha}
                  secureTextEntry={!mostrar}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={salvar}
                  placeholder="Repita a nova senha"
                  placeholderTextColor={CORES.cinzaTexto}
                  accessibilityLabel="Confirmar nova senha"
                />
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[es.botaoSalvar, carregando && { opacity: 0.6 }]}
            onPress={salvar}
            disabled={carregando}
            accessible
            accessibilityLabel="Salvar nova senha"
            accessibilityRole="button"
          >
            {carregando
              ? <ActivityIndicator color={CORES.primaria} />
              : <AppText style={es.botaoSalvarTexto}>Salvar Senha</AppText>
            }
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const es = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: CORES.primaria },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ESPACOS.md,
    paddingVertical: ESPACOS.sm,
    backgroundColor: CORES.primaria,
  },
  headerTitulo: { color: CORES.branco, fontSize: FONTES.subtitulo, fontWeight: '700' },

  scroll:   { flex: 1, backgroundColor: CORES.cinzaClaro },
  conteudo: { padding: ESPACOS.md, paddingBottom: ESPACOS.xxl },

  card: {
    backgroundColor: CORES.branco,
    borderRadius: 16,
    padding: ESPACOS.lg,
    marginBottom: ESPACOS.md,
    shadowColor: CORES.sombra,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitulo:    { fontSize: FONTES.subtitulo, fontWeight: '700', color: CORES.pretinho, marginBottom: 4 },
  cardSubtitulo: { fontSize: FONTES.pequena, color: CORES.textoSecundario, marginBottom: ESPACOS.lg, lineHeight: 18 },

  campoGroup: { marginBottom: ESPACOS.md },
  campoLabel: { fontSize: FONTES.pequena, color: CORES.textoSecundario, marginBottom: 4 },
  campoLinha: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1.5, borderBottomColor: CORES.secundaria },
  campoInput: {
    flex: 1,
    fontSize: FONTES.normal,
    color: CORES.pretinho,
    fontWeight: '500',
    paddingVertical: 6,
    paddingBottom: 4,
  },
  olhoBtn: { paddingLeft: ESPACOS.sm },

  botaoSalvar: {
    backgroundColor: CORES.secundaria,
    borderRadius: 20,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: ESPACOS.xs,
  },
  botaoSalvarTexto: { color: CORES.primaria, fontSize: FONTES.normal, fontWeight: '700' },
})
