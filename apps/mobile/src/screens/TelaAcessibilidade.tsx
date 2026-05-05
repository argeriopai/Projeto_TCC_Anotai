import React from 'react'
import {
  View, StyleSheet, Switch, ScrollView, TouchableOpacity,
} from 'react-native'
import { AppText } from '../components/AppText'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { useAcessibilidade } from '../contexts/AcessibilidadeContext'
import { CORES, FONTES, ESPACOS } from '../constants/cores'

export function TelaAcessibilidade() {
  const navigation = useNavigation()
  const { fonteGrande, toggleFonteGrande, escala } = useAcessibilidade()

  return (
    <View style={es.container}>
      {/* Header */}
      <View style={es.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={es.btnVoltar}>
          <Ionicons name="arrow-back" size={24} color={CORES.branco} />
        </TouchableOpacity>
        <AppText style={es.headerTitulo}>Acessibilidade</AppText>
      </View>

      <ScrollView contentContainerStyle={es.content}>
        <AppText style={[es.tituloSecao, { fontSize: 26 * escala }]}>
          Configure sua{'\n'}experiência visual.
        </AppText>

        {/* Card de opção */}
        <View style={es.card}>
          <View style={es.cardEsquerda}>
            <View style={es.iconeContainer}>
              <Ionicons name="text" size={22} color={CORES.primaria} />
            </View>
            <View style={es.cardTextos}>
              <AppText style={[es.cardTitulo, { fontSize: FONTES.normal * escala }]}>
                Aumentar tamanho do texto
              </AppText>
              <AppText style={[es.cardDescricao, { fontSize: FONTES.pequena * escala }]}>
                Melhora a legibilidade.
              </AppText>
            </View>
          </View>
          <Switch
            value={fonteGrande}
            onValueChange={toggleFonteGrande}
            trackColor={{ false: '#ccc', true: CORES.secundaria }}
            thumbColor={fonteGrande ? CORES.primaria : '#f4f3f4'}
          />
        </View>

        {/* Preview */}
        <View style={es.preview}>
          <AppText style={[es.previewLabel, { fontSize: FONTES.pequena * escala }]}>
            Pré-visualização
          </AppText>
          <AppText style={[es.previewTexto, { fontSize: FONTES.normal * escala }]}>
            Registrar Serviço
          </AppText>
          <AppText style={[es.previewSubtexto, { fontSize: FONTES.pequena * escala }]}>
            Toque para adicionar um novo serviço ao seu veículo.
          </AppText>
        </View>
      </ScrollView>
    </View>
  )
}

const es = StyleSheet.create({
  container: { flex: 1, backgroundColor: CORES.cinzaClaro },
  header: {
    backgroundColor: CORES.primaria,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ESPACOS.md,
    paddingTop: 48,
    paddingBottom: 16,
    gap: 12,
  },
  btnVoltar: { padding: 4 },
  headerTitulo: { color: CORES.branco, fontSize: FONTES.subtitulo, fontWeight: '700' },
  content: { padding: ESPACOS.lg, gap: ESPACOS.lg },
  tituloSecao: {
    fontSize: 26,
    fontWeight: '800',
    color: CORES.pretinho,
    lineHeight: 34,
  },
  card: {
    backgroundColor: CORES.branco,
    borderRadius: 16,
    padding: ESPACOS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardEsquerda: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconeContainer: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: CORES.cinzaClaro,
    justifyContent: 'center', alignItems: 'center',
  },
  cardTextos: { flex: 1 },
  cardTitulo: { fontWeight: '600', color: CORES.pretinho },
  cardDescricao: { color: CORES.cinzaTexto, marginTop: 2 },
  preview: {
    backgroundColor: CORES.branco,
    borderRadius: 16,
    padding: ESPACOS.md,
    gap: 6,
    borderLeftWidth: 4,
    borderLeftColor: CORES.secundaria,
  },
  previewLabel: { color: CORES.cinzaTexto, fontWeight: '600', marginBottom: 4 },
  previewTexto: { fontWeight: '700', color: CORES.pretinho },
  previewSubtexto: { color: CORES.texto, lineHeight: 20 },
})
