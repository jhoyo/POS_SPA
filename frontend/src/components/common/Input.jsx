import { forwardRef } from 'react'

// forwardRef permite que librerías de formularios (ej. react-hook-form) y
// código que necesite enfocar el input (ej. BuscadorProducto) obtengan
// una referencia real al <input>, no al componente envoltorio.
const Input = forwardRef(function Input({ label, error, className = '', ...props }, ref) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <input
        ref={ref}
        className={`min-h-[44px] px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${className}`}
        {...props}
      />
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  )
})

export default Input
