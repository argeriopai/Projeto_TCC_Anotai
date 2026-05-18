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
- Sprint 4: Notificações locais, TelaNotificacoesPush, permissões
- Sprint 5: Veículo Ativo na Home, Relatório de Despesas, ajustes UX
- Sprint 6: Isolamento de dados no logout e no mock (getPid)
- Sprint 7: Guard visitante, recuperação de sessão, sync lembretes ↔ registro
- Sprint 8: Modal boas-vindas visitante, Esqueci minha senha, máscara de placa, maxLength campos, auto-limpeza notificações vencidas, campo livre "Outro", bloqueio placa duplicada
- Sprint 9: Galeria filtrada por veículo ativo, chips → CampoDropdown, antecedência configurável, isolamento por usuário/veículo, ícone sino ativo/inativo, veículo no card, card veículo com marca/modelo, foto e perfil persistem após logout/login, tipos de serviço/revisão em arquivo compartilhado
- Sprint 10: Firebase Auth + Firestore integrados, mock removido, dados persistem na nuvem, node_modules removido do git

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

## Sprint 8 — CONCLUÍDO

### 8A — Modal de boas-vindas para visitante na TelaHome ✅
- TelaHome: `avisadoVisitante = useRef(false)` + `useEffect` exibe Alert de boas-vindas apenas para visitantes, apenas 1 vez por visita (não rerenderiza)

### 8B — Tela "Esqueci minha senha" ✅
- Criado `src/screens/auth/TelaEsqueciSenha.tsx`: campo e-mail, validação, chamada `api.post('/auth/esqueci-senha')`, Alert de confirmação, botão voltar
- RootNavigator: rota `EsqueciSenha` com `animation: 'slide_from_right'`
- TelaLogin: botão "Esqueci minha senha" agora navega para `EsqueciSenha`

### 8C — Máscara de placa (padrão antigo + Mercosul) ✅
- Criado `src/utils/mascara.ts`: `mascaraPlaca()` e `validarPlaca()` (regex antigo ABC-1234 e Mercosul ABC1D23)
- TelaRegistrarCarro e TelaRegistrarMoto: campo Placa usa `mascaraPlaca` no `onChangeText`, `maxLength={8}`, validação com `validarPlaca` no `validar()`

### 8D — Limite de caracteres (`maxLength`) em todos os campos ✅
- TelaCadastro: `CampoProps` recebe `maxLength?`; campos: Nome=60, E-mail=80, Telefone=15, Senha=20, Confirmar Senha=20
- TelaRegistrarCarro / TelaRegistrarMoto: Marca livre=40, Modelo=40, Cor=40, Placa=8
- TelaRegistrarServico: Tipo=50, Descrição=300, Custo=12, Estabelecimento=60, Tel.estab=15, Profissional=60, Tel.prof=15, Garantia=30, Kilometragem=7
- TelaRegistrarPeca: Nome=50, Descrição=300, Estabelecimento=60, Tel.estab=15, Quantidade=4, Valor unit=12
- TelaRegistrarNotificacao: Mensagem=200

### 8E — Ajustes: Cor maxLength 40, notificação 1 dia antes, texto informativo ✅
- TelaRegistrarCarro / Moto: campo Cor `maxLength` 20 → 40
- `notificacoes.ts`: `agendarNotificacao` agora subtrai 1 dia antes de `setHours(8,0,0,0)` — dispara 1 dia antes da data do lembrete
- TelaRegistrarNotificacao: view informativa abaixo do `CampoData` com ícone `information-circle-outline` + texto "Você será notificado um dia antes"

### 8F — Auto-remover notificações com data vencida ✅
- TelaNotificacoesPush `carregarLista()`: percorre todas as notificações agendadas, cancela silenciosamente as vencidas (verifica 4 formatos de `trigger`: `value`, `seconds`, `dateComponents`, `date`), exibe apenas as válidas ordenadas por `dataAgendada`

### 8G — Campo livre "Outro" nos chips de Tipo da TelaRegistrarNotificacao ✅
- Estado `tipoOutro` adicionado; `tipoInicial` computado antes do estado para edição
- Quando `tipo === 'Outro'`: exibe TextInput "Especifique o tipo..." entre chips de Tipo e chips de Veículo
- `validar()` exige `tipoOutro.trim()` quando `tipo === 'Outro'`
- `handleSalvar()` envia `tipoOutro.trim()` no payload quando tipo é "Outro"

### 8H — Bloquear cadastro de veículo com placa duplicada ✅
- TelaRegistrarCarro: antes do payload, busca duplicata em carros (mesmo id excluído na edição) e depois em motos — Alert se encontrar
- TelaRegistrarMoto: mesma lógica com ordem invertida (motos primeiro, carros depois)
- Comparação normalizada: remove hífen, força maiúsculas em ambos os lados

## Sprint 9 — CONCLUÍDO

### 9A — Galeria filtrada pelo veículo ativo ✅
- TelaGaleria: importa `useVeiculo`; filtra lista de veículos por `veiculoAtivo.id` quando há veículo ativo
- Estado vazio exibe mensagem "Ative um veículo para ver suas fotos" quando nenhum veículo está ativo

