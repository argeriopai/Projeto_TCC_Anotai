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

## Sprint 5 — CONCLUÍDO

### 5A — Veículo Ativo na Home
- VeiculoContext: veiculoAtivoId (string|null) + ativarVeiculo(id), persiste em '@anotai:veiculoAtivo' ✅
- TelaHome: seção 'Meus Veículos' com FlatList horizontal, cards com badge ATIVO e borda verde ✅

### 5B — Relatório de Despesas
- Cria TelaRelatorio: filtros mensal/semestral/anual, cards Serviços + Peças + Total Geral ✅
- Lista de lançamentos combinada (serviços + peças) ordenada por data ✅
- Valores formatados R$ X.XXX,XX ✅
- TelaHome: card de atalho 'Ver Relatório de Despesas' + item 'Relatório' na drawer ✅
- RootNavigator: rota TelaRelatorio ✅

### 5C — Ajustes de UX (drawer + cards de veículo)
- Drawer: itens envolvidos em ScrollView (todos acessíveis via scroll) ✅
- Drawer header: maxHeight 160, logo 55×28, avatar 44, nome fontSize 15, email fontSize 11 ✅
- Drawer itens: paddingVertical reduzido para 10 ✅
- Seção veículo: título → 'Ative aqui o veículo', subtítulo atualizado ✅
- Cards: ícone checkmark-circle (ativo) / radio-button-off (inativo) no canto sup direito ✅
- Badge 'ATIVO' movido para canto inferior esquerdo (sem sobreposição com ícone) ✅
- onPress diferenciado: inativo → ativarVeiculo + Alert confirmação; ativo → Alert informativo ✅

### 5D — Ajustes de UX II (drawer + ativação de veículo + badge)
- Drawer largura: fixo 280 → 72% da tela (SCREEN_WIDTH * 0.72) ✅
- Drawer logo: 55×28 → 65×65 ✅
- Bug corrigido: ativar veículo na Home agora chama definirVeiculoAtivo() com objeto completo ✅
  (TelaRegistrarServico/Peca leem veiculoAtivo — objeto de @anotai:veiculo_ativo —
   e não veiculoAtivoId; a Home só chamava ativarVeiculo(id), que salva apenas o ID)
- Badge 'ATIVO': removido posicionamento absoluto; agora em fluxo normal abaixo do modelo ✅
- cardVeiculo: height fixo 100 → minHeight 110, justifyContent center → flex-start ✅

### 5E — Ajustes de UX III (sincronização e header do drawer)
- VeiculoContext: definirVeiculoAtivo() agora também atualiza veiculoAtivoId e @anotai:veiculoAtivo ✅
  (TelaVeiculos chamava só definirVeiculoAtivo; veiculoAtivoId ficava desatualizado na Home)
- Drawer header: email com numberOfLines=1 ellipsizeMode="tail" para não invadir a lista ✅
- Drawer header: paddingTop 40, paddingBottom 20, removidos minHeight/maxHeight — altura automática ✅
- Separador visual (height 1, rgba branco 15%, marginTop 8) entre header e lista de itens ✅

## Sprint 6 — CONCLUÍDO

### 6A — REVERTIDO (causou bugs de isolamento de dados e notificações)
- TelaNotificacoesPush: remover ícone lixeira e "Cancelar todos"; cards navegam para 'Revisoes'
- TelaHome: card exibe `marca modelo` como texto principal e `placa` como secundário

### 6B — REVERTIDO junto com 6A
- cancelarTodasNotificacoes() em notificacoes.ts
- AuthContext logout() cancela todas as notificações ao sair
- AuthContext restaurarSessao() cancela notificações órfãs quando sem sessão
- TelaNotificacoesPush: useEffect cancela notificações órfãs para visitantes

### 6C — Isolamento de dados no logout ✅
- VeiculoContext: importa useAuth, observa [estaLogado, carregando] ✅
- Quando carregando=false e estaLogado=false: zera veiculoAtivo, veiculoAtivoId e limpa AsyncStorage ✅
- Guarda carregando evita reset prematuro durante restauração de sessão no startup ✅
- Serviços/peças/revisões: não precisam de reset (useFocusEffect + API sem token = vazio) ✅

### 6D — Isolamento de dados no mock (getPid) ✅
- getPid() em api.ts: antes ignorava token e retornava 'mock-user-1' fixo ✅
- Agora lê o token do header Authorization, rejeita 401 se ausente ou inválido ✅
- Dados mock (carros, motos, serviços, peças) passam a ser isolados por proprietarioId real ✅

## Sprint 7 — CONCLUÍDO

### 7A — Notificações não aparecem para visitante
- TelaNotificacoesPush: guard estaLogado limpa lista para visitante ✅

### 7B — Isolamento de dados no mock (getPid recuperação de sessão)
- getPid() recupera sessão após reload do Expo Go via formato do token ✅

### 7C — Sincronização lembretes com registro de origem
- notificacoes.ts: salvarMapeamento, buscarOsNotifId, removerMapeamento ✅
- Criar lembrete: salva mapeamento notificacaoId → osNotifId ✅
- Editar lembrete: cancela OS antigo, reagenda novo, atualiza mapeamento ✅
- Excluir registro: cancela OS, remove mapeamento ✅
- Clicar no lembrete: navega para registro de origem ou exibe alert se excluído ✅

## Sprint 8 — EM ANDAMENTO
Próximo passo: a definir.

## Convenções do projeto
- Estilos: StyleSheet.create com variáveis
- Nomes em português (telas, contextos, funções)
- Componentes com export function (não default)
- Ícones: @expo/vector-icons (Ionicons)

## Repositório
github.com/argeriopai/Projeto_TCC_Anotai
