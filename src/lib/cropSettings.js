import { API_URL } from '../config/app.js'
import { authorizedFetch } from './auth.js'

export const CROP_SETTINGS_KEY = 'tlali_crop_settings'
export const ACTIVE_CROP_KEY = 'tlali_active_crop_id'
export const NODE_ASSIGNMENTS_KEY = 'tlali_node_assignments'
export const CROP_CONFIGURATION_KEY = 'tlali_crop_configuration'

export const SENSOR_PARAMETERS = [
  { key: 'soilMoisturePercent', label: 'Humedad capacitiva', unit: '%', min: 25, max: 85, source: 'Video Agrocejo: 60-80% H.A.; tolerancia operativa nocturna ampliada para sensores capacitivos.' },
  { key: 'substrateHumidityPercent', label: 'Humedad del sustrato', unit: '%', min: 25, max: 85, source: 'Video Agrocejo: 60-80% H.A.; tolerancia operativa nocturna ampliada para sensores capacitivos.' },
  { key: 'soilTemperatureC', label: 'Temperatura del sustrato', unit: '°C', min: 20, max: 25, source: 'Video Agrocejo: temperatura del sustrato óptima 20-25 °C.' },
  { key: 'temperatureCelsius', label: 'Temperatura ambiente', unit: '°C', min: 23, max: 26, source: 'Video Agrocejo: rangos por etapa de jitomate en invernadero.' },
  { key: 'ph', label: 'pH del sustrato', unit: 'pH', min: 5.2, max: 6.8, source: 'Oklahoma State Extension: medio sin suelo 5.5-6.5; IFAS: solución final 5.8-6.2.' },
  { key: 'humidityPercent', label: 'Humedad del aire', unit: '%', min: 60, max: 95, source: 'Video Agrocejo: 60-80%; tolerancia nocturna ampliada hasta 95% para evitar falsas alertas.' },
  { key: 'conductivityUsCm', label: 'Conductividad', unit: 'µS/cm', min: 2500, max: 3500, source: 'UF/IFAS HS1274: EC final 1.5-3.5 dS/m, sube conforme madura el cultivo.' },
  { key: 'nitrogenMgKg', label: 'Nitrógeno', unit: 'mg/kg', min: 100, max: 199, source: 'Oklahoma State Extension: NO3-N 40-199 ppm; IFAS: N aumenta por etapa.' },
  { key: 'phosphorusMgKg', label: 'Fósforo', unit: 'mg/kg', min: 6, max: 15, source: 'Oklahoma State Extension: P 3-15 ppm en extracto saturado.' },
  { key: 'potassiumMgKg', label: 'Potasio', unit: 'mg/kg', min: 150, max: 249, source: 'Oklahoma State Extension: K 60-249 ppm; IFAS: K aumenta en fructificación.' },
  { key: 'lightLux', label: 'Luminosidad', unit: 'lux', min: 0, max: 65000, source: 'Video Agrocejo: radiación óptima 3000 pie-bujía, equivalente aproximado a 32,000 lux.' },
]

