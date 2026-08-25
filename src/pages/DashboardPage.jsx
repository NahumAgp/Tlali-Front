import { useEffect, useMemo, useState } from 'react'
import {
  DashboardNav,
  StatusPill,
} from '../components/dashboard/DashboardWidgets.jsx'
import useDashboardData, { HISTORY_PERIODS } from '../hooks/useDashboardData.js'
import { getCropAgeDays, getCropParameters, getCropStage, getCropStageTiming } from '../lib/cropSettings.js'
import { formatMetric, toNumber } from '../lib/sensors.js'

export default function DashboardPage({ auth, navigate, route }) {
  const [clock, setClock] = useState(new Date())
  const [historyPeriod, setHistoryPeriod] = useState('day')
  const data = useDashboardData(auth, { historyPeriod })
  const {
    activeFirebaseNodes,
    activeCrop,
    actuatorNode,
    actuatorReadings,
    alerts,
    cultivationAssignment,
    cultivationNode,
    downloadReport,
    firebaseOnline,
    lastReceivedAt,
    latest,
    liveSource,
    message,
    periodActuatorReadings,
    periodReadings,
    readings,
    status,
    summary,
    todayActuatorReadings,
    todayReadings,
  } = data

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const cropReadings = todayReadings.length ? todayReadings : readings
  const actuatorDayReadings = todayActuatorReadings.length ? todayActuatorReadings : actuatorReadings
  const dashboardCropReadings = periodReadings.length ? periodReadings : cropReadings
  const dashboardActuatorReadings = periodActuatorReadings.length ? periodActuatorReadings : actuatorDayReadings
  const periodLabel = HISTORY_PERIODS.find((period) => period.key === historyPeriod)?.label ?? 'Día'
  const sourceOnline = liveSource ? firebaseOnline : summary?.gatewayOnline
  const live = cultivationNode?.data ?? {}
  const actuatorData = actuatorNode?.data ?? {}
  const averages = useMemo(() => buildAverages(dashboardCropReadings), [dashboardCropReadings])
  const actuatorAverages = useMemo(() => buildAverages(dashboardActuatorReadings), [dashboardActuatorReadings])
  const signal = getSignalDecision(cultivationNode ?? actuatorNode)
  const relayOneOn = Boolean(actuatorData.relay1On)
  const relayTwoOn = Boolean(actuatorData.relay2On)
  const irrigationLabel = relayOneOn || relayTwoOn ? 'Riego activo' : 'Riego en espera'
  const criticalAlerts = alerts.filter((alert) => alert.status !== 'healthy')
  const activeStage = getCropStage(activeCrop)
  const activeStageTiming = getCropStageTiming(activeCrop)
  const cropAgeDays = getCropAgeDays(activeCrop)
  const activeParameters = getCropParameters(activeCrop)

  const importantReadings = useMemo(() => ([
    {
      helper: `Promedio · ${periodLabel}`,
      label: 'Humedad del suelo',
      range: activeParameters?.soilMoisturePercent,
      rawValue: averages.soilMoisturePercent,
      state: getRangeState(averages.soilMoisturePercent, activeParameters?.soilMoisturePercent),
      value: formatMetric(averages.soilMoisturePercent, '%'),
    },
    {
      helper: `Promedio · ${periodLabel}`,
      label: 'Temperatura',
      range: activeParameters?.temperatureCelsius,
      rawValue: averages.temperatureCelsius,
      state: getRangeState(averages.temperatureCelsius, activeParameters?.temperatureCelsius),
      value: formatMetric(averages.temperatureCelsius, ' °C'),
    },
    {
      helper: `Promedio · ${periodLabel}`,
      label: 'pH',
      range: activeParameters?.ph,
      rawValue: averages.ph,
      state: getRangeState(averages.ph, activeParameters?.ph),
      value: formatMetric(averages.ph, ''),
    },
    {
      helper: `Promedio · ${periodLabel}`,
      label: 'Cisterna 1',
      range: { min: 0, max: 120 },
      rawValue: actuatorAverages.tank1DistanceCm,
      state: getTankState(actuatorAverages.tank1DistanceCm),
      value: formatMetric(actuatorAverages.tank1DistanceCm, ' cm'),
    },
  ]), [activeParameters, actuatorAverages.tank1DistanceCm, averages, periodLabel])

  const kpis = [
    {
      helper: criticalAlerts.length ? 'Requieren atención' : 'Todo en orden',
      label: 'Alertas activas',
      tone: criticalAlerts.length ? 'danger' : 'healthy',
      value: criticalAlerts.length,
    },
    {
      helper: 'Cultivo + actuadores',
      label: 'Nodos activos',
      tone: sourceOnline ? 'healthy' : 'danger',
      value: liveSource ? activeFirebaseNodes : (summary?.activeNodes ?? '-'),
    },
    {
      helper: 'Lecturas de sensores',
      label: 'Cultivo',
      tone: dashboardCropReadings.length ? 'healthy' : 'warning',
      value: dashboardCropReadings.length,
    },
    {
      helper: 'Solo riego y cisternas',
      label: 'Actuadores',
      tone: dashboardActuatorReadings.length ? 'healthy' : 'warning',
      value: dashboardActuatorReadings.length,
    },
    {
      helper: relayTwoOn ? 'Bomba o válvula activa' : 'Sin movimiento',
      label: 'Estado de riego',
      tone: relayOneOn || relayTwoOn ? 'warning' : 'healthy',
      value: irrigationLabel,
    },
    {
      helper: signal.detail,
      label: 'Señal LoRa',
      tone: signal.tone,
      value: signal.label,
    },
    {
      helper: activeStage?.name ?? 'Etapa sin definir',
      label: 'Cultivo configurado',
      tone: activeCrop ? 'healthy' : 'warning',
      value: activeCrop?.name ?? 'Pendiente',
    },
    {
      helper: lastReceivedAt ? `Última señal: ${relativeTime(lastReceivedAt)}` : 'Sin lectura reciente',
      label: 'Actualización',
      tone: lastReceivedAt ? 'healthy' : 'warning',
      value: clock.toLocaleTimeString('es-MX'),
    },
  ]

  return (
    <div className="dashboard-shell min-h-screen text-tlali-ink">
      <DashboardNav auth={auth} downloadReport={downloadReport} hasReadings={cropReadings.length > 0 || actuatorDayReadings.length > 0} navigate={navigate} route={route} />
      <div className="mx-auto max-w-[1280px] px-4 py-5 sm:px-7 lg:px-10 lg:py-7">
        <section className="grid gap-4 lg:grid-cols-[1fr_360px]" id="dashboard">
          <article className="paper-card px-5 py-6 sm:px-7">
            <p className="eyebrow">Dashboard</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Decisiones rápidas del invernadero</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-tlali-muted">
              Vista general con los datos más importantes del cultivo y del sistema de riego. Las alertas quedan al frente para saber qué revisar primero.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="module-badge green">Cultivo: {activeCrop?.name ?? 'Sin definir'}</span>
              <span className="module-badge green">Edad: {cropAgeDays} días</span>
              {activeStage && <span className="module-badge green">Etapa: {activeStage.name} · día {activeStageTiming.daysElapsed} de {activeStageTiming.maxDays}</span>}
              {cultivationAssignment && <span className="module-badge amber">{cultivationAssignment.greenhouse} · {cultivationAssignment.area}</span>}
            </div>
            {activeStage && (
              <div className="mt-3 grid gap-2 text-xs font-semibold text-[#687169] sm:grid-cols-2">
                <p>{activeStage.from} → {activeStage.to}</p>
                <p>Inicio del cultivo: {formatDate(activeCrop?.cropStartedAt)}</p>
                <p>Inicio efectivo: {formatDate(activeStageTiming.effectiveStartedAt)}</p>
                {activeStageTiming.isAutoAdvanced && (
                  <p className="sm:col-span-2 text-[#9b6b1d]">Etapa avanzada automáticamente desde {activeStageTiming.configuredStage.name}.</p>
                )}
              </div>
            )}
          </article>

          <article className="paper-card px-5 py-5">
            <div className="flex items-center justify-between gap-5">
              <div className="flex items-center gap-3">
                <span className={`status-dot ${sourceOnline ? 'online' : status === 'checking' ? 'checking' : 'offline'}`} />
                <div>
                  <p className="font-bold">Sistema en campo</p>
                  <p className="mt-1 text-xs text-tlali-muted">Cultivo, actuadores y gateway</p>
                </div>
              </div>
              <StatusPill online={sourceOnline} status={status} />
            </div>
            <div className="mt-4 rounded-xl border border-[#e1dbcd] bg-[#fcf8f0] p-3">
              <p className="text-xs font-semibold text-tlali-muted">Reloj de actualización</p>
              <p className="mt-1 text-2xl font-black tracking-tight">{clock.toLocaleTimeString('es-MX')}</p>
            </div>
            <SignalIndicator node={cultivationNode ?? actuatorNode} />
          </article>
        </section>

        <section className="mt-4 paper-card p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Filtro de análisis</p>
              <h2 className="mt-1 text-lg font-bold">Promedios del dashboard</h2>
              <p className="mt-1 text-sm text-tlali-muted">Las tarjetas principales se calculan con el periodo seleccionado.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {HISTORY_PERIODS.map((period) => (
                <button
                  className={`rounded-full border px-4 py-2 text-xs font-black transition ${historyPeriod === period.key ? 'border-tlali-jade-dark bg-[#d8eee7] text-tlali-jade-dark' : 'border-[#e1dbcd] bg-[#fcf8f0] text-[#687169]'}`}
                  key={period.key}
                  onClick={() => setHistoryPeriod(period.key)}
                  type="button"
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi) => <DecisionKpi key={kpi.label} {...kpi} />)}
        </section>

        {message && <div className={`mt-4 rounded-xl border px-4 py-3 text-sm ${status === 'offline' ? 'border-red-200 bg-red-50 text-red-800' : 'border-tlali-line bg-tlali-paper text-tlali-muted'}`}>{message}</div>}

        <section className="mt-4 grid gap-4 lg:grid-cols-[.95fr_1.05fr]">
          <article className="paper-card p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="eyebrow">Tiempo real</p>
                <h2 className="mt-1 text-xl font-bold">Sensores clave</h2>
                <p className="mt-1 text-sm text-tlali-muted">Solo los datos que ayudan a decidir rápido.</p>
              </div>
              <span className="module-badge green">En vivo</span>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {importantReadings.map((reading) => <RealtimeCard key={reading.label} {...reading} />)}
            </div>
          </article>

          <article className="paper-card p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="eyebrow">Alertas</p>
                <h2 className="mt-1 text-xl font-bold">Qué revisar primero</h2>
                <p className="mt-1 text-sm text-tlali-muted">Comparado con los rangos del cultivo configurado.</p>
              </div>
              <span className={`module-badge ${criticalAlerts.length ? 'amber' : 'green'}`}>{criticalAlerts.length}</span>
            </div>
            <div className="mt-4 grid gap-2">
              {criticalAlerts.length ? criticalAlerts.slice(0, 6).map((alert) => (
                <div className="rounded-xl border border-[#ead5a8] bg-[#fff5dc] px-4 py-3" key={alert.key}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold">{alert.label}</p>
                      <p className="mt-1 text-xs text-[#7d735d]">Estado: {alert.statusLabel}</p>
                    </div>
                    <strong className="text-sm">{alert.formattedValue}</strong>
                  </div>
                </div>
              )) : (
                <div className="rounded-xl border border-[#cce0cf] bg-[#edf7ee] p-4">
                  <p className="font-bold text-[#245c32]">Sin alertas activas</p>
                  <p className="mt-1 text-sm text-[#5d7465]">Los sensores principales están dentro de los rangos configurados.</p>
                </div>
              )}
              <p className="pt-1 text-xs text-[#838983]">Última señal: {lastReceivedAt ? relativeTime(lastReceivedAt) : '-'}</p>
            </div>
          </article>
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-3">
          <DecisionCard
            title="Producción"
            text={criticalAlerts.length ? 'Hay condiciones fuera de rango. Conviene revisar antes de seguir el día normal.' : 'Las condiciones principales están estables para continuar la operación.'}
          />
          <DecisionCard
            title="Riego"
            text={relayOneOn || relayTwoOn ? 'El sistema de riego reporta actividad. Revisa que la cisterna tenga nivel suficiente.' : 'El riego está en espera. Si baja la humedad del suelo, el panel lo marcará como prioridad.'}
          />
          <DecisionCard
            title="Historial"
            text={`En el periodo ${periodLabel.toLowerCase()} hay ${dashboardCropReadings.length + dashboardActuatorReadings.length} registros entre cultivo y actuadores.`}
          />
        </section>
      </div>
    </div>
  )
}

