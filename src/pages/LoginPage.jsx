import { useEffect, useState } from 'react'
import TextField from '../components/forms/TextField.jsx'
import PublicPageLayout from '../components/layout/PublicPageLayout.jsx'
import { API_URL } from '../config/app.js'
import { useLanguage } from '../i18n/LanguageContext.jsx'

export default function LoginPage({ auth, loginMessage, navigate }) {
  const { t } = useLanguage()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState(loginMessage)
  const [loading, setLoading] = useState(false)
  const [googleEnabled, setGoogleEnabled] = useState(null)

  useEffect(() => {
    if (auth.token && auth.status === 'authenticated') navigate('/dashboard', { replace: true })
  }, [auth.status, auth.token])

  useEffect(() => setMessage(loginMessage), [loginMessage])

  useEffect(() => {
    fetch(`${API_URL}/api/v1/auth/providers`)
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((providers) => setGoogleEnabled(Boolean(providers.googleEnabled)))
      .catch(() => setGoogleEnabled(false))
  }, [])

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
      if (!response.ok) throw new Error('Credenciales inválidas')
      const data = await response.json()
      auth.saveToken(data.token)
      navigate('/dashboard')
    } catch {
      setMessage(t.login.failed)
    } finally {
      setLoading(false)
    }
  }

  return (
    <PublicPageLayout auth={auth} navigate={navigate}>
      <section className="tlali-container grid min-h-screen gap-8 pb-14 pt-32 lg:grid-cols-[1fr_420px] lg:items-center">
        <div>
          <p className="eyebrow">{t.login.eyebrow}</p>
          <h1 className="font-display mt-4 max-w-3xl text-5xl font-bold leading-[1.04] sm:text-6xl">{t.login.title}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-tlali-muted">{t.login.text}</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <AccessBenefit label={t.login.crop} text={t.login.cropText} />
            <AccessBenefit label={t.login.alerts} text={t.login.alertsText} />
            <AccessBenefit label={t.login.history} text={t.login.historyText} />
          </div>
        </div>

        <form className="paper-card p-5 text-tlali-ink shadow-2xl sm:p-6" onSubmit={handleSubmit}>
          <h2 className="font-display text-2xl font-bold">{t.login.formTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-tlali-muted">{t.login.formText}</p>
          <div className="mt-5 grid gap-4">
            <TextField label={t.common.email} name="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
            <PasswordField
              label={t.common.password}
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              showPassword={showPassword}
              togglePassword={() => setShowPassword((current) => !current)}
              value={password}
            />
          </div>
          <button className="primary-button mt-5 w-full min-h-12" disabled={loading} type="submit">{loading ? t.login.entering : t.login.enter}</button>
          <div className="my-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-slate-400"><span className="h-px flex-1 bg-slate-200" />{t.login.or}<span className="h-px flex-1 bg-slate-200" /></div>
          {googleEnabled ? (
            <a className="flex h-11 w-full items-center justify-center rounded-md border border-slate-300 text-sm font-semibold text-slate-800 hover:bg-slate-50" href={`${API_URL}/oauth2/authorization/google`}>{t.login.google}</a>
          ) : (
            <button className="flex h-11 w-full cursor-not-allowed items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-400" disabled type="button">{googleEnabled === null ? t.login.checking : t.common.googleUnavailable}</button>
          )}
          {message && <p className="mt-4 text-sm font-medium text-rose-700">{message}</p>}
        </form>
      </section>
    </PublicPageLayout>
  )
}

function AccessBenefit({ label, text }) {
  return <div className="rounded-2xl border border-tlali-line bg-tlali-paper/80 p-4"><p className="font-display text-lg font-bold">{label}</p><p className="mt-1 text-sm text-tlali-muted">{text}</p></div>
}

function PasswordField({ label, name, onChange, showPassword, togglePassword, value }) {
  return (
    <label className="grid gap-1 text-sm font-medium text-slate-700">
      {label}
      <span className="relative block">
        <input
          className="tlali-input w-full pr-24"
          name={name}
          onChange={onChange}
          required
          type={showPassword ? 'text' : 'password'}
          value={value}
        />
        <button
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-bold text-tlali-jade-dark transition hover:bg-[#d8eee7]"
          onClick={togglePassword}
          type="button"
        >
          {showPassword ? 'Ocultar' : 'Mostrar'}
        </button>
      </span>
    </label>
  )
}
