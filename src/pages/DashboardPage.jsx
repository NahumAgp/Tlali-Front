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
  const [monitoredGreenhouse, setMonitoredGreenhouse] = useState('')
  const data = useDashboardData(auth, { greenhouse: monitoredGreenhouse, historyPeriod })
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
    ghostPump,
    ghostWater,
    greenhouseOptions,
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

  useEffect(() => {
    if (!greenhouseOptions.length) return
    if (!monitoredGreenhouse) {
      setMonitoredGreenhouse(greenhouseOptions[0].value)
      return
    }
    if (!greenhouseOptions.some((greenhouse) => greenhouse.value === monitoredGreenhouse)) {
      setMonitoredGreenhouse(greenhouseOptions[0].value)
    }
  }, [greenhouseOptions, monitoredGreenhouse])

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
  const mainPumpRelayOn = Boolean(ghostPump?.active || relayOneOn)
  const realIrrigationActive = relayOneOn || relayTwoOn
  const ghostIrrigationActive = Boolean(ghostPump?.active)
  const irrigationLabel = realIrrigationActive ? 'Riego activo' : ghostIrrigationActive ? 'Bomba fantasma activa' : 'Riego en espera'
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
      helper: realIrrigationActive ? 'Bomba o válvula activa' : ghostIrrigationActive ? 'Simulada por humedad baja' : 'Sin movimiento',
      label: 'Estado de riego',
      tone: realIrrigationActive || ghostIrrigationActive ? 'warning' : 'healthy',
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
            <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
              <div>
                <p className="eyebrow">Monitoreo activo</p>
                <h1 className="mt-1 text-3xl font-black tracking-tight">{activeCrop?.name ?? 'Cultivo sin definir'}</h1>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <MetricTile label="Edad" value={`${cropAgeDays} días`} />
                  <MetricTile label="Etapa" value={activeStage?.name ?? 'Sin etapa'} />
                  <MetricTile label="Día de etapa" value={activeStage ? `${activeStageTiming.daysElapsed} / ${activeStageTiming.maxDays}` : '-'} />
                </div>
              </div>
              <div className="rounded-2xl border border-[#d8cfbf] bg-[#fcf8f0] p-4">
                <label className="grid gap-2 text-xs font-black text-[#4d5c53]">
                  Invernadero monitoreado
                  <select
                    className="rounded-xl border border-[#d8cfbf] bg-white px-4 py-3 text-base font-black text-tlali-ink outline-none transition focus:border-tlali-jade-dark"
                    disabled={!greenhouseOptions.length}
                    onChange={(event) => setMonitoredGreenhouse(event.target.value)}
                    value={monitoredGreenhouse}
                  >
                    {greenhouseOptions.length ? greenhouseOptions.map((greenhouse) => (
                      <option key={greenhouse.value} value={greenhouse.value}>{greenhouse.label}</option>
                    )) : <option value="">Sin invernaderos</option>}
                  </select>
                </label>
                <p className="mt-3 text-xs font-semibold text-tlali-muted">{cultivationAssignment?.area ?? 'Zona de cultivo'}</p>
              </div>
            </div>
            {activeStage && (
              <div className="mt-5 grid gap-3 rounded-2xl border border-[#e5ded0] bg-[#fffaf1] p-4 text-sm font-semibold text-[#687169] sm:grid-cols-3">
                <p>{activeStage.from} → {activeStage.to}</p>
                <p>Inicio del cultivo: {formatDate(activeCrop?.cropStartedAt)}</p>
                <p>Inicio efectivo: {formatDate(activeStageTiming.effectiveStartedAt)}</p>
                {activeStageTiming.isAutoAdvanced && (
                  <p className="sm:col-span-3 text-[#9b6b1d]">Etapa avanzada automáticamente desde {activeStageTiming.configuredStage.name}.</p>
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

        {message && <div className={`mt-4 rounded-xl border px-4 py-3 text-sm ${status === 'offline' ? 'border-red-200 bg-red-50 text-red-800' : 'border-tlali-line bg-tlali-paper text-tlali-muted'}`}>{message}</div>}

        <section className="mt-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow">Gráficas</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Comportamiento del cultivo</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {HISTORY_PERIODS.map((period) => (
                <button
                  className={`rounded-full border px-4 py-2 text-xs font-black transition ${historyPeriod === period.key ? 'border-tlali-jade-dark bg-[#d8eee7] text-tlali-jade-dark' : 'border-[#d8cfbf] bg-[#fcf8f0] text-[#687169]'}`}
                  key={period.key}
                  onClick={() => setHistoryPeriod(period.key)}
                  type="button"
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_340px]">
            <div className="grid gap-4">
              <MoistureRangeChart periodKey={historyPeriod} periodLabel={periodLabel} range={activeParameters?.soilMoisturePercent} readings={dashboardCropReadings} />
              <div className="grid gap-4 lg:grid-cols-2">
                <LineChartPanel
                  emptyText="Cuando lleguen lecturas de temperatura se dibujará su evolución."
                  periodKey={historyPeriod}
                  periodLabel={periodLabel}
                  readings={dashboardCropReadings}
                  series={[{ color: '#c75f2a', key: 'temperatureCelsius', label: 'Temperatura ambiente' }]}
                  title="Temperatura ambiente"
                  unit="°C"
                />
                <LineChartPanel
                  emptyText="Cuando lleguen lecturas de humedad ambiental se dibujará su evolución."
                  periodKey={historyPeriod}
                  periodLabel={periodLabel}
                  readings={dashboardCropReadings}
                  series={[{ color: '#0b6680', key: 'humidityPercent', label: 'Humedad ambiente' }]}
                  title="Humedad ambiente"
                  unit="%"
                  yMax={100}
                  yMin={0}
                />
              </div>
              <WaterTrendChart ghostPump={ghostPump} ghostWater={ghostWater} periodKey={historyPeriod} periodLabel={periodLabel} readings={dashboardActuatorReadings} />
            </div>
            <AlertsSidePanel
              mainPumpRelayOn={mainPumpRelayOn}
              alerts={criticalAlerts}
              relayTwoOn={relayTwoOn}
            />
          </div>
        </section>
      </div>
    </div>
  )
}

function MetricTile({ label, value }) {
  return (
    <div className="rounded-2xl border border-[#c8e1d7] bg-[#dff3eb] px-4 py-3">
      <p className="text-[11px] font-black uppercase text-[#4d6259]">{label}</p>
      <p className="mt-1 text-lg font-black leading-tight text-tlali-ink">{value}</p>
    </div>
  )
}

function AlertsSidePanel({ alerts, mainPumpRelayOn, relayTwoOn }) {
  return (
    <aside className="rounded-2xl border border-[#d8cfbf] bg-[#fffaf1] px-4 py-4 xl:sticky xl:top-28 xl:self-start">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Alertas</p>
          <h3 className="mt-1 text-lg font-black tracking-tight">Panel derecho</h3>
        </div>
        <span className={`module-badge ${alerts.length ? 'amber' : 'green'}`}>{alerts.length}</span>
      </div>

      <div className="mt-4 grid gap-2">
        {alerts.length ? alerts.slice(0, 8).map((alert) => (
          <div className="rounded-xl border border-[#ead5a8] bg-[#fff5dc] px-3 py-3" key={alert.key}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-black leading-tight">{alert.label}</p>
                <p className="mt-1 text-xs font-semibold text-[#7d735d]">{alert.statusLabel}</p>
              </div>
              <strong className="shrink-0 text-xs">{alert.formattedValue}</strong>
            </div>
          </div>
        )) : (
          <div className="rounded-xl border border-[#cce0cf] bg-[#edf7ee] p-4">
            <p className="font-black text-[#245c32]">Sin alertas activas</p>
            <p className="mt-1 text-sm text-[#5d7465]">El cultivo está dentro de los rangos configurados.</p>
          </div>
        )}
      </div>

      <div className="mt-4 rounded-xl border border-[#d8cfbf] bg-[#fcf8f0] p-3">
        <p className="text-xs font-black uppercase text-tlali-muted">Riego</p>
        <div className="mt-3 grid gap-2">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-[#e1dbcd] bg-white px-3 py-3">
            <div>
              <p className="text-sm font-black">Relevador bomba principal</p>
              <p className="mt-1 text-xs text-tlali-muted">Relevador 1</p>
            </div>
            <strong className={mainPumpRelayOn ? 'text-[#0f7a49]' : 'text-[#687169]'}>{mainPumpRelayOn ? 'Activo' : 'En espera'}</strong>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-[#e1dbcd] bg-white px-3 py-3">
            <div>
              <p className="text-sm font-black">Relevador 2</p>
              <p className="mt-1 text-xs text-tlali-muted">Sin cambios</p>
            </div>
            <strong className={relayTwoOn ? 'text-[#0f7a49]' : 'text-[#687169]'}>{relayTwoOn ? 'Activo' : 'En espera'}</strong>
          </div>
        </div>
      </div>
    </aside>
  )
}

function MoistureRangeChart({ periodKey, periodLabel, range, readings }) {
  const min = toNumber(range?.min) ?? 0
  const max = toNumber(range?.max) ?? 100
  const chart = buildChart(readings, [{ color: '#0f7a49', key: 'soilMoisturePercent', label: 'Humedad del suelo' }], { periodKey, yMax: 100, yMin: 0 })

  return (
    <section className="rounded-2xl border border-[#d8cfbf] bg-[#fffaf1] px-4 py-4 sm:px-5">
      <ChartHeading count={chart.pointCount} helper={`Rango objetivo ${formatRangeNumber(min)}-${formatRangeNumber(max)}%`} periodLabel={periodLabel} title="Humedad del suelo contra rango" />
      {chart.hasData ? (
        <>
          <svg aria-label="Humedad del suelo contra rango" className="mt-4 h-[320px] w-full" preserveAspectRatio="none" viewBox="0 0 760 320">
            <ChartGrid chart={chart} unit="%" />
            <rect fill="#cdeee2" opacity="0.75" x="54" width="688" y={chart.yForValue(max)} height={Math.max(1, chart.yForValue(min) - chart.yForValue(max))} />
            <line stroke="#0f7a49" strokeDasharray="6 6" strokeWidth="1.6" x1="54" x2="742" y1={chart.yForValue(min)} y2={chart.yForValue(min)} />
            <line stroke="#0f7a49" strokeDasharray="6 6" strokeWidth="1.6" x1="54" x2="742" y1={chart.yForValue(max)} y2={chart.yForValue(max)} />
            <ChartSeries chart={chart} />
          </svg>
          <ChartLegend items={[{ color: '#0f7a49', label: 'Humedad real' }, { color: '#b6ddcd', label: 'Rango configurado' }]} />
        </>
      ) : <EmptyChart text="Cuando lleguen lecturas de humedad se dibujará la curva contra el rango activo de la etapa." />}
    </section>
  )
}

function LineChartPanel({ emptyText, periodKey, periodLabel, readings, series, title, unit, yMax, yMin }) {
  const chart = buildChart(readings, series, { periodKey, yMax, yMin })
  return (
    <section className="rounded-2xl border border-[#d8cfbf] bg-[#fffaf1] px-4 py-4 sm:px-5">
      <ChartHeading count={chart.pointCount} periodLabel={periodLabel} title={title} />
      {chart.hasData ? (
        <>
          <svg aria-label={title} className="mt-4 h-[260px] w-full" preserveAspectRatio="none" viewBox="0 0 760 320">
            <ChartGrid chart={chart} unit={unit} />
            <ChartSeries chart={chart} />
          </svg>
          <ChartLegend items={series} />
        </>
      ) : <EmptyChart text={emptyText} />}
    </section>
  )
}

function WaterTrendChart({ ghostPump, ghostWater, periodKey, periodLabel, readings }) {
  const chart = buildChart(readings, [
    { color: '#0b6680', key: 'tank1DistanceCm', label: 'Cisterna 1 real' },
    { color: '#6c4ab6', key: 'tank2DistanceCm', label: 'Cisterna 2 real' },
  ], { periodKey, yMax: 120, yMin: 0 })
  const simulated = ghostWater?.simulatedTank1DistanceCm

  return (
    <section className="rounded-2xl border border-[#d8cfbf] bg-[#fffaf1] px-4 py-4 sm:px-5">
      <ChartHeading
        count={chart.pointCount}
        helper={ghostPump?.active ? 'Bomba principal activa en sistema' : 'Lectura real y estimación del sistema'}
        periodLabel={periodLabel}
        title="Agua disponible y riego"
      />
      {chart.hasData ? (
        <>
          <svg aria-label="Agua disponible y riego" className="mt-4 h-[300px] w-full" preserveAspectRatio="none" viewBox="0 0 760 320">
            <ChartGrid chart={chart} unit="cm" />
            {toNumber(simulated) !== null && (
              <line stroke="#c7922b" strokeDasharray="8 7" strokeWidth="2" x1="54" x2="742" y1={chart.yForValue(simulated)} y2={chart.yForValue(simulated)} />
            )}
            <ChartSeries chart={chart} />
          </svg>
          <ChartLegend items={[
            { color: '#0b6680', label: 'Cisterna 1 real' },
            { color: '#6c4ab6', label: 'Cisterna 2 real' },
            { color: '#c7922b', label: 'Cisterna 1 estimada' },
          ]} />
          <p className="mt-2 text-xs font-semibold text-tlali-muted">
            Estimada: {formatMetric(simulated, ' cm')} · ajuste pendiente: {formatMetric(ghostWater?.pendingDropCm, ' cm')}
          </p>
        </>
      ) : <EmptyChart text="Cuando lleguen lecturas de cisterna se dibujará el consumo de agua." />}
    </section>
  )
}

function ChartHeading({ count = 0, helper, periodLabel, title }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="eyebrow">Periodo: {periodLabel}</p>
        <h3 className="mt-1 text-lg font-black tracking-tight">{title}</h3>
        <p className="mt-1 text-xs font-semibold text-tlali-muted">{count} registros recuperados</p>
      </div>
      {helper && <span className="module-badge green">{helper}</span>}
    </div>
  )
}

function ChartGrid({ chart, unit }) {
  return (
    <g>
      {chart.yTicks.map((tick) => (
        <g key={tick.value}>
          <line stroke="#e7e2d8" strokeWidth="1" x1="54" x2="742" y1={tick.y} y2={tick.y} />
          <text fill="#607069" fontSize="11" fontWeight="700" textAnchor="end" x="45" y={tick.y + 4}>{formatRangeNumber(tick.value)}</text>
        </g>
      ))}
      {chart.xTicks.map((tick) => (
        <g key={tick.label}>
          <line stroke="#f0ebe2" strokeWidth="1" x1={tick.x} x2={tick.x} y1="34" y2="252" />
          <text fill="#607069" fontSize="11" fontWeight="700" textAnchor="middle" x={tick.x} y="286">{tick.label}</text>
        </g>
      ))}
      <line stroke="#d8d0c2" strokeWidth="1.4" x1="54" x2="742" y1="252" y2="252" />
      <text fill="#607069" fontSize="11" fontWeight="800" textAnchor="middle" transform="rotate(-90 16 143)" x="16" y="143">{unit}</text>
    </g>
  )
}

function ChartSeries({ chart }) {
  return (
    <g>
      {chart.series.map((line) => (
        <g key={line.label}>
          <polyline fill="none" points={line.points} stroke={line.color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.8" />
          {line.markers.map((marker) => (
            <circle cx={marker.x} cy={marker.y} fill="#fffdf8" key={`${line.label}-${marker.x}-${marker.y}`} r="3.5" stroke={line.color} strokeWidth="1.8">
              <title>{`${marker.time} · ${line.label}: ${formatRangeNumber(marker.value)}`}</title>
            </circle>
          ))}
        </g>
      ))}
    </g>
  )
}

function ChartLegend({ items }) {
  return (
    <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
      {items.map((item) => (
        <span className="inline-flex items-center gap-2 text-xs font-semibold text-[#56635c]" key={item.label}>
          <span className="h-3 w-3 rounded-full border-2 bg-white" style={{ borderColor: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  )
}

function EmptyChart({ text }) {
  return <div className="mt-4 rounded-xl border border-[#e1dbcd] bg-[#fcf8f0] p-4 text-sm text-tlali-muted">{text}</div>
}

function buildChart(readings, series, options = {}) {
  const orderedReadings = readings
    .filter((reading) => reading?.receivedAt)
    .sort((left, right) => new Date(left.receivedAt).getTime() - new Date(right.receivedAt).getTime())
  const values = series.flatMap((item) => orderedReadings.map((reading) => toNumber(reading[item.key])).filter((value) => value !== null))
  if (!values.length) return { hasData: false, pointCount: 0, series: [], xTicks: [], yForValue: () => 252, yTicks: [] }

  const left = 54
  const right = 742
  const top = 34
  const bottom = 252
  const times = orderedReadings.map((reading) => new Date(reading.receivedAt).getTime()).filter((time) => Number.isFinite(time))
  const firstTime = times[0] ?? Date.now()
  const lastTime = times[times.length - 1] ?? firstTime
  const rawTimeSpan = Math.max(15 * 60 * 1000, lastTime - firstTime)
  const minTime = firstTime - rawTimeSpan * 0.05
  const maxTime = lastTime + rawTimeSpan * 0.05
  const actualMin = Math.min(...values)
  const actualMax = Math.max(...values)
  const rangePadding = actualMin === actualMax ? Math.max(1, Math.abs(actualMin) * 0.2) : (actualMax - actualMin) * 0.12
  const yMin = options.yMin ?? Math.max(0, actualMin - rangePadding)
  const yMax = options.yMax ?? actualMax + rangePadding
  const safeYMax = yMax === yMin ? yMax + 1 : yMax
  const ySpan = safeYMax - yMin
  const timeSpan = maxTime - minTime || 1
  const xForTime = (time) => left + ((time - minTime) / timeSpan) * (right - left)
  const yForValue = (value) => bottom - ((value - yMin) / ySpan) * (bottom - top)
  const yTicks = Array.from({ length: 5 }, (_, index) => {
    const value = yMin + (ySpan / 4) * index
    return { value, y: yForValue(value) }
  }).reverse()
  const xTicks = Array.from({ length: 5 }, (_, index) => {
    const time = minTime + (timeSpan / 4) * index
    return {
      label: formatChartTick(new Date(time), options.periodKey),
      x: xForTime(time),
    }
  })
  const chartSeries = series.map((item) => {
    const points = orderedReadings
      .map((reading) => {
        const value = toNumber(reading[item.key])
        const time = new Date(reading.receivedAt).getTime()
        if (value === null || !Number.isFinite(time)) return null
        return {
          time: formatChartPointTime(new Date(reading.receivedAt), options.periodKey),
          value,
          x: xForTime(time),
          y: yForValue(value),
        }
      })
      .filter(Boolean)
    const sampled = samplePoints(points, 280)
    return {
      color: item.color,
      label: item.label,
      markers: points.length <= 14 ? points : [],
      points: sampled.map((point) => `${point.x},${point.y}`).join(' '),
    }
  }).filter((item) => item.points)

  return { hasData: chartSeries.length > 0, pointCount: values.length, series: chartSeries, xTicks, yForValue, yTicks }
}

function formatChartTick(date, periodKey) {
  if (periodKey === 'day') return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  if (periodKey === 'week') return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
  return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' })
}

function formatChartPointTime(date, periodKey) {
  if (periodKey === 'day') return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  return `${date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })} · ${date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`
}

function samplePoints(points, maxPoints) {
  if (points.length <= maxPoints) return points
  const step = Math.ceil(points.length / maxPoints)
  return points.filter((_, index) => index % step === 0 || index === points.length - 1)
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
