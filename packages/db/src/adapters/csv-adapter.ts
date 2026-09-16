// packages/db/src/adapters/csv-adapter.ts
// Robust CSV Supplier Feed Adapter

import type { RawSupplierFeedItem } from '@halo-rc/types'
import { BaseSupplierAdapter, type AdapterParseResult, type SupplierAdapterOptions } from './supplier-adapter'

export interface CsvColumnMapping {
  supplierSku?: string
  manufacturerSku?: string
  partNumber?: string
  eanGtin?: string
  title?: string
  brandName?: string
  description?: string
  cost?: string
  rrp?: string
  currency?: string
  availability?: string
  quantity?: string
  leadTimeDays?: string
  leadTimeText?: string
  category?: string
  productUrl?: string
}

export interface CsvAdapterOptions extends SupplierAdapterOptions {
  delimiter?: string
  hasHeader?: boolean
  columnMapping?: CsvColumnMapping
}

export class CsvSupplierAdapter extends BaseSupplierAdapter<string> {
  private readonly delimiter: string
  private readonly hasHeader: boolean
  private readonly columnMapping: CsvColumnMapping

  constructor(options: CsvAdapterOptions) {
    super({ ...options, format: 'CSV' })
    this.delimiter = options.delimiter ?? ','
    this.hasHeader = options.hasHeader ?? true
    this.columnMapping = options.columnMapping ?? {}
  }

  async fetch(source?: unknown): Promise<string> {
    if (typeof source === 'string') {
      return source
    }
    throw new Error('CsvSupplierAdapter.fetch requires a CSV text payload or valid source URL.')
  }

  async parse(rawPayload: string): Promise<AdapterParseResult> {
    const lines = this.parseCsvLines(rawPayload)
    if (lines.length === 0) {
      return { items: [], errors: ['CSV payload is empty'], warnings: [] }
    }

    const items: RawSupplierFeedItem[] = []
    const errors: string[] = []
    const warnings: string[] = []

    let headerRow: string[] = []
    let startIndex = 0

    const firstLine = lines[0]
    if (this.hasHeader && firstLine) {
      headerRow = firstLine.map((h) => h.trim().toLowerCase())
      startIndex = 1
    }

    const colIdx = this.resolveColumnIndices(headerRow)

    for (let i = startIndex; i < lines.length; i++) {
      const row = lines[i]
      if (!row || row.length === 0 || (row.length === 1 && !row[0]?.trim())) {
        continue // Skip empty lines
      }

      try {
        const getValue = (field: keyof CsvColumnMapping): string | null => {
          const idx = colIdx[field]
          if (idx !== undefined && idx < row.length) {
            const rawVal = row[idx]
            if (rawVal !== undefined) {
              const val = rawVal.trim()
              return val !== '' ? val : null
            }
          }
          return null
        }

        const sku = getValue('supplierSku')
        if (!sku) {
          warnings.push(`Row ${i + 1}: Skipped row with empty supplier SKU.`)
          continue
        }

        // Parse cost
        const rawCostStr = getValue('cost') || '0'
        const cleanedCost = rawCostStr.replace(/[^0-9.]/g, '')
        const costFloat = parseFloat(cleanedCost)
        // If cost has a decimal point like 49.50, convert to pence/cents 4950; if already integer like 4950, handle minor units
        const costMinor = Math.round(costFloat * (rawCostStr.includes('.') ? 100 : 1))

        // Parse RRP
        let rrpMinor: number | null = null
        const rawRrpStr = getValue('rrp')
        if (rawRrpStr) {
          const cleanedRrp = rawRrpStr.replace(/[^0-9.]/g, '')
          const rrpFloat = parseFloat(cleanedRrp)
          if (!isNaN(rrpFloat)) {
            rrpMinor = Math.round(rrpFloat * (rawRrpStr.includes('.') ? 100 : 1))
          }
        }

        // Parse quantity
        let quantity: number | null = null
        const qtyStr = getValue('quantity')
        if (qtyStr) {
          const q = parseInt(qtyStr.replace(/[^0-9]/g, ''), 10)
          if (!isNaN(q)) quantity = q
        }

        // Parse lead time
        let leadTimeDays: number | null = null
        const leadStr = getValue('leadTimeDays')
        if (leadStr) {
          const l = parseInt(leadStr.replace(/[^0-9]/g, ''), 10)
          if (!isNaN(l)) leadTimeDays = l
        }

        const currencyVal = (getValue('currency') || this.defaultCurrency).toUpperCase() as 'GBP' | 'USD'

        items.push({
          supplierSku: sku,
          manufacturerSku: getValue('manufacturerSku'),
          partNumber: getValue('partNumber'),
          eanGtin: getValue('eanGtin'),
          title: getValue('title') || `Item ${sku}`,
          brandName: getValue('brandName'),
          description: getValue('description'),
          cost: costMinor,
          rrp: rrpMinor,
          currency: currencyVal === 'USD' ? 'USD' : 'GBP',
          availability: getValue('availability') || (quantity !== null && quantity > 0 ? 'IN_STOCK' : 'NOT_AVAILABLE'),
          quantity,
          leadTimeDays,
          leadTimeText: getValue('leadTimeText'),
          sourceTimestamp: new Date().toISOString(),
        })
      } catch (err) {
        errors.push(`Row ${i + 1}: Failed to parse row — ${(err as Error).message}`)
      }
    }

    return { items, errors, warnings }
  }

