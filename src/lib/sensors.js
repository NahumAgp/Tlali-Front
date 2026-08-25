import { SENSOR_PARAMETERS } from './cropSettings.js'

const SENSOR_META = {
  temperatureCelsius: { suffix: ' °C', lowText: 'Baja', highText: 'Alta', min: 0, max: 45 },
  humidityPercent: { suffix: '%', lowText: 'Seca', highText: 'Muy húmeda', min: 0, max: 100 },
  soilMoisturePercent: { suffix: '%', lowText: 'Necesita riego', highText: 'Saturada', min: 0, max: 100 },
  substrateHumidityPercent: { suffix: '%', lowText: 'Baja', highText: 'Alta', min: 0, max: 100 },
  soilTemperatureC: { suffix: ' °C', lowText: 'Baja', highText: 'Alta', min: 0, max: 45 },
  ph: { suffix: '', lowText: 'Bajo', highText: 'Alto', min: 0, max: 14 },
  conductivityUsCm: { suffix: ' µS/cm', lowText: 'Baja', highText: 'Alta', min: 0, max: 5000 },
  nitrogenMgKg: { suffix: ' mg/kg', lowText: 'Bajo', highText: 'Alto', min: 0, max: 200 },
  phosphorusMgKg: { suffix: ' mg/kg', lowText: 'Bajo', highText: 'Alto', min: 0, max: 150 },
  potassiumMgKg: { suffix: ' mg/kg', lowText: 'Bajo', highText: 'Alto', min: 0, max: 250 },
  lightLux: { suffix: ' lx', lowText: 'Baja', highText: 'Alta', min: 0, max: 100000 },
}

export const sensorDefinitions = SENSOR_PARAMETERS.map((parameter) => ({
  ...parameter,
  ...(SENSOR_META[parameter.key] ?? {}),
  healthyMin: parameter.min,
  healthyMax: parameter.max,
}))

export function formatMetric(value, suffix) {
  if (value === null || value === undefined || value === '' || Number.isNaN(Number(value))) return '--'
  return `${Number(value).toLocaleString('es-MX', { maximumFractionDigits: 1 })}${suffix}`
}

export function toNumber(value) {
  if (value === null || value === undefined || value === '') return null
  const number = Number(value)
  return Number.isNaN(number) ? null : number
}

export function buildSensorMetrics(latest, cropParameters = null) {
  return sensorDefinitions.map((definition) => {
    const cropRange = cropParameters?.[definition.key]
    const effectiveDefinition = {
      ...definition,
      healthyMin: toNumber(cropRange?.min) ?? definition.healthyMin,
      healthyMax: toNumber(cropRange?.max) ?? definition.healthyMax,
    }
    const value = toNumber(latest?.[definition.key])
    const status = getSensorStatus(value, effectiveDefinition)
    return {
      ...effectiveDefinition,
      value,
      formattedValue: formatMetric(value, effectiveDefinition.suffix),
      percent: getPercent(value, effectiveDefinition.min, effectiveDefinition.max),
      status: status.key,
      statusLabel: status.label,
      badgeClass: status.badgeClass,
    }
  })
}

function getSensorStatus(value, definition) {
  if (value === null) return { key: 'empty', label: 'Sin dato', badgeClass: 'bg-slate-100 text-slate-600' }
  if (value < definition.healthyMin) return { key: 'low', label: definition.lowText, badgeClass: 'bg-amber-100 text-amber-800' }
  if (value > definition.healthyMax) return { key: 'high', label: definition.highText, badgeClass: 'bg-rose-100 text-rose-800' }
  return { key: 'healthy', label: 'Normal', badgeClass: 'bg-emerald-100 text-emerald-800' }
}

export function getPercent(value, min, max) {
  if (value === null) return 0
  return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100))
}
