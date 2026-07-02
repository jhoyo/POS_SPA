export function formatDate(fecha) {
  const date = new Date(fecha)
  if (Number.isNaN(date.getTime())) return ''
  const dia = String(date.getDate()).padStart(2, '0')
  const mes = String(date.getMonth() + 1).padStart(2, '0')
  const anio = date.getFullYear()
  return `${dia}/${mes}/${anio}`
}