function DecisionKpi({ helper, label, tone, value }) {
  const isAlert = tone === 'warning' || tone === 'danger'
  return (
    <article className="relative overflow-hidden rounded-2xl border border-[#dfe5df] bg-white p-4 shadow-sm">
      <span className="absolute -bottom-8 -right-8 h-20 w-20 rounded-full bg-[#dff1e9]" />
      {isAlert && <span className={`absolute right-4 top-4 text-lg font-black leading-none ${tone === 'danger' ? 'text-[#b73832]' : 'text-[#c88b23]'}`}>▲</span>}
      <p className="text-xs font-bold uppercase tracking-[0.04em] text-[#606b63]">{label}</p>
      <p className="mt-3 min-h-9 text-3xl font-black tracking-tight">{value}</p>
      <p className="mt-2 text-xs text-[#6d766e]">{helper}</p>
    </article>
  )
}

function RealtimeCard({ helper, label, range, rawValue, state, value }) {
  const isAlert = state === 'warning' || state === 'danger'
  const isEmpty = state === 'empty'
  const tone = isEmpty
    ? { border: 'border-[#ead9ad]', surface: 'bg-[#fffaf0]', text: 'text-[#a3731a]' }
    : isAlert
      ? { border: 'border-[#ecd8a8]', surface: 'bg-[#fffaf0]', text: 'text-[#a87518]' }
      : { border: 'border-[#b9dcc8]', surface: 'bg-white', text: 'text-[#0f7a49]' }
  const rangeLabel = formatRange(range)
  return (
    <div className={`relative flex min-h-[170px] flex-col justify-between overflow-hidden rounded-2xl border p-4 shadow-sm ${tone.border} ${tone.surface}`}>
      {(isAlert || isEmpty) && <span className={`absolute right-4 top-4 text-lg font-black leading-none ${tone.text}`}>▲</span>}
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.04em] text-[#606b63]">{label}</p>
        <p className={`mt-3 text-3xl font-black tracking-tight ${tone.text}`}>{value}</p>
        <div className="mt-3 rounded-xl border border-[#e5ded0] bg-white/75 px-3 py-2">
          <div className="flex items-center justify-between gap-2 text-[11px] font-bold">
            <span className="text-[#687169]">Rango</span>
            <span className="text-[#344039]">{rangeLabel}</span>
          </div>
          <p className={`mt-1 text-xs font-black ${tone.text}`}>{getComparisonText(rawValue, range)}</p>
        </div>
      </div>
      <p className="mt-3 text-xs font-semibold text-[#6d766e]">{helper}</p>
    </div>
  )
}