export const TOMATO_STAGE_TEMPLATES = [
  {
    id: 'germinacion',
    name: 'Germinación y plántula',
    from: 'Siembra',
    to: 'Emergencia',
    durationDays: '4-10',
    description: 'Arranque estable: emergencia esperada en 4-10 días, con temperatura de aire 20-30 °C y sustrato 15-20 °C.',
    guidance: 'En siembra, cubrir la semilla con 0.5 cm de sustrato o vermiculita. Regar ligero con agua de buena calidad, EC menor a 1 mmho/cm si hay sales presentes, y temperatura del agua entre 20 y 30 °C. Puede usarse solución de arranque con 50 ppm de fósforo y 50 ppm de potasio como coadyuvantes de germinación.',
    parameters: {
      soilMoisturePercent: { min: 25, max: 85 },
      substrateHumidityPercent: { min: 25, max: 85 },
      soilTemperatureC: { min: 15, max: 20 },
      temperatureCelsius: { min: 20, max: 30 },
      ph: { min: 5.2, max: 6.8 },
      humidityPercent: { min: 60, max: 95 },
      conductivityUsCm: { min: 500, max: 1200 },
      nitrogenMgKg: { min: 20, max: 80 },
      phosphorusMgKg: { min: 3, max: 15 },
      potassiumMgKg: { min: 40, max: 120 },
      lightLux: { min: 0, max: 32000 },
    },
  },
  {
    id: 'crecimiento',
    name: 'Crecimiento vegetativo',
    from: 'Primeras hojas verdaderas',
    to: 'Aparición de primeros botones florales',
    durationDays: '45-60',
    description: 'Formación de estructura durante 45-60 días: controlar vigor, evitar exceso de nitrógeno y sostener raíces activas.',
    guidance: 'Buscar crecimiento balanceado. Si la planta se vuelve demasiado vegetativa, revisar exceso de nitrógeno, baja radiación, alta humedad o diferencia térmica día/noche demasiado marcada.',
    parameters: {
      soilMoisturePercent: { min: 25, max: 85 },
      substrateHumidityPercent: { min: 25, max: 85 },
      soilTemperatureC: { min: 20, max: 25 },
      temperatureCelsius: { min: 20, max: 25 },
      ph: { min: 5.2, max: 6.8 },
      humidityPercent: { min: 60, max: 95 },
      conductivityUsCm: { min: 1800, max: 2400 },
      nitrogenMgKg: { min: 140, max: 220 },
      phosphorusMgKg: { min: 35, max: 55 },
      potassiumMgKg: { min: 180, max: 240 },
      lightLux: { min: 0, max: 65000 },
    },
  },
  {
    id: 'floracion',
    name: 'Floración y polinización',
    from: 'Aparición de primeros botones florales',
    to: 'Cuajado de primeros frutos',
    durationDays: '55-75',
    description: 'Etapa crítica de 55-75 días: proteger polen, evitar calor alto y mantener humedad sin saturar.',
    guidance: 'Priorizar polinización y amarre. Evitar temperaturas mayores a 30-32 °C por periodos prolongados, porque cae la viabilidad del polen y aumenta aborto floral.',
    parameters: {
      soilMoisturePercent: { min: 25, max: 85 },
      substrateHumidityPercent: { min: 25, max: 85 },
      soilTemperatureC: { min: 20, max: 25 },
      temperatureCelsius: { min: 18, max: 26 },
      ph: { min: 5.2, max: 6.8 },
      humidityPercent: { min: 60, max: 95 },
      conductivityUsCm: { min: 2000, max: 2600 },
      nitrogenMgKg: { min: 120, max: 200 },
      phosphorusMgKg: { min: 45, max: 65 },
      potassiumMgKg: { min: 230, max: 300 },
      lightLux: { min: 0, max: 65000 },
    },
  },
  {
    id: 'fructificacion',
    name: 'Fructificación',
    from: 'Cuajado de primeros frutos',
    to: 'Fin de crecimiento de primeros frutos',
    durationDays: '90-175',
    description: 'Llenado de fruto entre 90-175 días: más demanda de agua, potasio y estabilidad térmica para evitar aborto y BER.',
    guidance: 'Aumenta la demanda de agua y potasio. Mantener humedad estable del sustrato, evitar acumulación de sales y vigilar desbalances K/Ca/Mg para reducir pudrición apical.',
    parameters: {
      soilMoisturePercent: { min: 25, max: 85 },
      substrateHumidityPercent: { min: 25, max: 85 },
      soilTemperatureC: { min: 20, max: 25 },
      temperatureCelsius: { min: 23, max: 26 },
      ph: { min: 5.2, max: 6.8 },
      humidityPercent: { min: 60, max: 95 },
      conductivityUsCm: { min: 2400, max: 3200 },
      nitrogenMgKg: { min: 140, max: 220 },
      phosphorusMgKg: { min: 50, max: 70 },
      potassiumMgKg: { min: 300, max: 400 },
      lightLux: { min: 0, max: 65000 },
    },
  },
  {
    id: 'maduracion',
    name: 'Maduración',
    from: 'Fin de crecimiento de primeros frutos',
    to: 'Primera recolección',
    durationDays: '105-135',
    description: 'Maduración hacia primera recolección, 105-135 días: temperatura moderada y sales bajo control.',
    guidance: 'Para color y calidad, mantener 22-26 °C y evitar superar 29 °C. Si la EC sube por concentración de sales, ajustar fertirriego y revisar drenaje/lixiviado.',
    parameters: {
      soilMoisturePercent: { min: 25, max: 85 },
      substrateHumidityPercent: { min: 25, max: 85 },
      soilTemperatureC: { min: 20, max: 25 },
      temperatureCelsius: { min: 22, max: 26 },
      ph: { min: 5.2, max: 6.8 },
      humidityPercent: { min: 60, max: 95 },
      conductivityUsCm: { min: 2200, max: 3000 },
      nitrogenMgKg: { min: 120, max: 200 },
      phosphorusMgKg: { min: 45, max: 65 },
      potassiumMgKg: { min: 280, max: 380 },
      lightLux: { min: 0, max: 65000 },
    },
  },
]

