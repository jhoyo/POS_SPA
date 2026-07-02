function Spinner({ size = 8 }) {
  return (
    <div
      className="animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 mx-auto"
      style={{ width: `${size * 4}px`, height: `${size * 4}px` }}
      role="status"
      aria-label="Cargando"
    />
  )
}

export default Spinner
