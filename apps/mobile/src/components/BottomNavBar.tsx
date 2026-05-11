import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { CORES, FONTES, ESPACOS } from '../constants/cores'

export type AbaNav = 'inicio' | 'servicos' | 'pecas' | 'revisoes' | 'veiculo'

interface Props {
  ativa: AbaNav
  navigation: any
}

type Lib = 'mci' | undefined
const ABAS: { key: AbaNav; label: string; labelA11y: string; icone: string; lib?: Lib; rota: string }[] = [
  { key: 'inicio',   label: 'Início',   labelA11y: 'Ir para Início',   icone: 'home-outline',      rota: 'Home' },
  { key: 'servicos', label: 'Serviços', labelA11y: 'Ir para Serviços', icone: 'construct-outline',  rota: 'Servicos' },
  { key: 'pecas',    label: 'Peças',    labelA11y: 'Ir para Peças',    icone: 'cog-outline',        rota: 'Pecas' },
  { key: 'revisoes', label: 'Revisões', labelA11y: 'Ir para Revisões', icone: 'calendar-outline',   rota: 'Revisoes' },
  { key: 'veiculo',  label: 'Veículo',  labelA11y: 'Ir para Veículo',  icone: 'car-multiple', lib: 'mci', rota: 'Veiculos' },
]

function NavIcon({ icone, lib, size, color }: { icone: string; lib?: Lib; size: number; color: string }) {
  if (lib === 'mci') return <MaterialCommunityIcons name={icone as any} size={size} color={color} />
  return <Ionicons name={icone as any} size={size} color={color} />
}

export function BottomNavBar({ ativa, navigation }: Props) {
  return (
    <View style={estilos.bottomNav}>
      {ABAS.map(({ key, label, labelA11y, icone, lib, rota }) => {
        const ativo = ativa === key
        return (
          <TouchableOpacity
            key={key}
            style={estilos.abaNav}
            onPress={() => { if (!ativo) navigation.navigate(rota) }}
            accessible={true}
            accessibilityLabel={labelA11y}
            accessibilityRole="tab"
            accessibilityState={{ selected: ativo }}
          >
            <NavIcon icone={icone} lib={lib} size={24} color={ativo ? CORES.secundaria : 'white'} />
            {ativo && <View style={estilos.pontoAtivo} />}
            <Text style={[estilos.abaLabel, ativo && estilos.abaLabelAtivo]}>{label}</Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const estilos = StyleSheet.create({
  bottomNav: {
    backgroundColor: CORES.primaria,
    flexDirection: 'row',
    paddingBottom: ESPACOS.sm,
    paddingTop: ESPACOS.sm,
    borderTopWidth: 1,
    borderTopColor: CORES.primariaMedio,
  },
  abaNav:        { flex: 1, alignItems: 'center', gap: 3 },
  pontoAtivo:    { width: 5, height: 5, borderRadius: 3, backgroundColor: CORES.secundaria },
  abaLabel:      { fontSize: 13, color: CORES.cinzaTexto },
  abaLabelAtivo: { color: CORES.secundaria, fontWeight: '600' },
})