  private resolveColumnIndices(header: string[]): { [K in keyof CsvColumnMapping]?: number | undefined } {
    const map: { [K in keyof CsvColumnMapping]?: number | undefined } = {}

    const findIndex = (customKey: string | undefined, defaultCandidates: string[]): number | undefined => {
      if (customKey) {
        const exact = header.indexOf(customKey.toLowerCase())
        if (exact !== -1) return exact
      }
      for (const candidate of defaultCandidates) {
        const idx = header.indexOf(candidate)
        if (idx !== -1) return idx
      }
      return undefined
    }

    const setIdx = (field: keyof CsvColumnMapping, customKey: string | undefined, candidates: string[]) => {
      const idx = findIndex(customKey, candidates)
      if (idx !== undefined) {
        map[field] = idx
      }
    }

    setIdx('supplierSku', this.columnMapping.supplierSku, [
      'supplier_sku', 'sku', 'item_no', 'item_code', 'product_code', 'part_no', 'code',
    ])
    setIdx('manufacturerSku', this.columnMapping.manufacturerSku, [
      'manufacturer_sku', 'mfr_sku', 'mpn', 'factory_sku',
    ])
    setIdx('partNumber', this.columnMapping.partNumber, [
      'part_number', 'part_no', 'partnumber',
    ])
    setIdx('eanGtin', this.columnMapping.eanGtin, [
      'ean', 'gtin', 'barcode', 'upc', 'ean_code',
    ])
    setIdx('title', this.columnMapping.title, [
      'title', 'product_name', 'name', 'item_name', 'description_short',
    ])
    setIdx('brandName', this.columnMapping.brandName, [
      'brand', 'manufacturer', 'make', 'brand_name',
    ])
    setIdx('description', this.columnMapping.description, [
      'description', 'long_description', 'body', 'details',
    ])
    setIdx('cost', this.columnMapping.cost, [
      'cost', 'wholesale_price', 'trade_price', 'dealer_price', 'cost_price', 'net_price',
    ])
    setIdx('rrp', this.columnMapping.rrp, [
      'rrp', 'srp', 'retail_price', 'list_price', 'msrp',
    ])
    setIdx('currency', this.columnMapping.currency, [
      'currency', 'curr',
    ])
    setIdx('availability', this.columnMapping.availability, [
      'availability', 'status', 'stock_status', 'in_stock',
    ])
    setIdx('quantity', this.columnMapping.quantity, [
      'quantity', 'qty', 'stock', 'stock_qty', 'inventory',
    ])
    setIdx('leadTimeDays', this.columnMapping.leadTimeDays, [
      'lead_time_days', 'lead_time', 'lead_days',
    ])
    setIdx('leadTimeText', this.columnMapping.leadTimeText, [
      'lead_time_text', 'delivery_note', 'shipping_time',
    ])

    return map
  }

  /**
   * RFC 4180 compliant CSV line and token parser.
   */
  private parseCsvLines(csvText: string): string[][] {
    const result: string[][] = []
    let currentRow: string[] = []
    let currentField = ''
    let inQuotes = false

    const cleanText = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

    for (let i = 0; i < cleanText.length; i++) {
      const char = cleanText[i]
      const nextChar = cleanText[i + 1]

      if (inQuotes) {
        if (char === '"') {
          if (nextChar === '"') {
            currentField += '"'
            i++ // Skip escaped quote
          } else {
            inQuotes = false
          }
        } else {
          currentField += char
        }
      } else {
        if (char === '"') {
          inQuotes = true
        } else if (char === this.delimiter) {
          currentRow.push(currentField)
          currentField = ''
        } else if (char === '\n') {
          currentRow.push(currentField)
          currentField = ''
          if (currentRow.some((f) => f.trim() !== '')) {
            result.push(currentRow)
          }
          currentRow = []
        } else {
          currentField += char
        }
      }
    }

    if (currentField || currentRow.length > 0) {
      currentRow.push(currentField)
      if (currentRow.some((f) => f.trim() !== '')) {
        result.push(currentRow)
      }
    }

    return result
  }
}
