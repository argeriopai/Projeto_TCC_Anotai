import React, { useRef, useState, useEffect } from 'react'
import {
  View, TouchableOpacity, StyleSheet, ScrollView,
  Animated, Dimensions, TouchableWithoutFeedback, Alert,
} from 'react-native'
import { AppText } from '../../components/AppText'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { useAuth } from '../../contexts/AuthContext'
import { useAuthGuard } from '../../hooks/useAuthGuard'
import { CORES, FONTES, ESPACOS } from '../../constants/cores'

// Logomarca
import LogomarcaIcone1 from '../../assets/icons/LOGOMARCA_ICONE1.svg'
import Logomarca1      from '../../assets/icons/LOGOMARCA_1.svg'

import { AvatarCircular } from '../../components/AvatarCircular'

// Drawer lateral — ícones de Menu (Ionicons para tamanho uniforme)
type IProps = { width?: number; height?: number; color?: string }
const IconeMenuUsuario = ({ width = 26, color }: IProps) => <Ionicons name="person-outline"  size={width} color={color ?? '#fff'} />
const IconeMenuCarro   = ({ width = 26, color }: IProps) => <Ionicons name="car-outline"     size={width} color={color ?? '#fff'} />
const IconeGaleria     = ({ width = 26, color }: IProps) => <Ionicons name="images-outline"  size={width} color={color ?? '#fff'} />
const IconeMenuContato = ({ width = 26, color }: IProps) => <Ionicons name="mail-outline"    size={width} color={color ?? '#fff'} />
const IconeMenuSair          = ({ width = 26, color }: IProps) => <Ionicons name="log-out-outline" size={width} color={color ?? '#fff'} />
const IconeAcessibilidade    = ({ width = 26, color }: IProps) => <Ionicons name="eye-outline"     size={width} color={color ?? '#fff'} />

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const DRAWER_WIDTH = 280
const CAROUSEL_WIDTH = SCREEN_WIDTH - 32

const slides = [
  { fundo: '#141450', titulo: 'TRAGA PRA NÓS!',       subtitulo: '(00) 0000-0000',                              subtituloVerde: true  },
  { fundo: '#0a3d0a', titulo: 'PARCEIRO COMERCIAL',    subtitulo: 'Anuncie aqui para milhares de motoristas',    subtituloVerde: false },
  { fundo: '#3d1a00', titulo: 'SUA OFICINA AQUI',      subtitulo: 'Entre em contato: contato@anotai.com',        subtituloVerde: false },
]

interface Props {
  navigation: any
}

type Aba = 'inicio' | 'servicos' | 'pecas' | 'revisoes' | 'veiculo'
type LibIcon = 'mci' | undefined
type BotaoItem = { label: string; icone: string; lib?: LibIcon; onPress: () => void }
type AbaNavItem = { key: string; label: string; icone: string; lib?: LibIcon; rota: string | null }

function NavIcon({ icone, lib, size, color }: { icone: string; lib?: LibIcon; size: number; color: string }) {
  if (lib === 'mci') return <MaterialCommunityIcons name={icone as any} size={size} color={color} />
  return <Ionicons name={icone as any} size={size} color={color} />
}

