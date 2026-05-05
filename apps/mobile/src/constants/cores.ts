export const CORES = {
  // Primária — azul escuro (headers, botões, fundo auth)
  primaria:        '#141450',
  primariaMedio:   '#1A1A6E',
  primariaClaro:   '#1F1F80',

  // Splash
  splash:          '#100050',

  // Secundária — verde ANOTAÍ
  secundaria:      '#2ECC71',
  secundariaEscuro:'#27AE60',
  verdeSlogan:     '#33CC33',

  // Neutros
  branco:          '#FFFFFF',
  cinzaClaro:      '#F0F2F8',
  texto:           '#1A1A3E',
  cinzaMedio:      '#D1D5DB',
  cinzaTexto:      '#8892A4',
  borda:           '#E5E7EB',
  pretinho:        '#1F2937',

  // Acessibilidade — textos secundários em fundos claros (WCAG AA ≥ 4.5:1)
  textoSecundario: '#4A5568',  // 6.85:1 sobre #F0F2F8 | 6.79:1 sobre #FFFFFF
  placeholder:     '#757575',  // 4.56:1 sobre #FFFFFF (mínimo WCAG para placeholder)

  // Estados
  erro:            '#C0392B',  // 5.33:1 sobre #FFFFFF | 4.78:1 sobre #F0F2F8 (WCAG AA)
  atencao:         '#F59E0B',
  sucesso:         '#10B981',
  info:            '#3B82F6',

  // Sombra
  sombra:          '#000000',
}

export const FONTES = {
  tituloGrande: 32,
  titulo:        24,
  subtitulo:     20,
  media:         16,
  normal:        14,
  pequena:       12,
}

export const ESPACOS = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
}

export const BORDAS = {
  pequena: 4,
  media:   8,
  grande:  16,
  total:   999,
}