export const DEFAULT_CROPS = [
  {
    id: 'jitomate',
    name: 'Jitomate',
    description: 'Rangos profesionales por etapa para jitomate en invernadero.',
    activeStageId: 'fructificacion',
    activeStageStartedAt: todayLocalDate(),
    cropStartedAt: todayLocalDate(),
    stages: TOMATO_STAGE_TEMPLATES,
    parameters: getStageParameters('fructificacion', TOMATO_STAGE_TEMPLATES),
  },
]

export const DEFAULT_NODE_ASSIGNMENTS = [
  {
    node: 'tlali-npk-01',
    cropId: 'jitomate',
    activeStageId: 'fructificacion',
    activeStageStartedAt: todayLocalDate(),
    cropStartedAt: todayLocalDate(),
    greenhouse: 'Invernadero 1',
    area: 'Zona de cultivo',
  },
]

export function loadCropSettings() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(CROP_SETTINGS_KEY) ?? 'null')
    if (!Array.isArray(saved) || !saved.length) return DEFAULT_CROPS
    const filtered = saved.filter((crop) => crop.id !== 'lechuga')
    return filtered.length ? filtered.map(normalizeCrop) : DEFAULT_CROPS
  } catch {
    return DEFAULT_CROPS
  }
}

export function saveCropSettings(crops) {
  const cleanCrops = crops.filter((crop) => crop.id !== 'lechuga').map(normalizeCrop)
  window.localStorage.setItem(CROP_SETTINGS_KEY, JSON.stringify(cleanCrops))
  window.dispatchEvent(new Event('tlali-crop-settings-change'))
  return cleanCrops
}

export function loadActiveCropId() {
  const activeCropId = window.localStorage.getItem(ACTIVE_CROP_KEY)
  return activeCropId === 'lechuga' ? DEFAULT_CROPS[0].id : activeCropId ?? DEFAULT_CROPS[0].id
}

export function saveActiveCropId(cropId) {
  window.localStorage.setItem(ACTIVE_CROP_KEY, cropId === 'lechuga' ? DEFAULT_CROPS[0].id : cropId)
  window.dispatchEvent(new Event('tlali-crop-settings-change'))
}

export function getActiveCrop() {
  const crops = loadCropSettings()
  const activeId = loadActiveCropId()
  return crops.find((crop) => crop.id === activeId) ?? crops[0]
}

export function getCropStage(crop) {
  return getCropStageTiming(crop).stage
}

export function getCropStageTiming(crop) {
  const stages = crop?.stages?.length ? crop.stages : TOMATO_STAGE_TEMPLATES
  const configuredStage = stages.find((stage) => stage.id === crop?.activeStageId) ?? stages[0]
  let stageIndex = Math.max(0, stages.findIndex((stage) => stage.id === configuredStage.id))
  let daysElapsed = getDaysElapsed(crop?.activeStageStartedAt)
  let consumedDays = 0

  while (stageIndex < stages.length - 1) {
    const maxDays = getStageMaxDays(stages[stageIndex])
    if (daysElapsed < maxDays) break
    daysElapsed -= maxDays
    consumedDays += maxDays
    stageIndex += 1
  }

  return {
    configuredStage,
    daysElapsed,
    effectiveStartedAt: addDays(crop?.activeStageStartedAt, consumedDays),
    isAutoAdvanced: configuredStage.id !== stages[stageIndex]?.id,
    maxDays: getStageMaxDays(stages[stageIndex]),
    stage: stages[stageIndex] ?? configuredStage,
    totalDaysElapsed: getDaysElapsed(crop?.activeStageStartedAt),
  }
}

export function getCropParameters(crop) {
  return getCropStage(crop)?.parameters ?? crop?.parameters ?? defaultParameterMap()
}

export function getCropAgeDays(crop) {
  return getDaysElapsed(crop?.cropStartedAt)
}

export function loadNodeAssignments() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(NODE_ASSIGNMENTS_KEY) ?? 'null')
    if (!Array.isArray(saved) || !saved.length) return DEFAULT_NODE_ASSIGNMENTS
    return normalizeAssignments(saved)
  } catch {
    return DEFAULT_NODE_ASSIGNMENTS
  }
}

export function saveNodeAssignments(assignments) {
  const cleanAssignments = normalizeAssignments(assignments)
  window.localStorage.setItem(NODE_ASSIGNMENTS_KEY, JSON.stringify(cleanAssignments))
  window.dispatchEvent(new Event('tlali-crop-settings-change'))
  return cleanAssignments
}

