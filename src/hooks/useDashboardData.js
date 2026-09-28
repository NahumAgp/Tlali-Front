import { useEffect, useMemo, useState } from 'react'
import { API_URL, initialReadingForm } from '../config/app.js'
import { authorizedFetch } from '../lib/auth.js'
import { getActiveCrop, getAssignmentForNode, getCropForNode, getCropParameters, loadCropConfiguration, loadCropSettings, loadNodeAssignments, loadRemoteCropConfiguration } from '../lib/cropSettings.js'
import { getGhostWaterForNode, loadGhostWaterLedger, updateGhostWaterLedger } from '../lib/ghostWater.js'
import { toReadingPayload } from '../lib/readings.js'
import { buildSensorMetrics, toNumber } from '../lib/sensors.js'

const DAILY_CACHE_KEY = 'tlali-dashboard-readings'
const ACTUATOR_DAILY_CACHE_KEY = 'tlali-actuator-readings'

export const HISTORY_PERIODS = [
  { key: 'day', label: 'Día', days: 1 },
  { key: 'week', label: 'Semana', days: 7 },
  { key: 'month', label: 'Mes', days: 30 },
  { key: 'quarter', label: '3 meses', days: 90 },
  { key: 'semester', label: '6 meses', days: 180 },
  { key: 'year', label: 'Año', days: 365 },
]

