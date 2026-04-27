import React, { useState } from 'react'
import { View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native'
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'
import { Ionicons } from '@expo/vector-icons'
import { CORES, FONTES, ESPACOS } from '../constants/cores'

interface Props {
  label:          string
  obrigatorio?:   boolean
  valor:          Date
  erro?:          string
  onChange:       (data: Date) => void
  permitirFuturo?: boolean
}

function formatarData(d: Date): string {
  const dd   = String(d.getDate()).padStart(2, '0')
  const mm   = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

export function CampoData({ label, obrigatorio, valor, erro, onChange, permitirFuturo }: Props) {
  const [aberto, setAberto] = useState(false)

  function onChangeNativo(_: DateTimePickerEvent, dataSelecionada?: Date) {
    if (Platform.OS === 'android') setAberto(false)
    if (dataSelecionada) onChange(dataSelecionada)
  }

  return (
    <View style={estilos.campo}>
      <Text style={estilos.label}>
        {label}{obrigatorio && <Text style={estilos.obrig}> *</Text>}
      </Text>

      <TouchableOpacity
        style={[estilos.botao, erro ? estilos.botaoErro : null]}
        onPress={() => setAberto(true)}
        activeOpacity={0.7}
      >
        <Text style={estilos.texto}>{formatarData(valor)}</Text>
        <Ionicons name="calendar-outline" size={18} color={CORES.cinzaTexto} />
      </TouchableOpacity>

      {!!erro && <Text style={estilos.textoErro}>{erro}</Text>}

      {(aberto || Platform.OS === 'ios') && aberto && (
        <DateTimePicker
          value={valor}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          locale="pt-BR"
          maximumDate={permitirFuturo ? undefined : new Date()}
          onChange={onChangeNativo}
        />
      )}
    </View>
  )
}

export { formatarData }

const estilos = StyleSheet.create({
  campo:    { marginBottom: ESPACOS.md },
  label:    { fontSize: FONTES.normal, fontWeight: '600', color: CORES.texto, marginBottom: ESPACOS.xs },
  obrig:    { color: CORES.erro, fontWeight: '700' },
  botao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: CORES.branco,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: CORES.borda,
    paddingHorizontal: ESPACOS.md,
    height: 50,
  },
  botaoErro:  { borderColor: CORES.erro },
  texto:      { fontSize: FONTES.normal, color: CORES.texto },
  textoErro:  { color: CORES.erro, fontSize: FONTES.pequena, marginTop: ESPACOS.xs },
})
