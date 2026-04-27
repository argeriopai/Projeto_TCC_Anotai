import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { CORES, FONTES, ESPACOS } from '../constants/cores'

import IconeNavInicio      from '../assets/icons/ICONE_INICIO_BOTTOM_NAV.svg'
import IconeNavServicos    from '../assets/icons/ICONE_RELATORIO_SERVIÇOS.svg'
import IconeNavPecas       from '../assets/icons/ICONE_RELATORIO_PEÇAS.svg'
import IconeNavNotificacao from '../assets/icons/ICONE_RELATORIO_NOTIFICAÇÃO.svg'
import IconeNavVeiculo     from '../assets/icons/ICONE_RELATORIO_VEICULOS.svg'

export type AbaNav = 'inicio' | 'servicos' | 'pecas' | 'revisoes' | 'veiculo'

interface Props {
  ativa: AbaNav
  navigation: any
}

const ABAS: { key: AbaNav; label: string; Icone: any; rota: string }[] = [
  { key: 'inicio',      label: 'Início',      Icone: IconeNavInicio,      rota: 'Home' },
  { key: 'servicos',    label: 'Serviços',    Icone: IconeNavServicos,    rota: 'Servicos' },
  { key: 'pecas',       label: 'Peças',       Icone: IconeNavPecas,       rota: 'Pecas' },
  { key: 'revisoes',    label: 'Revisões',    Icone: IconeNavNotificacao, rota: 'Revisoes' },
  { key: 'veiculo',     label: 'Veículo',     Icone: IconeNavVeiculo,     rota: 'Veiculos' },
]

export function BottomNavBar({ ativa, navigation }: Props) {
  return (
    <View style={estilos.bottomNav}>
      {ABAS.map(({ key, label, Icone, rota }) => {
        const ativo = ativa === key
        return (
          <TouchableOpacity
            key={key}
            style={estilos.abaNav}
            onPress={() => { if (!ativo) navigation.navigate(rota) }}
          >
            <Icone width={26} height={26} color={ativo ? CORES.secundaria : 'white'} />
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
  abaNav:      { flex: 1, alignItems: 'center', gap: 3 },
  pontoAtivo:  { width: 5, height: 5, borderRadius: 3, backgroundColor: CORES.secundaria },
  abaLabel:    { fontSize: 9, color: CORES.cinzaTexto },
  abaLabelAtivo: { color: CORES.secundaria, fontWeight: '600' },
})