export default function useDashboardData(auth, options = {}) {
  const historyPeriod = options.historyPeriod ?? 'day'
  const selectedGreenhouse = options.greenhouse ?? ''
  const [summary, setSummary] = useState(null)
  const [firebaseData, setFirebaseData] = useState(null)
  const [status, setStatus] = useState('checking')
  const [message, setMessage] = useState('')
  const [form, setForm] = useState(initialReadingForm)
  const [showForm, setShowForm] = useState(false)
  const [firebaseHistory, setFirebaseHistory] = useState([])
  const [firebaseActuatorHistory, setFirebaseActuatorHistory] = useState([])
  const [cachedReadings, setCachedReadings] = useState(() => loadCachedDailyReadings())
  const [cachedActuatorReadings, setCachedActuatorReadings] = useState(() => loadCachedActuatorReadings())
  const [activeCrop, setActiveCrop] = useState(() => getActiveCrop())
  const [crops, setCrops] = useState(() => loadCropSettings())
  const [ghostWaterLedger, setGhostWaterLedger] = useState(() => loadGhostWaterLedger())
  const [nodeAssignments, setNodeAssignments] = useState(() => loadNodeAssignments())

  useEffect(() => {
    if (!auth.token) return
    loadDashboard()
    const timer = window.setInterval(loadDashboard, 10000)
    return () => window.clearInterval(timer)
  }, [auth.token, historyPeriod])

  useEffect(() => {
    const syncCrop = () => {
      setCrops(loadCropSettings())
      setNodeAssignments(loadNodeAssignments())
      setActiveCrop(getActiveCrop())
    }
    window.addEventListener('tlali-crop-settings-change', syncCrop)
    window.addEventListener('storage', syncCrop)
    return () => {
      window.removeEventListener('tlali-crop-settings-change', syncCrop)
      window.removeEventListener('storage', syncCrop)
    }
  }, [])

  useEffect(() => {
    const syncGhostWater = () => setGhostWaterLedger(loadGhostWaterLedger())
    window.addEventListener('tlali-ghost-water-change', syncGhostWater)
    window.addEventListener('storage', syncGhostWater)
    return () => {
      window.removeEventListener('tlali-ghost-water-change', syncGhostWater)
      window.removeEventListener('storage', syncGhostWater)
    }
  }, [])

  async function loadDashboard() {
    try {
      setStatus('checking')
      const today = new Date().toLocaleDateString('en-CA')
      const range = getHistoryRange(historyPeriod)
      const [summaryResponse, firebaseResponse, sensorHistoryResponse, actuatorHistoryResponse] = await Promise.all([
        authorizedFetch(`${API_URL}/api/v1/sensor-readings/dashboard`, auth.token, {}, auth.onUnauthorized),
        authorizedFetch(`${API_URL}/api/v1/firebase/actual`, auth.token, {}, auth.onUnauthorized),
        authorizedFetch(`${API_URL}/api/v1/firebase/history?type=sensor&startDate=${range.startDate}&endDate=${today}`, auth.token, {}, auth.onUnauthorized),
        authorizedFetch(`${API_URL}/api/v1/firebase/history?type=actuator&startDate=${range.startDate}&endDate=${today}`, auth.token, {}, auth.onUnauthorized),
      ])
      const cropConfiguration = await loadRemoteCropConfiguration(auth).catch(() => loadCropConfiguration())
      setCrops(cropConfiguration.crops)
      setNodeAssignments(cropConfiguration.nodeAssignments)
      setActiveCrop(cropConfiguration.crops.find((crop) => crop.id === cropConfiguration.activeCropId) ?? cropConfiguration.crops[0])
      if (!summaryResponse.ok) throw new Error(`HTTP ${summaryResponse.status}`)
      setSummary(await summaryResponse.json())
      setFirebaseHistory(sensorHistoryResponse.ok ? await sensorHistoryResponse.json() : [])
      setFirebaseActuatorHistory(actuatorHistoryResponse.ok ? await actuatorHistoryResponse.json() : [])
      setStatus('online')
      if (firebaseResponse.ok) {
        setFirebaseData(await firebaseResponse.json())
        setMessage('')
      } else {
        setFirebaseData(null)
        setMessage('Firebase no está disponible; se muestran las lecturas guardadas localmente.')
      }
    } catch {
      setStatus('offline')
      setMessage('No fue posible sincronizar el centro de monitoreo.')
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('Guardando lectura...')
    try {
      const response = await authorizedFetch(`${API_URL}/api/v1/sensor-readings`, auth.token, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toReadingPayload(form)),
      }, auth.onUnauthorized)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      await loadDashboard()
      setShowForm(false)
    } catch {
      setMessage('No se pudo registrar la lectura.')
    }
  }

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const firebaseNodes = Object.values(firebaseData?.nodes ?? {})
  const cultivationNodes = firebaseNodes.filter((node) => node.type === 'sensor' || node.node?.toLowerCase().includes('npk'))
  const greenhouseOptions = buildGreenhouseOptions(nodeAssignments)
  const greenhouseNode = selectedGreenhouse
    ? cultivationNodes.find((node) => getAssignmentForNode(node.node, nodeAssignments)?.greenhouse === selectedGreenhouse)
    : null
  const cultivationNode = greenhouseNode ?? cultivationNodes.find((node) => getAssignmentForNode(node.node, nodeAssignments)) ?? cultivationNodes[0]
  const actuatorNode = firebaseNodes.find((node) => node.type === 'actuator')
  const cultivationAssignment = getAssignmentForNode(cultivationNode?.node, nodeAssignments)
  const cropForCurrentNode = getCropForNode(cultivationNode?.node, crops, nodeAssignments) ?? activeCrop
  const firebaseReading = firebaseNodeToReading(cultivationNode, cultivationAssignment, cropForCurrentNode)
  const firebaseActuatorReading = firebaseActuatorNodeToReading(actuatorNode)
  const storedReadings = summary?.recentReadings ?? []
  const historyReadings = firebaseHistory
    .map((entry) => firebaseHistoryToReading(entry, getAssignmentForNode(entry.node, nodeAssignments), getCropForNode(entry.node, crops, nodeAssignments) ?? activeCrop))
    .filter(Boolean)
  const historyActuatorReadings = firebaseActuatorHistory.map(firebaseHistoryToActuatorReading).filter(Boolean)

  useEffect(() => {
    if (!firebaseReading) return
    setCachedReadings((current) => saveCachedDailyReadings(mergeReadings([firebaseReading], current)))
  }, [firebaseReading?.id])

  useEffect(() => {
    if (!firebaseActuatorReading) return
    setCachedActuatorReadings((current) => saveCachedActuatorReadings(mergeReadings([firebaseActuatorReading], current)))
  }, [firebaseActuatorReading?.id])

  const liveReadings = mergeReadings(firebaseReading ? [firebaseReading] : [], historyReadings, cachedReadings, storedReadings)
  const liveActuatorReadings = mergeReadings(firebaseActuatorReading ? [firebaseActuatorReading] : [], historyActuatorReadings, cachedActuatorReadings)
  const todayReadings = useMemo(() => filterToday(liveReadings), [liveReadings])
  const todayActuatorReadings = useMemo(() => filterToday(liveActuatorReadings), [liveActuatorReadings])
  const periodReadings = useMemo(() => filterByPeriod(liveReadings, historyPeriod), [historyPeriod, liveReadings])
  const periodActuatorReadings = useMemo(() => filterByPeriod(liveActuatorReadings, historyPeriod), [historyPeriod, liveActuatorReadings])
  const readings = todayReadings.length ? todayReadings : liveReadings
  const actuatorReadings = todayActuatorReadings.length ? todayActuatorReadings : liveActuatorReadings
  const latest = firebaseReading ?? summary?.latestReading
  const cropParameters = getCropParameters(cropForCurrentNode)
  const alerts = buildSensorMetrics(latest, cropParameters).filter((metric) => metric.value !== null && metric.status !== 'healthy')
  const ghostPump = buildGhostPumpDecision(latest, cropParameters, cultivationNode, cultivationAssignment)
  const todayKey = new Date().toLocaleDateString('en-CA')
  const ghostWater = getGhostWaterForNode(ghostWaterLedger, ghostPump, actuatorNode)
  const firebaseLastReceivedAt = latestFirebaseTimestamp(firebaseNodes)
  const firebaseOnline = firebaseNodes.some((node) => isRecentTimestamp(node.gateway?.recibidoUtc))
  const activeFirebaseNodes = firebaseNodes.length
  const liveSource = firebaseNodes.length > 0
  const lastReceivedAt = firebaseLastReceivedAt ?? summary?.lastReceivedAt

  function downloadReport() {
    downloadDailyExcel(todayReadings.length ? todayReadings : readings, latest, alerts)
  }

  useEffect(() => {
    const result = updateGhostWaterLedger(ghostWaterLedger, ghostPump, actuatorNode)
    if (result.changed) setGhostWaterLedger(result.ledger)
  }, [actuatorNode?.node, actuatorNode?.seq, ghostPump?.active, ghostPump?.node, ghostPump?.updatedAt, todayKey])

  return {
    activeFirebaseNodes,
    activeCrop: cropForCurrentNode,
    actuatorNode,
    actuatorReadings,
    alerts,
    cultivationAssignment,
    cultivationNode,
    cultivationNodes,
    downloadReport,
    firebaseNodes,
    firebaseOnline,
    form,
    ghostPump,
    ghostWater,
    greenhouseOptions,
    handleSubmit,
    lastReceivedAt,
    latest,
    liveSource,
    loadDashboard,
    message,
    nodeAssignments,
    periodActuatorReadings,
    periodReadings,
    readings,
    setShowForm,
    showForm,
    status,
    summary,
    todayReadings,
    todayActuatorReadings,
    updateField,
  }
}