### 9B — Chips de tipo de serviço por categoria (TelaRegistrarServico) ✅
- `TIPOS_SERVICO_CARRO` e `TIPOS_SERVICO_MOTO` já existiam; chips substituídos por `CampoDropdown` (Modal + FlatList)
- Opções filtradas por `veiculoAtivo?.tipo`: moto → TIPOS_SERVICO_MOTO, carro → TIPOS_SERVICO_CARRO
- TextInput "Outro" mantido abaixo do dropdown quando `tipo === 'Outro'`

### 9C — CampoDropdown em TelaRegistrarNotificacao ✅
- `TIPOS_REVISAO_CARRO` e `TIPOS_REVISAO_MOTO` definidos (mesma lista, inclui "Outro")
- `OPCOES_DIAS_ANTES = ['No dia do evento', '1 dia antes', ..., '5 dias antes']`
- Chips de "Tipo de revisão" e "Antecedência" substituídos por `CampoDropdown`
- `diasAntesStr: string` → `parseDiasAntes()` converte para número (0 para "No dia do evento")
- `temAlteracao` verifica apenas `!!tipo || !!mensagem.trim()` (veiculoId removido para evitar falso positivo)
- `validar()` não exige mensagem preenchida (campo opcional)

### 9D — Antecedência configurável em agendarNotificacao ✅
- `notificacoes.ts`: `agendarNotificacao` aceita `diasAntes: number = 1` como 6º parâmetro
- Subtrai `diasAntes` dias da data do evento antes de definir horário 08h
- Salva `dataEvento` (data original do evento) em `content.data` além de `dataAgendada`
- Extras incluem `{ notificacaoId, veiculoId, diasAntes }` em ambas as chamadas

### 9E — Isolamento de notificações por usuário e veículo ✅
- `carregarLista()`: filtra por `proprietarioId` (notificações sem campo sempre passam — retrocompatível)
- Filtra por `veiculoAtivo.id` quando há veículo ativo (sem `veiculoId` sempre passa)
- Ordena por `dataAgendada` após filtragem

### 9F — Ícone sino reflete estado ativo/inativo da revisão ✅
- `carregarLista()` busca notificações da API, constrói `inativas: Set<string>` (onde `ativo === false`)
- Card: ícone `notifications-off-outline` cinza se inativa, `notifications` verde se ativa

### 9G — Data do evento no card de notificação ✅
- `dataStr` prefere `dataEvento` (data original) sobre `dataAgendada` (data de disparo)
- `formatarDataHora()` exibe `dd/mm/aaaa às 08:00`

### 9H — Veículo no card de notificação ✅
- `carregarLista()` busca todos os carros e motos da API, monta `veiculosMap: Record<string, string>` → `{ [id]: "marca modelo — placa" }`
- Card exibe linha com ícone `car-outline` + nome do veículo abaixo do título (quando disponível)

## Convenções do projeto
- Estilos: StyleSheet.create com variáveis
- Nomes em português (telas, contextos, funções)
- Componentes com export function (não default)
- Ícones: @expo/vector-icons (Ionicons)

## Repositório
github.com/argeriopai/Projeto_TCC_Anotai

## Sprint 10 — Integração Firebase — CONCLUÍDO ✅

### Sprint 9 — itens adicionais concluídos ✅
- TelaHome: card de veículo exibe `Marca Modelo` (principal) e `Placa` (secundária)
- TelaRegistrarServico: listas TIPOS_VEICULO_CARRO (27 itens) e TIPOS_VEICULO_MOTO (13 itens) extraídas para `src/constants/tiposServico.ts`
- TelaRegistrarNotificacao: label "Tipo de revisão", diasAntes restaurado de content.data na edição
- AuthContext: foto de perfil isolada por userId (`@anotai:foto_perfil:<id>`), persiste após logout/login
- AuthContext: nome/telefone editados persistem após logout/login via `@anotai:perfil:<id>`

### Firebase — concluído ✅
- `firebase.ts` criado (initializeApp, auth, db)
- `AuthContext` migrado para Firebase Auth (signIn, createUser, signOut, onAuthStateChanged)
- `firestoreService.ts` criado com 26 funções (carros, motos, serviços, peças, notificações)
- `api.ts` mock removido (448 → 140 linhas) → redireciona para Firestore
- Dados persistem na nuvem entre sessões e dispositivos
- `node_modules` removido do rastreamento git (.gitignore corrigido)
- Commits: ae9a39d2 (Firebase), e6b5d2ab (gitignore)

### firebaseConfig:
apiKey: "AIzaSyAWxjgS3U-2_CSUcBLwi9jbJmPX6OnW0Jo"
authDomain: "anotai-145e1.firebaseapp.com"
projectId: "anotai-145e1"
storageBucket: "anotai-145e1.firebasestorage.app"
messagingSenderId: "143171299379"
appId: "1:143171299379:web:6c191fb0e6a4e536665b46"

## Sprint 11 — Geração do APK final

### Próximos passos:
1. Testar todas as funcionalidades com Firebase (carro, moto, serviço, peça, revisão, relatório)
2. Gerar APK: `eas build --platform android --profile preview`
3. Distribuir para testadores

### Feedbacks dos testadores a implementar:
- (listar aqui os feedbacks recebidos quando retomar)

### Comando para recuperar contexto:
"Leia o CLAUDE.md e retome o desenvolvimento"
