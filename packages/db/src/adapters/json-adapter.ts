// packages/db/src/adapters/json-adapter.ts
// Robust JSON Supplier Feed Adapter (REST APIs, Webhooks, or JSON feeds)

import type { RawSupplierFeedItem } from '@halo-rc/types'
import { BaseSupplierAdapter, type AdapterParseResult, type SupplierAdapterOptions } from './supplier-adapter'

export interface JsonAdapterOptions extends SupplierAdapterOptions {
  itemsPath?: string // e.g. "data.products" or "items"
}

export class JsonSupplierAdapter extends BaseSupplierAdapter<string | Record<string, unknown> | unknown[]> {
  private readonly itemsPath?: string | null

  constructor(options: JsonAdapterOptions) {
    super({ ...options, format: 'JSON' })
    this.itemsPath = options.itemsPath ?? null
  }

  async fetch(source?: unknown): Promise<string | Record<string, unknown> | unknown[]> {
    if (typeof source === 'string' || typeof source === 'object') {
      return source as string | Record<string, unknown> | unknown[]
    }
    throw new Error('JsonSupplierAdapter.fetch requires a JSON string or parsed object.')
  }

  async parse(rawPayload: string | Record<string, unknown> | unknown[]): Promise<AdapterParseResult> {
    const errors: string[] = []
    const warnings: string[] = []

    let parsed: unknown
    if (typeof rawPayload === 'string') {
      try {
        parsed = JSON.parse(rawPayload)
      } catch (err) {
        return {
          items: [],
          errors: [`Failed to parse JSON payload: ${(err as Error).message}`],
          warnings: [],
        }
      }
    } else {
      parsed = rawPayload
    }

    // Extract items array
    let itemsArray: unknown[] = []
    if (Array.isArray(parsed)) {
      itemsArray = parsed
    } else if (parsed && typeof parsed === 'object') {
      if (this.itemsPath) {
        const parts = this.itemsPath.split('.')
        let current: unknown = parsed
        for (const part of parts) {
          if (current && typeof current === 'object' && part in current) {
            current = (current as Record<string, unknown>)[part]
          } else {
            current = undefined
            break
          }
        }
        if (Array.isArray(current)) {
          itemsArray = current
        }
      } else {
        // Look for common array properties
        const obj = parsed as Record<string, unknown>
        for (const key of ['items', 'products', 'data', 'catalog', 'catalogue', 'records']) {
          if (Array.isArray(obj[key])) {
            itemsArray = obj[key] as unknown[]
            break
          }
        }
      }
    }

    if (itemsArray.length === 0) {
      return {
        items: [],
        errors: [],
        warnings: ['No product records discovered in JSON payload.'],
      }
    }

    const items: RawSupplierFeedItem[] = []

    for (let i = 0; i < itemsArray.length; i++) {
      const rawItem = itemsArray[i]
      if (!rawItem || typeof rawItem !== 'object') {
        warnings.push(`Record #${i + 1}: Ignored non-object entry.`)
        continue
      }

      const rec = rawItem as Record<string, unknown>

      const sku = String(
        rec.supplierSku || rec.sku || rec.itemCode || rec.code || rec.id || ''
      ).trim()

      if (!sku) {
        warnings.push(`Record #${i + 1}: Missing SKU identifier.`)
        continue
      }

      // Cost handling: could be in pounds/dollars float (49.50) or integer minor units (4950)
      let costMinor = 0
      const rawCost = rec.cost ?? rec.wholesalePrice ?? rec.price ?? rec.tradePrice
      if (rawCost !== undefined && rawCost !== null) {
        const num = Number(rawCost)
        if (!isNaN(num)) {
          // If less than 1000 and has decimals, treat as decimal float
          costMinor = String(rawCost).includes('.') ? Math.round(num * 100) : Math.round(num)
        }
      }

      let rrpMinor: number | null = null
      const rawRrp = rec.rrp ?? rec.srp ?? rec.retailPrice ?? rec.msrp
      if (rawRrp !== undefined && rawRrp !== null) {
        const num = Number(rawRrp)
        if (!isNaN(num)) {
          rrpMinor = String(rawRrp).includes('.') ? Math.round(num * 100) : Math.round(num)
        }
      }

      let qty: number | null = null
      const rawQty = rec.quantity ?? rec.stock ?? rec.stockQty ?? rec.qty
      if (rawQty !== undefined && rawQty !== null) {
        const q = Number(rawQty)
        if (!isNaN(q)) qty = Math.max(0, Math.floor(q))
      }

      const rawCurr = String(rec.currency || this.defaultCurrency).toUpperCase()

      items.push({
        supplierSku: sku,
        manufacturerSku: rec.manufacturerSku ? String(rec.manufacturerSku).trim() : null,
        partNumber: rec.partNumber ? String(rec.partNumber).trim() : null,
        eanGtin: rec.eanGtin ? String(rec.eanGtin).trim() : (rec.barcode ? String(rec.barcode).trim() : null),
        title: String(rec.title || rec.name || rec.productName || `Item ${sku}`).trim(),
        brandName: rec.brandName ? String(rec.brandName).trim() : (rec.brand ? String(rec.brand).trim() : null),
        description: rec.description ? String(rec.description).trim() : null,
        cost: costMinor,
        rrp: rrpMinor,
        currency: rawCurr === 'USD' ? 'USD' : 'GBP',
        availability: String(
          rec.availability || (qty !== null && qty > 0 ? 'IN_STOCK' : 'NOT_AVAILABLE')
        ),
        quantity: qty,
        leadTimeDays: rec.leadTimeDays ? Number(rec.leadTimeDays) : null,
        leadTimeText: rec.leadTimeText ? String(rec.leadTimeText) : null,
        sourceTimestamp: new Date().toISOString(),
      })
    }

    return { items, errors, warnings }
  }
}
