// packages/db/src/fixtures/supplier-feed-fixture.ts
// Deterministic Multi-Supplier Ingestion Fixture Dataset (Section 24 baseline)

import type { RawSupplierFeedItem } from '@halo-rc/types'

/**
 * Authoritative integration test fixture dataset containing:
 * 1. Vehicle (Chassis Kit)
 * 2. Spare Part (Suspension arm)
 * 3. Optional Upgrade (Titanium turnbuckles)
 * 4. Accessory (Pit mat / tool bag)
 * 5. Electronics Item (Sensored Brushless Motor)
 * 6. Engine (Competition Nitro/Petrol engine)
 * 7. Product with Variants (multi-color / multi-configuration)
 * 8. Product with In-Stock quantity
 * 9. Product with Out-of-Stock (0 quantity)
 * 10. Product with Missing Data (missing SKU or corrupted cost)
 * 11. Duplicate Product (identical SKU within same feed)
 * 12. Discontinued Product (explicitly flagged discontinued)
 */
export const DETERMINISTIC_SUPPLIER_FEED_FIXTURE: RawSupplierFeedItem[] = [
  // 1. Vehicle (Chassis Kit) - Maps to canonical XRAY X4 2026
  {
    supplierSku: 'XRAY-300040',
    manufacturerSku: 'XRAY-300040',
    partNumber: '300040',
    eanGtin: '8581703000402',
    title: "XRAY X4 '26 1/10 Touring Car Kit EU Graphite",
    brandName: 'XRAY',
    description: '1/10 competition electric touring car chassis with all-carbon lower suspension and mid-motor layout.',
    cost: 49500, // £495.00
    rrp: 72900,  // £729.00
    currency: 'GBP',
    availability: 'in stock',
    quantity: 12,
    leadTimeDays: 1,
    leadTimeText: 'Next-day courier dispatch',
    sourceTimestamp: '2026-03-01T09:00:00Z',
  },

  // 2. Spare Part (Suspension arm)
  {
    supplierSku: 'XRAY-302160',
    manufacturerSku: '302160',
    partNumber: '302160',
    eanGtin: '8581703021605',
    title: 'X4 Front Lower Suspension Arm - Hard Composite',
    brandName: 'XRAY',
    description: 'Replacement front lower wishbone molded from ultra-rigid graphite composite.',
    cost: 1450, // £14.50
    rrp: 2199,  // £21.99
    currency: 'GBP',
    availability: 'in stock',
    quantity: 45,
    leadTimeDays: 1,
    leadTimeText: 'Immediate stock',
    sourceTimestamp: '2026-03-01T09:00:00Z',
  },

  // 3. Optional Upgrade (Titanium Turnbuckles)
  {
    supplierSku: 'HUDY-293401',
    manufacturerSku: '293401',
    partNumber: '293401',
    eanGtin: '8581702934012',
    title: 'HUDY Lightweight Titanium Turnbuckle Set M3x42 (4pcs)',
    brandName: 'HUDY',
    description: 'Precision CNC-machined Grade 5 titanium steering linkages.',
    cost: 3200, // £32.00
    rrp: 4800,  // £48.00
    currency: 'GBP',
    availability: 'in stock',
    quantity: 18,
    leadTimeDays: 2,
    leadTimeText: 'Dispatches within 48h',
    sourceTimestamp: '2026-03-01T09:00:00Z',
  },

  // 4. Accessory (Pit Mat / Tool Bag)
  {
    supplierSku: 'HUDY-199010',
    manufacturerSku: '199010',
    partNumber: '199010',
    eanGtin: '8581701990101',
    title: 'HUDY Professional Pit Mat 100x60cm Anti-Static',
    brandName: 'HUDY',
    description: 'Chemical-resistant neoprene work mat with magnetic hardware trays.',
    cost: 2900, // £29.00
    rrp: 4500,  // £45.00
    currency: 'GBP',
    availability: 'low stock',
    quantity: 3,
    leadTimeDays: 1,
    sourceTimestamp: '2026-03-01T09:00:00Z',
  },

  // 5. Electronics Item (Competition Sensored Brushless Motor)
  {
    supplierSku: 'HW-30401140',
    manufacturerSku: '30401140',
    partNumber: '30401140',
    eanGtin: '6938994411401',
    title: 'Hobbywing XeRun V10 G4 Competition Brushless Motor 13.5T',
    brandName: 'Hobbywing',
    description: 'EFRA/ROAR legal stock competition brushless motor with high-temperature stator.',
    cost: 6500, // £65.00
    rrp: 9900,  // £99.00
    currency: 'GBP',
    availability: 'in stock',
    quantity: 35,
    leadTimeDays: 1,
    sourceTimestamp: '2026-03-01T09:00:00Z',
  },

  // 6. Engine (Competition Nitro/Petrol Engine)
  {
    supplierSku: 'FX-65201',
    manufacturerSku: 'FX-65201',
    partNumber: '65201',
    eanGtin: '8581706520109',
    title: 'FX K303 .21 3-Port Competition Off-Road Nitro Racing Engine',
    brandName: 'FX Engines',
    description: 'Diamond-coated crankshaft competition buggy engine hand-tuned in Slovakia.',
    cost: 28500, // £285.00
    rrp: 42900,  // £429.00
    currency: 'GBP',
    availability: 'in stock',
    quantity: 6,
    leadTimeDays: 3,
    sourceTimestamp: '2026-03-01T09:00:00Z',
  },

  // 7. Product with Variants (multi-color / multi-configuration)
  {
    supplierSku: 'ARRMA-ARA7617V2-RED',
    manufacturerSku: 'ARA7617V2-R',
    partNumber: 'ARA7617V2',
    eanGtin: '0505197617012',
    title: 'ARRMA Infraction 6S BLX All-Road Speed Truck RTR - Red/Silver',
    brandName: 'ARRMA',
    description: '1/7 scale 80+ MPH brushless 4WD speed bash truck, Red livery edition.',
    cost: 41000, // £410.00
    rrp: 61999,  // £619.99
    currency: 'GBP',
    availability: 'in stock',
    quantity: 8,
    leadTimeDays: 2,
    sourceTimestamp: '2026-03-01T09:00:00Z',
  },
  {
    supplierSku: 'ARRMA-ARA7617V2-BLU',
    manufacturerSku: 'ARA7617V2-B',
    partNumber: 'ARA7617V2',
    eanGtin: '0505197617029',
    title: 'ARRMA Infraction 6S BLX All-Road Speed Truck RTR - Matte Blue',
    brandName: 'ARRMA',
    description: '1/7 scale 80+ MPH brushless 4WD speed bash truck, Matte Blue edition.',
    cost: 41000,
    rrp: 61999,
    currency: 'GBP',
    availability: 'in stock',
    quantity: 4,
    leadTimeDays: 2,
    sourceTimestamp: '2026-03-01T09:00:00Z',
  },

  // 8. Product with Stock
  {
    supplierSku: 'HW-30112750',
    manufacturerSku: '30112750',
    partNumber: '30112750',
    eanGtin: '6938994412750',
    title: 'Hobbywing XeRun XR10 Pro G3 Competition ESC 160A',
    brandName: 'Hobbywing',
    cost: 14500, // £145.00
    rrp: 21900,  // £219.00
    currency: 'GBP',
    availability: 'in stock',
    quantity: 22,
    leadTimeDays: 1,
    sourceTimestamp: '2026-03-01T09:00:00Z',
  },

  // 9. Product with No Stock (Out of stock at supplier)
  {
    supplierSku: 'XRAY-300041-OOS',
    manufacturerSku: '300041',
    partNumber: '300041',
    eanGtin: '8581703000419',
    title: 'XRAY X4F Front Wheel Drive Electric Touring Car Kit',
    brandName: 'XRAY',
    cost: 48000,
    rrp: 71000,
    currency: 'GBP',
    availability: 'out of stock',
    quantity: 0,
    leadTimeDays: 14,
    leadTimeText: 'Factory backorder — 2 weeks estimated',
    sourceTimestamp: '2026-03-01T09:00:00Z',
  },

  // 10. Product with Missing Data (Empty SKU - Will trigger validation exception)
  {
    supplierSku: '', // Intentionally invalid
    title: 'Corrupted Unlabelled Package Item',
    cost: 1500,
    currency: 'GBP',
    availability: 'in stock',
    sourceTimestamp: '2026-03-01T09:00:00Z',
  },

  // 10b. Product with Invalid Price (Zero cost)
  {
    supplierSku: 'INV-PRICE-001',
    title: 'Glitched Free Widget Part',
    cost: 0, // Intentionally invalid
    currency: 'GBP',
    availability: 'in stock',
    quantity: 10,
    sourceTimestamp: '2026-03-01T09:00:00Z',
  },

  // 11. Duplicate Product (Identical SKU to item #1 with conflicting modified price)
  {
    supplierSku: 'XRAY-300040', // Duplicate SKU
    manufacturerSku: 'XRAY-300040',
    title: "XRAY X4 '26 Duplicate Line Item",
    brandName: 'XRAY',
    cost: 49000,
    currency: 'GBP',
    availability: 'in stock',
    quantity: 5,
    sourceTimestamp: '2026-03-01T09:01:00Z',
  },

  // 12. Discontinued Product (Explicitly flagged discontinued by factory)
  {
    supplierSku: 'XRAY-300030-DISC',
    manufacturerSku: '300030',
    partNumber: '300030',
    eanGtin: '8581703000303',
    title: "XRAY T4 '21 1/10 Electric Touring Car Kit (Legacy)",
    brandName: 'XRAY',
    cost: 39000,
    rrp: 59900,
    currency: 'GBP',
    availability: 'discontinued',
    quantity: 0,
    leadTimeDays: null,
    leadTimeText: 'Factory discontinued. Superseded by X4 series.',
    sourceTimestamp: '2026-03-01T09:00:00Z',
  },
]

