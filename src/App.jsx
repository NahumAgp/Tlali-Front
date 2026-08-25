import { useEffect, useState } from 'react'
import { TOKEN_KEY } from './config/app.js'
import { useLanguage } from './i18n/LanguageContext.jsx'
import { getTokenExpirationDelay, isTokenExpired, loadCurrentUser } from './lib/auth.js'
import ActuadoresPage from './pages/ActuadoresPage.jsx'
import ConfiguracionPage from './pages/ConfiguracionPage.jsx'
import CultivoPage from './pages/CultivoPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import LandingPage from './pages/LandingPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import WhoWeArePage from './pages/WhoWeArePage.jsx'

const DEFAULT_LOGIN_MESSAGE = ''
const PRIVATE_ROUTES = ['/dashboard', '/cultivo', '/actuadores', '/configuracion']
const PUBLIC_ROUTES = ['/', '/quienes-somos', '/login', '/dashboard', '/cultivo', '/actuadores', '/configuracion', '/auth/callback']

export default function App() {
  const { t } = useLanguage()
  const [route, setRoute] = useState(() => window.location.pathname)
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState(null)
  const [authStatus, setAuthStatus] = useState(() => (token ? 'checking' : 'guest'))
  const [loginMessage, setLoginMessage] = useState(DEFAULT_LOGIN_MESSAGE)

  useEffect(() => {
    const handlePopState = () => setRoute(window.location.pathname)
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    if (route !== '/auth/callback') return
    const callbackToken = new URLSearchParams(window.location.search).get('token')
    if (callbackToken) {
      saveToken(callbackToken)
      navigate('/dashboard', { replace: true })
    } else {
      navigate('/login', { replace: true })
    }
  }, [route])

  useEffect(() => {
    if (!token) {
      setUser(null)
      setAuthStatus('guest')
      return
    }
    if (isTokenExpired(token)) {
      endSession('/login', t.app.expired)
      return
    }

    setAuthStatus('checking')
    loadCurrentUser(token)
      .then((currentUser) => {
        setUser(currentUser)
        setAuthStatus('authenticated')
      })
      .catch(() => endSession('/login', t.app.invalid))

    const expirationDelay = getTokenExpirationDelay(token)
    if (!expirationDelay) return
    const expirationTimer = window.setTimeout(() => endSession('/login', t.app.expired), expirationDelay)
    return () => window.clearTimeout(expirationTimer)
  }, [token, t])

  useEffect(() => {
    if (PRIVATE_ROUTES.includes(route) && !token) navigate('/login', { replace: true })
  }, [route, token])

  function navigate(path, options = {}) {
    window.history[options.replace ? 'replaceState' : 'pushState']({}, '', path)
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

  const auth = {
    token,
    user,
    status: authStatus,
    saveToken,
    logout: () => endSession('/', DEFAULT_LOGIN_MESSAGE),
    onUnauthorized: () => endSession('/login', t.app.expired),
  }

  return (
    <main className="min-h-screen bg-tlali-cream text-tlali-ink">
      {route === '/' && <LandingPage auth={auth} navigate={navigate} />}
      {route === '/quienes-somos' && <WhoWeArePage auth={auth} navigate={navigate} />}
      {route === '/login' && <LoginPage auth={auth} loginMessage={loginMessage} navigate={navigate} />}
      {route === '/dashboard' && token && <DashboardPage auth={auth} navigate={navigate} route={route} />}
      {route === '/cultivo' && token && <CultivoPage auth={auth} navigate={navigate} route={route} />}
      {route === '/actuadores' && token && <ActuadoresPage auth={auth} navigate={navigate} route={route} />}
      {route === '/configuracion' && token && <ConfiguracionPage auth={auth} navigate={navigate} route={route} />}
      {route === '/auth/callback' && <LoadingPage />}
      {!PUBLIC_ROUTES.includes(route) && <NotFoundPage navigate={navigate} />}
    </main>
  )
}

function LoadingPage() {
  const { t } = useLanguage()
  return <div className="tlali-page grid min-h-screen place-items-center"><p className="font-display text-xl font-bold">{t.app.loading}</p></div>
}

function NotFoundPage({ navigate }) {
  const { t } = useLanguage()
  return <div className="tlali-page grid min-h-screen place-items-center px-5 text-center"><div><p className="eyebrow">{t.app.notFound}</p><h1 className="font-display mt-3 text-4xl font-bold">{t.app.returnCrop}</h1><button className="primary-button mt-6" onClick={() => navigate('/')} type="button">{t.common.backHome}</button></div></div>
}
