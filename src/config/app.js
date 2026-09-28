export const API_URL = import.meta.env.VITE_API_URL ?? ''
export const TOKEN_KEY = 'tlali_token'

export const initialReadingForm = {
  deviceId: 'esp32-tlali-sensor-01',
  siteId: 'tlali-tlapixqui-main',
  temperatureCelsius: '24.8',
  humidityPercent: '67.5',
  soilMoisturePercent: '41.2',
  lightLux: '1180',
  batteryVoltage: '3.7',
}
