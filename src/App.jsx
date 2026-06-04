import { useEffect, useMemo, useState } from 'react'
import heroTlaliTlapixqui from './assets/hero-tlali-tlapixqui.png'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'
const TOKEN_KEY = 'tlali_token'
const DEFAULT_LOGIN_MESSAGE = ''

const initialForm = {
  deviceId: 'esp32-tlali-sensor-01',
  siteId: 'tlali-tlapixqui-main',
  temperatureCelsius: '24.8',
  humidityPercent: '67.5',
  soilMoisturePercent: '41.2',
  lightLux: '1180',
  batteryVoltage: '3.7',
}

const sensorDefinitions = [
  {
    key: 'temperatureCelsius',
    label: 'Temperatura',
    shortLabel: 'Temp',
    suffix: ' C',
    healthyMin: 18,
    healthyMax: 30,
    min: 0,
    max: 45,
    accent: 'emerald',
    lowText: 'Frio',
    highText: 'Caliente',
  },
  {
    key: 'humidityPercent',
    label: 'Humedad aire',
    shortLabel: 'Aire',
    suffix: '%',
    healthyMin: 45,
    healthyMax: 80,
    min: 0,
    max: 100,
    accent: 'sky',
    lowText: 'Seco',
    highText: 'Humedo',
  },
  {
    key: 'soilMoisturePercent',
    label: 'Humedad suelo',
    shortLabel: 'Suelo',
    suffix: '%',
    healthyMin: 35,
    healthyMax: 70,
    min: 0,
    max: 100,
    accent: 'amber',
    lowText: 'Riego',
    highText: 'Saturado',
  },
  {
    key: 'lightLux',
    label: 'Luz',
    shortLabel: 'Luz',
    suffix: ' lx',
    healthyMin: 500,
    healthyMax: 5000,
    min: 0,
    max: 8000,
    accent: 'lime',
    lowText: 'Baja',
    highText: 'Alta',
  },
]

