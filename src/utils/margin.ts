import type { Fees } from '../api/types'

export interface MarginBreakdown {
  price: number
  commission: number
  paymentFee: number
  tax: number
  cost: number
  profit: number
  /** Lucro ÷ preço, em %. */
  margin: number
}

/**
 * Lucro estimado por unidade vendida, com as mesmas regras do backend (OrderPricing),
 * considerando pagamento online (o pior caso, pois paga a taxa de processamento).
 */
export function estimateMargin(price: number, cost: number, fees: Fees): MarginBreakdown {
  const pct = (p: number) => (price * p) / 100
  const commission = pct(fees.commissionPercent)
  const paymentFee = pct(fees.paymentFeePercent)
  const tax = pct(fees.taxPercent)
  const profit = price - commission - paymentFee - tax - cost
  return { price, commission, paymentFee, tax, cost, profit, margin: price > 0 ? (profit / price) * 100 : 0 }
}

/** Faixas usadas nas pílulas de margem: saudável, atenção e crítica. */
export function marginTone(margin: number) {
  if (margin >= 30) return 'bg-success-soft text-success'
  if (margin >= 15) return 'bg-warning-soft text-warning'
  return 'bg-danger-soft text-danger'
}
