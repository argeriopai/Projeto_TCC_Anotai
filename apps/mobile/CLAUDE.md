# ANOTAÍ — TCC App Mobile

## Stack
- React Native + Expo SDK 54 + TypeScript
- AsyncStorage, Axios
- Monorepo: `apps/mobile`

## Paleta de cores
- Header/Primária: `#141450`
- Verde/Secundária: `#2ECC71`
- Fundo: `#F0F2F8`

## Estrutura principal
apps/mobile/
  src/
    contexts/       → AuthContext, VeiculoContext, VLibrasContext
    components/     → VLibrasFloat, VLibrasText, ...
    navigation/     → RootNavigator, DrawerNavigator, BottomTabNavigator
    screens/        → todas as telas
    constants/      → cores.ts (CORES, FONTES, ESPACOS)

## Sprints concluídos
- Sprint 1: Splash, Login, Cadastro, Home, Guest Mode, Drawer, Bottom Nav, Carrossel
- Sprint 2: Registro Carro, Moto, Serviço, Peças, Revisões, DatePicker, Máscaras
- Sprint 3: 5 telas de consulta, Galeria de fotos, Regras de negócio, VLibras

## Sprint 3 — CONCLUÍDO
- 5 telas de consulta ✅
- Galeria de fotos ✅
- Regras de negócio ✅
- Acessibilidade: fonte grande global (AcessibilidadeContext + AppText) ✅
- VLibras: removido (incompatível com mobile nativo, documentar como melhoria futura)

## Sprint 4 — CONCLUÍDO
- Notificações locais com expo-notifications ✅
- src/services/notificacoes.ts: solicitarPermissao, agendarNotificacao, cancelarNotificacao, listarNotificacoesAgendadas ✅
- App.tsx: setNotificationHandler + solicitarPermissao na inicialização ✅
- TelaRegistrarNotificacao: agenda notificação local (08h) ao salvar nova revisão com data futura ✅
- TelaNotificacoesPush: lista e cancela lembretes agendados individualmente ou todos ✅
- RootNavigator: rota NotificacoesPush ✅
- TelaHome drawer: item "Notificações" (ícone notifications-outline) ✅

## Próximo passo — Sprint 5
A definir.

## Convenções do projeto
- Estilos: StyleSheet.create com variável es
- Nomes em português (telas, contextos, funções)
- Componentes com export function (não default)
- Ícones: @expo/vector-icons (Ionicons)

## Repositório
github.com/argeriopai/Projeto_TCC_Anotai
