// packages/db/src/importers/mugen-supplier-ingestion.ts
// Authoritative Supplier Ingestion Engine for Mugen Seiki Europe

import * as fs from 'fs'
import * as path from 'path'
import { createHash } from 'crypto'
import { db } from '../client'
import {
  supplierPriceLists,
  supplierItems,
  ingestExceptions,
} from '../schema/supplier-ingestion'
import { suppliers } from '../schema/suppliers'
import { eq, sql } from 'drizzle-orm'

export interface MugenIngestResult {
  priceListsCreated: number
  itemsIngested: number
  itemsUpdated: number
  exceptionsLogged: number
  overlapsResolved: number
  priceConflictsLogged: number
  germanTranslatedCount: number
  kitItemsCount: number
  zeroPriceExceptions: string[]
}

/**
 * Parses a single CSV line with respect to quotes and commas.
 */
export function parseSupplierCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++ // Skip escaped quote
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

// ─── Literal German-to-English RC Translation Dictionary ───────────────────────
// Strictly literal translations. No embellishment, no guessed specs.

export const GERMAN_RC_TRANSLATIONS: [RegExp, string][] = [
  [/\bBauanleitung\b/gi, 'Instruction Manual'],
  [/\bRadioplattenhalter\b/gi, 'Radio Plate Holder'],
  [/\bRadioplatte\b/gi, 'Radio Plate'],
  [/\bAkkuhalter\b|\bAkku-Halter\b/gi, 'Battery Holder'],
  [/\bQuerlenkerhalter\b/gi, 'Suspension Arm Mount'],
  [/\bQuerlenker\b/gi, 'Suspension Arm'],
  [/\bAchsträger\b/gi, 'Upright'],
  [/\bLenkhebel\b/gi, 'Steering Arm'],
  [/\bRadträger\b/gi, 'Wheel Hub Carrier'],
  [/\bChassisplatte\b/gi, 'Chassis Plate'],
  [/\bOberdeck\b/gi, 'Upper Deck'],
  [/\bUnterdeck\b/gi, 'Lower Deck'],
  [/\bDämpferbrücke\b|\bStoßdämpferbrücke\b|\bStossdämpferbrücke\b/gi, 'Shock Tower'],
  [/\bStoßdämpfer\b|\bStossdämpfer\b|\bDämpfer\b/gi, 'Shock Absorber'],
  [/\bDämpferfeder\b|\bFeder\b/gi, 'Spring'],
  [/\bKolbenstange\b/gi, 'Piston Rod'],
  [/\bKupplungsglocke\b/gi, 'Clutch Bell'],
  [/\bKupplungsbacken\b/gi, 'Clutch Shoes'],
  [/\bKupplung\b/gi, 'Clutch'],
  [/\bSchwungscheibe\b/gi, 'Flywheel'],
  [/\bKrümmer\b/gi, 'Manifold'],
  [/\bSchalldämpfer\b|\bResorohr\b|\bReso\b/gi, 'Tuned Pipe'],
  [/\bLuftfilter\b/gi, 'Air Filter'],
  [/\bKraftstofftank\b|\bTank\b/gi, 'Fuel Tank'],
  [/\bBremsscheibe\b/gi, 'Brake Disc'],
  [/\bBremsbelag\b|\bBremsbeläge\b/gi, 'Brake Pad'],
  [/\bBremssattel\b|\bBremszange\b/gi, 'Brake Caliper'],
  [/\bBremsnocken\b/gi, 'Brake Cam'],
  [/\bRadmitnehmer\b/gi, 'Wheel Hex Hub'],
  [/\bMitnehmer\b/gi, 'Drive Hub'],
  [/\bAntriebswelle\b|\bKardanwelle\b|\bKardan\b/gi, 'Driveshaft'],
  [/\bRadachse\b/gi, 'Wheel Axle'],
  [/\bHauptzahnrad\b/gi, 'Spur Gear'],
  [/\bRitzel\b/gi, 'Pinion Gear'],
  [/\bKegelrad\b|\bKegelzahnrad\b/gi, 'Bevel Gear'],
  [/\bTellerrad\b|\bTellerzahnrad\b/gi, 'Ring Gear'],
  [/\bDifferentialgehäuse\b|\bDiffgehäuse\b/gi, 'Differential Case'],
  [/\bDifferential\b/gi, 'Differential'],
  [/\bZahnriemen\b|\bRiemen\b/gi, 'Drive Belt'],
  [/\bRiemenscheibe\b/gi, 'Pulley'],
  [/\bKugellager\b/gi, 'Ball Bearing'],
  [/\bKugelkopf\b|\bKugelbolzen\b/gi, 'Ball Stud'],
  [/\bKugelpfanne\b/gi, 'Ball End'],
  [/\bSpurstange\b/gi, 'Turnbuckle'],
  [/\bStabilisator\b|\bStabi\b/gi, 'Stabilizer'],
  [/\bKarosseriehalter\b/gi, 'Body Mount'],
  [/\bKarosserie\b/gi, 'Body'],
  [/\bHeckflügel\b|\bFlügel\b/gi, 'Rear Wing'],
  [/\bFlügelhalter\b/gi, 'Wing Mount'],
  [/\bRammer\b|\bSchaumstofframmer\b/gi, 'Bumper'],
  [/\bMotorhalter\b/gi, 'Motor Mount'],
  [/\bServosaver\b|\bServo-Saver\b/gi, 'Servo Saver'],
  [/\bSenkschraube\b/gi, 'Flat Head Screw'],
  [/\bZylinderschraube\b/gi, 'Cap Head Screw'],
  [/\bLinsenschraube\b/gi, 'Button Head Screw'],
  [/\bMadenschraube\b/gi, 'Set Screw'],
  [/\bStoppmutter\b/gi, 'Lock Nut'],
  [/\bBundmutter\b/gi, 'Flanged Nut'],
  [/\bPassscheibe\b|\bDistanzscheibe\b/gi, 'Shim'],
  [/\bUnterlegscheibe\b|\bScheibe\b/gi, 'Washer'],
  [/\bBuchsen\b/gi, 'Bushings'],
  [/\bBuchse\b/gi, 'Bushing'],
  [/\bStift\b/gi, 'Pin'],
  [/\bSchraube\b|\bSchrauben\b/gi, 'Screw'],
  [/\bMutter\b|\bMuttern\b/gi, 'Nut'],
  [/\bZubehörteile\b|\bZubehör\b/gi, 'Accessories'],
  [/\bKomplettset\b|\bKomplett\b/gi, 'Complete Set'],
  [/\bVorderachse\b|\bVorne\b/gi, 'Front'],
  [/\bHinterachse\b|\bHinten\b/gi, 'Rear'],
  [/\bOben\b/gi, 'Upper'],
  [/\bUnten\b/gi, 'Lower'],
  [/\bLinks\b/gi, 'Left'],
  [/\bRechts\b/gi, 'Right'],
  [/\bHart\b/gi, 'Hard'],
  [/\bWeich\b/gi, 'Soft'],
  [/\bMittel\b/gi, 'Medium'],
]

