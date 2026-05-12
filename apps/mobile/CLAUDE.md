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
  assets/           → icon.png, adaptive-icon.png, splash-icon.png, favicon.png (placeholders)
  src/
    assets/icons/   → LOGOMARCA_1.svg (único SVG em uso)
    contexts/       → AuthContext, VeiculoContext, AcessibilidadeContext
    components/     → AppText, AvatarCircular, BotaoMic, IndicadorGravando, CampoData, BottomNavBar
    hooks/          → useVoiceInput, useAuthGuard
    navigation/     → RootNavigator
    screens/        → todas as telas
    services/       → api.ts, notificacoes.ts
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

### 5F — Comando de voz
- useVoiceInput.ts: stub com interface useVoiceInput(onResult) → { gravando, iniciarGravacao, pararGravacao } ✅
  (@react-native-voice/voice removido — conflito androidx impossível de resolver; stub exibe Alert informativo)
- TelaRegistrarServico: mic no campo Descrição ✅
- TelaRegistrarPeca: 2 instâncias do hook, mic independente em Nome da peça e Descrição ✅
- TelaRegistrarNotificacao: mic no campo Mensagem ✅
- BotaoMic e IndicadorGravando: componentes de UI para mic (pulse animation + "Gravando...") ✅
- app.json: plugin @react-native-voice/voice e withVoiceFix removidos ✅

### 5G — Relatório de despesas (reescrita)
- TelaRelatorio: filtro por veículo ativo (VeiculoContext) ✅
- Tabs "Juntos" (serviços+peças combinados) e "Separados" (seções independentes) ✅
- Agrupamento mensal com cabeçalho, itens e subtotal por mês ✅
- Cards de total: Serviços (construct-outline), Peças (cog-outline), Total Geral ✅
- Clique em item navega para tela de consulta correspondente (Servicos/Pecas) ✅

### 5H — Pré-build: limpeza e assets
- Auditoria completa: 31 telas, 8 hooks/serviços, 4 contextos, 8 componentes verificados ✅
- 20 SVGs ociosos deletados de src/assets/icons/ (mantido apenas LOGOMARCA_1.svg) ✅
- TelaHome: import LogomarcaIcone1 removido; 4 cores '#2ECC71' → CORES.secundaria ✅
- cores.ts: BORDAS e CORES.verdeSlogan removidos (nunca utilizados) ✅
- TelaSplash: import LOGOMARCA_ICONE1.svg (deletado) → LOGOMARCA_1.svg ✅
- assets/ criada com 4 PNGs placeholder (icon, adaptive-icon, splash-icon, favicon) ✅
  → substituir por assets definitivos do designer antes do build final

## Sprint 6 — CONCLUÍDO

### 6A — Notificações e card de veículo
- TelaNotificacoesPush: removida lixeira individual e botão "Cancelar todos" ✅
- TelaNotificacoesPush: card vira TouchableOpacity → navega para 'Revisoes' ao tocar ✅
  (exclusão/edição de revisão ocorre apenas na tela de revisões)
- TelaHome: card de veículo exibe marca + modelo na linha principal e placa na linha secundária ✅
  (segue o padrão dos chips das telas de registro)

### 6B — Notificações órfãs
- notificacoes.ts: nova função cancelarTodasNotificacoes() ✅
- AuthContext logout(): cancela todas as notificações antes de limpar AsyncStorage ✅
- AuthContext restaurarSessao(): cancela notificações ao iniciar sem sessão (visitante) ✅
- AuthContext restaurarSessao(): cancela notificações em caso de sessão corrompida (catch) ✅
- TelaNotificacoesPush: useEffect cancela notificações órfãs ao montar em modo visitante ✅

## Próximo passo — Sprint 7
A definir.

## Convenções do projeto
- Estilos: StyleSheet.create com variável es
- Nomes em português (telas, contextos, funções)
- Componentes com export function (não default)
- Ícones: @expo/vector-icons (Ionicons)

## Repositório
github.com/argeriopai/Projeto_TCC_Anotai
