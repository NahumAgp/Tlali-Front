export function toReadingPayload(form) {
  return {
    deviceId: form.deviceId.trim(),
    siteId: form.siteId.trim() || null,
    temperatureCelsius: Number(form.temperatureCelsius),
    humidityPercent: Number(form.humidityPercent),
    soilMoisturePercent: optionalNumber(form.soilMoisturePercent),
    lightLux: optionalNumber(form.lightLux),
    batteryVoltage: optionalNumber(form.batteryVoltage),
    recordedAt: new Date().toISOString(),
  }
}

function optionalNumber(value) {
  return value === '' ? null : Number(value)
}
