function Badge({ children, color = 'gray' }) {
  const colores = {
    gray: 'bg-gray-100 text-gray-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    amber: 'bg-amber-100 text-amber-800'
  }

  return (
    <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${colores[color]}`}>
      {children}
    </span>
  )
}

export default Badge
