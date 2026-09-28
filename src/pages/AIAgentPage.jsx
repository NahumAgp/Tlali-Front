import { useEffect, useMemo, useRef, useState } from 'react'
import { DashboardNav } from '../components/dashboard/DashboardWidgets.jsx'
import { API_URL } from '../config/app.js'
import { authorizedFetch } from '../lib/auth.js'
import { getCropParameters } from '../lib/cropSettings.js'
import { formatMetric, toNumber } from '../lib/sensors.js'
import useDashboardData from '../hooks/useDashboardData.js'

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
  const [question, setQuestion] = useState('')
  const [responseLanguage, setResponseLanguage] = useState('es')
  const [messages, setMessages] = useState(() => [
    {
      role: 'assistant',
      text: 'Hola, soy el agente de análisis de Tlali. Puedo revisar el historial por fecha, comparar contra los rangos del cultivo y darte un resumen operativo.',
    },
  ])
  const [status, setStatus] = useState('idle')
  const [voiceStatus, setVoiceStatus] = useState('idle')
  const [isRecording, setIsRecording] = useState(false)
  const [voiceLevel, setVoiceLevel] = useState(0)
  const [detectedVoiceLanguage, setDetectedVoiceLanguage] = useState(null)
  const audioChunksRef = useRef([])
  const analyserRef = useRef(null)
  const audioContextRef = useRef(null)
  const animationFrameRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const mediaStreamRef = useRef(null)
  const messagesEndRef = useRef(null)

  const availableReadings = todayReadings.length ? todayReadings : readings
  const activeParameters = useMemo(() => getCropParameters(activeCrop), [activeCrop])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, status])

  useEffect(() => () => {
    stopVoiceMeter()
    stopMediaStream()
  }, [])

  async function askAgent(event) {
    event.preventDefault()
    const cleanQuestion = question.trim()
    if (!cleanQuestion) return
    const detectedDate = detectDate(cleanQuestion) ?? date
    const historyRange = detectHistoryRange(cleanQuestion, detectedDate)
    const periodLabel = formatHistoryPeriod(historyRange)
    setDate(historyRange.endDate)
    setMessages((current) => [...current, { role: 'user', text: cleanQuestion }])
    setQuestion('')
    setStatus('thinking')
    try {
      const history = await fetchSensorHistory(auth, historyRange).catch(() => [])
      const sourceReadings = history.length ? history : (isToday(historyRange.endDate) ? availableReadings : [])
      const localAnswer = buildAgentAnswer(cleanQuestion, periodLabel, sourceReadings, activeCrop, activeParameters, history.length > 0)
      const openAiAnswer = await askOpenAiAgent(auth, {
        crop: activeCrop,
        date: periodLabel,
        fallbackAnswer: localAnswer,
        firebaseHistory: history.length > 0,
        question: cleanQuestion,
        ranges: activeParameters,
        readings: sourceReadings,
        responseLanguage,
      })
      setMessages((current) => [...current, { role: 'assistant', text: openAiAnswer }])
    } catch {
      setMessages((current) => [...current, {
        role: 'assistant',
        text: 'No pude preparar la respuesta en este momento. Revisa que el backend esté encendido e intenta otra vez.',
      }])
    } finally {
      setStatus('idle')
    }
  }

  function handleQuestionKeyDown(event) {
    if (event.key !== 'Enter' || event.shiftKey) return
    event.preventDefault()
    event.currentTarget.form?.requestSubmit()
  }

  async function toggleRecording() {
    if (isRecording) {
      mediaRecorderRef.current?.stop()
      return
    }

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setVoiceStatus('unsupported')
      return
    }

    try {
      setVoiceStatus('recording')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream
      startVoiceMeter(stream)
      audioChunksRef.current = []
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : undefined
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      mediaRecorderRef.current = recorder
      recorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data)
      })
      recorder.addEventListener('stop', () => {
        transcribeRecording(recorder.mimeType || 'audio/webm')
      })
      recorder.start()
      setIsRecording(true)
    } catch {
      setIsRecording(false)
      setVoiceStatus('error')
      stopMediaStream()
    }
  }

  async function transcribeRecording(mimeType) {
    setIsRecording(false)
    stopMediaStream()
    setVoiceLevel(0)

    const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
    audioChunksRef.current = []
    if (!audioBlob.size) {
      setVoiceStatus('empty')
      return
    }

    setVoiceStatus('transcribing')
    const formData = new FormData()
    formData.append('audio', audioBlob, 'voice-message.webm')

    try {
      const response = await authorizedFetch(`${API_URL}/api/v1/ai/transcribe`, auth.token, {
        method: 'POST',
        body: formData,
      }, auth.onUnauthorized)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      const transcript = data.text?.trim()
      if (!transcript) {
        setVoiceStatus('empty')
        return
      }
      const detected = detectVoiceLanguage(data.language, transcript)
      setDetectedVoiceLanguage(detected)
      if (detected) setResponseLanguage(detected)
      setQuestion((current) => current.trim() ? `${current.trim()}\n${transcript}` : transcript)
      setVoiceStatus(detected === 'otomi' ? 'readyOtomi' : 'readySpanish')
    } catch {
      setVoiceStatus('error')
    }
  }

  function startVoiceMeter(stream) {
    stopVoiceMeter()
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      const audioContext = new AudioContext()
      const analyser = audioContext.createAnalyser()
      const source = audioContext.createMediaStreamSource(stream)
      analyser.fftSize = 256
      source.connect(analyser)
      audioContextRef.current = audioContext
      analyserRef.current = analyser
      const samples = new Uint8Array(analyser.frequencyBinCount)

      function tick() {
        analyser.getByteFrequencyData(samples)
        const average = samples.reduce((sum, value) => sum + value, 0) / samples.length
        setVoiceLevel(Math.min(1, average / 95))
        animationFrameRef.current = window.requestAnimationFrame(tick)
      }

      tick()
    } catch {
      setVoiceLevel(0.35)
    }
  }

  function stopVoiceMeter() {
    if (animationFrameRef.current) {
      window.cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    audioContextRef.current?.close().catch(() => {})
    audioContextRef.current = null
    analyserRef.current = null
  }

  function stopMediaStream() {
    stopVoiceMeter()
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
    mediaStreamRef.current = null
  }

  return (
    <div className="dashboard-shell min-h-screen text-tlali-ink">
      <DashboardNav auth={auth} downloadReport={downloadReport} hasReadings={availableReadings.length > 0} navigate={navigate} route={route} />
      <div className="mx-auto max-w-[1280px] px-4 py-5 sm:px-7 lg:px-10 lg:py-7">
        <section className="paper-card px-5 py-6 sm:px-7">
          <p className="eyebrow">Agente IA</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Preguntas sobre el cultivo</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-tlali-muted">
            Consulta el historial guardado en MySQL y recibe un resumen comparado contra los rangos configurados del cultivo.
          </p>
        </section>

        <section className="mt-4">
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
                    <div className={`message-content ${message.role === 'user' ? 'user' : 'assistant'}`}>
                      {renderMessageContent(message.text)}
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
            <form className="chat-composer" onSubmit={askAgent}>
              <div className="composer-topline">
                <div className="language-switch" aria-label="Idioma de respuesta">
                  <button className={responseLanguage === 'es' ? 'active' : ''} onClick={() => setResponseLanguage('es')} type="button">Español</button>
                  <button className={responseLanguage === 'otomi' ? 'active' : ''} onClick={() => setResponseLanguage('otomi')} type="button">Otomí</button>
                </div>
                <p className="composer-status">{voiceStatusMessage(voiceStatus, detectedVoiceLanguage)}</p>
              </div>

              {isRecording && <VoiceMeter level={voiceLevel} />}

              <div className={`composer-row ${isRecording ? 'recording' : ''}`}>
                <textarea
                  aria-label="Mensaje"
                  className="composer-input"
                  disabled={isRecording || voiceStatus === 'transcribing'}
                  onChange={(event) => setQuestion(event.target.value)}
                  onKeyDown={handleQuestionKeyDown}
                  placeholder={isRecording ? 'Escuchando...' : 'Pregunta lo que quieras sobre el cultivo.'}
                  rows={1}
                  value={question}
                />
                <button
                  aria-label={isRecording ? 'Detener grabación' : 'Grabar mensaje de voz'}
                  className={`composer-mic ${isRecording ? 'active' : ''}`}
                  disabled={status === 'thinking' || voiceStatus === 'transcribing'}
                  onClick={toggleRecording}
                  type="button"
                >
                  <MicIcon active={isRecording} />
                </button>
                <button className="composer-send" disabled={status === 'thinking' || !question.trim() || isRecording} type="submit" aria-label="Enviar mensaje">
                  {status === 'thinking' ? <span className="send-spinner" /> : <SendIcon />}
                </button>
              </div>
            </form>
          </article>
        </section>
      </div>
    </div>
  )
}

