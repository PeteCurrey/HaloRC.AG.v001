// packages/db/src/adapters/xml-adapter.ts
// Robust XML Supplier Feed Adapter (without heavy external XML dependencies)

import type { RawSupplierFeedItem } from '@halo-rc/types'
import { BaseSupplierAdapter, type AdapterParseResult, type SupplierAdapterOptions } from './supplier-adapter'

export interface XmlAdapterOptions extends SupplierAdapterOptions {
  itemTag?: string // default: "product", "item", or "record"
}

export class XmlSupplierAdapter extends BaseSupplierAdapter<string> {
  private readonly itemTag: string

  constructor(options: XmlAdapterOptions) {
    super({ ...options, format: 'XML' })
    this.itemTag = options.itemTag ?? 'product'
  }

  async fetch(source?: unknown): Promise<string> {
    if (typeof source === 'string') return source
    throw new Error('XmlSupplierAdapter.fetch requires an XML text string.')
  }

  async parse(rawPayload: string): Promise<AdapterParseResult> {
    const items: RawSupplierFeedItem[] = []
    const errors: string[] = []
    const warnings: string[] = []

    if (!rawPayload || !rawPayload.trim()) {
      return { items: [], errors: ['XML payload is empty'], warnings: [] }
    }

    try {
      // Extract all item blocks
      const tag = this.itemTag
      const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi')
      let match: RegExpExecArray | null

      const matches: string[] = []
      while ((match = regex.exec(rawPayload)) !== null) {
        if (match[1]) matches.push(match[1])
      }

      // If no matches found, try fallback tags: item, record, article
      if (matches.length === 0) {
        for (const altTag of ['item', 'record', 'article', 'product_record']) {
          const altRegex = new RegExp(`<${altTag}[^>]*>([\\s\\S]*?)<\\/${altTag}>`, 'gi')
          while ((match = altRegex.exec(rawPayload)) !== null) {
            if (match[1]) matches.push(match[1])
          }
          if (matches.length > 0) break
        }
      }

      if (matches.length === 0) {
        return {
          items: [],
          errors: [],
          warnings: [`No <${this.itemTag}> or alternative product nodes found in XML payload.`],
        }
      }

      const getTagValue = (xmlSnippet: string, tagNames: string[]): string | null => {
        for (const t of tagNames) {
          const tagReg = new RegExp(`<${t}[^>]*>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([^<]*))<\\/${t}>`, 'i')
          const found = tagReg.exec(xmlSnippet)
          if (found) {
            const val = (found[1] !== undefined ? found[1] : found[2]) || ''
            return val.trim()
          }
        }
        return null
      }

      for (let i = 0; i < matches.length; i++) {
        const snippet = matches[i]
        if (!snippet) continue

        const sku = getTagValue(snippet, ['supplier_sku', 'sku', 'code', 'id', 'item_no', 'itemcode'])
        if (!sku) {
          warnings.push(`XML Record #${i + 1}: Missing SKU node.`)
          continue
        }

        const title = getTagValue(snippet, ['title', 'name', 'product_name', 'description_short']) || `Item ${sku}`
        const brand = getTagValue(snippet, ['brand', 'manufacturer', 'make'])
        const desc = getTagValue(snippet, ['description', 'long_description', 'details'])

        // Cost
        const rawCostStr = getTagValue(snippet, ['cost', 'price', 'wholesale_price', 'trade_price']) || '0'
        const costFloat = parseFloat(rawCostStr.replace(/[^0-9.]/g, '')) || 0
        const costMinor = Math.round(costFloat * (rawCostStr.includes('.') ? 100 : 1))

        // RRP
        const rawRrpStr = getTagValue(snippet, ['rrp', 'srp', 'retail_price', 'msrp'])
        let rrpMinor: number | null = null
        if (rawRrpStr) {
          const rrpFloat = parseFloat(rawRrpStr.replace(/[^0-9.]/g, ''))
          if (!isNaN(rrpFloat)) {
            rrpMinor = Math.round(rrpFloat * (rawRrpStr.includes('.') ? 100 : 1))
          }
        }

        // Qty
        const rawQtyStr = getTagValue(snippet, ['quantity', 'qty', 'stock', 'inventory'])
        let qty: number | null = null
        if (rawQtyStr) {
          const q = parseInt(rawQtyStr.replace(/[^0-9]/g, ''), 10)
          if (!isNaN(q)) qty = q
        }

        const avail = getTagValue(snippet, ['availability', 'status', 'stock_status']) ||
          (qty !== null && qty > 0 ? 'IN_STOCK' : 'NOT_AVAILABLE')

        const curr = (getTagValue(snippet, ['currency', 'curr']) || this.defaultCurrency).toUpperCase() as 'GBP' | 'USD'

        items.push({
          supplierSku: sku,
          manufacturerSku: getTagValue(snippet, ['manufacturer_sku', 'mfr_sku', 'mpn']),
          partNumber: getTagValue(snippet, ['part_number', 'part_no', 'partnumber']),
          eanGtin: getTagValue(snippet, ['ean', 'gtin', 'barcode', 'upc']),
          title,
          brandName: brand,
          description: desc,
          cost: costMinor,
          rrp: rrpMinor,
          currency: curr === 'USD' ? 'USD' : 'GBP',
          availability: avail,
          quantity: qty,
          leadTimeDays: parseInt(getTagValue(snippet, ['lead_time_days', 'lead_time']) || '', 10) || null,
          leadTimeText: getTagValue(snippet, ['lead_time_text', 'shipping_time']),
          sourceTimestamp: new Date().toISOString(),
        })
      }
    } catch (err) {
      errors.push(`XML Parsing exception: ${(err as Error).message}`)
    }

    return { items, errors, warnings }
  }
}