function buildGhostPumpDecision(reading, cropParameters, cultivationNode, assignment) {
  const moisture = toNumber(reading?.soilMoisturePercent)
  const min = toNumber(cropParameters?.soilMoisturePercent?.min)
  const max = toNumber(cropParameters?.soilMoisturePercent?.max)
  const hasDecisionData = moisture !== null && min !== null && max !== null
  const deficit = hasDecisionData ? Math.max(0, min - moisture) : null
  const active = hasDecisionData && moisture < min
  const tooWet = hasDecisionData && moisture > max

  return {
    active,
    mode: 'ghost',
    node: reading?.deviceId ?? cultivationNode?.node ?? null,
    area: assignment?.area ?? reading?.siteId ?? 'Zona de cultivo',
    greenhouse: assignment?.greenhouse ?? 'Invernadero 1',
    moisture,
    min,
    max,
    deficit,
    relay1On: active,
    relay2On: false,
    state: !hasDecisionData ? 'empty' : active ? 'warning' : tooWet ? 'danger' : 'healthy',
    statusLabel: !hasDecisionData
      ? 'Sin datos para simular'
      : active
        ? 'Activa en sistema'
        : tooWet
          ? 'Bloqueada por exceso de humedad'
          : 'En espera',
    reason: !hasDecisionData
      ? 'Falta lectura de humedad o rango mínimo/máximo.'
      : active
        ? `Humedad ${formatGhostNumber(moisture)}%, mínimo ${formatGhostNumber(min)}%. Déficit ${formatGhostNumber(deficit)}%.`
        : tooWet
          ? `Humedad ${formatGhostNumber(moisture)}%, por encima del máximo ${formatGhostNumber(max)}%.`
          : `Humedad ${formatGhostNumber(moisture)}%, dentro del rango ${formatGhostNumber(min)}-${formatGhostNumber(max)}%.`,
    recommendation: active
      ? 'Simular encendido de bomba hasta recuperar el mínimo configurado.'
      : tooWet
        ? 'Mantener bomba apagada; no conviene regar.'
        : 'Mantener bomba apagada; la planta no requiere riego.',
    updatedAt: reading?.receivedAt ?? null,
  }
}