function VoiceMeter({ level }) {
  const normalized = Math.max(0.08, Math.min(1, level))
  return (
    <div className="voice-meter" aria-label="Nivel de voz detectado">
      <span className="voice-dot" />
      <div className="voice-wave">
        {Array.from({ length: 18 }, (_, index) => {
          const phase = Math.sin((index + 1) * 0.85) * 0.5 + 0.5
          const height = 18 + Math.round(normalized * (18 + phase * 34))
          return <i key={index} style={{ height: `${height}px` }} />
        })}
      </div>
      <strong>{level > 0.18 ? 'Voz detectada' : 'Escuchando'}</strong>
    </div>
  )
}

function MicIcon({ active }) {
  return (
    <svg aria-hidden="true" className="composer-icon" fill="none" viewBox="0 0 24 24">
      <path d="M12 14.5a3.5 3.5 0 0 0 3.5-3.5V6a3.5 3.5 0 0 0-7 0v5a3.5 3.5 0 0 0 3.5 3.5Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <path d="M5 10.5a7 7 0 0 0 14 0M12 17.5V21M9 21h6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      {active && <circle cx="18" cy="5" fill="currentColor" r="2" />}
    </svg>
  )
}

function SendIcon() {
  return (
    <svg aria-hidden="true" className="composer-icon" fill="none" viewBox="0 0 24 24">
      <path d="m4 12 16-7-7 16-2-7-7-2Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <path d="m11 13 4-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  )
}