export function translateGermanOnly(text: string): { english: string; confidence: 'VERIFIED' | 'INFERRED' } {
  if (!text) return { english: text, confidence: 'VERIFIED' }
  const isLikelyGerman =
    /[äöüß]/i.test(text) ||
    /(halter|platte|querlenker|achsträger|stift|feder|scheibe|buchse|dämpfer|lenkung|oberdeck|unterdeck|kardan|mitnehmer|bauanleitung|akku|kugellager)/i.test(
      text
    )

  if (!isLikelyGerman) {
    return { english: text, confidence: 'VERIFIED' }
  }

  let translated = text
  for (const [pattern, replacement] of GERMAN_RC_TRANSLATIONS) {
    translated = translated.replace(pattern, replacement)
  }
  return {
    english: translated.replace(/\s+/g, ' ').trim(),
    confidence: 'INFERRED',
  }
}

/**
 * Classify MUGEN item category and productType.
 */
export function classifyMugenProduct(
  sku: string,
  title: string
): { productType: string; category: string } {
  const upperSku = sku.toUpperCase().trim()
  const upperTitle = title.toUpperCase().trim()

  // 1. Complete Kits (10 items)
  const isKitSku = [
    'A2006',
    'B2001',
    'E2027',
    'E2027-PREMIUM',
    'E2028',
    'E2028-PREMIUM',
    'E2029',
    'E2030',
    'H2009',
    'T2006',
  ].includes(upperSku)

  if (isKitSku || (upperTitle.includes('KIT') && (upperTitle.includes('TOURING') || upperTitle.includes('BUGGY') || upperTitle.includes('TRUGGY')))) {
    return { productType: 'KIT', category: 'COMPLETE_KIT' }
  }

  // 2. Tools & Work Equipment (check before general components to catch "Clutch Tool" etc.)
  if (
    upperTitle.includes('TOOL') ||
    upperTitle.includes('WERKZEUG') ||
    upperTitle.includes('WRENCH') ||
    upperTitle.includes('SCHLÜSSEL') ||
    upperTitle.includes('BAG') ||
    upperTitle.includes('TASCHE') ||
    upperTitle.includes('BOX') ||
    upperTitle.includes('STAND') ||
    upperTitle.includes('TWEAKSTICK')
  ) {
    return { productType: 'TOOLS', category: 'TOOLS' }
  }

  // 3. Consumables & Accessories (Oils, Grease)
  if (
    upperTitle.includes('SILICONE') ||
    upperTitle.includes('SILIKON') ||
    upperTitle.includes('OIL') ||
    upperTitle.includes('ÖL') ||
    upperTitle.includes('GREASE') ||
    upperTitle.includes('FETT') ||
    upperTitle.includes('FLUID')
  ) {
    return { productType: 'ACCESSORY', category: 'ACCESSORY' }
  }

  // 4. Option & Upgrade Parts
  if (
    upperTitle.includes('CARBON') ||
    upperTitle.includes('CFRP') ||
    upperTitle.includes('TITAN') ||
    upperTitle.includes('WEIGHT') ||
    upperTitle.includes('GEWICHT') ||
    upperTitle.includes('OPTION') ||
    upperTitle.includes('UPGRADE') ||
    upperTitle.includes('ALUMI') ||
    upperTitle.includes('BRASS')
  ) {
    return { productType: 'OPTION_PART', category: 'OPTION_PART' }
  }

  // 5. Engines & Powertrain
  if (
    upperTitle.includes('ENGINE') ||
    upperTitle.includes('MOTOR') ||
    upperTitle.includes('RESO') ||
    upperTitle.includes('MUFFLER') ||
    upperTitle.includes('KRÜMMER') ||
    upperTitle.includes('MANIFOLD') ||
    upperTitle.includes('KUPPLUNG') ||
    upperTitle.includes('CLUTCH')
  ) {
    return { productType: 'PART', category: 'ENGINE' }
  }


  // 6. Manuals / Documents
  if (
    upperTitle.includes('MANUAL') ||
    upperTitle.includes('BAUANLEITUNG') ||
    upperTitle.includes('DECAL') ||
    upperTitle.includes('STICKER')
  ) {
    return { productType: 'DOCUMENT_PRODUCT', category: 'DOCUMENT_PRODUCT' }
  }

  // 7. General Spares / Replacement Parts
  return { productType: 'REPLACEMENT_PART', category: 'REPLACEMENT_PART' }
}

