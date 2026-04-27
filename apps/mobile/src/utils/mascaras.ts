export function mascaraMoeda(valor: string): string {
  const nums = valor.replace(/\D/g, '')
  if (!nums) return ''
  const centavos = parseInt(nums, 10)
  const reais = Math.floor(centavos / 100)
  const cents = centavos % 100
  const reaisFormatado = reais.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `R$ ${reaisFormatado},${String(cents).padStart(2, '0')}`
}

export function parseMoeda(valor: string): number {
  const num = parseFloat(valor.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.'))
  return isNaN(num) ? 0 : num
}

export function mascaraTelefone(valor: string): string {
  const nums = valor.replace(/\D/g, '').slice(0, 11)
  if (nums.length === 0)  return ''
  if (nums.length <= 2)   return `(${nums}`
  if (nums.length <= 6)   return `(${nums.slice(0, 2)}) ${nums.slice(2)}`
  if (nums.length <= 10)  return `(${nums.slice(0, 2)}) ${nums.slice(2, 6)}-${nums.slice(6)}`
  return `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7)}`
}