function renderMessageContent(text) {
  const blocks = []
  let listItems = []

  function flushList() {
    if (!listItems.length) return
    const items = listItems
    listItems = []
    blocks.push(
      <ul className="message-list" key={`list-${blocks.length}`}>
        {items.map((item, index) => <li key={`${item}-${index}`}>{renderInlineContent(item)}</li>)}
      </ul>,
    )
  }

  text.split('\n').forEach((line, index) => {
    const trimmed = line.trim()
    if (!trimmed) {
      flushList()
      blocks.push(<span className="message-space" key={`space-${index}`} />)
      return
    }
    if (trimmed.startsWith('### ')) {
      flushList()
      blocks.push(<h3 className="message-heading" key={`heading-${index}`}>{renderInlineContent(trimmed.slice(4))}</h3>)
      return
    }
    if (trimmed.startsWith('- ')) {
      listItems.push(trimmed.slice(2))
      return
    }
    flushList()
    blocks.push(<p key={`paragraph-${index}`}>{renderInlineContent(trimmed)}</p>)
  })
  flushList()

  return blocks
}

function renderInlineContent(text) {
  const parts = []
  const pattern = /(\*\*[^*]+\*\*|\[[^\]]+\]\(https?:\/\/[^)]+\))/g
  let cursor = 0
  let match
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > cursor) {
      parts.push(text.slice(cursor, match.index))
    }
    const token = match[0]
    if (token.startsWith('**')) {
      parts.push(<strong key={`strong-${match.index}`}>{token.slice(2, -2)}</strong>)
    } else {
      const linkMatch = token.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/)
      if (linkMatch) {
        parts.push(
          <a href={linkMatch[2]} key={`link-${match.index}`} rel="noreferrer" target="_blank">
            {linkMatch[1]}
          </a>,
        )
      }
    }
    cursor = match.index + token.length
  }
  if (cursor < text.length) {
    parts.push(text.slice(cursor))
  }
  return parts.map((part, index) => typeof part === 'string' ? <span key={`text-${index}`}>{part}</span> : part)
}

