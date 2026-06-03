import { useEffect, useMemo, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

const initialForm = {
  deviceId: 'esp32-greenhouse-01',
  greenhouseId: 'greenhouse-main',
  temperatureCelsius: '24.8',
  humidityPercent: '67.5',
  soilMoisturePercent: '41.2',
  lightLux: '1180',
  batteryVoltage: '3.7',
}

function toReadingPayload(form) {
  return {
    deviceId: form.deviceId.trim(),
    greenhouseId: form.greenhouseId.trim() || null,
    temperatureCelsius: Number(form.temperatureCelsius),
    humidityPercent: Number(form.humidityPercent),
    soilMoisturePercent: optionalNumber(form.soilMoisturePercent),
    lightLux: optionalNumber(form.lightLux),
    batteryVoltage: optionalNumber(form.batteryVoltage),
    recordedAt: new Date().toISOString(),
  }
}

function optionalNumber(value) {
  if (value === '') {
    return null
  }

  return Number(value)
}

function formatMetric(value, suffix) {
  if (value === null || value === undefined) {
    return '--'
  }

  return `${Number(value).toLocaleString('es-MX', {
    maximumFractionDigits: 1,
  })}${suffix}`
}

function App() {
  const [readings, setReadings] = useState([])
  const [form, setForm] = useState(initialForm)
  const [status, setStatus] = useState('checking')
  const [message, setMessage] = useState('')

  const latest = readings[0]

  const metrics = useMemo(
    () => [
      {
        label: 'Temperatura',
        value: formatMetric(latest?.temperatureCelsius, ' C'),
        accent: 'border-l-emerald-500',
      },
      {
        label: 'Humedad aire',
        value: formatMetric(latest?.humidityPercent, '%'),
        accent: 'border-l-sky-500',
      },
      {
        label: 'Humedad suelo',
        value: formatMetric(latest?.soilMoisturePercent, '%'),
        accent: 'border-l-amber-500',
      },
      {
        label: 'Luz',
        value: formatMetric(latest?.lightLux, ' lx'),
        accent: 'border-l-lime-500',
      },
    ],
    [latest],
  )

  async function loadReadings() {
    try {
      setStatus('checking')
      const response = await fetch(`${API_URL}/api/v1/sensor-readings/latest?limit=8`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      setReadings(await response.json())
      setStatus('online')
      setMessage('')
    } catch (error) {
      setStatus('offline')
      setMessage('Backend no disponible en este momento.')
    }
  }

  useEffect(() => {
    loadReadings()
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()

    try {
      setMessage('Guardando lectura...')
      const response = await fetch(`${API_URL}/api/v1/sensor-readings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(toReadingPayload(form)),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      await loadReadings()
      setMessage('Lectura registrada.')
    } catch (error) {
      setStatus('offline')
      setMessage('No se pudo registrar la lectura.')
    }
  }

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  return (
    <main className="min-h-screen bg-[#f4f7f6] text-slate-950">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-5 sm:px-8">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Tlali
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-normal text-slate-950">
              Invernadero principal
            </h1>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                status === 'online'
                  ? 'bg-emerald-500'
                  : status === 'checking'
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
              }`}
            />
            <span className="font-medium text-slate-700">
              {status === 'online'
                ? 'API conectada'
                : status === 'checking'
                  ? 'Sincronizando'
                  : 'API desconectada'}
            </span>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => (
            <article
              className={`rounded-lg border border-slate-200 border-l-4 bg-white p-4 shadow-sm ${metric.accent}`}
              key={metric.label}
            >
              <p className="text-sm font-medium text-slate-500">{metric.label}</p>
              <p className="mt-2 text-3xl font-semibold tracking-normal text-slate-950">
                {metric.value}
              </p>
            </article>
          ))}
        </section>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h2 className="text-base font-semibold text-slate-900">
                Ultimas lecturas
              </h2>
              <button
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                onClick={loadReadings}
                type="button"
              >
                Actualizar
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Dispositivo</th>
                    <th className="px-4 py-3 font-medium">Temp</th>
                    <th className="px-4 py-3 font-medium">Humedad</th>
                    <th className="px-4 py-3 font-medium">Suelo</th>
                    <th className="px-4 py-3 font-medium">Luz</th>
                    <th className="px-4 py-3 font-medium">Recibida</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {readings.length === 0 ? (
                    <tr>
                      <td className="px-4 py-6 text-slate-500" colSpan="6">
                        Sin lecturas registradas.
                      </td>
                    </tr>
                  ) : (
                    readings.map((reading) => (
                      <tr className="hover:bg-slate-50" key={reading.id}>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {reading.deviceId}
                        </td>
                        <td className="px-4 py-3">
                          {formatMetric(reading.temperatureCelsius, ' C')}
                        </td>
                        <td className="px-4 py-3">
                          {formatMetric(reading.humidityPercent, '%')}
                        </td>
                        <td className="px-4 py-3">
                          {formatMetric(reading.soilMoisturePercent, '%')}
                        </td>
                        <td className="px-4 py-3">
                          {formatMetric(reading.lightLux, ' lx')}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {new Date(reading.receivedAt).toLocaleString('es-MX')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <form
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
            onSubmit={handleSubmit}
          >
            <h2 className="text-base font-semibold text-slate-900">
              Registrar lectura
            </h2>

            <div className="mt-4 grid gap-3">
              <TextField
                label="Dispositivo"
                name="deviceId"
                onChange={updateField}
                required
                value={form.deviceId}
              />
              <TextField
                label="Invernadero"
                name="greenhouseId"
                onChange={updateField}
                value={form.greenhouseId}
              />
              <NumberField
                label="Temperatura C"
                name="temperatureCelsius"
                onChange={updateField}
                required
                value={form.temperatureCelsius}
              />
              <NumberField
                label="Humedad aire %"
                name="humidityPercent"
                onChange={updateField}
                required
                value={form.humidityPercent}
              />
              <NumberField
                label="Humedad suelo %"
                name="soilMoisturePercent"
                onChange={updateField}
                value={form.soilMoisturePercent}
              />
              <NumberField
                label="Luz lx"
                name="lightLux"
                onChange={updateField}
                value={form.lightLux}
              />
              <NumberField
                label="Bateria V"
                name="batteryVoltage"
                onChange={updateField}
                value={form.batteryVoltage}
              />
            </div>

            <button
              className="mt-4 w-full rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
              type="submit"
            >
              Enviar lectura
            </button>

            {message && (
              <p className="mt-3 text-sm font-medium text-slate-600">{message}</p>
            )}
          </form>
        </div>
      </div>
    </main>
  )
}

function TextField({ label, name, onChange, required = false, value }) {
  return (
    <label className="grid gap-1 text-sm font-medium text-slate-700">
      {label}
      <input
        className="h-10 rounded-md border border-slate-300 px-3 text-slate-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
        name={name}
        onChange={onChange}
        required={required}
        value={value}
      />
    </label>
  )
}

function NumberField({ label, name, onChange, required = false, value }) {
  return (
    <label className="grid gap-1 text-sm font-medium text-slate-700">
      {label}
      <input
        className="h-10 rounded-md border border-slate-300 px-3 text-slate-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
        name={name}
        onChange={onChange}
        required={required}
        step="0.1"
        type="number"
        value={value}
      />
    </label>
  )
}

export default App
