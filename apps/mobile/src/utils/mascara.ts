export function mascaraPlaca(valor: string): string {
  // Remove tudo que não for letra ou número, força maiúsculas
  const limpo = valor.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 7)

  if (limpo.length <= 3) return limpo

  const parte1 = limpo.slice(0, 3)  // sempre 3 letras
  const parte2 = limpo.slice(3)     // restante

  return `${parte1}-${parte2}`
}

// Valida se a placa completa bate com um dos dois padrões
export function validarPlaca(placa: string): boolean {
  const limpo = placa.replace('-', '')
  const antigoRegex   = /^[A-Z]{3}[0-9]{4}$/           // ABC1234
  const mercosulRegex = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/ // ABC1D23
  return antigoRegex.test(limpo) || mercosulRegex.test(limpo)
}