async function fetchSensorHistory(auth, range) {
  const isRange = range.startDate !== range.endDate
  const query = isRange
    ? `startDate=${range.startDate}&endDate=${range.endDate}&limit=100000`
    : `date=${range.startDate}`
  const response = await authorizedFetch(`${API_URL}/api/v1/firebase/history?type=sensor&${query}`, auth.token, {}, auth.onUnauthorized)
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
      responseLanguage: context.responseLanguage,
      stageName: context.crop?.stages?.find((stage) => stage.id === context.crop?.activeStageId)?.name ?? null,
    }),
  }, auth.onUnauthorized)
  if (response.status === 503 || response.status === 502) {
    const error = await response.json().catch(() => null)
    return `${context.fallbackAnswer}\n\nNota: ${error?.message ?? 'OpenAI no está disponible en este momento.'}`
  }
  if (!response.ok) {
    return `${context.fallbackAnswer}\n\nNota: OpenAI no respondió correctamente, así que usé el análisis local del cultivo.`
  }
  try {
    const data = await response.json()
    return data.answer ?? context.fallbackAnswer
  } catch {
    return `${context.fallbackAnswer}\n\nNota: OpenAI respondió en un formato inesperado, así que usé el análisis local del cultivo.`
  }
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

function buildAgentAnswer(question, periodLabel, readings, crop, ranges, isDatabaseHistory) {
  if (!readings.length) {
    return `Sin datos para ${periodLabel}.\nAcción: confirma que el backend esté encendido y que MySQL tenga registros de ese periodo.`
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
  const sourceText = isDatabaseHistory ? 'historial MySQL' : 'lecturas disponibles en tiempo real'
  const questionLower = question.toLowerCase()

  if (questionLower.includes('humedad') || questionLower.includes('temperatura')) {
    const lines = summary.filter((item) => item.label.includes('Humedad') || item.label.includes('Temperatura')).slice(0, 4)
    return `### Diagnóstico rápido\n- 📊 **Lecturas:** ${readings.length} (${formatTime(first)}-${formatTime(last)}, ${sourceText}).\n${lines.map((item) => `- ${severityIcon(item.outPercent)} **${item.label}:** ${formatMetricLine(item)}`).join('\n')}\n### Acción prioritaria\n- ✅ **Prioriza** la variable con mayor % fuera de rango y confirma sensor antes de ajustar manejo.\n### Para aprender más\n- ▶️ [Temperatura y humedad en invernadero](https://www.youtube.com/results?search_query=temperatura+humedad+invernadero+jitomate)\n- ▶️ [Manejo ambiental en jitomate](https://www.youtube.com/results?search_query=manejo+ambiental+jitomate+invernadero)`
  }

  if (questionLower.includes('fuera') || questionLower.includes('rango') || questionLower.includes('variable')) {
    return `### Diagnóstico rápido\n- 🔴 **Variable crítica:** ${worst.label} (${worst.outPercent}% fuera de rango).\n- ${severityIcon(worst.outPercent)} **Detalle:** ${formatMetricLine(worst)}\n### Acción prioritaria\n- ✅ **Verifica/calibra** el sensor y revisa condición física del cultivo antes de ajustar fertilización, riego o clima.\n### Para aprender más\n- ▶️ [Calibración de sensores agrícolas](https://www.youtube.com/results?search_query=calibracion+sensores+agricolas+ph+ec)\n- ▶️ [Interpretar pH y conductividad en cultivo](https://www.youtube.com/results?search_query=ph+conductividad+electrica+solucion+nutritiva+jitomate)`
  }

  return `### Diagnóstico rápido\n- 🌱 **${crop?.name ?? 'Cultivo'}:** ${periodLabel}, ${readings.length} registros (${formatTime(first)}-${formatTime(last)}, ${sourceText}).\n${summary.slice(0, 5).map((item) => `- ${severityIcon(item.outPercent)} **${item.label}:** ${formatMetricLine(item)}`).join('\n')}\n### Acción prioritaria\n- ✅ **${worst.outPercent > 40 ? `Revisar ${worst.label}` : 'Mantener monitoreo'}** ${worst.outPercent > 40 ? 'y confirmar sensor antes de aplicar correcciones.' : 'porque las variables principales se ven estables.'}\n### Para aprender más\n- ▶️ [Manejo de jitomate en invernadero](https://www.youtube.com/results?search_query=manejo+jitomate+invernadero)\n- ▶️ [pH y CE en solución nutritiva](https://www.youtube.com/results?search_query=ph+ce+solucion+nutritiva+jitomate)`
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
  const range = item.range ? `${formatMetric(item.range.min, item.suffix)}-${formatMetric(item.range.max, item.suffix)}` : 'sin rango'
  return `${item.label}: prom. ${formatMetric(item.average, item.suffix)}, ${item.outPercent}% fuera (${range}).`
}

function severityIcon(outPercent) {
  if (outPercent >= 60) return '🔴'
  if (outPercent >= 25) return '🟡'
  return '🟢'
}

function detectHistoryRange(text, fallbackDate) {
  const normalized = normalizeText(text)
  let days = 1
  if (/todo el historial|todo el tiempo|desde el inicio|historico completo/.test(normalized)) days = 90
  else if (/ultimos?\s+(dos|2)\s+meses|2\s+meses/.test(normalized)) days = 60
  else if (/ultimos?\s+(tres|3)\s+meses|3\s+meses/.test(normalized)) days = 90
  else if (/ultimo\s+mes|ultimos?\s+30\s+dias/.test(normalized)) days = 30
  else if (/ultima\s+semana|ultimos?\s+7\s+dias/.test(normalized)) days = 7
  if (days === 1) return { startDate: fallbackDate, endDate: fallbackDate }
  const end = new Date()
  const start = new Date(end)
  start.setDate(start.getDate() - (days - 1))
  return {
    startDate: start.toLocaleDateString('en-CA'),
    endDate: end.toLocaleDateString('en-CA'),
  }
}

function formatHistoryPeriod(range) {
  if (range.startDate === range.endDate) return formatDate(range.startDate)
  return `${formatDate(range.startDate)} a ${formatDate(range.endDate)}`
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

function voiceStatusMessage(status, detectedLanguage) {
  if (status === 'recording') return 'Grabando voz...'
  if (status === 'transcribing') return 'Convirtiendo voz a texto...'
  if (status === 'readyOtomi') return 'Voz convertida. Idioma detectado: otomí.'
  if (status === 'readySpanish') return `Voz convertida.${detectedLanguage === 'es' ? ' Idioma detectado: español.' : ''}`
  if (status === 'empty') return 'No detecté voz en la grabación.'
  if (status === 'unsupported') return 'Este navegador no permite grabar voz aquí.'
  if (status === 'error') return 'No pude procesar el audio.'
  return 'Enter envía · Shift+Enter agrega línea'
}

function detectVoiceLanguage(language, transcript) {
  const normalizedLanguage = normalizeText(language ?? '')
  const normalizedTranscript = normalizeText(transcript ?? '')
  if (
    normalizedLanguage.includes('otomi')
    || normalizedLanguage.includes('hnahnu')
    || normalizedLanguage.includes('hñahñu')
    || normalizedLanguage.includes('oto')
    || /\b(hnahnu|hñahñu|nugi|mfa?di|xudi|juadi|ntudi|otomi)\b/.test(normalizedTranscript)
    || /[äëïöüʼ]/i.test(transcript)
  ) {
    return 'otomi'
  }
  if (
    normalizedLanguage.includes('spanish')
    || normalizedLanguage.includes('espanol')
    || normalizedLanguage === 'es'
    || /\b(el|la|los|las|cultivo|jitomate|humedad|temperatura|riego|planta)\b/.test(normalizedTranscript)
  ) {
    return 'es'
  }
  return null
}

function normalizeText(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
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
