import LogoMark from '../brand/LogoMark.jsx'
import TextField from '../forms/TextField.jsx'
import { formatMetric, toNumber } from '../../lib/sensors.js'

const VIEW_LABELS = {
  suelo: 'Vista: suelo',
  luz: 'Vista: luminosidad',
  actuadores: 'Vista: actuadores',
}

const VIEW_ORDER = ['suelo', 'luz', 'actuadores']

const LABELS = {
  activity: 'Actividad',
  actuatorTitle: 'Riego y cisternas',
  airHumidity: 'Humedad aire',
  airTemp: 'Temperatura aire',
  alerts: 'Alertas',
  alertsTitle: 'Seguimiento operativo',
  captureTitle: 'Registrar lectura manual',
  conductivity: 'Conductividad',
  crop: 'Cultivo',
  cropSensors: 'Sensores de cultivo',
  cultivationTitle: 'Monitoreo del cultivo',
  dashboard: 'Dashboard',
  light: 'Luminosidad',
  noAlerts: 'Sin alertas activas',
  noReadings: 'Aún no hay registros de hoy.',
  node: 'Nodo',
  ph: 'pH del sustrato',
  recentReadings: 'Registros del día',
  relaysOne: 'Relevador 1',
  relaysTwo: 'Relevador 2',
  report: 'Reporte diario',
  site: 'Zona',
  soilMoisture: 'Humedad capacitiva',
  tankOne: 'Cisterna 1',
  tankTwo: 'Cisterna 2',
}

