import { useEffect, useMemo, useState } from 'react'
import heroGreenhouse from './assets/hero-greenhouse.png'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'
const TOKEN_KEY = 'tlali_token'

const initialForm = {
  deviceId: 'esp32-greenhouse-01',
  greenhouseId: 'greenhouse-main',
  temperatureCelsius: '24.8',
  humidityPercent: '67.5',
  soilMoisturePercent: '41.2',
  lightLux: '1180',
  batteryVoltage: '3.7',
}

function App() {
  const [route, setRoute] = useState(() => window.location.pathname)
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState(null)

  useEffect(() => {
    function handlePopState() {
      setRoute(window.location.pathname)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    if (route !== '/auth/callback') {
      return
    }

    const params = new URLSearchParams(window.location.search)
    const callbackToken = params.get('token')

    if (callbackToken) {
      saveToken(callbackToken)
      navigate('/dashboard')
    } else {
      navigate('/login')
    }
  }, [route])

  useEffect(() => {
    if (!token) {
      setUser(null)
      return
    }

    loadCurrentUser(token).then(setUser).catch(() => logout())
  }, [token])

  function navigate(path) {
    window.history.pushState({}, '', path)
    setRoute(path)
  }

  function saveToken(nextToken) {
    localStorage.setItem(TOKEN_KEY, nextToken)
    setToken(nextToken)
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
    navigate('/')
  }

  const auth = {
    token,
    user,
    saveToken,
    logout,
  }

  return (
    <main className="min-h-screen bg-[#f6f8f4] text-slate-950">
      <TopNav auth={auth} navigate={navigate} route={route} />

      {route === '/login' && <LoginPage auth={auth} navigate={navigate} />}
      {route === '/dashboard' && <Dashboard auth={auth} navigate={navigate} />}
      {route !== '/login' && route !== '/dashboard' && route !== '/auth/callback' && (
        <LandingPage navigate={navigate} />
      )}
    </main>
  )
}

function TopNav({ auth, navigate, route }) {
  const authenticated = Boolean(auth.token)

  return (
    <header className="fixed left-0 right-0 top-0 z-30 border-b border-white/10 bg-slate-950/80 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <button
          className="flex items-center gap-3 text-left text-white"
          onClick={() => navigate('/')}
          type="button"
        >
          <span className="grid h-9 w-9 place-items-center rounded-md bg-emerald-500 text-sm font-black text-slate-950">
            T
          </span>
          <span>
            <span className="block text-base font-semibold leading-none">Tlali</span>
            <span className="block text-xs font-medium text-emerald-100/80">
              Smart greenhouse
            </span>
          </span>
        </button>

        <div className="hidden items-center gap-7 text-sm font-medium text-white/75 md:flex">
          <button className="hover:text-white" onClick={() => navigate('/')} type="button">
            Inicio
          </button>
          <a className="hover:text-white" href="/#solucion">
            Solucion
          </a>
          <a className="hover:text-white" href="/#sensores">
            Sensores
          </a>
          <button
            className={route === '/dashboard' ? 'text-white' : 'hover:text-white'}
            onClick={() => navigate(authenticated ? '/dashboard' : '/login')}
            type="button"
          >
            Dashboard
          </button>
        </div>

        <div className="flex items-center gap-2">
          {authenticated ? (
            <>
              <button
                className="hidden rounded-md border border-white/20 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 sm:inline-flex"
                onClick={() => navigate('/dashboard')}
                type="button"
              >
                Panel
              </button>
              <button
                className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-100"
                onClick={auth.logout}
                type="button"
              >
                Salir
              </button>
            </>
          ) : (
            <button
              className="rounded-md bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-300"
              onClick={() => navigate('/login')}
              type="button"
            >
              Iniciar sesion
            </button>
          )}
        </div>
      </nav>
    </header>
  )
}

function LandingPage({ navigate }) {
  return (
    <>
      <section className="relative min-h-[92vh] overflow-hidden pt-16 text-white">
        <img
          alt="Invernadero inteligente Tlali con sensores IoT"
          className="absolute inset-0 h-full w-full object-cover"
          src={heroGreenhouse}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/72 to-slate-950/10" />

        <div className="relative mx-auto flex min-h-[calc(92vh-4rem)] max-w-7xl items-center px-5 py-12 sm:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-300">
              Monitoreo agricola inteligente
            </p>
            <h1 className="mt-5 text-5xl font-semibold leading-tight tracking-normal sm:text-6xl">
              Tlali
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-100">
              Controla temperatura, humedad, luz y suelo desde una sola plataforma
              conectada a sensores ESP32 y preparada para crecer con Supabase.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                className="rounded-md bg-emerald-400 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-300"
                onClick={() => navigate('/login')}
                type="button"
              >
                Iniciar sesion
              </button>
              <button
                className="rounded-md border border-white/30 px-5 py-3 text-sm font-bold text-white hover:bg-white/10"
                onClick={() => navigate('/dashboard')}
                type="button"
              >
                Ver dashboard
              </button>
            </div>
          </div>
        </div>
      </section>

      <section id="solucion" className="border-b border-slate-200 bg-white py-14">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Plataforma Tlali
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal text-slate-950">
              Observabilidad del invernadero sin friccion.
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <FeatureCard title="Sensores" text="Lecturas ambientales y de suelo desde ESP32." />
            <FeatureCard title="Alertas" text="Base lista para reglas por temperatura, luz y humedad." />
            <FeatureCard title="Operacion" text="Dashboard privado para decidir riego, ventilacion y revision." />
          </div>
        </div>
      </section>

      <section id="sensores" className="bg-[#f6f8f4] py-12">
        <div className="mx-auto grid max-w-7xl gap-4 px-5 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
          {[
            ['Temperatura', 'Rangos seguros para cultivo'],
            ['Humedad aire', 'Microclima del invernadero'],
            ['Humedad suelo', 'Decision de riego'],
            ['Luz', 'Radiacion y exposicion'],
          ].map(([title, text]) => (
            <article key={title} className="rounded-lg border border-slate-200 bg-white p-5">
              <h3 className="text-base font-semibold text-slate-950">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}

function FeatureCard({ title, text }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-slate-50 p-5">
      <h3 className="text-base font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
    </article>
  )
}

function LoginPage({ auth, navigate }) {
  const [email, setEmail] = useState('superadmin@tlali.local')
  const [password, setPassword] = useState('SuperAdmin123!')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        throw new Error('Credenciales invalidas')
      }

      const data = await response.json()
      auth.saveToken(data.token)
      navigate('/dashboard')
    } catch (error) {
      setMessage('No se pudo iniciar sesion. Revisa tus credenciales.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="min-h-screen bg-slate-950 px-5 pb-10 pt-24 text-white sm:px-8">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_420px] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-300">
            Acceso seguro
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-normal sm:text-5xl">
            Entra al panel operativo de Tlali.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
            Usa el superadmin inicial para desarrollo o conecta Google OAuth con
            tus credenciales del proyecto.
          </p>
          <div className="mt-8 rounded-lg border border-white/10 bg-white/5 p-5 text-sm text-slate-200">
            <p className="font-semibold text-white">Usuario superadmin inicial</p>
            <p className="mt-2">Correo: superadmin@tlali.local</p>
            <p>Password: SuperAdmin123!</p>
          </div>
        </div>

        <form
          className="rounded-lg border border-white/10 bg-white p-5 text-slate-950 shadow-2xl"
          onSubmit={handleSubmit}
        >
          <h2 className="text-xl font-semibold">Iniciar sesion</h2>
          <p className="mt-1 text-sm text-slate-500">
            Accede con correo y contrasena o con Google.
          </p>

          <div className="mt-5 grid gap-4">
            <TextField
              label="Correo"
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
            <TextField
              label="Contrasena"
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </div>

          <button
            className="mt-5 w-full rounded-md bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={loading}
            type="submit"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          <div className="my-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            o
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <a
            className="flex h-11 w-full items-center justify-center rounded-md border border-slate-300 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            href={`${API_URL}/oauth2/authorization/google`}
          >
            Continuar con Google
          </a>

          {message && <p className="mt-4 text-sm font-medium text-rose-700">{message}</p>}
        </form>
      </div>
    </section>
  )
}

function Dashboard({ auth, navigate }) {
  const [readings, setReadings] = useState([])
  const [form, setForm] = useState(initialForm)
  const [status, setStatus] = useState('checking')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!auth.token) {
      navigate('/login')
      return
    }

    loadReadings()
  }, [auth.token])

  const latest = readings[0]
  const metrics = useMemo(
    () => [
      ['Temperatura', formatMetric(latest?.temperatureCelsius, ' C'), 'border-l-emerald-500'],
      ['Humedad aire', formatMetric(latest?.humidityPercent, '%'), 'border-l-sky-500'],
      ['Humedad suelo', formatMetric(latest?.soilMoisturePercent, '%'), 'border-l-amber-500'],
      ['Luz', formatMetric(latest?.lightLux, ' lx'), 'border-l-lime-500'],
    ],
    [latest],
  )

  async function loadReadings() {
    try {
      setStatus('checking')
      const response = await authorizedFetch(
        `${API_URL}/api/v1/sensor-readings/latest?limit=8`,
        auth.token,
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      setReadings(await response.json())
      setStatus('online')
      setMessage('')
    } catch (error) {
      setStatus('offline')
      setMessage('No se pudieron cargar lecturas.')
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()

    try {
      setMessage('Guardando lectura...')
      const response = await authorizedFetch(`${API_URL}/api/v1/sensor-readings`, auth.token, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    <section className="min-h-screen bg-[#f6f8f4] px-5 pb-8 pt-24 sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Dashboard privado
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-normal text-slate-950">
              Invernadero principal
            </h1>
            {auth.user && (
              <p className="mt-2 text-sm text-slate-500">
                {auth.user.fullName} - {auth.user.role}
              </p>
            )}
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
          {metrics.map(([label, value, accent]) => (
            <article
              className={`rounded-lg border border-slate-200 border-l-4 bg-white p-4 shadow-sm ${accent}`}
              key={label}
            >
              <p className="text-sm font-medium text-slate-500">{label}</p>
              <p className="mt-2 text-3xl font-semibold tracking-normal text-slate-950">
                {value}
              </p>
            </article>
          ))}
        </section>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <ReadingsTable loadReadings={loadReadings} readings={readings} />
          <ReadingForm
            form={form}
            handleSubmit={handleSubmit}
            message={message}
            updateField={updateField}
          />
        </div>
      </div>
    </section>
  )
}

function ReadingsTable({ readings, loadReadings }) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h2 className="text-base font-semibold text-slate-900">Ultimas lecturas</h2>
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
                  <td className="px-4 py-3">{formatMetric(reading.lightLux, ' lx')}</td>
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
  )
}

function ReadingForm({ form, handleSubmit, message, updateField }) {
  return (
    <form
      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
      onSubmit={handleSubmit}
    >
      <h2 className="text-base font-semibold text-slate-900">Registrar lectura</h2>

      <div className="mt-4 grid gap-3">
        <TextField label="Dispositivo" name="deviceId" onChange={updateField} required value={form.deviceId} />
        <TextField label="Invernadero" name="greenhouseId" onChange={updateField} value={form.greenhouseId} />
        <TextField label="Temperatura C" name="temperatureCelsius" onChange={updateField} required type="number" value={form.temperatureCelsius} />
        <TextField label="Humedad aire %" name="humidityPercent" onChange={updateField} required type="number" value={form.humidityPercent} />
        <TextField label="Humedad suelo %" name="soilMoisturePercent" onChange={updateField} type="number" value={form.soilMoisturePercent} />
        <TextField label="Luz lx" name="lightLux" onChange={updateField} type="number" value={form.lightLux} />
        <TextField label="Bateria V" name="batteryVoltage" onChange={updateField} type="number" value={form.batteryVoltage} />
      </div>

      <button
        className="mt-4 w-full rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
        type="submit"
      >
        Enviar lectura
      </button>

      {message && <p className="mt-3 text-sm font-medium text-slate-600">{message}</p>}
    </form>
  )
}

function TextField({ label, name, onChange, required = false, type = 'text', value }) {
  return (
    <label className="grid gap-1 text-sm font-medium text-slate-700">
      {label}
      <input
        className="h-10 rounded-md border border-slate-300 px-3 text-slate-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
        name={name}
        onChange={onChange}
        required={required}
        step={type === 'number' ? '0.1' : undefined}
        type={type}
        value={value}
      />
    </label>
  )
}

async function loadCurrentUser(token) {
  const response = await authorizedFetch(`${API_URL}/api/v1/auth/me`, token)

  if (!response.ok) {
    throw new Error('Invalid session')
  }

  return response.json()
}

function authorizedFetch(url, token, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
  })
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
  return value === '' ? null : Number(value)
}

function formatMetric(value, suffix) {
  if (value === null || value === undefined) {
    return '--'
  }

  return `${Number(value).toLocaleString('es-MX', {
    maximumFractionDigits: 1,
  })}${suffix}`
}

export default App