function DecisionCard({ text, title }) {
  return (
    <article className="paper-card p-4">
      <p className="text-lg font-bold">{title}</p>
      <p className="mt-2 text-sm leading-6 text-tlali-muted">{text}</p>
    </article>
  )
}

function buildAverages(readings) {
  return {
    ph: average(readings, 'ph'),
    soilMoisturePercent: average(readings, 'soilMoisturePercent'),
    tank1DistanceCm: average(readings, 'tank1DistanceCm'),
    temperatureCelsius: average(readings, 'temperatureCelsius'),
  }
}

function average(readings, key) {
  const values = readings.map((reading) => toNumber(reading?.[key])).filter((value) => value !== null)
  if (!values.length) return null
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function SignalIndicator({ node }) {
  const rssi = toNumber(node?.radio?.rssiDbm)
  const signal = getSignalDecision(node)
  const barCount = getSignalBars(rssi)
  const tone = {
    danger: { active: 'bg-[#b73832]', border: 'border-[#efc7bd]', text: 'text-[#9c3029]' },
    healthy: { active: 'bg-[#0f7a49]', border: 'border-[#b9dcc8]', text: 'text-[#0f7a49]' },
    warning: { active: 'bg-[#d89a1d]', border: 'border-[#f0d594]', text: 'text-[#a86f11]' },
  }[signal.tone] ?? { active: 'bg-[#d89a1d]', border: 'border-[#f0d594]', text: 'text-[#a86f11]' }

  return (
    <div className={`mt-3 rounded-xl border bg-[#fcf8f0] p-3 ${tone.border}`}>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase text-tlali-muted">Señal de radio</p>
          <p className={`mt-1 text-lg font-black ${tone.text}`}>{signal.label}</p>
        </div>
        <div className="flex h-10 items-end gap-1" aria-label={`Señal ${signal.label}`}>
          {[1, 2, 3, 4].map((bar) => (
            <span
              className={`w-2 rounded-sm ${bar <= barCount ? tone.active : 'bg-[#ded8ca]'}`}
              key={bar}
              style={{ height: `${bar * 8 + 6}px` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function getRangeState(value, range) {
  const number = toNumber(value)
  if (number === null) return 'empty'
  const min = toNumber(range?.min)
  const max = toNumber(range?.max)
  if (min === null || max === null) return 'healthy'
  if (number < min || number > max) return 'warning'
  return 'healthy'
}

function getTankState(value) {
  const number = toNumber(value)
  if (number === null) return 'empty'
  return number > 120 ? 'warning' : 'healthy'
}

function formatRange(range) {
  const min = toNumber(range?.min)
  const max = toNumber(range?.max)
  if (min === null || max === null) return '--'
  return `${formatRangeNumber(min)}-${formatRangeNumber(max)}`
}

function getComparisonText(value, range) {
  const number = toNumber(value)
  const min = toNumber(range?.min)
  const max = toNumber(range?.max)
  if (number === null) return 'Sin lectura para comparar'
  if (min === null || max === null) return 'Sin rango configurado'
  if (number < min) return `${formatRangeNumber(min - number)} por debajo`
  if (number > max) return `${formatRangeNumber(number - max)} por encima`
  return 'Dentro del rango'
}

function formatRangeNumber(value) {
  return Number(value).toLocaleString('es-MX', { maximumFractionDigits: 1 })
}

function formatDate(date) {
  if (!date) return '-'
  return new Date(`${date}T00:00:00`).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

function getSignalDecision(node) {
  const rssi = toNumber(node?.radio?.rssiDbm)
  if (rssi === null) return { detail: 'Sin dato de radio', label: 'Sin dato', tone: 'warning' }
  if (rssi >= -80) return { detail: 'Rango excelente', label: 'Excelente', tone: 'healthy' }
  if (rssi >= -105) return { detail: 'Rango bueno', label: 'Buena', tone: 'healthy' }
  if (rssi >= -115) return { detail: 'Rango débil', label: 'Débil', tone: 'warning' }
  return { detail: 'Rango crítico', label: 'Crítica', tone: 'danger' }
}

function getSignalBars(rssi) {
  if (rssi === null) return 1
  if (rssi >= -80) return 4
  if (rssi >= -105) return 3
  if (rssi >= -115) return 2
  return 1
}

function relativeTime(date) {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(date).getTime()) / 1000))
  if (seconds < 60) return '< 1 min'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h`
  return new Date(date).toLocaleDateString('es-MX')
}
