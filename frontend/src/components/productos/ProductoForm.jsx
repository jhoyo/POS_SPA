import { useState, useEffect } from 'react'
import Input from '../common/Input'
import Button from '../common/Button'
import ErrorMessage from '../common/ErrorMessage'

const FORM_VACIO = {
  nombre: '',
  sku: '',
  codigo_barras: '',
  precio_venta: '',
  unidad_medida: '',
  stock_minimo: 1
}

function ProductoForm({ productoInicial, onGuardar, onCancelar, guardando }) {
  const [form, setForm] = useState(FORM_VACIO)
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState(null)

  useEffect(() => {
    // codigo_barras puede llegar como null desde el backend (productos sin
    // código escaneado); un input controlado no acepta null como value.
    setForm(
      productoInicial
        ? { ...FORM_VACIO, ...productoInicial, codigo_barras: productoInicial.codigo_barras ?? '' }
        : FORM_VACIO
    )
    setErrores({})
    setErrorGeneral(null)
  }, [productoInicial])

  const handleChange = (campo) => (event) => {
    setForm((prev) => ({ ...prev, [campo]: event.target.value }))
  }

  const validar = () => {
    const nuevosErrores = {}
    if (!form.nombre) nuevosErrores.nombre = 'El nombre es obligatorio'
    if (!form.sku) nuevosErrores.sku = 'El SKU es obligatorio'
    if (!form.unidad_medida) nuevosErrores.unidad_medida = 'La unidad de medida es obligatoria'
    if (!form.precio_venta || Number(form.precio_venta) <= 0) {
      nuevosErrores.precio_venta = 'El precio de venta debe ser mayor a cero'
    }
    if (!form.stock_minimo || Number(form.stock_minimo) < 1) {
      nuevosErrores.stock_minimo = 'El stock mínimo debe ser al menos 1'
    }
    setErrores(nuevosErrores)
    return Object.keys(nuevosErrores).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorGeneral(null)
    if (!validar()) return

    try {
      await onGuardar({
        ...form,
        // Un código de barras vacío debe viajar como null, no como '', para no
        // chocar con la restricción UNIQUE de la columna cuando hay varios
        // productos sin código de barras registrado.
        codigo_barras: form.codigo_barras || null,
        precio_venta: Number(form.precio_venta),
        stock_minimo: Number(form.stock_minimo)
      })
    } catch (err) {
      const mensaje = err.message || ''
      const mensajeMinusculas = mensaje.toLowerCase()
      if (mensajeMinusculas.includes('código de barras')) {
        setErrores((prev) => ({ ...prev, codigo_barras: mensaje }))
      } else if (mensajeMinusculas.includes('sku') || mensajeMinusculas.includes('código de producto')) {
        setErrores((prev) => ({ ...prev, sku: mensaje }))
      } else {
        setErrorGeneral(mensaje)
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input label="Nombre" value={form.nombre} onChange={handleChange('nombre')} error={errores.nombre} />
      <Input label="SKU" value={form.sku} onChange={handleChange('sku')} error={errores.sku} />
      <Input
        label="Código de barras"
        value={form.codigo_barras}
        onChange={handleChange('codigo_barras')}
        error={errores.codigo_barras}
      />
      <Input
        label="Precio de venta"
        type="number"
        step="0.01"
        value={form.precio_venta}
        onChange={handleChange('precio_venta')}
        error={errores.precio_venta}
      />
      <Input
        label="Unidad de medida"
        value={form.unidad_medida}
        onChange={handleChange('unidad_medida')}
        error={errores.unidad_medida}
      />
      <Input
        label="Stock mínimo"
        type="number"
        value={form.stock_minimo}
        onChange={handleChange('stock_minimo')}
        error={errores.stock_minimo}
      />
      <ErrorMessage message={errorGeneral} />
      <div className="flex gap-2 justify-end">
        {onCancelar && (
          <Button variant="secondary" type="button" onClick={onCancelar}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={guardando}>
          Guardar
        </Button>
      </div>
    </form>
  )
}

export default ProductoForm