export function DashboardNav({ auth, downloadReport, hasReadings, navigate, route, showReport = true }) {
  const isAdmin = auth.user?.role === 'SUPER_ADMIN'
  const navItems = [
    { label: LABELS.dashboard, path: '/dashboard' },
    { label: LABELS.crop, path: '/cultivo' },
    { label: 'Actuadores', path: '/actuadores' },
    { label: 'Agente IA', path: '/agente' },
    ...(isAdmin ? [{ label: 'Configuración', path: '/configuracion' }] : []),
  ]

  return (
    <header className="sticky top-3 z-30 px-4">
      <nav className="mx-auto flex min-h-[86px] max-w-[1320px] items-center justify-between gap-5 rounded-full border border-tlali-line bg-tlali-paper/90 px-6 py-4 shadow-lg shadow-[#142d25]/10 backdrop-blur">
        <button className="flex min-w-0 items-center gap-3 text-left" onClick={() => navigate('/dashboard')} type="button">
          <LogoMark />
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-bold leading-tight">Tlali Tlapixqui</p>
            <p className="hidden truncate text-[11px] text-tlali-muted sm:block">Cuidado inteligente del cultivo</p>
          </div>
        </button>
        <div className="hidden items-center justify-center gap-1 md:flex">
          {navItems.map((item) => (
            <button className={`nav-tab ${route === item.path ? 'active' : ''}`} key={item.path} onClick={() => navigate(item.path)} type="button">
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button className="secondary-button hidden sm:inline-flex" onClick={auth.logout} type="button">Salir</button>
          {showReport && <button className="primary-button" disabled={!hasReadings} onClick={downloadReport} type="button">{LABELS.report}</button>}
        </div>
      </nav>
    </header>
  )
}

export function StatusPill({ online, status }) {
  const label = status === 'checking' ? 'Sincronizando' : online ? 'Online' : 'Offline'
  return <span className={`status-pill ${online ? 'online' : status === 'checking' ? 'checking' : 'offline'}`}>{label}</span>
}

export function SignalQuality({ node }) {
  const rssi = toNumber(node?.radio?.rssiDbm)
  const snr = toNumber(node?.radio?.snrDb)
  const quality = getSignalQuality(rssi)
  return (
    <div className="mt-4 rounded-xl border border-[#e1dbcd] bg-[#fcf8f0] p-3 text-xs">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-tlali-ink">Señal</span>
        <span className={`rounded-full px-2 py-1 font-bold ${quality.className}`}>{quality.label}</span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 text-tlali-muted">
        <p>RSSI: <strong className="text-tlali-ink">{rssi === null ? '-' : `${rssi} dBm`}</strong></p>
        <p>SNR: <strong className="text-tlali-ink">{snr === null ? '-' : `${snr} dB`}</strong></p>
      </div>
      <p className="mt-2 text-[11px] text-tlali-muted">Mientras el RSSI esté más cerca de 0, la señal es mejor.</p>
    </div>
  )
}

export function DashboardStat({ helper, label, value }) {
  return (
    <article className="paper-card px-4 py-4 sm:px-5">
      <p className="text-xs font-semibold text-[#626c64]">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
      <p className="mt-2 text-xs text-[#8a908a]">{helper}</p>
    </article>
  )
}

export function ViewToggleButton({ onToggle, view }) {
  return (
    <button className="secondary-button" onClick={onToggle} type="button">
      {VIEW_LABELS[view] ?? 'Cambiar vista'}
    </button>
  )
}

function SectionHeading({ actions, badge, badgeTone = 'green', eyebrow, title }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="mt-1 text-lg font-bold">{title}</h2>
      </div>
      <div className="flex items-center gap-2">
        {actions}
        {badge && <span className={`module-badge ${badgeTone}`}>{badge}</span>}
      </div>
    </div>
  )
}

function DataRow({ label, muted = false, value }) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-3 rounded-lg border border-[#e1dbcd] bg-[#fcf8f0] px-3 py-2">
      <dt className="text-xs text-[#7c827c]">{label}</dt>
      <dd className={`text-right text-sm font-bold ${muted ? 'text-[#9a9e99]' : ''}`}>{value}</dd>
    </div>
  )
}

export function CultivationCard({ actuatorNode, cropParameters, firebaseNode, fullWidth = false, ghostPump, ghostWater, latest, onToggleView, readings, showMoistureTrend = true, view = 'suelo' }) {
  const live = firebaseNode?.data ?? {}
  return (
    <article className="paper-card p-4 sm:p-5" id="cultivo">
      <SectionHeading actions={onToggleView ? <ViewToggleButton onToggle={onToggleView} view={view} /> : null} eyebrow={LABELS.cropSensors} title={getViewTitle(view)} />
      {view === 'actuadores' ? <ActuatorDetails ghostPump={ghostPump} ghostWater={ghostWater} node={actuatorNode} /> : null}
      {view === 'luz' ? <LightDetails latest={latest} live={live} readings={readings} /> : null}
      {view === 'suelo' ? (fullWidth ? <SoilDetailsWide cropParameters={cropParameters} latest={latest} live={live} /> : <SoilDetails latest={latest} live={live} readings={readings} />) : null}
    </article>
  )
}

function SoilDetails({ fullWidth = false, latest, live, readings, showMoistureTrend = true }) {
  const conductivity = toNumber(live.conductivityUsCm)
  const tds = conductivity === null ? null : conductivity * 0.5

  return (
    <>
      <div className={`mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 ${fullWidth ? 'xl:grid-cols-4' : 'sm:grid-cols-3'}`}>
        <CultivationMetric featured label={LABELS.soilMoisture} helper={latest?.siteId ?? '-'} value={formatMetric(latest?.soilMoisturePercent, '%')} />
        <CultivationMetric label={LABELS.ph} helper="pH" value={formatMetric(live.ph, '')} />
        <CultivationMetric label={LABELS.airTemp} helper="Ambiente" value={formatMetric(live.airTemperatureC, ' °C')} />
      </div>
      <dl className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <DataRow label={LABELS.airHumidity} value={formatMetric(live.airHumidityPct, '%')} />
        <DataRow label={LABELS.conductivity} value={formatMetric(live.conductivityUsCm, ' µS/cm')} />
        <DataRow
          label="Nitrógeno · Fósforo · Potasio"
          value={`${compactNumber(live.nitrogenMgKg)} · ${compactNumber(live.phosphorusMgKg)} · ${compactNumber(live.potassiumMgKg)} mg/kg`}
        />
        <DataRow label={LABELS.node} value={latest?.deviceId ?? '-'} />
      </dl>
      <MoistureChart readings={readings} />
    </>
  )
}

function SoilDetailsWide({ cropParameters, latest, live }) {
  const substrateHumidity = firstNumber(live, 'substrateHumidityPct', 'substrateHumidityPercent', 'soilHumidityPct', 'soilHumidityPercent', 'soilMoisturePct')
  const conductivity = toNumber(live.conductivityUsCm)
  const tds = conductivity === null ? null : conductivity * 0.5
  const groups = [
    {
      cards: [
        { key: 'soilMoisturePercent', label: LABELS.soilMoisture, helper: latest?.siteId ?? 'Zona de cultivo', value: latest?.soilMoisturePercent, suffix: '%' },
        { key: 'substrateHumidityPercent', label: 'Humedad del sustrato', helper: 'Sensor capacitivo', value: substrateHumidity, suffix: '%' },
        { key: 'soilTemperatureC', label: 'Temperatura del sustrato', helper: 'Sustrato', value: live.soilTemperatureC, suffix: ' °C' },
        { key: 'ph', label: LABELS.ph, helper: 'Sustrato', value: live.ph, suffix: '' },
      ],
      title: 'Sustrato',
    },
    {
      cards: [
        { key: 'temperatureCelsius', label: LABELS.airTemp, helper: 'Ambiente', value: live.airTemperatureC, suffix: ' °C' },
        { key: 'humidityPercent', label: LABELS.airHumidity, helper: 'Ambiente', value: live.airHumidityPct, suffix: '%' },
        { key: 'lightLux', label: LABELS.light, helper: 'Luz ambiental', value: latest?.lightLux, suffix: ' lux', compact: true },
      ],
      title: 'Ambiente',
    },
    {
      cards: [
        { key: 'conductivityUsCm', label: LABELS.conductivity, helper: 'Solución nutritiva', value: conductivity, suffix: ' µS/cm' },
        { key: 'tdsPpm', label: 'TDS estimado', helper: 'Solución nutritiva', value: tds, suffix: ' ppm' },
        { key: 'nitrogenMgKg', label: 'Nitrógeno', helper: 'N · mg/kg', value: live.nitrogenMgKg, suffix: ' mg/kg' },
        { key: 'phosphorusMgKg', label: 'Fósforo', helper: 'P · mg/kg', value: live.phosphorusMgKg, suffix: ' mg/kg' },
        { key: 'potassiumMgKg', label: 'Potasio', helper: 'K · mg/kg', value: live.potassiumMgKg, suffix: ' mg/kg' },
      ],
      title: 'Nutrición',
    },
  ]

  return (
    <div className="mt-4 grid gap-7">
      {groups.map((group) => (
        <section key={group.title}>
          <div className="flex items-center gap-3">
            <span className="h-7 w-1 rounded-full bg-tlali-jade-dark" />
            <h3 className="text-xl font-black tracking-tight text-tlali-ink">{group.title}</h3>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {group.cards.map((card) => (
              <SensorStatusCard
                helper={card.helper}
                key={card.key}
                label={card.label}
                range={cropParameters?.[card.key]}
                rangeUnit={card.suffix}
                rawValue={card.value}
                state={getConfiguredState(card.value, cropParameters?.[card.key])}
                value={card.compact ? `${compactNumber(card.value)}${card.suffix}` : formatMetric(card.value, card.suffix)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function SensorStatusCard({ helper, label, range, rangeUnit = '', rawValue, state, value }) {
  const isAlert = state === 'warning' || state === 'danger'
  const isEmpty = state === 'empty'
  const comparison = getRangeComparison(rawValue, range, rangeUnit)
  const status = {
    danger: {
      bar: 'bg-[#b9694f]',
      border: 'border-[#e8c9bc]',
      dot: 'bg-[#b9694f]',
      icon: '▲',
      iconClass: 'text-[#b9694f]',
      label: 'Revisar rango',
      surface: 'bg-[#fff7f2]',
      text: 'text-[#a6533b]',
    },
    empty: {
      bar: 'bg-[#d6a23a]',
      border: 'border-[#ead9ad]',
      dot: 'bg-[#d6a23a]',
      icon: '▲',
      iconClass: 'text-[#b98922]',
      label: 'Sin lectura',
      surface: 'bg-[#fffaf0]',
      text: 'text-[#a3731a]',
    },
    healthy: {
      bar: 'bg-[#0f7a49]',
      border: 'border-[#b9dcc8]',
      dot: 'bg-[#0f7a49]',
      icon: '',
      iconClass: '',
      label: 'Dentro del rango',
      surface: 'bg-white',
      text: 'text-[#0f7a49]',
    },
    warning: {
      bar: 'bg-[#c7922b]',
      border: 'border-[#ecd8a8]',
      dot: 'bg-[#c7922b]',
      icon: '▲',
      iconClass: 'text-[#c7922b]',
      label: 'Revisar rango',
      surface: 'bg-[#fffaf0]',
      text: 'text-[#a87518]',
    },
  }[state] ?? {
    bar: 'bg-[#0f7a49]',
    border: 'border-[#b9dcc8]',
    dot: 'bg-[#0f7a49]',
    icon: '',
    iconClass: '',
    label: 'Dentro del rango',
    surface: 'bg-white',
    text: 'text-[#0f7a49]',
  }

  return (
    <div className={`relative flex min-h-[184px] overflow-hidden rounded-2xl border p-5 shadow-sm ${status.border} ${status.surface}`}>
      {(isAlert || isEmpty) && (
        <span className={`absolute right-4 top-4 text-xl font-black leading-none ${status.iconClass}`} title={isEmpty ? 'Este sensor no tiene lectura disponible' : 'Este sensor está fuera del rango configurado'}>
          {status.icon}
        </span>
      )}
      <div className="relative z-10 flex min-w-0 flex-col justify-between">
        <div>
          <p className="pr-8 text-sm font-black text-[#33544a]">{label}</p>
          <p className={`mt-4 text-3xl font-black tracking-tight ${status.text}`}>{value}</p>
          <div className="mt-3 rounded-xl border border-[#e5ded0] bg-white/75 px-3 py-2">
            <div className="flex items-center justify-between gap-2 text-[11px] font-bold">
              <span className="text-[#687169]">Rango objetivo</span>
              <span className="text-[#344039]">{comparison.rangeLabel}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e9e3d7]">
              <span className={`block h-full rounded-full ${status.bar}`} style={{ width: `${comparison.percent}%` }} />
            </div>
            <p className={`mt-2 text-xs font-black ${status.text}`}>{comparison.percentLabel}</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs font-black">
          <span className={`h-2 w-2 rounded-full ${status.dot}`} />
          <span className={status.text}>{status.label}</span>
          <span className="font-semibold text-tlali-muted">· {helper}</span>
        </div>
      </div>
    </div>
  )
}

function LightDetails({ latest, live, readings }) {
  const ph = toNumber(live.ph)
  const conductivity = toNumber(live.conductivityUsCm)
  const tds = conductivity === null ? null : conductivity * 0.5
  return (
    <>
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <CultivationMetric featured label="Luminosidad actual" helper="lux" value={`${compactNumber(latest?.lightLux)} lux`} />
        <CultivationMetric label="pH actual" helper="Sustrato" value={formatMetric(ph, '')} />
        <CultivationMetric label="TDS estimado" helper="ppm" value={formatMetric(tds, ' ppm')} />
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <DataRow label="Conductividad" value={formatMetric(conductivity, ' µS/cm')} />
        <DataRow label="Temperatura ambiente" value={formatMetric(live.airTemperatureC, ' °C')} />
        <DataRow label="Nodo de lectura" value={latest?.deviceId ?? '-'} />
      </div>
      <div className="mt-3 rounded-xl border border-[#e1dbcd] bg-[#fcf8f0] p-4">
        <p className="text-[11px] font-semibold text-[#687169]">Lectura de solución nutritiva</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <DataRow label="pH" value={formatMetric(ph, '')} />
          <DataRow label="TDS estimado" value={formatMetric(tds, ' ppm')} />
          <DataRow label="Conductividad eléctrica" value={formatMetric(conductivity, ' µS/cm')} />
          <DataRow label="Referencia" value="TDS ≈ EC × 0.5" />
        </div>
      </div>
    </>
  )

  const values = readings.slice(0, 6).map((reading) => toNumber(reading.lightLux)).filter((value) => value !== null)
  const max = Math.max(...values, 1)
  return (
    <>
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <CultivationMetric featured label="Luminosidad actual" helper="lux" value={`${compactNumber(latest?.lightLux)} lux`} />
        <CultivationMetric label="Temperatura por luz" helper="Ambiente" value={formatMetric(live.airTemperatureC, ' °C')} />
        <CultivationMetric label="Nodo de lectura" helper="Sensor" value={latest?.deviceId ?? '-'} />
      </div>
      <div className="mt-3 rounded-xl border border-[#e1dbcd] bg-[#fcf8f0] p-4">
        <p className="text-[11px] font-semibold text-[#687169]">Últimas lecturas de luminosidad</p>
        <div className="mt-3 grid gap-2">
          {values.length ? values.map((value, index) => (
            <div className="grid grid-cols-[44px_1fr_70px] items-center gap-2 text-xs" key={`${value}-${index}`}>
              <span>{index + 1}</span>
              <span className="h-3 overflow-hidden rounded-full bg-[#eadfcb]"><span className="block h-full rounded-full bg-[#d3a536]" style={{ width: `${Math.max(6, (value / max) * 100)}%` }} /></span>
              <strong className="text-right">{compactNumber(value)} lux</strong>
            </div>
          )) : <p className="text-sm text-tlali-muted">Aún no hay datos de luminosidad.</p>}
        </div>
      </div>
    </>
  )
}

function ActuatorDetails({ fullWidth = false, ghostPump, ghostWater, node }) {
  const data = node?.data ?? {}
  const signal = node?.radio ?? {}
  const tankOne = firstNumber(data, 'tank1DistanceCm', 'tankOneDistanceCm', 'cisterna1Cm')
  const tankTwo = firstNumber(data, 'tank2DistanceCm', 'tankTwoDistanceCm', 'cisterna2Cm')
  const ph = firstNumber(data, 'ph', 'waterPh')
  const conductivity = firstNumber(data, 'conductivityUsCm', 'conductivity', 'ecUsCm')
  const tds = firstNumber(data, 'tdsPpm', 'tds', 'tdsValue') ?? (conductivity === null ? null : conductivity * 0.5)
  const waterTemperature = firstNumber(data, 'waterTemperatureC', 'temperatureCelsius', 'tempC')
  const groups = [
    {
      cards: [
        { helper: 'Sistema de riego', label: LABELS.relaysOne, state: node ? (data.relay1On ? 'warning' : 'healthy') : 'empty', value: node ? (data.relay1On ? 'Encendido' : 'Apagado') : '--' },
        { helper: 'Sistema de riego', label: LABELS.relaysTwo, state: node ? (data.relay2On ? 'warning' : 'healthy') : 'empty', value: node ? (data.relay2On ? 'Encendido' : 'Apagado') : '--' },
        { helper: 'Simulación por humedad del cultivo', label: 'Bomba fantasma', state: ghostPump?.state ?? 'empty', value: ghostPump?.active ? 'Activa en sistema' : (ghostPump?.statusLabel ?? '--') },
      ],
      title: 'Riego',
    },
    {
      cards: [
        { helper: 'Distancia al agua', label: LABELS.tankOne, range: { min: 0, max: 120 }, rangeUnit: ' cm', rawValue: tankOne, state: getActuatorRangeState(tankOne, 0, 120), value: formatMetric(tankOne, ' cm') },
        { helper: 'Distancia al agua', label: LABELS.tankTwo, range: { min: 0, max: 120 }, rangeUnit: ' cm', rawValue: tankTwo, state: getActuatorRangeState(tankTwo, 0, 120), value: formatMetric(tankTwo, ' cm') },
        { helper: 'Con riego fantasma', label: 'Cisterna simulada', range: { min: 0, max: 120 }, rangeUnit: ' cm', rawValue: ghostWater?.simulatedTank1DistanceCm, state: getActuatorRangeState(ghostWater?.simulatedTank1DistanceCm, 0, 120), value: formatMetric(ghostWater?.simulatedTank1DistanceCm, ' cm') },
      ],
      title: 'Cisternas',
    },
    {
      cards: [
        { helper: 'Agua', label: 'pH del agua', range: { min: 5.5, max: 7.5 }, rangeUnit: ' pH', rawValue: ph, state: getActuatorRangeState(ph, 5.5, 7.5), value: formatMetric(ph, ' pH') },
        { helper: 'Solución nutritiva', label: 'TDS', range: { min: 0, max: 1200 }, rangeUnit: ' ppm', rawValue: tds, state: getActuatorRangeState(tds, 0, 1200), value: formatMetric(tds, ' ppm') },
        { helper: 'Solución nutritiva', label: 'Conductividad', range: { min: 0, max: 2400 }, rangeUnit: ' µS/cm', rawValue: conductivity, state: getActuatorRangeState(conductivity, 0, 2400), value: formatMetric(conductivity, ' µS/cm') },
        { helper: 'Agua', label: 'Temperatura del agua', range: { min: 10, max: 35 }, rangeUnit: ' °C', rawValue: waterTemperature, state: getActuatorRangeState(waterTemperature, 10, 35), value: formatMetric(waterTemperature, ' °C') },
      ],
      title: 'Agua y nutrientes',
    },
  ]

  return (
    <>
      <div className="mt-4 grid gap-7">
        {groups.map((group) => (
          <section key={group.title}>
            <div className="flex items-center gap-3">
              <span className="h-7 w-1 rounded-full bg-tlali-jade-dark" />
              <h3 className="text-xl font-black tracking-tight text-tlali-ink">{group.title}</h3>
            </div>
            <div className={`mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 ${fullWidth ? 'lg:grid-cols-3 xl:grid-cols-4' : ''}`}>
              {group.cards.map((card) => (
                <SensorStatusCard
                  helper={card.helper}
                  key={card.label}
                  label={card.label}
                  range={card.range}
                  rangeUnit={card.rangeUnit}
                  rawValue={card.rawValue}
                  state={card.state}
                  value={card.value}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
      {ghostPump && (
        <div className={`mt-4 rounded-xl border px-4 py-3 text-sm ${ghostPump.active ? 'border-[#ead5a8] bg-[#fff5dc] text-[#75501d]' : ghostPump.state === 'danger' ? 'border-[#e8c9bc] bg-[#fff7f2] text-[#8d3f2b]' : 'border-[#cce0cf] bg-[#edf7ee] text-[#245c32]'}`}>
          <p className="font-bold">Programación fantasma de bomba</p>
          <p className="mt-1">{ghostPump.reason}</p>
          <p className="mt-1">{ghostPump.recommendation}</p>
          <p className="mt-2 text-xs">
            Nodo: {ghostPump.node ?? '-'} · {ghostPump.greenhouse} · {ghostPump.area}
          </p>
        </div>
      )}
      {ghostWater && (
        <div className="mt-4 rounded-xl border border-[#d9d5c9] bg-[#fcf8f0] px-4 py-3 text-sm text-[#4c5b52]">
          <p className="font-bold text-tlali-ink">Agua simulada por riego fantasma</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <DataRow label="Lectura real sensor" value={formatMetric(ghostWater.realTank1DistanceCm, ' cm')} />
            <DataRow label="Con ajuste mensual" value={formatMetric(ghostWater.systemTank1DistanceCm, ' cm')} />
            <DataRow label="Pendiente fantasma" value={formatMetric(ghostWater.pendingDropCm, ' cm')} />
            <DataRow label="Próximo cierre" value={formatShortDate(ghostWater.nextMonthlyUpdateAt)} />
          </div>
          <p className="mt-2 text-xs text-tlali-muted">
            La bomba fantasma descuenta agua una vez por día cuando la humedad está baja. Cada 30 días pasa el pendiente al ajuste real del sistema.
          </p>
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-[#7c827c]">
        <span>{LABELS.node}: <strong className="text-[#344039]">{node?.node ?? '-'}</strong></span>
        <span>RSSI: <strong className="text-[#344039]">{formatMetric(signal.rssiDbm, ' dBm')}</strong></span>
        <span>SNR: <strong className="text-[#344039]">{formatMetric(signal.snrDb, ' dB')}</strong></span>
      </div>
    </>
  )
}

function getActuatorRangeState(value, min, max) {
  const number = toNumber(value)
  if (number === null) return 'empty'
  return number < min || number > max ? 'warning' : 'healthy'
}

function CultivationMetric({ featured = false, helper, label, value }) {
  return (
    <div className={`rounded-xl border p-3 ${featured ? 'border-[#8ec59e] bg-[#c9ead0]' : 'border-[#e1dbcd] bg-[#fcf8f0]'}`}>
      <p className="min-h-8 text-[11px] font-semibold text-[#606b63]">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{value}</p>
      <p className="mt-2 truncate text-[10px] text-[#818981]">{helper}</p>
    </div>
  )
}

function MoistureChart({ readings }) {
  const values = readings.slice(0, 12).reverse().map((reading) => toNumber(reading.soilMoisturePercent)).filter((value) => value !== null)
  if (values.length < 2) {
    return (
      <div className="mt-3 rounded-xl border border-[#e1dbcd] bg-[#fcf8f0] p-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold text-[#687169]">Tendencia de humedad</p>
          <span className="rounded-full bg-[#f4ead6] px-2 py-1 text-[10px] font-bold text-[#80652d]">{values.length} registro</span>
        </div>
        <p className="mt-2 text-sm text-tlali-muted">Cuando existan 2 o más registros del día se dibujará la tendencia real de humedad.</p>
      </div>
    )
  }
  const points = values.map((value, index) => `${(index / (values.length - 1)) * 100},${92 - Math.min(100, Math.max(0, value)) * 0.78}`).join(' ')
  return (
    <div className="mt-3 rounded-xl border border-[#e1dbcd] bg-[#fcf8f0] p-3">
      <div className="flex items-center justify-between text-[11px] font-semibold text-[#687169]">
        <span>Tendencia de humedad</span>
        <span>{values.length} registros</span>
      </div>
      <svg aria-label="Tendencia de humedad" className="mt-2 h-24 w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
        <path d="M0 25H100M0 50H100M0 75H100" stroke="#ded8ca" strokeWidth=".6" />
        <polyline fill="none" points={points} stroke="#245c32" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
      </svg>
    </div>
  )
}

export function GreenhouseMap({ actuatorNode, latest, selectedArea, setSelectedArea }) {
  const soilStatus = getMetricState(toNumber(latest?.soilMoisturePercent), 35, 70)
  const lightStatus = getMetricState(toNumber(latest?.lightLux), 500, 60000)
  const waterLevel = getWaterState(actuatorNode?.data)
  const areas = [
    { id: 'zona-a1', label: 'Zona A1', helper: 'Sensor suelo', status: soilStatus, x: '18%', y: '34%' },
    { id: 'zona-a2', label: 'Zona A2', helper: 'Luminosidad', status: lightStatus, x: '54%', y: '28%' },
    { id: 'riego', label: 'Riego', helper: actuatorNode ? 'Actuadores' : 'Sin nodo', status: actuatorNode ? 'ok' : 'warn', x: '38%', y: '66%' },
    { id: 'agua', label: 'Agua', helper: 'Cisterna', status: waterLevel, x: '82%', y: '62%' },
  ]
  const active = areas.find((area) => area.id === selectedArea) ?? areas[0]

  return (
    <article className="paper-card p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Mapa del invernadero</p>
          <h2 className="mt-1 text-lg font-bold">Áreas monitoreadas</h2>
        </div>
        <span className={`module-badge ${active.status === 'ok' ? 'green' : 'amber'}`}>{stateLabel(active.status)}</span>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_250px]">
        <div className="relative min-h-[260px] overflow-hidden rounded-2xl border border-[#d8cfbf] bg-[#f7efdf] p-4">
          <div className="absolute inset-4 rounded-[28px] border-2 border-[#c8bda9] bg-[linear-gradient(90deg,rgba(24,75,64,.07)_1px,transparent_1px),linear-gradient(rgba(24,75,64,.06)_1px,transparent_1px)] bg-[length:48px_48px]" />
          <div className="absolute left-[9%] right-[9%] top-1/2 h-2 -translate-y-1/2 rounded-full bg-[#b9d6c4]" />
          <div className="absolute bottom-[20%] right-[12%] h-20 w-20 rounded-full border-4 border-[#8fc7c0] bg-[#d7f0ea]" />
          {areas.map((area) => (
            <button
              className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-2xl border px-3 py-2 text-left text-xs shadow-sm transition hover:-translate-y-[54%] ${area.id === selectedArea ? 'border-tlali-jade-dark bg-white' : 'border-[#d8cfbf] bg-[#fffaf1]'}`}
              key={area.id}
              onClick={() => setSelectedArea(area.id)}
              style={{ left: area.x, top: area.y }}
              type="button"
            >
              <span className={`mb-1 block h-3 w-3 rounded-full ${stateDotClass(area.status)}`} />
              <strong className="block">{area.label}</strong>
              <span className="text-[10px] text-tlali-muted">{area.helper}</span>
            </button>
          ))}
        </div>
        <div className="rounded-2xl border border-[#e1dbcd] bg-[#fcf8f0] p-4">
          <p className="text-xs font-semibold text-tlali-muted">Área seleccionada</p>
          <h3 className="mt-1 text-2xl font-bold">{active.label}</h3>
          <p className="mt-1 text-sm text-tlali-muted">{active.helper}</p>
          <div className="mt-4 grid gap-2 text-sm">
            <DataRow label="Estado" value={stateLabel(active.status)} />
            <DataRow label="Humedad suelo" value={formatMetric(latest?.soilMoisturePercent, '%')} />
            <DataRow label="Luminosidad" value={`${compactNumber(latest?.lightLux)} lux`} />
            <DataRow label="Nodo" value={latest?.deviceId ?? '-'} />
          </div>
        </div>
      </div>
    </article>
  )
}

export function ActuatorCard({ fullWidth = false, ghostPump, ghostWater, node }) {
  return (
    <article className="paper-card p-4 sm:p-5">
      <SectionHeading eyebrow="Actuadores" title={LABELS.actuatorTitle} />
      <ActuatorDetails fullWidth={fullWidth} ghostPump={ghostPump} ghostWater={ghostWater} node={node} />
    </article>
  )
}

export function AlertsCard({ alerts, lastReceivedAt }) {
  return (
    <article className="paper-card p-4 sm:p-5">
      <SectionHeading badge={`${alerts.length}`} badgeTone={alerts.length ? 'amber' : 'green'} eyebrow={LABELS.alerts} title={LABELS.alertsTitle} />
      <div className="mt-3 grid gap-2">
        {alerts.length ? alerts.slice(0, 3).map((alert) => (
          <div className="rounded-lg border border-[#ead5a8] bg-[#fff5dc] px-3 py-2" key={alert.key}>
            <p className="text-xs font-bold">{alert.label}: {alert.statusLabel}</p>
            <p className="mt-1 text-xs text-[#7d735d]">{alert.formattedValue}</p>
          </div>
        )) : (
          <div className="rounded-lg border border-[#cce0cf] bg-[#edf7ee] p-3">
            <p className="text-sm font-bold text-[#245c32]">{LABELS.noAlerts}</p>
          </div>
        )}
        <p className="pt-1 text-xs text-[#838983]">Última señal: {lastReceivedAt ? relativeTime(lastReceivedAt) : '-'}</p>
      </div>
    </article>
  )
}

export function RecentActivity({ readings, type = 'cultivo' }) {
  const isActuator = type === 'actuadores'
  return (
    <article className="paper-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#e1dbcd] px-4 py-4 sm:px-5">
        <div>
          <p className="eyebrow">{LABELS.activity}</p>
          <h2 className="mt-1 text-lg font-bold">{LABELS.recentReadings}</h2>
          <p className="mt-1 text-xs text-tlali-muted">{readings.length} registros consultados automáticamente hoy</p>
        </div>
      </div>
      <div className="max-h-80 overflow-auto">
        <table className={`w-full text-left text-xs ${isActuator ? 'min-w-[860px]' : 'min-w-[650px]'}`}>
          <thead className="sticky top-0 bg-[#f8f3e9] text-[#687169]">
            {isActuator ? (
              <tr><th>Hora</th><th>{LABELS.node}</th><th>Relevador 1</th><th>Relevador 2</th><th>Cisterna 1</th><th>Cisterna 2</th><th>pH</th><th>TDS</th></tr>
            ) : (
              <tr><th>Hora</th><th>{LABELS.node}</th><th>Temperatura</th><th>{LABELS.soilMoisture}</th><th>{LABELS.light}</th></tr>
            )}
          </thead>
          <tbody>
            {readings.map((reading) => (
              <tr className="border-t border-[#ece6da]" key={reading.id}>
                <td>{new Date(reading.receivedAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</td>
                <td className="font-semibold">{reading.deviceId}</td>
                <td>{isActuator ? (reading.relay1On ? 'Encendido' : 'Apagado') : formatMetric(reading.temperatureCelsius, ' °C')}</td>
                <td>{isActuator ? (reading.relay2On ? 'Encendido' : 'Apagado') : formatMetric(reading.soilMoisturePercent, '%')}</td>
                <td>{isActuator ? formatMetric(reading.tank1DistanceCm, ' cm') : `${compactNumber(reading.lightLux)} lux`}</td>
                {isActuator && (
                  <>
                    <td>{formatMetric(reading.tank2DistanceCm, ' cm')}</td>
                    <td>{formatMetric(reading.ph, '')}</td>
                    <td>{formatMetric(reading.tdsPpm, ' ppm')}</td>
                  </>
                )}
              </tr>
            ))}
            {!readings.length && <tr><td className="py-8 text-center text-[#8b918b]" colSpan={isActuator ? 8 : 5}>{LABELS.noReadings}</td></tr>}
          </tbody>
        </table>
      </div>
    </article>
  )
}

export function DailyTrendCharts({ readings }) {
  const orderedReadings = getDailyChartReadings(readings)
  const countLabel = `${orderedReadings.length} ${orderedReadings.length === 1 ? 'registro' : 'registros'} de hoy`

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <TrendChart
          eyebrow="Humedad"
          emptyText="Cuando existan lecturas de humedad se dibujará la curva completa del día."
          readings={orderedReadings}
          series={[
            { color: '#0f7a49', key: 'soilMoisturePercent', label: 'Suelo' },
            { color: '#0b6680', key: 'humidityPercent', label: 'Ambiente' },
          ]}
          subtitle={countLabel}
          title="Suelo y ambiente"
          unit="%"
          yMax={100}
          yMin={0}
        />
        <TrendChart
          eyebrow="Temperatura"
          emptyText="Cuando existan lecturas de temperatura se dibujará la curva completa del día."
          readings={orderedReadings}
          series={[
            { color: '#d36a00', key: 'soilTemperatureC', label: 'Suelo' },
            { color: '#d5413d', key: 'temperatureCelsius', label: 'Ambiente' },
          ]}
          subtitle={countLabel}
          title="Suelo y ambiente"
          unit="°C"
        />
      </div>
      <TrendChart
        eyebrow="Nutrientes del sustrato"
        emptyText="Cuando existan lecturas de NPK se dibujará la curva completa del día."
        readings={orderedReadings}
        series={[
          { color: '#0f8a64', key: 'nitrogenMgKg', label: 'Nitrógeno' },
          { color: '#d8951b', key: 'phosphorusMgKg', label: 'Fósforo' },
          { color: '#6c4ab6', key: 'potassiumMgKg', label: 'Potasio' },
        ]}
        subtitle={countLabel}
        title="Nitrógeno, fósforo y potasio"
        unit="mg/kg"
      />
    </div>
  )
}

function TrendChart({ emptyText, eyebrow, readings, series, subtitle, title, unit, yMax, yMin }) {
  const chart = buildTrendChart(readings, series, { yMax, yMin })

  return (
    <article className="paper-card bg-white/90 px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow text-tlali-jade-dark">{eyebrow}</p>
          <h2 className="mt-1 text-lg font-bold">{title}</h2>
        </div>
        <span className="module-badge green">{subtitle}</span>
      </div>
      {chart.hasData ? (
        <>
          <div className="mt-4">
            <svg aria-label={`${eyebrow}: ${title}`} className="h-[260px] w-full" preserveAspectRatio="none" viewBox="0 0 760 260">
              <g>
                {chart.yTicks.map((tick) => (
                  <g key={tick.value}>
                    <line stroke="#e7e2d8" strokeWidth="1" x1="54" x2="742" y1={tick.y} y2={tick.y} />
                    <text fill="#607069" fontSize="11" fontWeight="700" textAnchor="end" x="45" y={tick.y + 4}>{formatAxisNumber(tick.value)}</text>
                  </g>
                ))}
                {chart.xTicks.map((tick) => (
                  <g key={tick.label}>
                    <line stroke="#f0ebe2" strokeWidth="1" x1={tick.x} x2={tick.x} y1="34" y2="212" />
                    <text fill="#607069" fontSize="11" fontWeight="700" textAnchor="middle" x={tick.x} y="238">{tick.label}</text>
                  </g>
                ))}
                <line stroke="#d8d0c2" strokeWidth="1.4" x1="54" x2="742" y1="212" y2="212" />
                <text fill="#607069" fontSize="11" fontWeight="800" textAnchor="middle" transform="rotate(-90 16 123)" x="16" y="123">{unit}</text>
                {chart.series.map((line) => (
                  <g key={line.label}>
                    <polyline fill="none" points={line.points} stroke={line.color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
                    {line.markers.map((marker) => (
                      <circle cx={marker.x} cy={marker.y} fill="#fffdf8" key={`${line.label}-${marker.x}-${marker.y}`} r="3.5" stroke={line.color} strokeWidth="1.8">
                        <title>{`${marker.time} · ${line.label}: ${formatMetric(marker.value, getUnitSuffix(unit))}`}</title>
                      </circle>
                    ))}
                  </g>
                ))}
              </g>
            </svg>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {series.map((item) => (
              <span className="inline-flex items-center gap-2 text-xs font-semibold text-[#56635c]" key={item.key}>
                <span className="h-3 w-3 rounded-full border-2 bg-white" style={{ borderColor: item.color }} />
                {item.label}
              </span>
            ))}
          </div>
        </>
      ) : (
        <div className="mt-4 rounded-xl border border-[#e1dbcd] bg-[#fcf8f0] p-4 text-sm text-tlali-muted">{emptyText}</div>
      )}
    </article>
  )
}

export function ReadingForm({ form, handleSubmit, message, updateField }) {
  return (
    <form className="tlali-card p-4 shadow-sm" onSubmit={handleSubmit}>
      <h2 className="text-base font-semibold">{LABELS.captureTitle}</h2>
      <p className="mt-1 text-xs text-tlali-muted">Solo se usa para pruebas o capturas manuales cuando no llega una lectura automática.</p>
      <div className="mt-4 grid gap-3">
        <TextField label="Dispositivo" name="deviceId" onChange={updateField} required value={form.deviceId} />
        <TextField label={LABELS.site} name="siteId" onChange={updateField} value={form.siteId} />
        <TextField label="Temperatura °C" name="temperatureCelsius" onChange={updateField} required type="number" value={form.temperatureCelsius} />
        <TextField label={LABELS.airHumidity} name="humidityPercent" onChange={updateField} required type="number" value={form.humidityPercent} />
        <TextField label={LABELS.soilMoisture} name="soilMoisturePercent" onChange={updateField} type="number" value={form.soilMoisturePercent} />
        <TextField label={LABELS.light} name="lightLux" onChange={updateField} type="number" value={form.lightLux} />
      </div>
      <button className="primary-button mt-4 w-full" type="submit">Guardar lectura</button>
      {message && <p className="mt-3 text-sm font-medium text-tlali-muted">{message}</p>}
    </form>
  )
}

export function getNextView(view) {
  const current = VIEW_ORDER.indexOf(view)
  return VIEW_ORDER[(current + 1) % VIEW_ORDER.length]
}

function getDailyChartReadings(readings) {
  return readings
    .filter((reading) => reading?.receivedAt)
    .sort((left, right) => new Date(left.receivedAt).getTime() - new Date(right.receivedAt).getTime())
}

function buildTrendChart(readings, series, options = {}) {
  const left = 54
  const right = 742
  const top = 34
  const bottom = 212
  const validTimes = readings.map((reading) => new Date(reading.receivedAt).getTime()).filter((time) => Number.isFinite(time)).sort((leftTime, rightTime) => leftTime - rightTime)
  const firstTime = validTimes[0] ?? Date.now()
  const lastTime = validTimes[validTimes.length - 1] ?? firstTime
  const rawTimeSpan = Math.max(15 * 60 * 1000, lastTime - firstTime)
  const timePadding = rawTimeSpan * 0.05
  const minTime = firstTime - timePadding
  const maxTime = lastTime + timePadding

  const values = series.flatMap((item) => readings.map((reading) => toNumber(reading[item.key])).filter((value) => value !== null))
  if (!values.length) {
    return { hasData: false, series: [], xTicks: [], yTicks: [] }
  }

  const actualMin = Math.min(...values)
  const actualMax = Math.max(...values)
  const rangePadding = actualMin === actualMax ? Math.max(1, Math.abs(actualMin) * 0.2) : (actualMax - actualMin) * 0.12
  const yMin = options.yMin ?? Math.max(0, actualMin - rangePadding)
  const yMax = options.yMax ?? (actualMax + rangePadding)
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
    const date = new Date(time)
    return {
      label: date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      x: xForTime(time),
    }
  })

  const chartSeries = series
    .map((item) => {
      const rawPoints = readings
        .map((reading) => {
          const value = toNumber(reading[item.key])
          const time = new Date(reading.receivedAt).getTime()
          if (value === null || !Number.isFinite(time)) return null
          return {
            time,
            timeLabel: new Date(reading.receivedAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
            value,
            x: xForTime(time),
            y: yForValue(value),
          }
        })
        .filter(Boolean)
      const points = sampleChartPoints(rawPoints, 320)
      const markers = rawPoints.length <= 12 ? rawPoints.map((point) => ({
        time: point.timeLabel,
        value: point.value,
        x: point.x,
        y: point.y,
      })) : []

      return {
        color: item.color,
        label: item.label,
        markers,
        points: points.map((point) => `${point.x},${point.y}`).join(' '),
      }
    })
    .filter((item) => item.points)

  return {
    hasData: chartSeries.length > 0,
    series: chartSeries,
    xTicks,
    yTicks,
  }
}

function sampleChartPoints(points, maxPoints) {
  if (points.length <= maxPoints) return points
  const step = Math.ceil(points.length / maxPoints)
  return points.filter((_, index) => index % step === 0 || index === points.length - 1)
}

function formatAxisNumber(value) {
  return Number(value).toLocaleString('es-MX', { maximumFractionDigits: Math.abs(value) < 10 ? 1 : 0 })
}

function getUnitSuffix(unit) {
  if (!unit) return ''
  return unit === '%' ? '%' : ` ${unit}`
}

function getViewTitle(view) {
  if (view === 'luz') return 'Luminosidad'
  if (view === 'actuadores') return 'Actuadores y agua'
  return 'Suelo y nutrientes'
}

function getSignalQuality(rssi) {
  if (rssi === null) return { label: 'Sin dato', className: 'bg-slate-100 text-slate-700' }
  if (rssi >= -80) return { label: 'Excelente', className: 'bg-[#cce8df] text-tlali-jade-dark' }
  if (rssi >= -95) return { label: 'Buena', className: 'bg-[#cce8df] text-tlali-jade-dark' }
  if (rssi >= -110) return { label: 'Débil', className: 'bg-[#faedcb] text-[#75501d]' }
  return { label: 'Crítica', className: 'bg-[#f5dedd] text-[#8c332f]' }
}

function getMetricState(value, min, max) {
  if (value === null) return 'warn'
  if (value < min || value > max) return 'warn'
  return 'ok'
}

function getWaterState(data) {
  const tankOne = toNumber(data?.tank1DistanceCm)
  const tankTwo = toNumber(data?.tank2DistanceCm)
  if (tankOne === null && tankTwo === null) return 'warn'
  return Math.max(tankOne ?? 0, tankTwo ?? 0) > 120 ? 'warn' : 'ok'
}

function stateLabel(status) {
  if (status === 'ok') return 'En orden'
  if (status === 'bad') return 'Revisar'
  return 'Atención'
}

function stateDotClass(status) {
  if (status === 'ok') return 'bg-[#245c32]'
  if (status === 'bad') return 'bg-[#a83f3a]'
  return 'bg-[#c88b23]'
}

function compactNumber(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '-'
  return new Intl.NumberFormat('es-MX', { notation: Number(value) >= 1000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(Number(value))
}

function formatShortDate(value) {
  if (!value) return '-'
  return new Date(`${value}T00:00:00`).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function firstNumber(source, ...keys) {
  for (const key of keys) {
    const value = toNumber(source?.[key])
    if (value !== null) return value
  }
  return null
}

function getConfiguredState(value, range) {
  const number = toNumber(value)
  if (number === null) return 'empty'
  const min = toNumber(range?.min)
  const max = toNumber(range?.max)
  if (min === null || max === null) return 'healthy'
  if (number < min) return 'warning'
  if (number > max) return 'danger'
  return 'healthy'
}

function getRangeComparison(value, range, unit = '') {
  const number = toNumber(value)
  const min = toNumber(range?.min)
  const max = toNumber(range?.max)
  if (min === null || max === null) {
    return {
      percent: number === null ? 0 : 100,
      percentLabel: 'Sin rango configurado',
      rangeLabel: '--',
    }
  }
  if (number === null) {
    return {
      percent: 0,
      percentLabel: 'Sin lectura para comparar',
      rangeLabel: `${formatRangeNumber(min)}-${formatRangeNumber(max)}${unit}`,
    }
  }
  const percent = Math.min(100, Math.max(0, ((number - min) / (max - min)) * 100))
  if (number < min) {
    return {
      percent: 8,
      percentLabel: `${formatRangeNumber(min - number)}${unit} por debajo`,
      rangeLabel: `${formatRangeNumber(min)}-${formatRangeNumber(max)}${unit}`,
    }
  }
  if (number > max) {
    return {
      percent: 100,
      percentLabel: `${formatRangeNumber(number - max)}${unit} por encima`,
      rangeLabel: `${formatRangeNumber(min)}-${formatRangeNumber(max)}${unit}`,
    }
  }
  return {
    percent: Math.max(12, percent),
    percentLabel: `${Math.round(percent)}% dentro del rango`,
    rangeLabel: `${formatRangeNumber(min)}-${formatRangeNumber(max)}${unit}`,
  }
}

function formatRangeNumber(value) {
  return Number(value).toLocaleString('es-MX', { maximumFractionDigits: 1 })
}

function relativeTime(date) {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(date).getTime()) / 1000))
  if (seconds < 60) return '< 1 min'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h`
  return new Date(date).toLocaleDateString('es-MX')
}
