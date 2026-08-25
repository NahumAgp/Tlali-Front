import { useEffect, useMemo, useRef, useState } from 'react'
import { DashboardNav } from '../components/dashboard/DashboardWidgets.jsx'
import { API_URL } from '../config/app.js'
import { authorizedFetch } from '../lib/auth.js'
import { getCropParameters } from '../lib/cropSettings.js'
import { formatMetric, toNumber } from '../lib/sensors.js'
import useDashboardData from '../hooks/useDashboardData.js'

const QUICK_QUESTIONS = [
  '¿Cómo estuvo mi cultivo hoy?',
  '¿Qué variable estuvo más fuera de rango?',
  '¿Cómo estuvo la humedad y temperatura?',
  '¿Qué recomendaciones tengo para este día?',
]

const MONTHS = {
  abril: 3,
  agosto: 7,
  diciembre: 11,
  enero: 0,
  febrero: 1,
  julio: 6,
  junio: 5,
  marzo: 2,
  mayo: 4,
  noviembre: 10,
  octubre: 9,
  septiembre: 8,
}

export default function AIAgentPage({ auth, navigate, route }) {
  const data = useDashboardData(auth)
  const { activeCrop, downloadReport, readings, todayReadings } = data
  const [date, setDate] = useState(() => new Date().toLocaleDateString('en-CA'))
  const [question, setQuestion] = useState('¿Cómo estuvo mi cultivo hoy?')
  const [messages, setMessages] = useState(() => [
    {
      role: 'assistant',
      text: 'Hola, soy el agente de análisis de Tlali. Puedo revisar el historial por fecha, comparar contra los rangos del cultivo y darte un resumen operativo.',
    },
  ])
  const [status, setStatus] = useState('idle')
  const messagesEndRef = useRef(null)

  const availableReadings = todayReadings.length ? todayReadings : readings
  const activeParameters = useMemo(() => getCropParameters(activeCrop), [activeCrop])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, status])

  async function askAgent(event) {
    event.preventDefault()
    const cleanQuestion = question.trim()
    if (!cleanQuestion) return
    const detectedDate = detectDate(cleanQuestion) ?? date
    setDate(detectedDate)
    setMessages((current) => [...current, { role: 'user', text: cleanQuestion }])
    setQuestion('')
    setStatus('thinking')
    try {
      const history = await fetchSensorHistory(auth, detectedDate)
      const sourceReadings = history.length ? history : (isToday(detectedDate) ? availableReadings : [])
      const localAnswer = buildAgentAnswer(cleanQuestion, detectedDate, sourceReadings, activeCrop, activeParameters, history.length > 0)
      const openAiAnswer = await askOpenAiAgent(auth, {
        crop: activeCrop,
        date: detectedDate,
        fallbackAnswer: localAnswer,
        firebaseHistory: history.length > 0,
        question: cleanQuestion,
        ranges: activeParameters,
        readings: sourceReadings,
      })
      setMessages((current) => [...current, { role: 'assistant', text: openAiAnswer }])
    } catch {
      setMessages((current) => [...current, {
        role: 'assistant',
        text: 'No pude consultar Firebase en este momento. Revisa que el backend esté encendido y que Firebase responda correctamente.',
      }])
    } finally {
      setStatus('idle')
    }
  }

  function useQuickQuestion(text) {
    setQuestion(text)
  }

  function handleQuestionKeyDown(event) {
    if (event.key !== 'Enter' || event.shiftKey) return
    event.preventDefault()
    event.currentTarget.form?.requestSubmit()
  }

  return (
    <div className="dashboard-shell min-h-screen text-tlali-ink">
      <DashboardNav auth={auth} downloadReport={downloadReport} hasReadings={availableReadings.length > 0} navigate={navigate} route={route} />
      <div className="mx-auto max-w-[1280px] px-4 py-5 sm:px-7 lg:px-10 lg:py-7">
        <section className="paper-card px-5 py-6 sm:px-7">
          <p className="eyebrow">Agente IA</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Preguntas sobre el cultivo</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-tlali-muted">
            Consulta el historial de Firebase por fecha y recibe un resumen comparado contra los rangos configurados del cultivo.
          </p>
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-[1fr_340px]">
          <article className="paper-card flex min-h-[680px] flex-col overflow-hidden bg-white/90">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e1dbcd] px-4 py-4 sm:px-5">
              <div>
                <p className="text-sm font-black">Chat del agente</p>
                <p className="mt-1 text-xs text-tlali-muted">Cultivo activo: {activeCrop?.name ?? 'Sin configurar'}</p>
              </div>
              <span className={`module-badge ${status === 'thinking' ? 'amber' : 'green'}`}>{status === 'thinking' ? 'Pensando' : 'Listo'}</span>
            </div>
            <div className="flex-1 space-y-4 overflow-auto bg-[#fffdf8] px-4 py-5 sm:px-6">
              {messages.map((message, index) => (
                <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`} key={`${message.role}-${index}`}>
                  <div className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm sm:max-w-[76%] ${message.role === 'user' ? 'rounded-br-md bg-tlali-jade-dark text-white' : 'rounded-bl-md border border-[#e1dbcd] bg-[#fcf8f0] text-tlali-ink'}`}>
                    <p className={`mb-1 text-[10px] font-black uppercase tracking-[0.06em] ${message.role === 'user' ? 'text-[#cfe7df]' : 'text-[#9b231e]'}`}>
                      {message.role === 'user' ? 'Tú' : 'Tlali IA'}
                    </p>
                    <div className="space-y-2">
                      {message.text.split('\n').filter((line, lineIndex, lines) => line.trim() || lineIndex === lines.length - 1).map((line, lineIndex) => (
                        <p key={`${line}-${lineIndex}`}>{line || ' '}</p>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              {status === 'thinking' && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-md border border-[#e1dbcd] bg-[#fcf8f0] px-4 py-3 text-sm font-bold text-tlali-muted shadow-sm">
                    Analizando historial y preparando respuesta...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <form className="border-t border-[#e1dbcd] bg-[#fffaf1] p-4 sm:p-5" onSubmit={askAgent}>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {QUICK_QUESTIONS.slice(0, 3).map((item) => (
                  <button className="rounded-full border border-[#d8cfbf] bg-white px-3 py-2 text-xs font-bold text-[#516158] transition hover:bg-[#f4ead6]" key={item} onClick={() => useQuickQuestion(item)} type="button">{item}</button>
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-[165px_1fr]">
                <label className="grid content-start gap-1 text-xs font-bold text-[#516158]">
                  Fecha
                  <input className="rounded-xl border border-[#d8cfbf] bg-white px-3 py-2 text-sm text-tlali-ink" onChange={(event) => setDate(event.target.value)} type="date" value={date} />
                </label>
                <label className="grid gap-1 text-xs font-bold text-[#516158]">
                  Mensaje
                  <textarea
                    className="min-h-[86px] resize-none rounded-2xl border border-[#d8cfbf] bg-white px-4 py-3 text-sm leading-6 text-tlali-ink outline-none transition focus:border-tlali-jade-dark focus:ring-2 focus:ring-[#cce8df]"
                    onChange={(event) => setQuestion(event.target.value)}
                    onKeyDown={handleQuestionKeyDown}
                    placeholder="Escribe una pregunta, por ejemplo: ¿cómo estuvo mi cultivo el 24 de agosto?"
                    value={question}
                  />
                </label>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-semibold text-tlali-muted">Enter envía · Shift+Enter agrega línea</p>
                <button className="primary-button w-full sm:w-auto" disabled={status === 'thinking' || !question.trim()} type="submit">
                  {status === 'thinking' ? 'Enviando...' : 'Enviar mensaje'}
                </button>
              </div>
            </form>
          </article>

          <aside className="grid content-start gap-4">
            <article className="paper-card p-4 sm:p-5">
              <p className="eyebrow">Prueba rápida</p>
              <h2 className="mt-1 text-lg font-bold">Preguntas sugeridas</h2>
              <div className="mt-4 grid gap-2">
                {QUICK_QUESTIONS.map((item) => (
                  <button className="secondary-button justify-start text-left" key={item} onClick={() => useQuickQuestion(item)} type="button">{item}</button>
                ))}
              </div>
            </article>
            <article className="paper-card p-4 sm:p-5">
              <p className="eyebrow">Datos usados</p>
              <div className="mt-3 grid gap-2 text-sm">
                <InfoRow label="Fuente" value="Firebase historial" />
                <InfoRow label="Cultivo" value={activeCrop?.name ?? 'Sin configurar'} />
                <InfoRow label="Fecha" value={formatDate(date)} />
                <InfoRow label="Hoy en memoria" value={`${availableReadings.length} registros`} />
              </div>
            </article>
          </aside>
        </section>
      </div>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-[#e1dbcd] bg-[#fcf8f0] px-3 py-2">
      <span className="text-xs font-bold text-tlali-muted">{label}</span>
      <strong className="text-right text-xs">{value}</strong>
    </div>
  )
}

async function fetchSensorHistory(auth, date) {
  const response = await authorizedFetch(`${API_URL}/api/v1/firebase/history?type=sensor&date=${date}`, auth.token, {}, auth.onUnauthorized)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const entries = await response.json()
  return entries.map(firebaseHistoryToReading).filter(Boolean)
}

async function askOpenAiAgent(auth, context) {
  if (!context.readings.length) {
    return context.fallbackAnswer
  }
  const metrics = buildMetricSummaries(context.readings, context.ranges)
  const ordered = [...context.readings].sort((left, right) => new Date(left.receivedAt).getTime() - new Date(right.receivedAt).getTime())
  const response = await authorizedFetch(`${API_URL}/api/v1/ai/crop-agent`, auth.token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cropName: context.crop?.name ?? 'Cultivo',
      date: context.date,
      firebaseHistory: context.firebaseHistory,
      firstReadingAt: ordered[0]?.receivedAt ?? null,
      lastReadingAt: ordered[ordered.length - 1]?.receivedAt ?? null,
      metrics,
      question: context.question,
      readingsCount: context.readings.length,
      stageName: context.crop?.stages?.find((stage) => stage.id === context.crop?.activeStageId)?.name ?? null,
    }),
  }, auth.onUnauthorized)
  if (response.status === 503 || response.status === 502) {
    const error = await response.json().catch(() => null)
    return `${context.fallbackAnswer}\n\nNota: ${error?.message ?? 'OpenAI no está disponible en este momento.'}`
  }
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  const data = await response.json()
  return data.answer ?? context.fallbackAnswer
}

function firebaseHistoryToReading(entry) {
  const data = parseJson(entry.dataJson)
  const gateway = parseJson(entry.gatewayJson)
  const receivedAt = entry.gatewayReceivedAt ?? gateway.recibidoUtc
  if (!receivedAt) return null
  return {
    deviceId: entry.node,
    receivedAt,
    conductivityUsCm: dataValue(data, 'conductivityUsCm', 'conductivity', 'ecUsCm'),
    humidityPercent: dataValue(data, 'airHumidityPct', 'airHumidityPercent', 'humidityPercent'),
    lightLux: dataValue(data, 'lightLux', 'lux', 'luminosityLux'),
    nitrogenMgKg: dataValue(data, 'nitrogenMgKg', 'nitrogen', 'nMgKg'),
    ph: dataValue(data, 'ph', 'substratePh'),
    phosphorusMgKg: dataValue(data, 'phosphorusMgKg', 'phosphorus', 'pMgKg'),
    potassiumMgKg: dataValue(data, 'potassiumMgKg', 'potassium', 'kMgKg'),
    soilMoisturePercent: dataValue(data, 'soilMoisturePct', 'soilMoisturePercent', 'capacitiveHumidityPct', 'capacitiveSoilMoisturePct'),
    soilTemperatureC: dataValue(data, 'soilTemperatureC', 'substrateTemperatureC'),
    temperatureCelsius: dataValue(data, 'airTemperatureC', 'temperatureCelsius', 'tempC'),
  }
}

function buildAgentAnswer(question, date, readings, crop, ranges, isFirebaseHistory) {
  if (!readings.length) {
    return `No encontré registros para ${formatDate(date)} en Firebase.\n\nSi esa fecha es anterior a que activáramos el historial en Firebase, no habrá datos para analizar. Desde ahora se irán acumulando mientras el backend esté encendido.`
  }

  const summary = [
    metricSummary('Humedad suelo', readings, 'soilMoisturePercent', '%', ranges.soilMoisturePercent),
    metricSummary('Humedad ambiente', readings, 'humidityPercent', '%', ranges.humidityPercent),
    metricSummary('Temperatura ambiente', readings, 'temperatureCelsius', ' °C', ranges.temperatureCelsius),
    metricSummary('Temperatura sustrato', readings, 'soilTemperatureC', ' °C', ranges.soilTemperatureC),
    metricSummary('pH', readings, 'ph', '', ranges.ph),
    metricSummary('Nitrógeno', readings, 'nitrogenMgKg', ' mg/kg', ranges.nitrogenMgKg),
    metricSummary('Fósforo', readings, 'phosphorusMgKg', ' mg/kg', ranges.phosphorusMgKg),
    metricSummary('Potasio', readings, 'potassiumMgKg', ' mg/kg', ranges.potassiumMgKg),
  ].filter(Boolean)
  const worst = [...summary].sort((left, right) => right.outPercent - left.outPercent)[0]
  const first = readings[0]?.receivedAt
  const last = readings[readings.length - 1]?.receivedAt
  const sourceText = isFirebaseHistory ? 'Firebase histórico' : 'lecturas disponibles de hoy'
  const questionLower = question.toLowerCase()

  if (questionLower.includes('humedad') || questionLower.includes('temperatura')) {
    return `Para ${formatDate(date)}, revisé ${readings.length} registros desde ${formatTime(first)} hasta ${formatTime(last)} usando ${sourceText}.\n\n${summary.filter((item) => item.label.includes('Humedad') || item.label.includes('Temperatura')).map(formatMetricLine).join('\n')}\n\nRecomendación: revisa primero las variables con mayor tiempo fuera de rango; si es de noche, interpreta humedad ambiental alta con más tolerancia.`
  }

  if (questionLower.includes('fuera') || questionLower.includes('rango') || questionLower.includes('variable')) {
    return `La variable más crítica para ${formatDate(date)} fue ${worst.label}: ${worst.outPercent}% de sus lecturas estuvo fuera del rango configurado.\n\n${formatMetricLine(worst)}\n\nDespués revisaría: ${summary.slice(1, 4).map((item) => item.label).join(', ')}.`
  }

  return `Resumen de ${crop?.name ?? 'cultivo'} para ${formatDate(date)}.\n\nAnalicé ${readings.length} registros desde ${formatTime(first)} hasta ${formatTime(last)} usando ${sourceText}.\n\n${summary.slice(0, 6).map(formatMetricLine).join('\n')}\n\nConclusión: ${worst.outPercent > 40 ? `hay que priorizar ${worst.label}, porque fue la variable con más lecturas fuera de rango.` : 'el día se ve relativamente estable en las variables principales disponibles.'}`
}

function metricSummary(label, readings, key, suffix, range) {
  const values = readings.map((reading) => toNumber(reading[key])).filter((value) => value !== null)
  if (!values.length) return null
  const min = toNumber(range?.min)
  const max = toNumber(range?.max)
  const outCount = min === null || max === null ? 0 : values.filter((value) => value < min || value > max).length
  return {
    average: values.reduce((sum, value) => sum + value, 0) / values.length,
    label,
    max: Math.max(...values),
    min: Math.min(...values),
    outPercent: Math.round((outCount / values.length) * 100),
    range,
    suffix,
  }
}

function buildMetricSummaries(readings, ranges) {
  return [
    metricSummary('Humedad suelo', readings, 'soilMoisturePercent', '%', ranges.soilMoisturePercent),
    metricSummary('Humedad ambiente', readings, 'humidityPercent', '%', ranges.humidityPercent),
    metricSummary('Temperatura ambiente', readings, 'temperatureCelsius', ' °C', ranges.temperatureCelsius),
    metricSummary('Temperatura sustrato', readings, 'soilTemperatureC', ' °C', ranges.soilTemperatureC),
    metricSummary('pH', readings, 'ph', '', ranges.ph),
    metricSummary('Conductividad', readings, 'conductivityUsCm', ' µS/cm', ranges.conductivityUsCm),
    metricSummary('Nitrógeno', readings, 'nitrogenMgKg', ' mg/kg', ranges.nitrogenMgKg),
    metricSummary('Fósforo', readings, 'phosphorusMgKg', ' mg/kg', ranges.phosphorusMgKg),
    metricSummary('Potasio', readings, 'potassiumMgKg', ' mg/kg', ranges.potassiumMgKg),
  ].filter(Boolean).map((item) => ({
    average: item.average,
    label: item.label,
    maximum: item.max,
    minimum: item.min,
    outOfRangePercent: item.outPercent,
    rangeMax: toNumber(item.range?.max),
    rangeMin: toNumber(item.range?.min),
    unit: item.suffix.trim(),
  }))
}

function formatMetricLine(item) {
  const range = item.range ? ` rango ${formatMetric(item.range.min, item.suffix)} a ${formatMetric(item.range.max, item.suffix)}` : ' sin rango configurado'
  return `${item.label}: promedio ${formatMetric(item.average, item.suffix)}, mínimo ${formatMetric(item.min, item.suffix)}, máximo ${formatMetric(item.max, item.suffix)}, ${item.outPercent}% fuera de rango (${range}).`
}

function detectDate(text) {
  const lower = text.toLowerCase()
  if (lower.includes('hoy')) return new Date().toLocaleDateString('en-CA')
  if (lower.includes('ayer')) {
    const date = new Date()
    date.setDate(date.getDate() - 1)
    return date.toLocaleDateString('en-CA')
  }
  const iso = lower.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/)
  if (iso) return iso[0]
  const numeric = lower.match(/\b(\d{1,2})[/-](\d{1,2})(?:[/-](20\d{2}))?\b/)
  if (numeric) {
    const year = Number(numeric[3] ?? new Date().getFullYear())
    return toLocalDate(year, Number(numeric[2]) - 1, Number(numeric[1]))
  }
  const named = lower.match(/\b(\d{1,2})\s+de\s+([a-záéíóúñ]+)(?:\s+de\s+(20\d{2}))?\b/)
  if (named) {
    const month = MONTHS[named[2].normalize('NFD').replace(/[\u0300-\u036f]/g, '')]
    if (month !== undefined) {
      const year = Number(named[3] ?? new Date().getFullYear())
      return toLocalDate(year, month, Number(named[1]))
    }
  }
  return null
}

function toLocalDate(year, month, day) {
  const date = new Date(year, month, day)
  return date.toLocaleDateString('en-CA')
}

function isToday(date) {
  return date === new Date().toLocaleDateString('en-CA')
}

function formatDate(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
}

function formatTime(date) {
  if (!date) return '-'
  return new Date(date).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
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
