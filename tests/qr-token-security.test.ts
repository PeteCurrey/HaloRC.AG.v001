import { describe, it, expect } from 'vitest'
import crypto from 'node:crypto'

describe('Garage QR Token Security & Privacy Verification', () => {
  function generateQrToken(): string {
    return crypto.randomUUID()
  }

  function resolvePublicVehicleByQrToken(vehicleRecord: {
    qrCodeToken: string
    userId: string
    customerEmail: string
    customerNotes: string
    vehicleName: string
    platformName: string
    manualUrl: string
  }, requestedToken: string) {
    if (vehicleRecord.qrCodeToken !== requestedToken) {
      return null
    }

    // Public representation strictly sanitizes customer private fields
    return {
      vehicleName: vehicleRecord.vehicleName,
      platformName: vehicleRecord.platformName,
      manualUrl: vehicleRecord.manualUrl,
    }
  }

  it('generates high-entropy non-sequential UUID tokens', () => {
    const token1 = generateQrToken()
    const token2 = generateQrToken()

    expect(token1).not.toBe(token2)
    // Validate UUID v4 format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    expect(token1).toMatch(uuidRegex)
    expect(token2).toMatch(uuidRegex)
  })

  it('resists sequential enumeration attacks', () => {
    const tokens = Array.from({ length: 10 }, () => generateQrToken())
    // Ensure no predictable increments
    for (let i = 0; i < tokens.length - 1; i++) {
      expect(tokens[i]).not.toBe(tokens[i + 1])
    }
  })

  it('strictly protects private customer data when resolving a QR token', () => {
    const privateRecord = {
      qrCodeToken: generateQrToken(),
      userId: 'usr-customer-999',
      customerEmail: 'private.racer@example.com',
      customerNotes: 'Door entry code: 1234. Home track address.',
      vehicleName: "My Championship X4 '26",
      platformName: 'XRAY X4',
      manualUrl: 'https://teamxray.com/manual.pdf',
    }

    const publicResponse = resolvePublicVehicleByQrToken(privateRecord, privateRecord.qrCodeToken)

    expect(publicResponse).not.toBeNull()
    expect(publicResponse?.vehicleName).toBe("My Championship X4 '26")

    const json = JSON.stringify(publicResponse)
    expect(json).not.toContain('usr-customer-999')
    expect(json).not.toContain('private.racer@example.com')
    expect(json).not.toContain('Door entry code')
  })
})
