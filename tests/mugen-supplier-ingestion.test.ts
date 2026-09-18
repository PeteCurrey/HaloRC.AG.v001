// tests/mugen-supplier-ingestion.test.ts
// Vitest suite verifying Mugen Seiki Europe authoritative supplier ingestion,
// defect handling, price conflict precedence, literal translation, and idempotency.

import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import { describe, it, expect } from 'vitest'

// Ensure local environment is loaded for tests connecting to database
const envPath = resolve(__dirname, '../.env.local')
if (existsSync(envPath)) {
  const lines = readFileSync(envPath, 'utf8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    const key = trimmed.slice(0, idx).trim()
    const value = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '')
    if (!process.env[key]) process.env[key] = value
  }
}

import {
  MugenSupplierIngestionEngine,
  parseSupplierCsvLine,
  translateGermanOnly,
  classifyMugenProduct,
} from '@halo-rc/db'

describe('Mugen Supplier Data Ingestion & Defect Handling', () => {
  describe('1. CSV Parsing & Quoted Commas', () => {
    it('handles escaped quotes and commas within cells correctly', () => {
      const line = 'A2166,"Oberdeck (1,6mm Optional)",55.00,EUR'
      const parsed = parseSupplierCsvLine(line)
      expect(parsed).toEqual(['A2166', 'Oberdeck (1,6mm Optional)', '55.00', 'EUR'])
    })

    it('handles multiple quotes inside double quotes', () => {
      const line = 'E2027,"MBX-8 ""R"" NITRO 1/8 4WD OFF-ROAD BUGGY",529,xxx'
      const parsed = parseSupplierCsvLine(line)
      expect(parsed[0]).toBe('E2027')
      expect(parsed[1]).toBe('MBX-8 "R" NITRO 1/8 4WD OFF-ROAD BUGGY')
      expect(parsed[2]).toBe('529')
      expect(parsed[3]).toBe('xxx')
    })
  })

  describe('2. Literal German RC Translation (No Spec Invention)', () => {
    it('translates compound German technical names literally', () => {
      const cases = [
        { input: 'Bauanleitung MTC-2R', expected: 'Instruction Manual MTC-2R' },
        { input: 'RADIOPLATTENHALTER MRX-5', expected: 'Radio Plate Holder MRX-5' },
        { input: 'AKKU-HALTER MRX-5', expected: 'Battery Holder MRX-5' },
        { input: 'Querlenkerhalter oben', expected: 'Suspension Arm Mount Upper' },
        { input: 'Querlenker oben & Zubehörteile (hart)', expected: 'Suspension Arm Upper & Accessories (Hard)' },
        { input: 'Oberdeck (1,6mm Optional)', expected: 'Upper Deck (1,6mm Optional)' },
        { input: 'Querlenker Vorderachse unten (-1mm)', expected: 'Suspension Arm Front Lower (-1mm)' },
        { input: 'Lenkhebel (Radträger)', expected: 'Steering Arm (Wheel Hub Carrier)' },
      ]

      for (const tc of cases) {
        const result = translateGermanOnly(tc.input)
        expect(result.english).toBe(tc.expected)
        expect(result.confidence).toBe('INFERRED')
      }
    })

    it('leaves already-English names intact with VERIFIED confidence', () => {
      const english = 'FRONT CASTER BLOCK PIN (2)'
      const result = translateGermanOnly(english)
      expect(result.english).toBe(english)
      expect(result.confidence).toBe('VERIFIED')
    })
  })

  describe('3. Classification & Deterministic Mapping', () => {
    it('classifies all 10 complete kits as COMPLETE_KIT / KIT', () => {
      const kits = [
        'A2006', 'B2001', 'E2027', 'E2027-PREMIUM', 'E2028',
        'E2028-PREMIUM', 'E2029', 'E2030', 'H2009', 'T2006'
      ]
      for (const sku of kits) {
        const cls = classifyMugenProduct(sku, `Mugen Kit ${sku}`)
        expect(cls.productType).toBe('KIT')
        expect(cls.category).toBe('COMPLETE_KIT')
      }
    })

    it('classifies carbon and titanium hop-ups as OPTION_PART', () => {
      const cls = classifyMugenProduct('A2166', 'Carbon Upper Deck 1.6mm')
      expect(cls.productType).toBe('OPTION_PART')
      expect(cls.category).toBe('OPTION_PART')
    })

    it('classifies tools as TOOLS without vehicle part confusion', () => {
      const cls = classifyMugenProduct('B0545', 'Clutch Spring Tool')
      expect(cls.productType).toBe('TOOLS')
      expect(cls.category).toBe('TOOLS')
    })

    it('classifies silicone oils as ACCESSORY', () => {
      const cls = classifyMugenProduct('B0230', 'Silicone Oil #300')
      expect(cls.productType).toBe('ACCESSORY')
      expect(cls.category).toBe('ACCESSORY')
    })
  })

  describe('4. Full Ingestion & Defect Handling', () => {
    it('executes ingestion, handles all known defects, and guarantees idempotency', async () => {
      const engine = new MugenSupplierIngestionEngine()

      // First run
      const res1 = await engine.ingest()
      expect(res1.priceListsCreated).toBe(3)
      expect(res1.kitItemsCount).toBe(10)
      expect(res1.overlapsResolved).toBe(205)
      expect(res1.priceConflictsLogged).toBe(6)
      expect(res1.zeroPriceExceptions.length).toBe(9)
      expect(res1.itemsIngested).toBeGreaterThanOrEqual(2600)

      // Known zero-price SKUs must all be captured in exceptions
      const expectedZeroSkus = ['H2120', 'H2126', 'H2202', 'H2205', 'H2306', 'H2307', 'H2309', 'H2803', 'H2807']
      for (const sku of expectedZeroSkus) {
        expect(res1.zeroPriceExceptions).toContain(sku)
      }

      // Second run (idempotency check — must produce exact same count with zero duplicate rows)
      const res2 = await engine.ingest()
      expect(res2.itemsIngested).toBe(res1.itemsIngested)
      expect(res2.exceptionsLogged).toBe(res1.exceptionsLogged)
      expect(res2.overlapsResolved).toBe(res1.overlapsResolved)
    }, 120000)
  })
})
