import { useEffect, useMemo, useState } from 'react'
import {
  DashboardNav,
  StatusPill,
} from '../components/dashboard/DashboardWidgets.jsx'
import useDashboardData from '../hooks/useDashboardData.js'
import { formatMetric, toNumber } from '../lib/sensors.js'

export default function DashboardPage({ auth, navigate, route }) {
  const [clock, setClock] = useState(new Date())
  const data = useDashboardData(auth)
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
  const sourceOnline = liveSource ? firebaseOnline : summary?.gatewayOnline
  const live = cultivationNode?.data ?? {}
  const actuatorData = actuatorNode?.data ?? {}
  const signal = getSignalDecision(cultivationNode ?? actuatorNode)
  const relayOneOn = Boolean(actuatorData.relay1On)
  const relayTwoOn = Boolean(actuatorData.relay2On)
  const irrigationLabel = relayOneOn || relayTwoOn ? 'Riego activo' : 'Riego en espera'
  const criticalAlerts = alerts.filter((alert) => alert.status !== 'healthy')

  const importantReadings = useMemo(() => ([
    {
      helper: 'Zona de cultivo',
      label: 'Humedad del suelo',
      state: getRangeState(latest?.soilMoisturePercent, activeCrop?.parameters?.soilMoisturePercent),
      value: formatMetric(latest?.soilMoisturePercent, '%'),
    },
    {
      helper: 'Ambiente',
      label: 'Temperatura',
      state: getRangeState(latest?.temperatureCelsius ?? live.airTemperatureC, activeCrop?.parameters?.temperatureCelsius),
      value: formatMetric(latest?.temperatureCelsius ?? live.airTemperatureC, ' °C'),
    },
    {
      helper: 'Sustrato',
      label: 'pH',
      state: getRangeState(live.ph, activeCrop?.parameters?.ph),
      value: formatMetric(live.ph, ''),
    },
    {
      helper: 'Agua disponible',
      label: 'Cisterna 1',
      state: getTankState(actuatorData.tank1DistanceCm),
      value: formatMetric(actuatorData.tank1DistanceCm, ' cm'),
    },
  ]), [activeCrop, actuatorData.tank1DistanceCm, latest, live])

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
      label: 'Cultivo hoy',
      tone: cropReadings.length ? 'healthy' : 'warning',
      value: cropReadings.length,
    },
    {
      helper: 'Solo riego y cisternas',
      label: 'Actuadores hoy',
      tone: actuatorDayReadings.length ? 'healthy' : 'warning',
      value: actuatorDayReadings.length,
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
      helper: activeCrop?.name ?? 'Sin cultivo elegido',
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
              {cultivationAssignment && <span className="module-badge amber">{cultivationAssignment.greenhouse} · {cultivationAssignment.area}</span>}
            </div>
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
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <MiniSignal label="RSSI" value={formatMetric((cultivationNode ?? actuatorNode)?.radio?.rssiDbm, ' dBm')} />
              <MiniSignal label="SNR" value={formatMetric((cultivationNode ?? actuatorNode)?.radio?.snrDb, ' dB')} />
            </div>
          </article>
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
            text={`Hoy se han recibido ${cropReadings.length + actuatorDayReadings.length} registros entre cultivo y actuadores.`}
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

function RealtimeCard({ helper, label, state, value }) {
  const isAlert = state === 'warning' || state === 'danger'
  return (
    <div className="relative flex min-h-[142px] flex-col justify-between overflow-hidden rounded-2xl border border-[#dfe5df] bg-white p-4 shadow-sm">
      <span className="absolute -bottom-8 -right-8 h-20 w-20 rounded-full bg-[#dff1e9]" />
      {isAlert && <span className={`absolute right-4 top-4 text-lg font-black leading-none ${state === 'danger' ? 'text-[#b73832]' : 'text-[#c88b23]'}`}>▲</span>}
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.04em] text-[#606b63]">{label}</p>
        <p className="mt-3 text-3xl font-black tracking-tight">{value}</p>
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

function MiniSignal({ label, value }) {
  return (
    <div className="rounded-xl border border-[#e1dbcd] bg-[#fcf8f0] px-3 py-2">
      <p className="text-[10px] font-bold uppercase text-tlali-muted">{label}</p>
      <p className="mt-1 font-bold">{value}</p>
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

function getSignalDecision(node) {
  const rssi = toNumber(node?.radio?.rssiDbm)
  if (rssi === null) return { detail: 'Sin dato de radio', label: 'Sin dato', tone: 'warning' }
  if (rssi >= -80) return { detail: `${rssi} dBm`, label: 'Excelente', tone: 'healthy' }
  if (rssi >= -95) return { detail: `${rssi} dBm`, label: 'Buena', tone: 'healthy' }
  if (rssi >= -110) return { detail: `${rssi} dBm`, label: 'Débil', tone: 'warning' }
  return { detail: `${rssi} dBm`, label: 'Crítica', tone: 'danger' }
}

function relativeTime(date) {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(date).getTime()) / 1000))
  if (seconds < 60) return '< 1 min'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h`
  return new Date(date).toLocaleDateString('es-MX')
}