export function loadCropConfiguration() {
  const crops = loadCropSettings()
  return normalizeCropConfiguration({
    activeCropId: loadActiveCropId(),
    crops,
    nodeAssignments: loadNodeAssignments(),
  })
}

export function saveCropConfiguration(configuration) {
  const cleanConfiguration = normalizeCropConfiguration(configuration)
  window.localStorage.setItem(CROP_CONFIGURATION_KEY, JSON.stringify(cleanConfiguration))
  window.localStorage.setItem(CROP_SETTINGS_KEY, JSON.stringify(cleanConfiguration.crops))
  window.localStorage.setItem(ACTIVE_CROP_KEY, cleanConfiguration.activeCropId)
  window.localStorage.setItem(NODE_ASSIGNMENTS_KEY, JSON.stringify(cleanConfiguration.nodeAssignments))
  window.dispatchEvent(new Event('tlali-crop-settings-change'))
  return cleanConfiguration
}

export async function loadRemoteCropConfiguration(auth) {
  const response = await authorizedFetch(`${API_URL}/api/v1/firebase/configuration`, auth.token, {}, auth.onUnauthorized)
  if (!response.ok) throw new Error('No se pudo leer la configuración de Firebase')
  const remoteConfiguration = await response.json()
  if (!remoteConfiguration?.crops?.length) {
    return saveRemoteCropConfiguration(auth, loadCropConfiguration())
  }
  return saveCropConfiguration(remoteConfiguration)
}

export async function saveRemoteCropConfiguration(auth, configuration) {
  const cleanConfiguration = normalizeCropConfiguration(configuration)
  const response = await authorizedFetch(`${API_URL}/api/v1/firebase/configuration`, auth.token, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cleanConfiguration),
  }, auth.onUnauthorized)
  if (!response.ok) throw new Error('No se pudo guardar la configuración en Firebase')
  const savedConfiguration = await response.json()
  return saveCropConfiguration(savedConfiguration)
}

export function getAssignmentForNode(nodeName, assignments = loadNodeAssignments()) {
  if (!nodeName) return null
  return assignments.find((assignment) => sameNode(assignment.node, nodeName)) ?? null
}

export function getCropForNode(nodeName, crops = loadCropSettings(), assignments = loadNodeAssignments()) {
  const assignment = getAssignmentForNode(nodeName, assignments)
  const crop = crops.find((item) => item.id === assignment?.cropId) ?? null
  return mergeCropWithAssignment(crop, assignment)
}

export function mergeCropWithAssignment(crop, assignment) {
  if (!crop) return null
  const activeStageId = crop.stages?.some((stage) => stage.id === assignment?.activeStageId)
    ? assignment.activeStageId
    : crop.activeStageId
  return normalizeCrop({
    ...crop,
    activeStageId,
    activeStageStartedAt: assignment?.activeStageStartedAt || crop.activeStageStartedAt,
    cropStartedAt: assignment?.cropStartedAt || crop.cropStartedAt,
  })
}

export function createCropFromName(name) {
  const cleanName = name.trim()
  const id = `${cleanName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`
  return {
    id,
    name: cleanName,
    description: 'Nuevo cultivo configurado por el administrador.',
    activeStageId: 'crecimiento',
    activeStageStartedAt: todayLocalDate(),
    cropStartedAt: todayLocalDate(),
    stages: TOMATO_STAGE_TEMPLATES.map((stage) => ({
      ...stage,
      parameters: cloneParameters(stage.parameters),
    })),
    parameters: getStageParameters('crecimiento', TOMATO_STAGE_TEMPLATES),
  }
}

export function createStageFromName(name) {
  const cleanName = name.trim()
  const id = `${cleanName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`
  return {
    id,
    name: cleanName,
    from: 'Inicio de etapa',
    to: 'Siguiente etapa',
    durationDays: '1-30',
    description: 'Nueva etapa configurada por el administrador.',
    guidance: 'Agrega aquí los cuidados recomendados para esta etapa.',
    parameters: defaultParameterMap(),
  }
}

export function isDefaultTomatoStage(stageId) {
  return TOMATO_STAGE_TEMPLATES.some((stage) => stage.id === stageId)
}

