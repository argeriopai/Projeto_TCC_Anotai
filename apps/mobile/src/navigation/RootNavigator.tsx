import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { TelaSplash }              from '../screens/TelaSplash'
import { TelaHome }                from '../screens/home/TelaHome'
import { TelaLogin }               from '../screens/auth/TelaLogin'
import { TelaCadastro }            from '../screens/auth/TelaCadastro'
import { TelaRegistrarCarro }      from '../screens/veiculos/TelaRegistrarCarro'
import { TelaRegistrarMoto }       from '../screens/veiculos/TelaRegistrarMoto'
import { TelaRegistrarServico }    from '../screens/registros/TelaRegistrarServico'
import { TelaRegistrarPeca }       from '../screens/registros/TelaRegistrarPeca'
import { TelaRegistrarNotificacao} from '../screens/registros/TelaRegistrarNotificacao'
import { TelaServicos }            from '../screens/relatorios/TelaServicos'
import { TelaPecas }               from '../screens/relatorios/TelaPecas'
import { TelaNotificacoes }        from '../screens/relatorios/TelaNotificacoes'
import { TelaVeiculos }            from '../screens/relatorios/TelaVeiculos'
import { TelaContato }             from '../screens/TelaContato'
import { TelaMeuPerfil }          from '../screens/TelaMeuPerfil'
import { TelaGaleria }            from '../screens/TelaGaleria'
import { TelaAcessibilidade }    from '../screens/TelaAcessibilidade'
import { TelaNotificacoesPush } from '../screens/TelaNotificacoesPush'
import { TelaRelatorio }        from '../screens/TelaRelatorio'
import { TelaEsqueciSenha }    from '../screens/auth/TelaEsqueciSenha'
import { TelaAlterarSenha }   from '../screens/auth/TelaAlterarSenha'

const Stack = createNativeStackNavigator()

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{ headerShown: false, animation: 'fade' }}
      >
        <Stack.Screen name="Splash"               component={TelaSplash}              />
        <Stack.Screen name="Home"                 component={TelaHome}                options={{ animation: 'none' }} />
        <Stack.Screen name="Login"                component={TelaLogin}               options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="Cadastro"             component={TelaCadastro}            options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="RegistrarCarro"       component={TelaRegistrarCarro}      options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="RegistrarMoto"        component={TelaRegistrarMoto}       options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="RegistrarServico"     component={TelaRegistrarServico}    options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="RegistrarPeca"        component={TelaRegistrarPeca}       options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="RegistrarRevisao"     component={TelaRegistrarNotificacao}options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="Servicos"             component={TelaServicos}            options={{ animation: 'none' }} />
        <Stack.Screen name="Pecas"                component={TelaPecas}               options={{ animation: 'none' }} />
        <Stack.Screen name="Revisoes"             component={TelaNotificacoes}        options={{ animation: 'none' }} />
        <Stack.Screen name="Veiculos"             component={TelaVeiculos}            options={{ animation: 'none' }} />
        <Stack.Screen name="Contato"              component={TelaContato}             options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="MeuPerfil"            component={TelaMeuPerfil}           options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="Galeria"              component={TelaGaleria}             options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="Acessibilidade"       component={TelaAcessibilidade}      options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="NotificacoesPush"     component={TelaNotificacoesPush}    options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="TelaRelatorio"        component={TelaRelatorio}           options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="EsqueciSenha"         component={TelaEsqueciSenha}        options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="AlterarSenha"         component={TelaAlterarSenha}        options={{ animation: 'slide_from_right' }} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
