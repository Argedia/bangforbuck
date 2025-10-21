import { useRef, useState } from 'react'
import 'preline/preline'

const generateLabel = (index) => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let label = ''
  let current = index

  do {
    label = alphabet[current % 26] + label
    current = Math.floor(current / 26) - 1
  } while (current >= 0)

  return label
}

const createRow = (id, labelIndex) => ({
  id,
  name: generateLabel(labelIndex),
  quantity: '',
  price: '',
})

const INITIAL_ROWS = [createRow(1, 0), createRow(2, 1)]

const unitFormatter = new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
})

const toNumber = (value) => {
  if (typeof value !== 'string' || value.trim() === '') return Number.NaN
  const normalized = value.replace(',', '.')
  return Number.parseFloat(normalized)
}

function App() {
  const [rows, setRows] = useState(INITIAL_ROWS)
  const [summary, setSummary] = useState(null)
  const nextId = useRef(3)
  const nextLabelIndex = useRef(INITIAL_ROWS.length)

  const handleFieldChange = (id, field) => (event) => {
    const value = event.target.value

    if (field === 'quantity' || field === 'price') {
      const numericPattern = /^[0-9]*([.,][0-9]*)?$/
      if (value !== '' && !numericPattern.test(value)) {
        return
      }
    }

    let didChange = false
    setRows((prev) => {
      const nextRows = prev.map((row) => {
        if (row.id !== id) return row
        if (row[field] === value) return row
        didChange = true
        return { ...row, [field]: value }
      })

      return didChange ? nextRows : prev
    })
    if (didChange) {
      setSummary(null)
    }
  }

  const handleAddRow = () => {
    const newId = nextId.current++
    const labelIndex = nextLabelIndex.current++
    setRows((prev) => [...prev, createRow(newId, labelIndex)])
    setSummary(null)
  }

  const handleRemoveRow = (id) => () => {
    if (rows.length <= 2) return

    const filtered = rows.filter((row) => row.id !== id)
    if (filtered.length < 2 || filtered.length === rows.length) return

    setRows(filtered)
    setSummary(null)
  }

  const handleCalculate = () => {
    const computedRows = rows.map((row, index) => {
      const quantityValue = toNumber(row.quantity)
      const priceValue = toNumber(row.price)
      const label = row.name?.trim() || generateLabel(index)
      const isQuantityValid =
        Number.isFinite(quantityValue) && quantityValue > 0
      const isPriceValid = Number.isFinite(priceValue) && priceValue >= 0
      const isValid = isQuantityValid && isPriceValid

      return {
        id: row.id,
        label,
        quantityValue,
        priceValue,
        isValid,
        unitPrice: isValid ? priceValue / quantityValue : null,
      }
    })

    const validRows = computedRows.filter((row) => row.isValid)

    if (validRows.length === 0) {
      setSummary({
        status: 'error',
        rows: computedRows,
        message:
          'Ingresa una cantidad mayor a 0 y un precio válido para calcular.',
        winnerId: null,
      })
      return
    }

    const winner = validRows.reduce((best, current) =>
      current.unitPrice < best.unitPrice ? current : best,
    )

    setSummary({
      status: 'success',
      rows: computedRows,
      winnerId: winner.id,
      message: `${winner.label} tiene el mejor precio por unidad.`,
    })
  }

  const getRowResult = (rowId) =>
    summary?.rows?.find((row) => row.id === rowId) ?? null

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto flex max-w-md flex-col gap-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-900">
            Calculadora de Mejor Precio
          </h1>
          <p className="text-sm text-slate-600">
            Compara tus productos por cantidad y precio total para encontrar el
            mejor costo por unidad.
          </p>
        </header>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left">
              <thead className="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Producto
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Cantidad
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Precio
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Resultado
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {rows.map((row, index) => {
                  const result = getRowResult(row.id)
                  const isWinner = summary?.winnerId === row.id
                  const isDeleteDisabled = rows.length <= 2
                  return (
                    <tr
                      key={row.id}
                      className={isWinner ? 'bg-emerald-50/70' : undefined}
                    >
                      <td className="px-4 py-3">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder={generateLabel(index)}
                            value={row.name ?? ''}
                            onChange={handleFieldChange(row.id, 'name')}
                            className="hs-input w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative">
                          <input
                            type="text"
                            inputMode="decimal"
                            placeholder="0"
                            value={row.quantity}
                            onChange={handleFieldChange(row.id, 'quantity')}
                            className="hs-input w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative">
                          <input
                            type="text"
                            inputMode="decimal"
                            placeholder="0"
                            value={row.price}
                            onChange={handleFieldChange(row.id, 'price')}
                            className="hs-input w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {result?.isValid && result.unitPrice !== null ? (
                          <span
                            className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold ${
                              isWinner
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {unitFormatter.format(result.unitPrice)} por unidad
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-slate-400">
                            -
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={handleRemoveRow(row.id)}
                          disabled={isDeleteDisabled}
                          className="hs-btn hs-btn-outline rounded-xl border border-rose-300 px-3 py-2 text-xs font-semibold text-rose-600 transition duration-150 hover:border-rose-400 hover:text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500/40 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {summary?.status === 'error' && (
            <div className="border-t border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {summary.message}
            </div>
          )}

          {summary?.status === 'success' && summary.message && (
            <div className="border-t border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {summary.message}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleAddRow}
            className="hs-btn hs-btn-outline flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition duration-150 hover:border-emerald-500 hover:text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          >
            Añadir línea
          </button>
          <button
            type="button"
            onClick={handleCalculate}
            className="hs-btn hs-btn-primary flex-1 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition duration-150 hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          >
            Calcular
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