function App() {
  const [route, setRoute] = useState(() => window.location.pathname)
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState(null)
  const [authStatus, setAuthStatus] = useState(() => (token ? 'checking' : 'guest'))
  const [loginMessage, setLoginMessage] = useState(DEFAULT_LOGIN_MESSAGE)

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
      setAuthStatus('guest')
      return
    }

    if (isTokenExpired(token)) {
      endSession('/login', 'Tu sesion expiro. Inicia sesion otra vez.')
      return
    }

    setAuthStatus('checking')
    loadCurrentUser(token)
      .then((currentUser) => {
        setUser(currentUser)
        setAuthStatus('authenticated')
      })
      .catch(() => endSession('/login', 'Tu sesion no es valida. Inicia sesion otra vez.'))

    const expirationDelay = getTokenExpirationDelay(token)
    if (!expirationDelay) {
      return
    }

    const expirationTimer = window.setTimeout(() => {
      endSession('/login', 'Tu sesion expiro. Inicia sesion otra vez.')
    }, expirationDelay)

    return () => window.clearTimeout(expirationTimer)
  }, [token])

  useEffect(() => {
    if (route === '/dashboard' && !token) {
      navigate('/login', { replace: true })
    }
  }, [route, token])

  function navigate(path, options = {}) {
    if (options.replace) {
      window.history.replaceState({}, '', path)
    } else {
      window.history.pushState({}, '', path)
    }
    setRoute(path)
  }

  function saveToken(nextToken) {
    localStorage.setItem(TOKEN_KEY, nextToken)
    setToken(nextToken)
    setLoginMessage(DEFAULT_LOGIN_MESSAGE)
  }

  function endSession(nextRoute = '/', message = DEFAULT_LOGIN_MESSAGE) {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
    setAuthStatus('guest')
    setLoginMessage(message)
    navigate(nextRoute)
  }

  function logout() {
    endSession('/', DEFAULT_LOGIN_MESSAGE)
  }

  const auth = {
    token,
    user,
    status: authStatus,
    saveToken,
    logout,
    onUnauthorized: () => endSession('/login', 'Tu sesion expiro. Inicia sesion otra vez.'),
  }

  return (
    <main className="min-h-screen bg-[#f6f8f4] text-slate-950">
      <TopNav auth={auth} navigate={navigate} route={route} />

      {route === '/login' && (
        <LoginPage auth={auth} loginMessage={loginMessage} navigate={navigate} />
      )}
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
            <span className="block text-base font-semibold leading-none">Tlali Tlapixqui</span>
            <span className="block text-xs font-medium text-emerald-100/80">
              Tlali Tlapixqui
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
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold leading-none text-white">
                  {auth.user?.fullName ?? 'Sesion activa'}
                </p>
                <p className="mt-1 text-xs font-medium text-emerald-100/75">
                  {auth.user?.role ?? 'Validando'}
                </p>
              </div>
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
          alt="Tlali Tlapixqui con sensores IoT"
          className="absolute inset-0 h-full w-full object-cover"
          src={heroTlaliTlapixqui}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/72 to-slate-950/10" />

        <div className="relative mx-auto flex min-h-[calc(92vh-4rem)] max-w-7xl items-center px-5 py-12 sm:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-300">
              Monitoreo agricola inteligente
            </p>
            <h1 className="mt-5 text-5xl font-semibold leading-tight tracking-normal sm:text-6xl">
              Tlali Tlapixqui
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
              Plataforma Tlali Tlapixqui
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal text-slate-950">
              Observabilidad de Tlali Tlapixqui sin friccion.
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
            ['Humedad aire', 'Microclima de Tlali Tlapixqui'],
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

function LoginPage({ auth, loginMessage, navigate }) {
  const [email, setEmail] = useState('superadmin@tlali.local')
  const [password, setPassword] = useState('SuperAdmin123!')
  const [message, setMessage] = useState(loginMessage)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (auth.token && auth.status === 'authenticated') {
      navigate('/dashboard', { replace: true })
    }
  }, [auth.status, auth.token])

  useEffect(() => {
    setMessage(loginMessage)
  }, [loginMessage])

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
            Entra al panel operativo de Tlali Tlapixqui.
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
  const metrics = useMemo(() => buildSensorMetrics(latest), [latest])
  const tlaliState = useMemo(() => getTlaliState(metrics), [metrics])

  async function loadReadings() {
    try {
      setStatus('checking')
      const response = await authorizedFetch(
        `${API_URL}/api/v1/sensor-readings/latest?limit=8`,
        auth.token,
        {},
        auth.onUnauthorized,
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
      const response = await authorizedFetch(
        `${API_URL}/api/v1/sensor-readings`,
        auth.token,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(toReadingPayload(form)),
        },
        auth.onUnauthorized,
      )

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
              Tlali Tlapixqui principal
            </h1>
            {auth.user && (
              <p className="mt-2 text-sm text-slate-500">
                {auth.user.fullName} - {auth.user.role}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:items-end">
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
            <button
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              onClick={auth.logout}
              type="button"
            >
              Cerrar sesion
            </button>
          </div>
        </header>

        <EnvironmentSummary
          latest={latest}
          readingsCount={readings.length}
          state={tlaliState}
        />

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <MetricCard key={metric.key} metric={metric} />
          ))}
        </section>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="grid gap-6">
            <SensorTrend readings={readings} />
            <ReadingsTable loadReadings={loadReadings} readings={readings} />
          </div>
          <div className="grid content-start gap-6">
            <DevicePanel latest={latest} />
            <ReadingForm
              form={form}
              handleSubmit={handleSubmit}
              message={message}
              updateField={updateField}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function EnvironmentSummary({ latest, readingsCount, state }) {
  return (
    <section className="grid gap-3 lg:grid-cols-[1fr_220px_220px]">
      <article className={`rounded-lg border bg-white p-5 shadow-sm ${state.borderClass}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Estado de Tlali Tlapixqui
            </p>
            <h2 className={`mt-2 text-3xl font-semibold tracking-normal ${state.textClass}`}>
              {state.label}
            </h2>
          </div>
          <span className={`rounded-md px-3 py-1.5 text-sm font-semibold ${state.badgeClass}`}>
            {state.badge}
          </span>
        </div>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">{state.message}</p>
      </article>

      <SummaryTile
        label="Ultima lectura"
        value={latest ? new Date(latest.receivedAt).toLocaleTimeString('es-MX') : '--'}
        helper={latest ? new Date(latest.receivedAt).toLocaleDateString('es-MX') : 'Sin datos'}
      />
      <SummaryTile
        label="Muestras"
        value={readingsCount}
        helper={readingsCount === 1 ? 'lectura reciente' : 'lecturas recientes'}
      />
    </section>
  )
}

function SummaryTile({ helper, label, value }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-normal text-slate-950">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{helper}</p>
    </article>
  )
}

function MetricCard({ metric }) {
  return (
    <article className={`rounded-lg border border-slate-200 border-l-4 bg-white p-4 shadow-sm ${metric.borderClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{metric.label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-normal text-slate-950">
            {metric.formattedValue}
          </p>
        </div>
        <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${metric.badgeClass}`}>
          {metric.statusLabel}
        </span>
      </div>

      <div className="mt-4 h-2 rounded-full bg-slate-100">
        <div
          className={`h-2 rounded-full ${metric.barClass}`}
          style={{ width: `${metric.percent}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between text-xs font-medium text-slate-400">
        <span>{formatMetric(metric.min, metric.suffix)}</span>
        <span>{formatMetric(metric.max, metric.suffix)}</span>
      </div>
    </article>
  )
}

function SensorTrend({ readings }) {
  const chartReadings = readings.slice(0, 8).reverse()

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-1 border-b border-slate-100 pb-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Tendencia de sensores</h2>
          <p className="text-sm text-slate-500">Comparacion visual de las ultimas lecturas.</p>
        </div>
        <p className="text-sm font-medium text-slate-500">
          {chartReadings.length} muestras
        </p>
      </div>

      {chartReadings.length === 0 ? (
        <p className="py-10 text-sm text-slate-500">Aun no hay datos para graficar.</p>
      ) : (
        <div className="mt-4 grid gap-4">
          {sensorDefinitions.map((definition) => (
            <TrendRow
              definition={definition}
              key={definition.key}
              readings={chartReadings}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function TrendRow({ definition, readings }) {
  return (
    <div className="grid gap-2 sm:grid-cols-[110px_1fr] sm:items-center">
      <p className="text-sm font-semibold text-slate-700">{definition.label}</p>
      <div className="flex h-20 items-end gap-1 rounded-md bg-slate-50 px-2 py-2">
        {readings.map((reading) => {
          const value = toNumber(reading[definition.key])
          const percent = getPercent(value, definition.min, definition.max)

          return (
            <div className="flex min-w-7 flex-1 flex-col items-center gap-1" key={`${definition.key}-${reading.id}`}>
              <div className="flex h-12 w-full items-end justify-center">
                <span
                  className={`w-full rounded-t-sm ${getAccentClasses(definition.accent).bar}`}
                  style={{ height: `${Math.max(percent, value === null ? 0 : 8)}%` }}
                  title={formatMetric(value, definition.suffix)}
                />
              </div>
              <span className="text-[10px] font-medium text-slate-400">
                {new Date(reading.receivedAt).toLocaleTimeString('es-MX', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DevicePanel({ latest }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900">Nodo sensor</h2>
      <dl className="mt-4 grid gap-3 text-sm">
        <DeviceStat label="Dispositivo" value={latest?.deviceId ?? '--'} />
        <DeviceStat label="Sitio" value={latest?.siteId ?? '--'} />
        <DeviceStat label="Bateria" value={formatMetric(latest?.batteryVoltage, ' V')} />
        <DeviceStat
          label="Registrada"
          value={latest ? new Date(latest.recordedAt ?? latest.receivedAt).toLocaleString('es-MX') : '--'}
        />
      </dl>
    </section>
  )
}

function DeviceStat({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
      <dt className="font-medium text-slate-500">{label}</dt>
      <dd className="text-right font-semibold text-slate-900">{value}</dd>
    </div>
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
        <TextField label="Sitio" name="siteId" onChange={updateField} value={form.siteId} />
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

async function authorizedFetch(url, token, options = {}, onUnauthorized) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
  })

  if (response.status === 401 && onUnauthorized) {
    onUnauthorized()
  }

  return response
}

function toReadingPayload(form) {
  return {
    deviceId: form.deviceId.trim(),
    siteId: form.siteId.trim() || null,
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

function buildSensorMetrics(latest) {
  return sensorDefinitions.map((definition) => {
    const value = toNumber(latest?.[definition.key])
    const status = getSensorStatus(value, definition)
    const accentClasses = getAccentClasses(definition.accent)

    return {
      ...definition,
      value,
      formattedValue: formatMetric(value, definition.suffix),
      percent: getPercent(value, definition.min, definition.max),
      status: status.key,
      statusLabel: status.label,
      badgeClass: status.badgeClass,
      borderClass: accentClasses.border,
      barClass: accentClasses.bar,
    }
  })
}

function getSensorStatus(value, definition) {
  if (value === null) {
    return {
      key: 'empty',
      label: 'Sin dato',
      badgeClass: 'bg-slate-100 text-slate-600',
    }
  }

  if (value < definition.healthyMin) {
    return {
      key: 'low',
      label: definition.lowText,
      badgeClass: 'bg-amber-100 text-amber-800',
    }
  }

  if (value > definition.healthyMax) {
    return {
      key: 'high',
      label: definition.highText,
      badgeClass: 'bg-rose-100 text-rose-800',
    }
  }

  return {
    key: 'healthy',
    label: 'Normal',
    badgeClass: 'bg-emerald-100 text-emerald-800',
  }
}

function getTlaliState(metrics) {
  const activeMetrics = metrics.filter((metric) => metric.value !== null)
  const alerts = activeMetrics.filter((metric) => metric.status !== 'healthy')

  if (activeMetrics.length === 0) {
    return {
      label: 'Sin lecturas',
      badge: 'Esperando sensores',
      message: 'Cuando el ESP32 envie datos, aqui veras el estado general de Tlali Tlapixqui.',
      borderClass: 'border-slate-200',
      textClass: 'text-slate-700',
      badgeClass: 'bg-slate-100 text-slate-700',
    }
  }

  if (alerts.length === 0) {
    return {
      label: 'Condiciones estables',
      badge: 'Normal',
      message: 'Temperatura, humedad, suelo y luz estan dentro de los rangos saludables configurados.',
      borderClass: 'border-emerald-200',
      textClass: 'text-emerald-800',
      badgeClass: 'bg-emerald-100 text-emerald-800',
    }
  }

  const alertText = alerts
    .map((metric) => `${metric.label}: ${metric.statusLabel.toLowerCase()}`)
    .join(', ')

  return {
    label: alerts.length > 1 ? 'Revisar ambiente' : 'Atencion requerida',
    badge: `${alerts.length} alerta${alerts.length > 1 ? 's' : ''}`,
    message: `Lecturas fuera de rango: ${alertText}. Ajusta ventilacion, riego o sombra segun el sensor afectado.`,
    borderClass: 'border-amber-200',
    textClass: 'text-amber-800',
    badgeClass: 'bg-amber-100 text-amber-800',
  }
}

function getAccentClasses(accent) {
  const classes = {
    amber: {
      bar: 'bg-amber-500',
      border: 'border-l-amber-500',
    },
    emerald: {
      bar: 'bg-emerald-500',
      border: 'border-l-emerald-500',
    },
    lime: {
      bar: 'bg-lime-500',
      border: 'border-l-lime-500',
    },
    sky: {
      bar: 'bg-sky-500',
      border: 'border-l-sky-500',
    },
  }

  return classes[accent] ?? classes.emerald
}

function getPercent(value, min, max) {
  if (value === null) {
    return 0
  }

  return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100))
}

function toNumber(value) {
  if (value === null || value === undefined || value === '') {
    return null
  }

  return Number(value)
}

function getTokenPayload(token) {
  try {
    const [, payload] = token.split('.')
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((character) => `%${`00${character.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(''),
    )

    return JSON.parse(json)
  } catch (error) {
    return null
  }
}

function isTokenExpired(token) {
  const payload = getTokenPayload(token)
  if (!payload?.exp) {
    return true
  }

  return payload.exp * 1000 <= Date.now()
}

function getTokenExpirationDelay(token) {
  const payload = getTokenPayload(token)
  if (!payload?.exp) {
    return null
  }

  return Math.max(payload.exp * 1000 - Date.now(), 0)
}

export default App