export function TelaHome({ navigation }: Props) {
  const { proprietario, estaLogado, logout } = useAuth()
  const { requireAuth } = useAuthGuard()
  const apelido = proprietario?.apelido ?? proprietario?.nome?.split(' ')[0] ?? ''

  // DEBUG TEMPORÁRIO — remover após confirmar que o banner some ao logar
  console.log('[TelaHome] estaLogado:', estaLogado, '| proprietario:', proprietario?.email)

  const [abaAtiva, setAbaAtiva] = useState<Aba>('inicio')
  const [drawerAberto, setDrawerAberto] = useState(false)
  const [slideAtual, setSlideAtual] = useState(0)

  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current
  const overlayOpacity = useRef(new Animated.Value(0)).current
  const carouselRef = useRef<ScrollView>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setSlideAtual(prev => {
        const next = (prev + 1) % slides.length
        carouselRef.current?.scrollTo({ x: next * CAROUSEL_WIDTH, animated: true })
        return next
      })
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  function abrirDrawer() {
    setDrawerAberto(true)
    Animated.parallel([
      Animated.timing(translateX, { toValue: 0, duration: 260, useNativeDriver: true }),
      Animated.timing(overlayOpacity, { toValue: 1, duration: 260, useNativeDriver: true }),
    ]).start()
  }

  function fecharDrawer() {
    Animated.parallel([
      Animated.timing(translateX, { toValue: -DRAWER_WIDTH, duration: 220, useNativeDriver: true }),
      Animated.timing(overlayOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => setDrawerAberto(false))
  }

  function handleLogout() {
    fecharDrawer()
    setTimeout(() => {
      Alert.alert(
        'Sair',
        'Deseja realmente sair do app?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Sair',
            style: 'destructive',
            onPress: async () => {
              await logout()
              navigation.reset({ index: 0, routes: [{ name: 'Login' }] })
            },
          },
        ]
      )
    }, 300)
  }

  function navegarDaDrawer(tela: string) {
    fecharDrawer()
    setTimeout(() => navigation.navigate(tela), 300)
  }

  const botoes: BotaoItem[] = [
    { label: 'Registrar Carro',    icone: 'car-outline',       onPress: () => navigation.navigate('RegistrarCarro') },
    { label: 'Registrar Moto',     icone: 'motorbike', lib: 'mci', onPress: () => navigation.navigate('RegistrarMoto') },
    { label: 'Registrar Serviços', icone: 'construct-outline', onPress: () => navigation.navigate('RegistrarServico') },
    { label: 'Registrar Peças',    icone: 'cog-outline',       onPress: () => navigation.navigate('RegistrarPeca') },
    { label: 'Registrar Revisões', icone: 'calendar-outline',  onPress: () => navigation.navigate('RegistrarRevisao') },
  ]

  const abasNav: AbaNavItem[] = [
    { key: 'inicio',   label: 'Início',   icone: 'home-outline',     rota: null },
    { key: 'servicos', label: 'Serviços', icone: 'construct-outline', rota: 'Servicos' },
    { key: 'pecas',    label: 'Peças',    icone: 'cog-outline',       rota: 'Pecas' },
    { key: 'revisoes', label: 'Revisões', icone: 'calendar-outline',  rota: 'Revisoes' },
    { key: 'veiculo',  label: 'Veículo',  icone: 'car-multiple', lib: 'mci', rota: 'Veiculos' },
  ]

  const itensDrawer = [
    { label: 'Meu Perfil', Icone: IconeMenuUsuario, onPress: () => { fecharDrawer(); setTimeout(() => requireAuth(() => navigation.navigate('MeuPerfil')), 300) }, vermelho: false },
    { label: 'Veículo',    Icone: IconeMenuCarro,   onPress: () => navegarDaDrawer('Veiculos'),                                                                     vermelho: false },
    { label: 'Galeria',    Icone: IconeGaleria,     onPress: () => { fecharDrawer(); setTimeout(() => requireAuth(() => navigation.navigate('Galeria')), 300) },    vermelho: false },
    { label: 'Contato',        Icone: IconeMenuContato,    onPress: () => navegarDaDrawer('Contato'),        vermelho: false },
    { label: 'Acessibilidade', Icone: IconeAcessibilidade, onPress: () => navegarDaDrawer('Acessibilidade'), vermelho: false },
    { label: 'Sair',           Icone: IconeMenuSair,       onPress: handleLogout,                            vermelho: true  },
  ]

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={estilos.safeArea} edges={['top']}>

        {/* HEADER */}
        <View style={estilos.header}>
          <TouchableOpacity
            onPress={abrirDrawer}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessible={true}
            accessibilityLabel="Abrir menu de navegação"
            accessibilityRole="button"
          >
            <Ionicons name="menu-outline" size={28} color={CORES.branco} />
          </TouchableOpacity>

          <View style={estilos.headerCentro}>
            <Logomarca1 width={70} height={35} color="white" />
            <AppText style={estilos.headerTitulo}>
              {estaLogado ? `Olá, ${apelido}!` : 'Bem vindo!'}
            </AppText>
          </View>

          {estaLogado ? (
            <TouchableOpacity
              onPress={handleLogout}
              style={estilos.botaoSair}
              accessible={true}
              accessibilityLabel="Sair da conta"
              accessibilityRole="button"
            >
              <AppText style={estilos.textoBotaoSair}>Sair</AppText>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 48 }} />
          )}
        </View>

        {/* CONTEÚDO */}
        <ScrollView style={estilos.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 90 }}>

          {/* Banner guest mode */}
          {!estaLogado && (
            <TouchableOpacity
              style={estilos.bannerGuest}
              onPress={() => navigation.navigate('Login')}
              accessible={true}
              accessibilityLabel="Entrar ou criar conta para salvar seus registros na nuvem"
              accessibilityRole="button"
            >
              <Ionicons name="person-circle-outline" size={28} color={CORES.branco} />
              <View style={{ flex: 1, marginLeft: ESPACOS.sm }}>
                <AppText style={estilos.bannerGuestTitulo}>Entrar / Criar conta</AppText>
                <AppText style={estilos.bannerGuestSub}>Salve seus registros na nuvem</AppText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={CORES.branco} />
            </TouchableOpacity>
          )}

          {/* Carrossel de anúncios — decorativo, oculto do leitor de tela */}
          <View
            style={estilos.carrosselContainer}
            accessibilityElementsHidden={true}
            importantForAccessibility="no-hide-descendants"
          >
            <ScrollView
              ref={carouselRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              scrollEnabled={false}
              style={{ width: CAROUSEL_WIDTH }}
            >
              {slides.map((slide, i) => (
                <View key={i} style={[estilos.carrosselSlide, { backgroundColor: slide.fundo }]}>
                  <AppText style={estilos.carrosselTitulo}>{slide.titulo}</AppText>
                  <AppText style={[estilos.carrosselSubtitulo, slide.subtituloVerde && estilos.carrosselSubtituloVerde]}>
                    {slide.subtitulo}
                  </AppText>
                </View>
              ))}
            </ScrollView>
            <View style={estilos.carrosselDots}>
              {slides.map((_, i) => (
                <View key={i} style={[estilos.dot, i === slideAtual && estilos.dotAtivo]} />
              ))}
            </View>
          </View>

          {/* Subtítulo */}
          <AppText style={estilos.subtituloAcoes}>Faça seus registros</AppText>

          {/* Botões de ação */}
          {botoes.map(({ label, icone, lib, onPress }) => (
            <TouchableOpacity
              key={label}
              style={estilos.botaoAcao}
              onPress={onPress}
              activeOpacity={0.7}
              accessible={true}
              accessibilityLabel={label}
              accessibilityRole="button"
            >
              <View style={estilos.botaoAcaoIcone}>
                <NavIcon icone={icone} lib={lib} size={22} color={CORES.secundaria} />
              </View>
              <View style={estilos.barraVerde} />
              <AppText style={estilos.botaoAcaoLabel}>{label}</AppText>
              <Ionicons name="chevron-forward" size={18} color={CORES.cinzaTexto} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
          ))}

          {/* Banner inferior — decorativo, oculto do leitor de tela */}
          <View
            style={estilos.bannerInferior}
            accessibilityElementsHidden={true}
            importantForAccessibility="no-hide-descendants"
          >
            <View style={estilos.bannerLadoIcone}>
              <Ionicons name="construct-outline" size={64} color={CORES.secundaria} />
              <Ionicons name="car" size={36} color={CORES.branco} style={{ marginTop: -6 }} />
            </View>
            <View style={estilos.bannerLadoTexto}>
              <AppText style={estilos.bannerTextoBranco}>Nunca mais</AppText>
              <AppText style={estilos.bannerTextoVerde}>ESQUEÇA</AppText>
              <AppText style={estilos.bannerTextoBranco}>do que já</AppText>
              <AppText style={estilos.bannerTextoVerde}>FOI FEITO</AppText>
              <AppText style={estilos.bannerTextoBranco}>no seu Veículo</AppText>
            </View>
          </View>

          {/* Botão Cadastre-se fora do banner — só para visitantes */}
          {!estaLogado && (
            <TouchableOpacity
              onPress={() => navigation.navigate('Cadastro')}
              style={estilos.botaoCadastro}
              accessible={true}
              accessibilityLabel="Cadastre-se gratuitamente"
              accessibilityRole="button"
            >
              <AppText style={estilos.textoBotaoCadastro}>Cadastre-se aqui!</AppText>
            </TouchableOpacity>
          )}

        </ScrollView>

        {/* BOTTOM NAVIGATION */}
        <View style={estilos.bottomNav}>
          {abasNav.map(({ key, label, icone, lib, rota }) => {
            const ativo = abaAtiva === key
            return (
              <TouchableOpacity
                key={key}
                style={estilos.abaNav}
                onPress={() => {
                  if (rota) {
                    navigation.navigate(rota)
                  } else {
                    setAbaAtiva(key as Aba)
                  }
                }}
                accessible={true}
                accessibilityLabel={`Ir para ${label}`}
                accessibilityRole="tab"
                accessibilityState={{ selected: ativo }}
              >
                <NavIcon icone={icone} lib={lib} size={24} color={ativo ? CORES.secundaria : 'white'} />
                {ativo && <View style={estilos.pontoAtivo} />}
                <AppText style={[estilos.abaLabel, ativo && estilos.abaLabelAtivo]}>{label}</AppText>
              </TouchableOpacity>
            )
          })}
        </View>

      </SafeAreaView>

      {/* DRAWER OVERLAY */}
      {drawerAberto && (
        <TouchableWithoutFeedback onPress={fecharDrawer}>
          <Animated.View style={[estilos.overlay, { opacity: overlayOpacity }]} />
        </TouchableWithoutFeedback>
      )}

      {/* DRAWER */}
      <Animated.View style={[estilos.drawer, { transform: [{ translateX }] }]}>
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
          {/* Drawer header */}
          <View style={estilos.drawerHeader}>
            <View style={estilos.drawerLogomarcaWrap}>
              <Logomarca1 width={140} height={70} color="white" />
            </View>
            {estaLogado && (
              <AvatarCircular
                uri={proprietario?.fotoPerfil}
                size={64}
                borderWidth={2}
                borderColor={CORES.secundaria}
              />
            )}
            <AppText style={estilos.drawerNome}>{estaLogado ? (apelido || 'Usuário') : 'Visitante'}</AppText>
            {estaLogado
              ? <AppText style={estilos.drawerEmail}>{proprietario?.email}</AppText>
              : (
                <TouchableOpacity onPress={() => navegarDaDrawer('Login')}>
                  <AppText style={estilos.drawerEmailLink}>Faça seu login</AppText>
                </TouchableOpacity>
              )
            }
          </View>

          {/* Drawer items */}
          <View style={estilos.drawerItens}>
            {itensDrawer.map(({ label, Icone, onPress, vermelho }) => (
              <TouchableOpacity
                key={label}
                style={estilos.drawerItem}
                onPress={onPress}
                accessible={true}
                accessibilityLabel={label}
                accessibilityRole="menuitem"
              >
                <Icone width={26} height={26} color={vermelho ? CORES.erro : CORES.secundaria} />
                <AppText style={[estilos.drawerItemLabel, vermelho && estilos.drawerItemVermelho]}>
                  {label}
                </AppText>
              </TouchableOpacity>
            ))}
          </View>
        </SafeAreaView>
      </Animated.View>
    </View>
  )
}

