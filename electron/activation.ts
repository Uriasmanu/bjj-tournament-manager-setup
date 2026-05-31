import { app } from 'electron'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const MASTER_PASSWORD_HASH = process.env.MASTER_PASSWORD_HASH || '57a8d2d84be94e9bdae407ad8352065346269c6997b0be31ff32101fc51e7c3e'
const ACTIVATION_FILE = 'activation.json'

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

export function checkActivation(): boolean {
  try {
    const filePath = getActivationPath()
    if (!fs.existsSync(filePath)) return false
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
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
    const filePath = getActivationPath()
    fs.writeFileSync(filePath, JSON.stringify({ token, activatedAt: new Date().toISOString() }), 'utf-8')
    return true
  } catch {
    return false
  }
}
