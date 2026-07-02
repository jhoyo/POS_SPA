const TASA_IVA_DEFAULT = 0.16;

// Dado un precio con IVA incluido, retorna { subtotal, iva } tal que
// subtotal + iva === precioConIva (redondeado a 2 decimales)
function calcularIva(precioConIva, tasaIva = TASA_IVA_DEFAULT) {
  const subtotal = Math.round((precioConIva / (1 + tasaIva)) * 100) / 100;
  const iva = Math.round((precioConIva - subtotal) * 100) / 100;
  return { subtotal, iva };
}

export { calcularIva, TASA_IVA_DEFAULT };
