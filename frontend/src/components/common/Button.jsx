function Button({ children, variant = 'primary', className = '', ...props }) {
  const base =
    'px-4 py-3 rounded-lg font-medium transition-colors min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed'
  const variantes = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700'
  }

  return (
    <button className={`${base} ${variantes[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
}

export default Button
