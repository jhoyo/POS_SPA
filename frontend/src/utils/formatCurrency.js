export function formatCurrency(monto) {
  const valor = Number(monto) || 0
  return `$${valor.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`
}
