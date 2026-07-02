import { useState } from 'react'
import Layout from '../components/common/Layout'
import AlertaStockBajo from '../components/inventario/AlertaStockBajo'
import FormEntradaInventario from '../components/inventario/FormEntradaInventario'
import FormAjusteInventario from '../components/inventario/FormAjusteInventario'
import TablaMovimientos from '../components/inventario/TablaMovimientos'
import { useAuth } from '../context/AuthContext'

function InventarioPage() {
  const { rol } = useAuth()
  const [tabActiva, setTabActiva] = useState('entradas')

  // Las entradas las puede registrar cajero o administrador; los ajustes,
  // solo administrador (mismas restricciones de rol que backend/src/routes/inventory-routes.js).
  const tabs = [
    { valor: 'entradas', etiqueta: 'Entradas' },
    ...(rol === 'administrador' ? [{ valor: 'ajustes', etiqueta: 'Ajustes' }] : []),
    { valor: 'movimientos', etiqueta: 'Movimientos' }
  ]

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Inventario</h1>
      <AlertaStockBajo />

      <div className="flex gap-4 border-b mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.valor}
            type="button"
            className={`pb-2 px-1 font-medium ${
              tabActiva === tab.valor ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'
            }`}
            onClick={() => setTabActiva(tab.valor)}
          >
            {tab.etiqueta}
          </button>
        ))}
      </div>

      {tabActiva === 'entradas' && <FormEntradaInventario />}
      {tabActiva === 'ajustes' && rol === 'administrador' && <FormAjusteInventario />}
      {tabActiva === 'movimientos' && <TablaMovimientos />}
    </Layout>
  )
}

export default InventarioPage