/**
 * Helper to generate CSV representation of the fixture feed.
 */
export function getDeterministicFixtureCsv(): string {
  const headers = [
    'supplier_sku',
    'manufacturer_sku',
    'part_number',
    'ean_gtin',
    'title',
    'brand',
    'description',
    'wholesale_price',
    'retail_price',
    'currency',
    'stock_status',
    'quantity',
    'lead_time_days',
  ]

  const rows = DETERMINISTIC_SUPPLIER_FEED_FIXTURE.map((item) => [
    `"${item.supplierSku}"`,
    item.manufacturerSku ? `"${item.manufacturerSku}"` : '',
    item.partNumber ? `"${item.partNumber}"` : '',
    item.eanGtin ? `"${item.eanGtin}"` : '',
    `"${item.title.replace(/"/g, '""')}"`,
    item.brandName ? `"${item.brandName}"` : '',
    item.description ? `"${(item.description || '').replace(/"/g, '""')}"` : '',
    (item.cost / 100).toFixed(2),
    item.rrp ? (item.rrp / 100).toFixed(2) : '',
    item.currency,
    `"${item.availability}"`,
    item.quantity !== undefined && item.quantity !== null ? String(item.quantity) : '',
    item.leadTimeDays !== undefined && item.leadTimeDays !== null ? String(item.leadTimeDays) : '',
  ].join(','))

  return [headers.join(','), ...rows].join('\n')
}

