import { describe, it, expect, beforeEach } from 'vitest'
import {
  detectEncoding,
  stripBom,
  detectDelimiter,
  parseCsvLine,
  parseCsvBuffer,
  applyFieldMap,
  parsePriceToMinorUnits,
  normaliseAvailability,
  normaliseEan,
  normaliseCurrency,
  normaliseRow,
  validateRow,
  detectDuplicates,
  matchSku,
  buildPreview,
} from '@halo-rc/db'
import type { CanonicalImportField } from '@halo-rc/types'

describe('SupplierCsvImportEngine (Unit)', () => {
  describe('Encoding & Delimiter Detection', () => {
    it('detects UTF-8 BOM and normal UTF-8', () => {
      const bomBuffer = Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from('ITEM,PRICE\nABC,10\n')])
      expect(detectEncoding(bomBuffer)).toBe('UTF-8-BOM')

      const regularBuffer = Buffer.from('ITEM,PRICE\nABC,10\n', 'utf8')
      expect(detectEncoding(regularBuffer)).toBe('UTF-8')
    })

    it('strips UTF-8 BOM properly', () => {
      const withBom = '\uFEFFheader1,header2'
      expect(stripBom(withBom)).toBe('header1,header2')
      expect(stripBom('plain,header')).toBe('plain,header')
    })

    it('detects comma vs semicolon delimiters', () => {
      const commaSample = 'SKU,NAME,PRICE,CURRENCY\nA1,Item 1,12.50,GBP\nA2,Item 2,15.00,GBP'
      expect(detectDelimiter(commaSample)).toBe(',')

      const semiSample = 'SKU;NAME;PRICE;CURRENCY\nA1;Item 1;12,50;EUR\nA2;Item 2;15,00;EUR'
      expect(detectDelimiter(semiSample)).toBe(';')
    })
  })

  describe('CSV Line & Buffer Parsing', () => {
    it('parses quoted fields with commas and escaped quotes', () => {
      const line = 'SKU-001,"High-Performance, Nitro 1/8 Buggy Kit ""Pro"" Edition",529.00'
      const parsed = parseCsvLine(line, ',')
      expect(parsed).toEqual([
        'SKU-001',
        'High-Performance, Nitro 1/8 Buggy Kit "Pro" Edition',
        '529.00',
      ])
    })

    it('parses full buffer and catches malformed rows without crashing', () => {
      const csv = `SKU,NAME,PRICE
SKU-1,Good Item,10.00
SKU-2,Malformed Item Has Too Many Cells,12.00,EXTRA
SKU-3,Another Good,15.50`
      const buffer = Buffer.from(csv, 'utf8')
      const result = parseCsvBuffer(buffer, 'test.csv')

      expect(result.columnNames).toEqual(['SKU', 'NAME', 'PRICE'])
      expect(result.rowCount).toBe(3)
      expect(result.malformedRows.length).toBe(1)
      expect(result.malformedRows[0]?.rowNumber).toBe(3)
      expect(result.rows[1]?.['__malformed__']).toBe('true')
    })
  })

  describe('Normalisation & Parsing Helpers', () => {
    it('parses various price formats into minor units (cents/pence)', () => {
      expect(parsePriceToMinorUnits('12.50')).toBe(1250)
      expect(parsePriceToMinorUnits('€529,00')).toBe(52900)
      expect(parsePriceToMinorUnits('$1,529.99')).toBe(152999)
      expect(parsePriceToMinorUnits('0')).toBe(0)
      expect(parsePriceToMinorUnits('-10.00')).toBeNull()
      expect(parsePriceToMinorUnits('invalid')).toBeNull()
      expect(parsePriceToMinorUnits('')).toBeNull()
    })

    it('normalises EAN/GTIN codes', () => {
      expect(normaliseEan(' 4944925032547 ')).toBe('4944925032547')
      expect(normaliseEan('12345678')).toBe('12345678')
      expect(normaliseEan('12345')).toBeNull() // invalid length
      expect(normaliseEan('not-a-number')).toBeNull()
    })

    it('normalises availability statuses', () => {
      expect(normaliseAvailability('In Stock')).toBe('IN_STOCK')
      expect(normaliseAvailability('Available')).toBe('IN_STOCK')
      expect(normaliseAvailability('Low stock remaining')).toBe('LOW_STOCK')
      expect(normaliseAvailability('Pre-Order Now')).toBe('PRE_ORDER')
      expect(normaliseAvailability('Out of Stock')).toBe('OUT_OF_STOCK')
      expect(normaliseAvailability('Discontinued')).toBe('NOT_AVAILABLE')
    })

    it('normalises currency codes', () => {
      expect(normaliseCurrency('gbp')).toBe('GBP')
      expect(normaliseCurrency(' EUR ')).toBe('EUR')
      expect(normaliseCurrency('JPY')).toBeNull()
    })
  })

  describe('Field Mapping & Validation', () => {
    const fieldMap: Record<string, CanonicalImportField> = {
      'ITEM NO': 'supplier_sku',
      'DESCRIPTION': 'product_name',
      'PRICE/ NET': 'net_price',
      'BARCODE': 'ean',
      'QTY': 'stock_quantity',
      'EXTRA_JUNK': 'IGNORE',
    }

    it('applies field map and produces clean normalised row', () => {
      const raw = {
        'ITEM NO': 'B0235',
        'DESCRIPTION': '  Aluminium Front Shock Tower  ',
        'PRICE/ NET': '24.50',
        'BARCODE': '4944925032547',
        'QTY': '15',
        'EXTRA_JUNK': 'do not include',
      }

      const norm = normaliseRow(raw, fieldMap)
      expect(norm.supplierSku).toBe('B0235')
      expect(norm.productName).toBe('Aluminium Front Shock Tower')
      expect(norm.netPriceMinorUnits).toBe(2450)
      expect(norm.eanGtin).toBe('4944925032547')
      expect(norm.stockQuantity).toBe(15)
    })

    it('validates rows and reports critical errors vs warnings', () => {
      const invalidRow = {
        supplierSku: null,
        manufacturerSku: null,
        eanGtin: null,
        productName: 'Item Without SKU',
        netPriceMinorUnits: -10,
        currency: null,
        stockQuantity: null,
        rawAvailability: null,
        isMalformed: false,
      }
      const val1 = validateRow(invalidRow)
      expect(val1.rowStatus).toBe('INVALID')
      expect(val1.errors.some((e) => e.includes('MISSING_SKU'))).toBe(true)
      expect(val1.errors.some((e) => e.includes('INVALID_PRICE'))).toBe(true)

      const warningRow = {
        supplierSku: 'VALID-SKU',
        manufacturerSku: null,
        eanGtin: null,
        productName: 'Valid Item',
        netPriceMinorUnits: 1500,
        currency: null,
        stockQuantity: null,
        rawAvailability: null,
        isMalformed: false,
      }
      const val2 = validateRow(warningRow)
      expect(val2.rowStatus).toBe('WARNING')
      expect(val2.warnings.some((w) => w.includes('MISSING_CURRENCY'))).toBe(true)
    })
  })

  describe('Duplicate Detection', () => {
    it('detects duplicate SKUs and duplicate EANs', () => {
      const rows = [
        { supplierSku: 'SKU-A', eanGtin: '11111111' },
        { supplierSku: 'SKU-B', eanGtin: '22222222' },
        { supplierSku: 'SKU-A', eanGtin: '33333333' }, // Dup SKU
        { supplierSku: 'SKU-C', eanGtin: '22222222' }, // Dup EAN
      ]

      const dups = detectDuplicates(rows)
      expect(dups.duplicates.has(2)).toBe(true)
      expect(dups.duplicates.get(2)).toBe(0) // Matches SKU-A at idx 0
      expect(dups.duplicates.has(3)).toBe(true)
      expect(dups.duplicates.get(3)).toBe(1) // Matches EAN at idx 1
    })
  })

  describe('SKU Matching Logic', () => {
    const existingMappings = [
      {
        supplierId: 'sup-1',
        supplierSku: 'MUGEN-001',
        canonicalProductId: 'prod-100',
        canonicalVariantId: null,
        status: 'MATCHED',
      },
    ]

    const existingSupplierProducts = [
      {
        id: 'sp-200',
        supplierId: 'sup-1',
        supplierSku: 'MUGEN-002',
        manufacturerSku: 'MF-002',
        eanGtin: '99999999',
      },
    ]

    it('matches VERIFIED with verified mapping', () => {
      const res = matchSku('sup-1', 'MUGEN-001', null, null, existingMappings, existingSupplierProducts)
      expect(res.confidence).toBe('VERIFIED')
      expect(res.matchedProductId).toBe('prod-100')
      expect(res.rowAction).toBe('UPDATE')
    })

    it('matches KNOWN with exact supplier SKU in supplier products', () => {
      const res = matchSku('sup-1', 'MUGEN-002', null, null, existingMappings, existingSupplierProducts)
      expect(res.confidence).toBe('KNOWN')
      expect(res.matchedProductId).toBe('sp-200')
      expect(res.rowAction).toBe('UPDATE')
    })

    it('matches INFERRED with matching EAN', () => {
      const res = matchSku('sup-1', 'DIFFERENT-SKU', null, '99999999', existingMappings, existingSupplierProducts)
      expect(res.confidence).toBe('INFERRED')
      expect(res.matchedProductId).toBe('sp-200')
      expect(res.rowAction).toBe('UPDATE')
    })

    it('returns UNKNOWN / CREATE for unrecognised products', () => {
      const res = matchSku('sup-1', 'BRAND-NEW-SKU', null, null, existingMappings, existingSupplierProducts)
      expect(res.confidence).toBe('UNKNOWN')
      expect(res.matchedProductId).toBeNull()
      expect(res.rowAction).toBe('CREATE')
    })
  })
})
