import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Alert, Linking,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../contexts/AuthContext'
import { CORES, FONTES, ESPACOS } from '../constants/cores'

interface Props { navigation: any }

export function TelaContato({ navigation }: Props) {
  const { proprietario } = useAuth()
  const apelido = proprietario?.apelido ?? proprietario?.nome?.split(' ')[0] ?? 'Visitante'

  const [mensagem, setMensagem] = useState('')

  function handleEnviar() {
    if (!mensagem.trim()) {
      Alert.alert('Atenção', 'Por favor, escreva sua mensagem antes de enviar.')
      return
    }
    Alert.alert(
      'Mensagem enviada!',
      'Mensagem enviada com sucesso! Obrigado pelo contato 😊',
      [{ text: 'OK', onPress: () => setMensagem('') }]
    )
  }

  return (
    <SafeAreaView style={estilos.safe} edges={['top']}>
      {/* HEADER */}
      <View style={estilos.header}>
        <View style={estilos.headerEsquerda}>
          <Ionicons name="person-circle-outline" size={34} color={CORES.branco} />
          <View style={{ marginLeft: ESPACOS.xs }}>
            <Text style={estilos.headerOla}>Olá,</Text>
            <Text style={estilos.headerNome}>{apelido}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={estilos.headerHomeBtn}
          onPress={() => navigation.navigate('Home')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="home" size={20} color={CORES.branco} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={estilos.scroll}
          contentContainerStyle={estilos.scrollConteudo}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* CARD PRINCIPAL */}
          <View style={estilos.card}>
            <Text style={estilos.cardTitulo}>Que bom ter você aqui!</Text>

            <Text style={estilos.cardLabel}>Como Posso Ajudar?</Text>

            <TextInput
              style={estilos.input}
              value={mensagem}
              onChangeText={setMensagem}
              placeholder="Deixe aqui sua mensagem, reclamação ou sugestão"
              placeholderTextColor={CORES.cinzaTexto}
              multiline
              textAlignVertical="top"
              autoCapitalize="sentences"
              blurOnSubmit={false}
            />

            <TouchableOpacity style={estilos.btnEnviar} onPress={handleEnviar} activeOpacity={0.8}>
              <Text style={estilos.btnEnviarTexto}>Enviar</Text>
            </TouchableOpacity>
          </View>

          {/* RODAPÉ — links de contato */}
          <View style={estilos.rodape}>
            <TouchableOpacity
              style={estilos.rodapeItem}
              onPress={() => Linking.openURL('mailto:anotai@gmail.com')}
            >
              <Ionicons name="mail-outline" size={20} color={CORES.secundaria} />
              <Text style={estilos.rodapeTexto}>anotai@gmail.com</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={estilos.rodapeItem}
              onPress={() => Linking.openURL('https://instagram.com/anotai')}
            >
              <Ionicons name="logo-instagram" size={20} color={CORES.secundaria} />
              <Text style={estilos.rodapeTexto}>@anotai</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const estilos = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: CORES.primaria },

  header: {
    backgroundColor: CORES.primaria,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ESPACOS.md,
    paddingVertical: ESPACOS.sm,
  },
  headerEsquerda: { flexDirection: 'row', alignItems: 'center' },
  headerOla:      { color: CORES.cinzaTexto, fontSize: FONTES.pequena },
  headerNome:     { color: CORES.branco, fontSize: FONTES.normal, fontWeight: '700' },
  headerHomeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: CORES.secundaria,
    justifyContent: 'center',
    alignItems: 'center',
  },

  scroll:        { flex: 1, backgroundColor: '#F0F2F8' },
  scrollConteudo: { padding: ESPACOS.md, paddingBottom: ESPACOS.xxl },

  card: {
    backgroundColor: CORES.branco,
    borderRadius: 16,
    padding: ESPACOS.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: ESPACOS.lg,
  },
  cardTitulo: {
    fontSize: FONTES.titulo,
    fontWeight: '800',
    color: CORES.primaria,
    textAlign: 'center',
    marginBottom: ESPACOS.md,
  },
  cardLabel: {
    fontSize: FONTES.media,
    fontWeight: '600',
    color: CORES.texto,
    marginBottom: ESPACOS.sm,
  },
  input: {
    backgroundColor: CORES.branco,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: CORES.borda,
    paddingHorizontal: ESPACOS.md,
    paddingVertical: ESPACOS.sm,
    minHeight: 120,
    fontSize: FONTES.normal,
    color: CORES.texto,
    marginBottom: ESPACOS.md,
  },
  btnEnviar: {
    borderWidth: 2,
    borderColor: CORES.primaria,
    borderRadius: 20,
    paddingVertical: ESPACOS.sm,
    paddingHorizontal: ESPACOS.xl,
    alignSelf: 'center',
    backgroundColor: CORES.branco,
  },
  btnEnviarTexto: {
    color: CORES.primaria,
    fontSize: FONTES.normal,
    fontWeight: '700',
  },

  rodape: {
    gap: ESPACOS.sm,
  },
  rodapeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACOS.sm,
    paddingVertical: ESPACOS.xs,
  },
  rodapeTexto: {
    fontSize: FONTES.normal,
    color: CORES.pretinho,
    fontWeight: '500',
  },
})
