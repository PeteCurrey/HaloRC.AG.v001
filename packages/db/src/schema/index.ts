// packages/db/src/schema/index.ts
// Single export point for the complete Drizzle schema.

// Enums
export * from './enums'

// Brands, manufacturers, markets
export * from './brands'

// Product graph: platforms, products, variants, market offers, inventory
export * from './products'

// Content: specifications, media, documents, compatibility
export * from './content'

// Builds: editorial, race, recommended, customer
export * from './builds'

// Garage: user vehicles, service log, QR/serial
export * from './garage'

// Suppliers: CRM, brand relationships, terms, documents
export * from './suppliers'

// Auth: profiles, orders, order items
export * from './auth'