const estilos = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: CORES.cinzaClaro,
  },
  header: {
    backgroundColor: CORES.primaria,
    paddingHorizontal: ESPACOS.lg,
    paddingVertical: ESPACOS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerCentro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACOS.xs,
    flex: 1,
    justifyContent: 'center',
  },
  headerTitulo: {
    color: CORES.branco,
    fontSize: FONTES.media,
    fontWeight: '700',
  },
  botaoSair: {
    borderWidth: 1,
    borderColor: CORES.erro,
    borderRadius: 12,
    paddingHorizontal: ESPACOS.sm,
    paddingVertical: 4,
  },
  textoBotaoSair: {
    color: CORES.erro,
    fontSize: FONTES.pequena,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  bannerGuest: {
    backgroundColor: CORES.primariaMedio,
    flexDirection: 'row',
    alignItems: 'center',
    padding: ESPACOS.md,
    marginHorizontal: ESPACOS.md,
    marginTop: ESPACOS.md,
    borderRadius: 12,
  },
  bannerGuestTitulo: {
    color: CORES.branco,
    fontSize: FONTES.normal,
    fontWeight: '700',
  },
  bannerGuestSub: {
    color: CORES.cinzaTexto,
    fontSize: FONTES.pequena,
    marginTop: 2,
  },
  carrosselContainer: {
    margin: ESPACOS.md,
    borderRadius: 12,
    overflow: 'hidden',
    height: 90,
  },
  carrosselSlide: {
    width: CAROUSEL_WIDTH,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: ESPACOS.lg,
  },
  carrosselTitulo: {
    color: CORES.branco,
    fontSize: FONTES.subtitulo,
    fontWeight: '900',
    letterSpacing: 1,
  },
  carrosselSubtitulo: {
    color: CORES.branco,
    fontSize: FONTES.media,
    fontWeight: '700',
    marginTop: ESPACOS.xs,
  },
  carrosselSubtituloVerde: {
    color: '#2ECC71',
  },
  carrosselDots: {
    position: 'absolute',
    bottom: 6,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotAtivo: {
    backgroundColor: '#2ECC71',
  },
  subtituloAcoes: {
    fontSize: FONTES.media,
    fontWeight: '700',
    color: CORES.pretinho,
    marginHorizontal: ESPACOS.md,
    marginBottom: ESPACOS.sm,
  },
  botaoAcao: {
    backgroundColor: CORES.branco,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: ESPACOS.md,
    marginBottom: ESPACOS.sm,
    borderRadius: 12,
    padding: ESPACOS.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  botaoAcaoIcone: {
    width: 44,
    alignItems: 'center',
  },
  barraVerde: {
    width: 3,
    height: 40,
    backgroundColor: CORES.secundaria,
    borderRadius: 2,
    marginHorizontal: ESPACOS.sm,
  },
  botaoAcaoLabel: {
    fontSize: FONTES.normal,
    fontWeight: '600',
    color: CORES.pretinho,
    flex: 1,
  },
  bannerInferior: {
    backgroundColor: CORES.primaria,
    marginHorizontal: ESPACOS.md,
    marginTop: ESPACOS.md,
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    minHeight: 140,
  },
  bannerLadoIcone: {
    flex: 0.38,
    backgroundColor: CORES.primariaMedio,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ESPACOS.md,
    gap: ESPACOS.xs,
  },
  bannerLadoTexto: {
    flex: 0.62,
    paddingVertical: ESPACOS.md,
    paddingHorizontal: ESPACOS.md,
    justifyContent: 'center',
  },
  bannerTextoBranco: {
    color: CORES.branco,
    fontSize: FONTES.normal,
    fontWeight: '400',
    lineHeight: 20,
  },
  bannerTextoVerde: {
    color: CORES.secundaria,
    fontSize: FONTES.subtitulo,
    fontWeight: '900',
    letterSpacing: 0.5,
    lineHeight: 26,
  },
  botaoCadastro: {
    backgroundColor: CORES.secundaria,
    borderRadius: 20,
    paddingHorizontal: ESPACOS.xl,
    paddingVertical: ESPACOS.sm,
    alignSelf: 'center',
    marginTop: ESPACOS.md,
    marginBottom: ESPACOS.sm,
  },
  textoBotaoCadastro: {
    color: CORES.primaria,
    fontSize: FONTES.normal,
    fontWeight: '700',
  },

  // Bottom Navigation
  bottomNav: {
    backgroundColor: CORES.primaria,
    flexDirection: 'row',
    paddingBottom: ESPACOS.sm,
    paddingTop: ESPACOS.sm,
    borderTopWidth: 1,
    borderTopColor: CORES.primariaMedio,
  },
  abaNav: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  pontoAtivo: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: CORES.secundaria,
  },
  abaLabel: {
    fontSize: 13,
    color: CORES.cinzaTexto,
  },
  abaLabelAtivo: {
    color: CORES.secundaria,
    fontWeight: '600',
  },

  // Overlay
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 10,
  },

  // Drawer
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: CORES.primaria,
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 20,
  },
  drawerHeader: {
    backgroundColor: CORES.primariaMedio,
    padding: ESPACOS.lg,
    paddingTop: ESPACOS.xl,
    alignItems: 'center',
    gap: ESPACOS.xs,
    borderBottomWidth: 1,
    borderBottomColor: CORES.primariaClaro,
  },
  drawerLogomarcaWrap: {
    alignItems: 'center',
    marginBottom: ESPACOS.sm,
  },
  drawerNome: {
    color: CORES.branco,
    fontSize: FONTES.subtitulo,
    fontWeight: '700',
    marginTop: ESPACOS.sm,
  },
  drawerEmail: {
    color: CORES.cinzaTexto,
    fontSize: FONTES.pequena,
  },
  drawerEmailLink: {
    color: CORES.secundaria,
    fontSize: FONTES.pequena,
    textDecorationLine: 'underline',
  },
  drawerItens: {
    padding: ESPACOS.md,
    gap: ESPACOS.xs,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACOS.md,
    paddingVertical: ESPACOS.md,
    paddingHorizontal: ESPACOS.sm,
    borderRadius: 10,
  },
  drawerItemLabel: {
    color: CORES.branco,
    fontSize: FONTES.media,
    fontWeight: '500',
  },
  drawerItemVermelho: {
    color: CORES.erro,
  },
})
