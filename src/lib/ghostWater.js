import { toNumber } from './sensors.js'

const GHOST_WATER_KEY = 'tlali_ghost_water_ledger'
const DAILY_MIN_DROP_CM = 0.2
const DAILY_MAX_DROP_CM = 1.5
const MONTHLY_RECONCILIATION_DAYS = 30
const TANK_MAX_DISTANCE_CM = 120

export function loadGhostWaterLedger() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(GHOST_WATER_KEY) ?? '{}')
    return saved && typeof saved === 'object' ? saved : {}
  } catch {
    return {}
  }
}

export function updateGhostWaterLedger(ledger, ghostPump, actuatorNode) {
  const node = ghostPump?.node ?? actuatorNode?.node ?? 'actuadores'
  const realTankOne = firstNumber(actuatorNode?.data, 'tank1DistanceCm', 'tankOneDistanceCm', 'cisterna1Cm')
  const realTankTwo = firstNumber(actuatorNode?.data, 'tank2DistanceCm', 'tankTwoDistanceCm', 'cisterna2Cm')
  const today = localDate()
  const current = normalizeRecord(ledger?.[node], node, today)
  let changed = false
  let record = {
    ...current,
    node,
    realTank1DistanceCm: realTankOne,
    realTank2DistanceCm: realTankTwo,
    updatedAt: new Date().toISOString(),
  }

  if (realTankOne !== current.realTank1DistanceCm || realTankTwo !== current.realTank2DistanceCm) {
    changed = true
  }

  if (daysBetween(record.lastMonthlyUpdateAt, today) >= MONTHLY_RECONCILIATION_DAYS && record.pendingDropCm > 0) {
    record = {
      ...record,
      lastMonthlyUpdateAt: today,
      lastReconciledAt: today,
      monthlyAppliedDropCm: roundWater(record.monthlyAppliedDropCm + record.pendingDropCm),
      pendingDropCm: 0,
    }
    changed = true
  }

  if (ghostPump?.active && record.lastGhostActivationDate !== today) {
    record = {
      ...record,
      lastGhostActivationDate: today,
      pendingDropCm: roundWater(record.pendingDropCm + getDailyDropCm(ghostPump)),
    }
    changed = true
  }

  const nextLedger = { ...ledger, [node]: record }
  if (changed) saveGhostWaterLedger(nextLedger)
  return { changed, ledger: nextLedger, water: buildGhostWater(record) }
}

export function getGhostWaterForNode(ledger, ghostPump, actuatorNode) {
  const node = ghostPump?.node ?? actuatorNode?.node ?? 'actuadores'
  return buildGhostWater(normalizeRecord(ledger?.[node], node, localDate()))
}

function buildGhostWater(record) {
  const totalDropCm = roundWater(record.pendingDropCm + record.monthlyAppliedDropCm)
  const systemTank1DistanceCm = addDrop(record.realTank1DistanceCm, record.monthlyAppliedDropCm)
  const simulatedTank1DistanceCm = addDrop(record.realTank1DistanceCm, totalDropCm)

  return {
    ...record,
    daysToMonthlyUpdate: Math.max(0, MONTHLY_RECONCILIATION_DAYS - daysBetween(record.lastMonthlyUpdateAt, localDate())),
    nextMonthlyUpdateAt: addDays(record.lastMonthlyUpdateAt, MONTHLY_RECONCILIATION_DAYS),
    simulatedTank1DistanceCm,
    systemTank1DistanceCm,
    totalDropCm,
  }
}

function saveGhostWaterLedger(ledger) {
  window.localStorage.setItem(GHOST_WATER_KEY, JSON.stringify(ledger))
  window.dispatchEvent(new Event('tlali-ghost-water-change'))
}

function normalizeRecord(record, node, today) {
  return {
    lastGhostActivationDate: record?.lastGhostActivationDate ?? null,
    lastMonthlyUpdateAt: record?.lastMonthlyUpdateAt ?? today,
    lastReconciledAt: record?.lastReconciledAt ?? null,
    monthlyAppliedDropCm: toNumber(record?.monthlyAppliedDropCm) ?? 0,
    node,
    pendingDropCm: toNumber(record?.pendingDropCm) ?? 0,
    realTank1DistanceCm: toNumber(record?.realTank1DistanceCm),
    realTank2DistanceCm: toNumber(record?.realTank2DistanceCm),
    updatedAt: record?.updatedAt ?? null,
  }
}

function getDailyDropCm(ghostPump) {
  const deficit = Math.max(0, toNumber(ghostPump?.deficit) ?? 0)
  return roundWater(Math.min(DAILY_MAX_DROP_CM, Math.max(DAILY_MIN_DROP_CM, 0.2 + deficit * 0.04)))
}

function addDrop(value, drop) {
  const number = toNumber(value)
  if (number === null) return null
  return roundWater(Math.min(TANK_MAX_DISTANCE_CM, number + drop))
}

function firstNumber(source, ...keys) {
  for (const key of keys) {
    const value = toNumber(source?.[key])
    if (value !== null) return value
  }
  return null
}

function roundWater(value) {
  return Math.round((toNumber(value) ?? 0) * 10) / 10
}

function localDate(date = new Date()) {
  return date.toLocaleDateString('en-CA')
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00`)
  date.setDate(date.getDate() + days)
  return date.toLocaleDateString('en-CA')
}

function daysBetween(startDate, endDate) {
  const start = new Date(`${startDate}T00:00:00`).getTime()
  const end = new Date(`${endDate}T00:00:00`).getTime()
  if (Number.isNaN(start) || Number.isNaN(end)) return 0
  return Math.floor((end - start) / 86400000)
}
