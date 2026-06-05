import { app } from 'electron'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const MASTER_PASSWORD_HASH = process.env.MASTER_PASSWORD_HASH || 'f83244662ee78bf661577ecd28343bc4ff6538b6f249d6d7b1bf34817ec0ced4'
const ACTIVATION_FILE = 'activation.json'
const EXPIRATION_YEARS = 1

export type ActivationInfo = {
  activated: boolean
  activatedAt: string | null
  expiresAt: string | null
  daysRemaining: number | null
}

function getActivationPath(): string {
  return path.join(app.getPath('userData'), ACTIVATION_FILE)
}

function getMachineId(): string {
  try {
    const uuid = execSync('wmic csproduct get uuid', { encoding: 'utf-8' })
    const lines = uuid.split('\n').map(l => l.trim()).filter(Boolean)
    return lines[1] || crypto.randomUUID()
  } catch {
    return crypto.randomUUID()
  }
}

function isExpired(expiresAt: string | undefined): boolean {
  if (!expiresAt) return true
  return new Date() > new Date(expiresAt)
}

function computeDaysRemaining(expiresAt: string): number {
  const diffMs = new Date(expiresAt).getTime() - Date.now()
  return Math.max(0, Math.ceil(diffMs / 86400000))
}

export function checkActivation(): boolean {
  try {
    const filePath = getActivationPath()
    if (!fs.existsSync(filePath)) return false
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    if (isExpired(data.expiresAt)) return false
    const machineId = getMachineId()
    const expectedToken = crypto
      .createHmac('sha256', MASTER_PASSWORD_HASH)
      .update(machineId)
      .digest('hex')
    return data.token === expectedToken
  } catch {
    return false
  }
}

export function getActivationInfo(): ActivationInfo {
  try {
    const filePath = getActivationPath()
    if (!fs.existsSync(filePath)) {
      return { activated: false, activatedAt: null, expiresAt: null, daysRemaining: null }
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    const expired = isExpired(data.expiresAt)
    if (expired) {
      return {
        activated: false,
        activatedAt: data.activatedAt ?? null,
        expiresAt: data.expiresAt ?? null,
        daysRemaining: 0,
      }
    }
    return {
      activated: true,
      activatedAt: data.activatedAt ?? null,
      expiresAt: data.expiresAt,
      daysRemaining: computeDaysRemaining(data.expiresAt),
    }
  } catch {
    return { activated: false, activatedAt: null, expiresAt: null, daysRemaining: null }
  }
}

export function validatePassword(password: string): boolean {
  const hash = crypto.createHash('sha256').update(password).digest('hex')
  return hash === MASTER_PASSWORD_HASH
}

export function activateLicense(): boolean {
  try {
    const machineId = getMachineId()
    const token = crypto
      .createHmac('sha256', MASTER_PASSWORD_HASH)
      .update(machineId)
      .digest('hex')
    const activatedAt = new Date()
    const expiresAt = new Date(activatedAt)
    expiresAt.setFullYear(expiresAt.getFullYear() + EXPIRATION_YEARS)
    const filePath = getActivationPath()
    fs.writeFileSync(
      filePath,
      JSON.stringify({ token, activatedAt: activatedAt.toISOString(), expiresAt: expiresAt.toISOString() }, null, 2),
      'utf-8'
    )
    return true
  } catch {
    return false
  }
}