interface IntermediateRow {
  supplierItemCode: string
  sku: string
  rawName: string
  rawDescription: string | null
  englishName: string
  nameConfidence: 'VERIFIED' | 'INFERRED'
  netPrice: string // numeric(10,4) as string
  currency: string
  ean: string | null
  productType: string
  category: string
  sourceFile: string
  sourceDate: string // YYYY-MM-DD
  priceListId: string
  exceptionFlags: string[]
}

export class MugenSupplierIngestionEngine {
  private baseDir: string
  private supplierId = 'sup-mugen-europe'

  constructor(baseDir?: string) {
    this.baseDir = baseDir || path.resolve(process.cwd(), 'data/suppliers/mugen')
  }

  /**
   * Execute full idempotent ingestion into supplier_price_lists, supplier_items, and ingest_exceptions.
   */
  public async ingest(): Promise<MugenIngestResult> {
    // 1. Ensure master supplier exists
    const supRows = await db
      .select({ id: suppliers.id })
      .from(suppliers)
      .where(eq(suppliers.id, this.supplierId))
      .limit(1)

    if (supRows.length === 0) {
      await db.insert(suppliers).values({
        id: this.supplierId,
        slug: 'mugen-seiki-europe',
        name: 'Mugen Seiki Europe',
        legalName: 'Mugen Seiki Europe Vertriebs GmbH',
        type: 'MANUFACTURER',
        country: 'DE',
        website: 'https://www.mugen.eu',
        status: 'ACTIVE',
        currency: 'EUR',
        notes: 'Authoritative supplier for Mugen Seiki Germany/Japan',
      }).onConflictDoNothing()
    }

    // 2. Define Price Lists
    const priceListsDef = [
      {
        id: 'spl-mugen-kits-2026-06',
        fileName: 'Export_06_2026kits.csv',
        effectiveDate: '2026-06-01',
        currency: 'EUR',
      },
      {
        id: 'spl-mugen-mrx-2025-11',
        fileName: 'MRX_Shop_INT_11_2025.csv',
        effectiveDate: '2025-11-01',
        currency: 'EUR',
      },
      {
        id: 'spl-mugen-shop-2025-06',
        fileName: 'Shop_INT_06_2025.csv',
        effectiveDate: '2025-06-01',
        currency: 'EUR',
      },
    ]

    for (const pl of priceListsDef) {
      await db.insert(supplierPriceLists).values({
        id: pl.id,
        supplierId: this.supplierId,
        fileName: pl.fileName,
        effectiveDate: pl.effectiveDate,
        currency: pl.currency,
        rowCount: 0,
        ingestRunId: `run-${Date.now()}`,
      }).onConflictDoUpdate({
        target: supplierPriceLists.id,
        set: {
          updatedAt: new Date(),
        },
      })
    }

    const itemsBySku = new Map<string, IntermediateRow>()
    const exceptionsToInsert: Array<{
      id: string
      supplierId: string
      fileName: string
      rowNumber: number
      reason: string
      rawPayload: Record<string, unknown>
    }> = []

    let overlapsResolved = 0
    let priceConflictsLogged = 0
    let germanTranslatedCount = 0
    let kitItemsCount = 0
    const zeroPriceExceptions: string[] = []

    // ── 3. Parse File 1: Export_06_2026kits.csv (June 2026) ───────────────────
    const kitsFile = path.join(this.baseDir, 'Export_06_2026kits.csv')
    if (fs.existsSync(kitsFile)) {
      const lines = fs.readFileSync(kitsFile, 'utf8').split(/\r?\n/).filter((l) => l.trim())
      let seenE2027 = 0
      let seenE2028 = 0

      for (let i = 1; i < lines.length; i++) {
        const cells = parseSupplierCsvLine(lines[i]!)
        const rawCode = cells[0]?.trim()
        if (!rawCode) continue // skip empty rows / footer notes

        const title = cells[1]?.trim() || ''
        const rawPriceStr = cells[2]?.trim() || '0'
        const priceNum = parseFloat(rawPriceStr.replace(',', '.'))

        // Handle duplicate item codes (E2027 / E2028 Premium Editions) per rule 1.2 a
        let sku = rawCode
        if (rawCode === 'E2027') {
          seenE2027++
          if (seenE2027 === 2 || title.toLowerCase().includes('premium')) {
            sku = 'E2027-PREMIUM'
          }
        } else if (rawCode === 'E2028') {
          seenE2028++
          if (seenE2028 === 2 || title.toLowerCase().includes('premium')) {
            sku = 'E2028-PREMIUM'
          }
        }

        const cls = classifyMugenProduct(sku, title)
        kitItemsCount++

        itemsBySku.set(sku, {
          supplierItemCode: rawCode,
          sku,
          rawName: title,
          rawDescription: null,
          englishName: title,
          nameConfidence: 'VERIFIED',
          netPrice: priceNum.toFixed(4),
          currency: 'EUR',
          ean: null,
          productType: cls.productType,
          category: cls.category,
          sourceFile: 'Export_06_2026kits.csv',
          sourceDate: '2026-06-01',
          priceListId: 'spl-mugen-kits-2026-06',
          exceptionFlags: sku !== rawCode ? ['PREMIUM_EDITION_VARIANT'] : [],
        })
      }
    }

    // ── 4. Parse File 2: MRX_Shop_INT_11_2025.csv (November 2025) ─────────────
    // Format: Item-No., Description, EUR Netto, [EAN / Currency]
    const mrxFile = path.join(this.baseDir, 'MRX_Shop_INT_11_2025.csv')
    if (fs.existsSync(mrxFile)) {
      const lines = fs.readFileSync(mrxFile, 'utf8').split(/\r?\n/).filter((l) => l.trim())
      for (let i = 1; i < lines.length; i++) {
        const cells = parseSupplierCsvLine(lines[i]!)
        const rawCode = cells[0]?.trim()
        if (!rawCode) continue

        const title = cells[1]?.trim() || ''
        const rawPriceStr = cells[2]?.trim() || '0'
        const priceNum = parseFloat(rawPriceStr.replace(',', '.'))
        const currency = cells[3]?.trim() || 'EUR'

        // Check zero-price or invalid currency defect (rule 1.2 c)
        if (priceNum <= 0 || !currency || currency.toUpperCase() !== 'EUR') {
          exceptionsToInsert.push({
            id: `exc-mrx-${rawCode}-${i}`,
            supplierId: this.supplierId,
            fileName: 'MRX_Shop_INT_11_2025.csv',
            rowNumber: i + 1,
            reason: priceNum <= 0 ? 'ZERO_PRICE' : 'INVALID_CURRENCY',
            rawPayload: { row: i + 1, rawCode, title, rawPriceStr, currency },
          })
          zeroPriceExceptions.push(rawCode)
          continue
        }

        const translation = translateGermanOnly(title)
        if (translation.confidence === 'INFERRED') {
          germanTranslatedCount++
        }

        const cls = classifyMugenProduct(rawCode, translation.english)

        itemsBySku.set(rawCode, {
          supplierItemCode: rawCode,
          sku: rawCode,
          rawName: title,
          rawDescription: null,
          englishName: translation.english,
          nameConfidence: translation.confidence,
          netPrice: priceNum.toFixed(4),
          currency: 'EUR',
          ean: null,
          productType: cls.productType,
          category: cls.category,
          sourceFile: 'MRX_Shop_INT_11_2025.csv',
          sourceDate: '2025-11-01',
          priceListId: 'spl-mugen-mrx-2025-11',
          exceptionFlags: [],
        })
      }
    }

    // ── 5. Parse File 3: Shop_INT_06_2025.csv (June 2025) ─────────────────────
    // Format: Item Code, Item Name, Artikelbeschreibung, Listenpreis, Währung, EAN Code
    const shopFile = path.join(this.baseDir, 'Shop_INT_06_2025.csv')
    if (fs.existsSync(shopFile)) {
      const lines = fs.readFileSync(shopFile, 'utf8').split(/\r?\n/).filter((l) => l.trim())
      for (let i = 1; i < lines.length; i++) {
        const cells = parseSupplierCsvLine(lines[i]!)
        const rawCode = cells[0]?.trim()
        if (!rawCode) continue

        const nameEn = cells[1]?.trim() || ''
        const nameDe = cells[2]?.trim() || ''
        const rawPriceStr = cells[3]?.trim() || '0'
        const currency = cells[4]?.trim() || ''
        const rawEan = cells[5]?.trim() || ''
        const ean = /^\d{8,14}$/.test(rawEan) ? rawEan : null

        const priceNum = parseFloat(rawPriceStr.replace(',', '.'))

        // Check zero-price or missing currency defect (rule 1.2 c)
        if (priceNum <= 0 || !currency || currency.toUpperCase() !== 'EUR') {
          exceptionsToInsert.push({
            id: `exc-shop-${rawCode}-${i}`,
            supplierId: this.supplierId,
            fileName: 'Shop_INT_06_2025.csv',
            rowNumber: i + 1,
            reason: priceNum <= 0 ? 'ZERO_PRICE' : 'MISSING_CURRENCY',
            rawPayload: { row: i + 1, rawCode, nameEn, nameDe, rawPriceStr, currency, rawEan },
          })
          zeroPriceExceptions.push(rawCode)
          continue
        }

        // Determine English title vs German fallback
        let displayTitle = nameEn
        let confidence: 'VERIFIED' | 'INFERRED' = 'VERIFIED'

        if (!displayTitle || displayTitle === nameDe) {
          const trans = translateGermanOnly(nameDe || displayTitle)
          displayTitle = trans.english
          confidence = trans.confidence
          if (confidence === 'INFERRED') {
            germanTranslatedCount++
          }
        }

        const cls = classifyMugenProduct(rawCode, displayTitle)

        // Precedence & Conflict Resolution (rule 1.2 d):
        // If already present from Kits (06/2026) or MRX (11/2025), check for price discrepancies
        const existing = itemsBySku.get(rawCode)
        if (existing) {
          overlapsResolved++
          const existingPrice = parseFloat(existing.netPrice)
          if (Math.abs(existingPrice - priceNum) > 0.001) {
            priceConflictsLogged++
            // The later file wins (existing has later date: 11/2025 or 06/2026)
            // Preserve EAN from June 2025 file
            if (!existing.ean && ean) {
              existing.ean = ean
            }
            if (!existing.rawDescription && nameDe) {
              existing.rawDescription = nameDe
            }
            existing.exceptionFlags.push(`PRICE_CONFLICT_RESOLVED: 06/25 €${priceNum} superseded by ${existing.sourceDate} €${existingPrice}`)
          } else {
            // Identical pricing: merge EAN and German description
            if (!existing.ean && ean) {
              existing.ean = ean
            }
            if (!existing.rawDescription && nameDe) {
              existing.rawDescription = nameDe
            }
          }
        } else {
          // New SKU from Shop INT
          itemsBySku.set(rawCode, {
            supplierItemCode: rawCode,
            sku: rawCode,
            rawName: nameEn || nameDe,
            rawDescription: nameDe && nameDe !== nameEn ? nameDe : null,
            englishName: displayTitle,
            nameConfidence: confidence,
            netPrice: priceNum.toFixed(4),
            currency: 'EUR',
            ean,
            productType: cls.productType,
            category: cls.category,
            sourceFile: 'Shop_INT_06_2025.csv',
            sourceDate: '2025-06-01',
            priceListId: 'spl-mugen-shop-2025-06',
            exceptionFlags: [],
          })
        }
      }
    }

    // ── 6. Persist to Database ────────────────────────────────────────────────
    // Insert exceptions in batches
    if (exceptionsToInsert.length > 0) {
      const excBatchSize = 100
      for (let i = 0; i < exceptionsToInsert.length; i += excBatchSize) {
        const chunk = exceptionsToInsert.slice(i, i + excBatchSize)
        await db.insert(ingestExceptions).values(
          chunk.map((exc) => ({
            id: exc.id,
            supplierId: exc.supplierId,
            fileName: exc.fileName,
            rowNumber: exc.rowNumber,
            reason: exc.reason,
            rawPayload: exc.rawPayload,
          }))
        ).onConflictDoNothing()
      }
    }

    // Batch upsert supplier_items using multi-row VALUES
    const allItems = Array.from(itemsBySku.values())
    const batchSize = 100
    let itemsIngested = 0
    let itemsUpdated = 0

    for (let i = 0; i < allItems.length; i += batchSize) {
      const chunk = allItems.slice(i, i + batchSize)
      const valuesToInsert = chunk.map((item) => {
        const itemId = `sitem-${createHash('sha256').update(`${this.supplierId}:${item.sku}`).digest('hex').slice(0, 24)}`
        return {
          id: itemId,
          supplierId: this.supplierId,
          priceListId: item.priceListId,
          supplierItemCode: item.supplierItemCode,
          sku: item.sku,
          rawName: item.rawName,
          rawDescription: item.rawDescription,
          englishName: item.englishName,
          nameConfidence: item.nameConfidence,
          netPrice: item.netPrice,
          currency: item.currency,
          ean: item.ean,
          productType: item.productType,
          category: item.category,
          sourceFile: item.sourceFile,
          sourceDate: item.sourceDate,
          exceptionFlags: item.exceptionFlags,
        }
      })

      await db.insert(supplierItems).values(valuesToInsert).onConflictDoUpdate({
        target: [supplierItems.supplierId, supplierItems.sku],
        set: {
          supplierItemCode: sql`excluded.supplier_item_code`,
          rawName: sql`excluded.raw_name`,
          rawDescription: sql`excluded.raw_description`,
          englishName: sql`excluded.english_name`,
          nameConfidence: sql`excluded.name_confidence`,
          netPrice: sql`excluded.net_price`,
          currency: sql`excluded.currency`,
          ean: sql`excluded.ean`,
          productType: sql`excluded.product_type`,
          category: sql`excluded.category`,
          sourceFile: sql`excluded.source_file`,
          sourceDate: sql`excluded.source_date`,
          exceptionFlags: sql`excluded.exception_flags`,
          updatedAt: new Date(),
        },
      })
      itemsIngested += chunk.length
    }

    // Update row counts on price lists
    await db.update(supplierPriceLists)
      .set({ rowCount: allItems.filter(it => it.priceListId === 'spl-mugen-kits-2026-06').length })
      .where(eq(supplierPriceLists.id, 'spl-mugen-kits-2026-06'))

    await db.update(supplierPriceLists)
      .set({ rowCount: allItems.filter(it => it.priceListId === 'spl-mugen-mrx-2025-11').length })
      .where(eq(supplierPriceLists.id, 'spl-mugen-mrx-2025-11'))

    await db.update(supplierPriceLists)
      .set({ rowCount: allItems.filter(it => it.priceListId === 'spl-mugen-shop-2025-06').length })
      .where(eq(supplierPriceLists.id, 'spl-mugen-shop-2025-06'))

    return {
      priceListsCreated: 3,
      itemsIngested: allItems.length,
      itemsUpdated,
      exceptionsLogged: exceptionsToInsert.length,
      overlapsResolved,
      priceConflictsLogged,
      germanTranslatedCount,
      kitItemsCount,
      zeroPriceExceptions,
    }
  }
}