function formatGhostNumber(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '-'
  return Number(value).toLocaleString('es-MX', { maximumFractionDigits: 1 })
}

function buildGreenhouseOptions(assignments) {
  return Array.from(new Set(assignments.map((assignment) => assignment.greenhouse).filter(Boolean)))
    .map((greenhouse) => ({ label: greenhouse, value: greenhouse }))
}

export function getHistoryRange(periodKey) {
  const period = HISTORY_PERIODS.find((item) => item.key === periodKey) ?? HISTORY_PERIODS[0]
  const end = new Date()
  const start = new Date(end)
  start.setDate(start.getDate() - period.days + 1)
  return {
    endDate: end.toLocaleDateString('en-CA'),
    startDate: start.toLocaleDateString('en-CA'),
  }
}

function downloadDailyExcel(readings, latest, alerts) {
  const date = new Date().toLocaleDateString('es-MX')
  const rows = readings.map((reading) => `
    <tr>
      <td>${safeCell(new Date(reading.receivedAt).toLocaleString('es-MX'))}</td>
      <td>${safeCell(reading.deviceId)}</td>
      <td>${safeCell(reading.siteId ?? '')}</td>
      <td>${safeCell(reading.temperatureCelsius ?? '')}</td>
      <td>${safeCell(reading.humidityPercent ?? '')}</td>
      <td>${safeCell(reading.soilMoisturePercent ?? '')}</td>
      <td>${safeCell(reading.lightLux ?? '')}</td>
    </tr>
  `).join('')
  const chartRows = [
    ['Temperatura °C', latest?.temperatureCelsius],
    ['Humedad aire %', latest?.humidityPercent],
    ['Humedad suelo %', latest?.soilMoisturePercent],
    ['Luz lux', latest?.lightLux],
  ].map(([label, value]) => {
    const width = Math.max(4, Math.min(100, Number(value || 0) / (label.includes('Luz') ? 1000 : 1)))
    return `<tr><td>${label}</td><td>${safeCell(value ?? '')}</td><td><div style="background:#184b40;height:16px;width:${width}%;"></div></td></tr>`
  }).join('')
  const alertRows = alerts.map((alert) => `<tr><td>${safeCell(alert.label)}</td><td>${safeCell(alert.statusLabel)}</td><td>${safeCell(alert.formattedValue)}</td></tr>`).join('')
  const html = `
    <html>
      <head><meta charset="UTF-8" /></head>
      <body>
        <h1>Reporte diario Tlali Tlapixqui</h1>
        <p>Fecha: ${date}</p>
        <h2>Resumen gráfico</h2>
        <table border="1"><tr><th>Indicador</th><th>Valor</th><th>Gráfica</th></tr>${chartRows}</table>
        <h2>Alertas</h2>
        <table border="1"><tr><th>Sensor</th><th>Estado</th><th>Valor</th></tr>${alertRows || '<tr><td colspan="3">Sin alertas</td></tr>'}</table>
        <h2>Registros del día</h2>
        <table border="1"><tr><th>Fecha</th><th>Nodo</th><th>Sitio</th><th>Temperatura °C</th><th>Humedad aire %</th><th>Humedad suelo %</th><th>Luz lux</th></tr>${rows || '<tr><td colspan="7">Sin registros</td></tr>'}</table>
      </body>
    </html>
  `
  const url = URL.createObjectURL(new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `reporte-diario-tlali-${new Date().toISOString().slice(0, 10)}.xls`
  link.click()
  URL.revokeObjectURL(url)
}

function safeCell(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

function mergeReadings(...groups) {
  const seen = new Set()
  return groups.flat()
    .filter(Boolean)
    .filter((reading) => {
      const key = reading.id ?? `${reading.deviceId}-${reading.receivedAt}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .sort((left, right) => new Date(right.receivedAt).getTime() - new Date(left.receivedAt).getTime())
}

function filterToday(readings) {
  const today = new Date().toLocaleDateString('en-CA')
  return readings.filter((reading) => new Date(reading.receivedAt).toLocaleDateString('en-CA') === today)
}

function filterByPeriod(readings, periodKey) {
  const period = HISTORY_PERIODS.find((item) => item.key === periodKey) ?? HISTORY_PERIODS[0]
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - period.days + 1)
  return readings.filter((reading) => new Date(reading.receivedAt) >= start)
}

function loadCachedDailyReadings() {
  try {
    return filterToday(JSON.parse(window.localStorage.getItem(DAILY_CACHE_KEY) ?? '[]'))
  } catch {
    return []
  }
}

function saveCachedDailyReadings(readings) {
  const today = filterToday(readings)
  window.localStorage.setItem(DAILY_CACHE_KEY, JSON.stringify(today))
  return today
}

function loadCachedActuatorReadings() {
  try {
    return filterToday(JSON.parse(window.localStorage.getItem(ACTUATOR_DAILY_CACHE_KEY) ?? '[]'))
  } catch {
    return []
  }
}

function saveCachedActuatorReadings(readings) {
  const today = filterToday(readings)
  window.localStorage.setItem(ACTUATOR_DAILY_CACHE_KEY, JSON.stringify(today))
  return today
}

function firebaseNodeToReading(node, assignment, crop) {
  if (!node) return null
  const data = node.data ?? {}
  const receivedAt = node.gateway?.recibidoUtc ?? new Date().toISOString()
  return {
    id: `firebase-${node.node}-${node.seq ?? receivedAt}`,
    deviceId: node.node,
    cropId: crop?.id ?? assignment?.cropId ?? null,
    cropName: crop?.name ?? null,
    greenhouse: assignment?.greenhouse ?? 'Invernadero 1',
    siteId: assignment?.area ?? 'Zona de cultivo',
    temperatureCelsius: dataValue(data, 'airTemperatureC', 'temperatureCelsius', 'tempC', 'soilTemperatureC'),
    humidityPercent: dataValue(data, 'airHumidityPct', 'airHumidityPercent', 'humidityPercent'),
    soilMoisturePercent: dataValue(data, 'soilMoisturePct', 'soilMoisturePercent', 'capacitiveHumidityPct', 'capacitiveSoilMoisturePct'),
    substrateHumidityPercent: dataValue(data, 'substrateHumidityPct', 'substrateHumidityPercent', 'substrateHumidity', 'soilHumidityPct', 'soilHumidityPercent', 'soilMoisturePct'),
    soilTemperatureC: dataValue(data, 'soilTemperatureC', 'substrateTemperatureC'),
    ph: dataValue(data, 'ph', 'substratePh'),
    conductivityUsCm: dataValue(data, 'conductivityUsCm', 'conductivity', 'ecUsCm'),
    nitrogenMgKg: dataValue(data, 'nitrogenMgKg', 'nitrogen', 'nMgKg'),
    phosphorusMgKg: dataValue(data, 'phosphorusMgKg', 'phosphorus', 'pMgKg'),
    potassiumMgKg: dataValue(data, 'potassiumMgKg', 'potassium', 'kMgKg'),
    lightLux: dataValue(data, 'lightLux', 'lux', 'luminosityLux'),
    batteryVoltage: null,
    recordedAt: receivedAt,
    receivedAt,
  }
}

function firebaseHistoryToReading(entry, assignment, crop) {
  const data = parseJson(entry.dataJson)
  const gateway = parseJson(entry.gatewayJson)
  const radio = parseJson(entry.radioJson)
  return firebaseNodeToReading({
    data,
    gateway: { ...gateway, recibidoUtc: entry.gatewayReceivedAt ?? gateway.recibidoUtc },
    node: entry.node,
    radio,
    seq: entry.sequenceNumber,
    type: entry.type,
  }, assignment, crop)
}

function firebaseHistoryToActuatorReading(entry) {
  const data = parseJson(entry.dataJson)
  const gateway = parseJson(entry.gatewayJson)
  const radio = parseJson(entry.radioJson)
  return firebaseActuatorNodeToReading({
    data,
    gateway: { ...gateway, recibidoUtc: entry.gatewayReceivedAt ?? gateway.recibidoUtc },
    node: entry.node,
    radio,
    seq: entry.sequenceNumber,
    type: entry.type,
  })
}

function firebaseActuatorNodeToReading(node) {
  if (!node) return null
  const data = node.data ?? {}
  const radio = node.radio ?? {}
  const receivedAt = node.gateway?.recibidoUtc ?? new Date().toISOString()
  const conductivityUsCm = dataValue(data, 'conductivityUsCm', 'conductivity', 'ecUsCm')
  const tdsPpm = dataValue(data, 'tdsPpm', 'tds', 'tdsValue') ?? (conductivityUsCm === null ? null : conductivityUsCm * 0.5)

  return {
    id: `firebase-actuator-${node.node}-${node.seq ?? receivedAt}`,
    type: 'actuator',
    deviceId: node.node,
    relay1On: Boolean(data.relay1On),
    relay2On: Boolean(data.relay2On),
    tank1DistanceCm: dataValue(data, 'tank1DistanceCm', 'tankOneDistanceCm', 'cisterna1Cm'),
    tank2DistanceCm: dataValue(data, 'tank2DistanceCm', 'tankTwoDistanceCm', 'cisterna2Cm'),
    ph: dataValue(data, 'ph', 'waterPh'),
    conductivityUsCm,
    tdsPpm,
    waterTemperatureC: dataValue(data, 'waterTemperatureC', 'temperatureCelsius', 'tempC'),
    rssiDbm: dataValue(radio, 'rssiDbm'),
    snrDb: dataValue(radio, 'snrDb'),
    recordedAt: receivedAt,
    receivedAt,
  }
}

function dataValue(source, ...keys) {
  for (const key of keys) {
    if (source?.[key] !== null && source?.[key] !== undefined && source?.[key] !== '') return source[key]
  }
  return null
}

function parseJson(value) {
  if (!value) return {}
  try {
    return JSON.parse(value)
  } catch {
    return {}
  }
}

function latestFirebaseTimestamp(nodes) {
  return nodes.map((node) => node.gateway?.recibidoUtc).filter(Boolean).sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0] ?? null
}

function isRecentTimestamp(timestamp) {
  return Boolean(timestamp) && Date.now() - new Date(timestamp).getTime() <= 120000
}
