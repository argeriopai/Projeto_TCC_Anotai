export interface FotoRegistro {
  veiculoId: string
  registroId: string
  tipoRegistro: 'servico' | 'peca'
  nomeRegistro?: string
  fotosServico: string[]
  fotosNotaFiscal: string[]
  fotosGarantia: string[]
}

export type TipoFoto = 'servico' | 'notaFiscal' | 'garantia'

export interface GaleriaVeiculo {
  veiculoId: string
  tipo: 'carro' | 'moto'
  marca: string
  modelo: string
  placa: string
  registros: FotoRegistro[]
}

export function temFotos(registro: Pick<FotoRegistro, 'fotosServico' | 'fotosNotaFiscal' | 'fotosGarantia'>): boolean {
  return (
    registro.fotosServico.length > 0 ||
    registro.fotosNotaFiscal.length > 0 ||
    registro.fotosGarantia.length > 0
  )
}
