import { useState } from 'react'
import Layout from '../components/common/Layout'
import FormAperturaCaja from '../components/caja/FormAperturaCaja'
import ResumenCorteX from '../components/caja/ResumenCorteX'
import FormCorteZ from '../components/caja/FormCorteZ'
import Button from '../components/common/Button'
import Spinner from '../components/common/Spinner'
import { useCaja } from '../context/CajaContext'
import * as cajaApi from '../services/api/caja.api'

function CajaPage() {
  const { cajaAbierta, cargandoCaja, abrirCaja, cerrarCajaLocal } = useCaja()
  const [vista, setVista] = useState('resumen')
  const [corteX, setCorteX] = useState(null)

  const handleGenerarCorteX = async () => {
    const resumen = await cajaApi.obtenerCorteX()
    setCorteX(resumen)
    setVista('corte-x')
  }

  const handleGenerarCorteZ = async (efectivoDeclarado) => {
    const resultado = await cajaApi.generarCorteZ(efectivoDeclarado)
    cerrarCajaLocal()
    return resultado
  }

  if (cargandoCaja) {
    return (
      <Layout>
        <Spinner />
      </Layout>
    )
  }

  if (!cajaAbierta) {
    return (
      <Layout>
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-sm p-6">
          <h1 className="text-xl font-bold text-gray-800 mb-4">Apertura de caja</h1>
          <FormAperturaCaja onAbrirCaja={abrirCaja} />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Corte de caja</h1>
      <div className="flex gap-2 mb-6">
        <Button variant="secondary" onClick={handleGenerarCorteX}>
          Corte X (parcial)
        </Button>
        <Button variant="danger" onClick={() => setVista('corte-z')}>
          Corte Z (cierre)
        </Button>
      </div>

      {vista === 'corte-x' && <ResumenCorteX resumen={corteX} />}
      {vista === 'corte-z' && <FormCorteZ onGenerarCorteZ={handleGenerarCorteZ} />}
    </Layout>
  )
}

export default CajaPage