function normalizeCropConfiguration(configuration = {}) {
  const crops = Array.isArray(configuration.crops) && configuration.crops.length
    ? configuration.crops.filter((crop) => crop.id !== 'lechuga').map(normalizeCrop)
    : DEFAULT_CROPS.map(normalizeCrop)
  const activeCropId = crops.some((crop) => crop.id === configuration.activeCropId)
    ? configuration.activeCropId
    : crops[0]?.id ?? DEFAULT_CROPS[0].id
  return {
    schemaVersion: 1,
    activeCropId,
    crops,
    nodeAssignments: normalizeAssignments(configuration.nodeAssignments ?? DEFAULT_NODE_ASSIGNMENTS),
    updatedAt: configuration.updatedAt ?? null,
  }
}

function normalizeCrop(crop) {
  const baseStages = Array.isArray(crop?.stages) && crop.stages.length
    ? crop.stages
    : TOMATO_STAGE_TEMPLATES
  const stages = baseStages.map((stage) => ({
    ...stage,
    id: stage.id || `${String(stage.name ?? 'etapa').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`,
    name: stage.name || 'Etapa',
    from: stage.from || 'Inicio',
    to: stage.to || 'Fin',
    durationDays: stage.durationDays || '1-30',
    description: stage.description || 'Etapa configurada para monitoreo del cultivo.',
    guidance: stage.guidance || '',
    parameters: normalizeParameterMap(stage.parameters),
  }))
  const activeStageId = stages.some((stage) => stage.id === crop?.activeStageId)
    ? crop.activeStageId
    : stages[0]?.id
  return {
    ...crop,
    description: crop?.description || 'Rangos por etapa para monitoreo del cultivo.',
    activeStageId,
    activeStageStartedAt: crop?.activeStageStartedAt || todayLocalDate(),
    cropStartedAt: crop?.cropStartedAt || crop?.activeStageStartedAt || todayLocalDate(),
    stages,
    parameters: getStageParameters(activeStageId, stages),
  }
}

function getStageParameters(stageId, stages) {
  return cloneParameters(stages.find((stage) => stage.id === stageId)?.parameters ?? defaultParameterMap())
}

function normalizeParameterMap(parameters = {}) {
  return Object.fromEntries(SENSOR_PARAMETERS.map((parameter) => [
    parameter.key,
    {
      min: parameters?.[parameter.key]?.min ?? parameter.min,
      max: parameters?.[parameter.key]?.max ?? parameter.max,
    },
  ]))
}

function defaultParameterMap() {
  return Object.fromEntries(SENSOR_PARAMETERS.map((parameter) => [
    parameter.key,
    { min: parameter.min, max: parameter.max },
  ]))
}

function cloneParameters(parameters) {
  return Object.fromEntries(Object.entries(parameters).map(([key, range]) => [
    key,
    { min: range.min, max: range.max },
  ]))
}

function getStageMaxDays(stage) {
  const values = String(stage?.durationDays ?? '').match(/\d+/g)?.map(Number) ?? []
  return values.length ? Math.max(...values) : 0
}

function getDaysElapsed(date) {
  if (!date) return 0
  const start = new Date(`${date}T00:00:00`)
  if (Number.isNaN(start.getTime())) return 0
  const today = new Date(`${todayLocalDate()}T00:00:00`)
  return Math.max(0, Math.floor((today.getTime() - start.getTime()) / 86400000))
}

function addDays(date, days) {
  if (!date) return todayLocalDate()
  const next = new Date(`${date}T00:00:00`)
  if (Number.isNaN(next.getTime())) return todayLocalDate()
  next.setDate(next.getDate() + days)
  return next.toLocaleDateString('en-CA')
}

function todayLocalDate() {
  return new Date().toLocaleDateString('en-CA')
}

function normalizeAssignments(assignments) {
  const byNode = new Map()
  assignments
    .filter((assignment) => assignment?.node?.trim())
    .forEach((assignment) => {
      const cleanNode = assignment.node.trim()
      byNode.set(cleanNode.toLowerCase(), {
        node: cleanNode,
        cropId: assignment.cropId === 'lechuga' ? DEFAULT_CROPS[0].id : assignment.cropId || DEFAULT_CROPS[0].id,
        activeStageId: assignment.activeStageId || null,
        activeStageStartedAt: assignment.activeStageStartedAt || null,
        cropStartedAt: assignment.cropStartedAt || null,
        greenhouse: assignment.greenhouse?.trim() || 'Invernadero 1',
        area: assignment.area?.trim() || 'Zona de cultivo',
      })
    })
  return Array.from(byNode.values())
}

function sameNode(left, right) {
  return String(left).trim().toLowerCase() === String(right).trim().toLowerCase()
}