/**
 * Helper to generate JSON representation of the fixture feed.
 */
export function getDeterministicFixtureJson(): string {
  return JSON.stringify({
    version: '2026.1',
    supplier: 'CML Distribution',
    exported_at: '2026-03-01T09:00:00Z',
    items: DETERMINISTIC_SUPPLIER_FEED_FIXTURE,
  }, null, 2)
}

/**
 * Helper to generate XML representation of the fixture feed.
 */
export function getDeterministicFixtureXml(): string {
  const itemsXml = DETERMINISTIC_SUPPLIER_FEED_FIXTURE.map((item) => `
    <product>
      <supplier_sku><![CDATA[${item.supplierSku}]]></supplier_sku>
      <manufacturer_sku><![CDATA[${item.manufacturerSku || ''}]]></manufacturer_sku>
      <part_number><![CDATA[${item.partNumber || ''}]]></part_number>
      <ean><![CDATA[${item.eanGtin || ''}]]></ean>
      <title><![CDATA[${item.title}]]></title>
      <brand><![CDATA[${item.brandName || ''}]]></brand>
      <description><![CDATA[${item.description || ''}]]></description>
      <cost>${(item.cost / 100).toFixed(2)}</cost>
      <rrp>${item.rrp ? (item.rrp / 100).toFixed(2) : ''}</rrp>
      <currency>${item.currency}</currency>
      <availability><![CDATA[${item.availability}]]></availability>
      <quantity>${item.quantity !== undefined && item.quantity !== null ? item.quantity : ''}</quantity>
      <lead_time_days>${item.leadTimeDays !== undefined && item.leadTimeDays !== null ? item.leadTimeDays : ''}</lead_time_days>
    </product>`).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<catalog supplier="CML Distribution" generated="2026-03-01T09:00:00Z">
  ${itemsXml}
</catalog>`
}
