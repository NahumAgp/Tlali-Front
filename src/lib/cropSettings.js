export const CROP_SETTINGS_KEY = 'tlali_crop_settings'
export const ACTIVE_CROP_KEY = 'tlali_active_crop_id'
export const NODE_ASSIGNMENTS_KEY = 'tlali_node_assignments'

export const SENSOR_PARAMETERS = [
  { key: 'soilMoisturePercent', label: 'Humedad capacitiva', unit: '%', min: 35, max: 70 },
  { key: 'substrateHumidityPercent', label: 'Humedad del sustrato', unit: '%', min: 35, max: 70 },
  { key: 'soilTemperatureC', label: 'Temperatura del sustrato', unit: '°C', min: 18, max: 28 },
  { key: 'temperatureCelsius', label: 'Temperatura ambiente', unit: '°C', min: 18, max: 30 },
  { key: 'ph', label: 'pH del sustrato', unit: 'pH', min: 5.8, max: 6.8 },
  { key: 'humidityPercent', label: 'Humedad del aire', unit: '%', min: 45, max: 80 },
  { key: 'conductivityUsCm', label: 'Conductividad', unit: 'µS/cm', min: 800, max: 2500 },
  { key: 'nitrogenMgKg', label: 'Nitrógeno', unit: 'mg/kg', min: 20, max: 80 },
  { key: 'phosphorusMgKg', label: 'Fósforo', unit: 'mg/kg', min: 10, max: 50 },
  { key: 'potassiumMgKg', label: 'Potasio', unit: 'mg/kg', min: 30, max: 120 },
  { key: 'lightLux', label: 'Luminosidad', unit: 'lux', min: 500, max: 60000 },
]

export const DEFAULT_CROPS = [
  {
    id: 'jitomate',
    name: 'Jitomate',
    description: 'Rangos base para monitoreo general de jitomate en invernadero.',
    parameters: Object.fromEntries(SENSOR_PARAMETERS.map((parameter) => [
      parameter.key,
      { min: parameter.min, max: parameter.max },
    ])),
  },
]

export const DEFAULT_NODE_ASSIGNMENTS = [
  {
    node: 'tlali-npk-01',
    cropId: 'jitomate',
    greenhouse: 'Invernadero 1',
    area: 'Zona de cultivo',
  },
]

export function loadCropSettings() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(CROP_SETTINGS_KEY) ?? 'null')
    if (!Array.isArray(saved) || !saved.length) return DEFAULT_CROPS
    const filtered = saved.filter((crop) => crop.id !== 'lechuga')
    return filtered.length ? filtered : DEFAULT_CROPS
  } catch {
    return DEFAULT_CROPS
  }
}

export function saveCropSettings(crops) {
  const cleanCrops = crops.filter((crop) => crop.id !== 'lechuga')
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

export function getAssignmentForNode(nodeName, assignments = loadNodeAssignments()) {
  if (!nodeName) return null
  return assignments.find((assignment) => sameNode(assignment.node, nodeName)) ?? null
}

export function getCropForNode(nodeName, crops = loadCropSettings(), assignments = loadNodeAssignments()) {
  const assignment = getAssignmentForNode(nodeName, assignments)
  return crops.find((crop) => crop.id === assignment?.cropId) ?? null
}

export function createCropFromName(name) {
  const cleanName = name.trim()
  const id = `${cleanName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`
  return {
    id,
    name: cleanName,
    description: 'Nuevo cultivo configurado por el administrador.',
    parameters: Object.fromEntries(SENSOR_PARAMETERS.map((parameter) => [
      parameter.key,
      { min: parameter.min, max: parameter.max },
    ])),
  }
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
        greenhouse: assignment.greenhouse?.trim() || 'Invernadero 1',
        area: assignment.area?.trim() || 'Zona de cultivo',
      })
    })
  return Array.from(byNode.values())
}

function sameNode(left, right) {
  return String(left).trim().toLowerCase() === String(right).trim().toLowerCase()
}
