export function formatUSD(value) {
  if (value == null || value === '') return '$0.00'
  const num = typeof value === 'number' ? value : Number(String(value).replace(/[^0-9.-]+/g, ''))
  if (isNaN(num)) return '$0.00'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num)
}

export default formatUSD

export function parseCurrency(text) {
  if (text == null || text === '') return 0
  if (typeof text === 'number') return text
  const num = Number(String(text).replace(/[^0-9.-]+/g, ''))
  return isNaN(num) ? 0 : Math.round(num)
}
