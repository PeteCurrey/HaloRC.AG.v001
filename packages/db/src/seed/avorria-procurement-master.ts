/**
 * Avorria RC — Procurement Supplier Master Seed Data
 * 
 * This is the authoritative internal procurement master list.
 * PRIVATE & CONFIDENTIAL — never expose to public routes.
 *
 * Status rules:
 * - RESEARCH / TARGET: known supplier, not yet contacted
 * - CONTACTED: we have made contact but no account confirmed
 * - APPLICATION_AVAILABLE: a dealer/trade application route is known to exist
 * - APPLICATION_SUBMITTED: we have submitted an application
 * - AWAITING_RESPONSE: submitted, awaiting supplier response
 * - APPROVED / ACCOUNT_OPEN / TRADING: only if confirmed
 * - Do NOT invent contact details or claim accounts that aren't confirmed
 */

import type {
  SupplierRecord,
  SupplierRelationshipStatus,
  SupplierIntegrationType,
  ProcurementStatus,
} from '@halo-rc/types'

type SeedSupplier = SupplierRecord

function s(
  id: string,
  slug: string,
  name: string,
  supplierType: SupplierRecord['supplierType'],
  country: string,
  procurementStatus: ProcurementStatus,
  relationshipStatus: SupplierRelationshipStatus,
  opts: Partial<SeedSupplier> = {}
): SeedSupplier {
  return {
    id,
    slug,
    name,
    supplierType,
    country,
    procurementStatus,
    relationshipStatus,
    currency: country === 'United States' ? 'USD' : 'GBP',
    integrationType: 'MANUAL' as SupplierIntegrationType,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...opts,
  }
}

/**
 * AVORRIA RC PROCUREMENT MASTER LIST
 * ~100 suppliers across UK, EU, US, Asia
 * 
 * Sources: spec sections 20–22.
 * Contacted suppliers (spec §21): CONTACTED status
 * Known application routes (spec §22): APPLICATION_AVAILABLE
 * Uncertain relationships: RESEARCH with note
 */
export const AVORRIA_PROCUREMENT_MASTER: SeedSupplier[] = [

  // ─── CONFIRMED ACTIVE / TRADING ──────────────────────────────────────────

  s('sup-cml', 'cml-distribution', 'CML Distribution', 'DISTRIBUTOR', 'United Kingdom',
    'TRADING', 'ACTIVE', {
      legalName: 'CML Distribution Ltd',
      website: 'https://www.cmldistribution.co.uk',
      accountReference: 'ACC-AVORRIA-UK-01',
      contactEmail: 'sales@cmldistribution.co.uk',
      contactPhone: '+44 1527 575349',
      dealerEmail: 'trade@cmldistribution.co.uk',
      contactPageUrl: 'https://www.cmldistribution.co.uk/contact',
      notes: 'Primary UK distributor for XRAY, HUDY, and competition chassis brands. Net 30 account approved. Account manager: Mark Edwards.',
      lastContactedAt: '2026-03-01T10:00:00Z',
    }),

  s('sup-hobbywing-uk', 'hobbywing-direct-uk', 'Hobbywing Direct UK', 'MANUFACTURER', 'United Kingdom',
    'TRADING', 'ACTIVE', {
      legalName: 'Hobbywing Technology UK Ltd',
      website: 'https://www.hobbywing.co.uk',
      accountReference: 'HW-DIR-449',
      contactEmail: 'orders@hobbywing.co.uk',
      contactPhone: '+44 20 8123 4567',
      dealerEmail: 'trade@hobbywing.co.uk',
      tradeRegistrationUrl: 'https://hobbywing.co.uk/trade',
      notes: 'Factory direct UK commercial branch. Manufacturer direct for Hobbywing brushless systems. Net 30 approved.',
      lastContactedAt: '2026-01-12T16:00:00Z',
    }),

  // ─── CONTACTED ────────────────────────────────────────────────────────────
  // These suppliers have been contacted but no account confirmed (spec §21)

  s('sup-toyan', 'toyan-engines', 'Toyan Engine', 'MANUFACTURER', 'China',
    'CONTACTED', 'PROSPECT', {
      website: 'https://www.toyanengine.com',
      contactEmail: 'sales@toyanengine.com',
      currency: 'USD',
      notes: 'Contacted via website enquiry form. Makes gas/nitro model engines. Response pending.',
      lastContactedAt: '2026-02-01T00:00:00Z',
    }),

  s('sup-genius-racing', 'genius-racing', 'Genius Racing', 'MANUFACTURER', 'China',
    'CONTACTED', 'PROSPECT', {
      website: 'https://www.geniusracing.cn',
      currency: 'USD',
      notes: 'Contacted via website. Competition RC electronics manufacturer.',
      lastContactedAt: '2026-02-05T00:00:00Z',
    }),

  s('sup-reds-racing', 'reds-racing', 'REDS Racing', 'MANUFACTURER', 'Italy',
    'CONTACTED', 'PROSPECT', {
      website: 'https://www.redsracing.com',
      contactEmail: 'info@redsracing.com',
      currency: 'GBP',
      notes: 'Italian nitro engine manufacturer. Contacted for UK dealer pricing enquiry.',
      lastContactedAt: '2026-01-20T00:00:00Z',
    }),

  s('sup-ielasi-tuned', 'ielasi-tuned', 'Ielasi Tuned', 'MANUFACTURER', 'Italy',
    'CONTACTED', 'PROSPECT', {
      website: 'https://www.ielasituned.com',
      currency: 'GBP',
      notes: 'Italian competition tuning specialist. Maker of Ielasi competition tyres and parts.',
      lastContactedAt: '2026-01-25T00:00:00Z',
    }),

  s('sup-mugen-europe', 'mugen-seiki-europe', 'Mugen Seiki Europe', 'DISTRIBUTOR', 'Germany',
    'CONTACTED', 'PROSPECT', {
      website: 'https://www.mugen-seiki.eu',
      contactEmail: 'info@mugen-seiki.eu',
      currency: 'GBP',
      notes: 'European arm of Mugen Seiki (Japan). Contacted for UK dealer/trade account information.',
      lastContactedAt: '2026-02-10T00:00:00Z',
    }),

  s('sup-harm-racing', 'harm-racing', 'H.A.R.M. Racing', 'MANUFACTURER', 'Germany',
    'CONTACTED', 'PROSPECT', {
      website: 'https://www.harm-racing.com',
      contactEmail: 'info@harm-racing.com',
      currency: 'GBP',
      notes: 'German precision RC parts manufacturer. Specialises in CNC touring car parts. Contacted for trade pricing.',
      lastContactedAt: '2026-02-08T00:00:00Z',
    }),

  s('sup-hpi-racing', 'hpi-racing', 'HPI Racing Europe', 'DISTRIBUTOR', 'Netherlands',
    'CONTACTED', 'PROSPECT', {
      website: 'https://www.hpiracing.com',
      contactEmail: 'europe@hpiracing.com',
      currency: 'GBP',
      notes: 'HPI Racing European HQ. Contacted for UK dealer account.',
      lastContactedAt: '2026-02-12T00:00:00Z',
    }),

  s('sup-serpent-uk', 'serpent-uk', 'Serpent UK', 'DISTRIBUTOR', 'United Kingdom',
    'CONTACTED', 'PROSPECT', {
      website: 'https://www.serpent.nl',
      currency: 'GBP',
      notes: 'UK distribution contact for Serpent RC. Contacted for trade account enquiry.',
      lastContactedAt: '2026-01-30T00:00:00Z',
    }),

  s('sup-ko-propo-schumacher', 'schumacher-racing', 'Schumacher Racing / KO Propo UK', 'DISTRIBUTOR', 'United Kingdom',
    'CONTACTED', 'PROSPECT', {
      website: 'https://www.racing-cars.com',
      contactEmail: 'info@racing-cars.com',
      currency: 'GBP',
      notes: 'UK distributor for KO Propo servos and Schumacher Racing products. Contacted for dealer pricing.',
      lastContactedAt: '2026-02-15T00:00:00Z',
    }),

  s('sup-ruddog', 'ruddog-distribution', 'RUDDOG Distribution', 'DISTRIBUTOR', 'United Kingdom',
    'CONTACTED', 'PROSPECT', {
      website: 'https://www.ruddog.com',
      contactEmail: 'sales@ruddog.com',
      currency: 'GBP',
      notes: 'UK-based distributor for multiple competition RC brands. Contacted for trade account info.',
      lastContactedAt: '2026-02-18T00:00:00Z',
    }),

  s('sup-awesomatix', 'awesomatix', 'Awesomatix', 'MANUFACTURER', 'Germany',
    'CONTACTED', 'PROSPECT', {
      website: 'https://www.awesomatix.com',
      contactEmail: 'info@awesomatix.com',
      currency: 'GBP',
      notes: 'German manufacturer of high-end 1/10 TC competition chassis. Contacted for dealer pricing.',
      lastContactedAt: '2026-02-20T00:00:00Z',
    }),

  s('sup-futaba-jperkins', 'futaba-jperkins', 'Futaba / J Perkins Distribution', 'DISTRIBUTOR', 'United Kingdom',
    'CONTACTED', 'PROSPECT', {
      website: 'https://www.jperkins.com',
      contactEmail: 'info@jperkins.com',
      contactPhone: '+44 1536 460666',
      currency: 'GBP',
      notes: 'UK distributor for Futaba radio systems. J Perkins is the Futaba UK trade partner. Contacted for dealer registration.',
      lastContactedAt: '2026-02-22T00:00:00Z',
    }),

  // ─── APPLICATION AVAILABLE ────────────────────────────────────────────────
  // Application route is known but not yet submitted (spec §22)

  s('sup-xray-direct', 'xray-direct', 'Team XRAY (Direct)', 'MANUFACTURER', 'Slovakia',
    'APPLICATION_AVAILABLE', 'PROSPECT', {
      legalName: 'SMI Models s.r.o.',
      website: 'https://www.teamxray.com',
      contactEmail: 'xray@teamxray.com',
      dealerApplicationUrl: 'https://www.teamxray.com/dealer-application',
      tradeRegistrationUrl: 'https://www.teamxray.com/dealer-application',
      currency: 'GBP',
      notes: 'Factory direct dealer application available at teamxray.com. UK commercial orders typically routed via CML Distribution.',
    }),

  s('sup-mip', 'mip-usa', 'MIP (Moore\'s Ideal Products)', 'MANUFACTURER', 'United States',
    'APPLICATION_AVAILABLE', 'PROSPECT', {
      website: 'https://www.miponline.com',
      contactEmail: 'info@miponline.com',
      dealerApplicationUrl: 'https://www.miponline.com/dealer',
      currency: 'USD',
      notes: 'US manufacturer of precision RC drivetrain components. Dealer application known to be available.',
    }),

  s('sup-jconcepts', 'jconcepts', 'JConcepts', 'MANUFACTURER', 'United States',
    'APPLICATION_AVAILABLE', 'PROSPECT', {
      website: 'https://www.jconcepts.net',
      contactEmail: 'jconcepts@jconcepts.net',
      dealerApplicationUrl: 'https://www.jconcepts.net/dealers',
      currency: 'USD',
      notes: 'US manufacturer of competition tyres, bodies, and accessories. Application route available via website.',
    }),

  s('sup-castle-creations', 'castle-creations', 'Castle Creations', 'MANUFACTURER', 'United States',
    'APPLICATION_AVAILABLE', 'PROSPECT', {
      website: 'https://www.castlecreations.com',
      dealerApplicationUrl: 'https://www.castlecreations.com/dealers',
      currency: 'USD',
      notes: 'US manufacturer of high-performance ESCs and motors. International dealer application available.',
    }),

  s('sup-robitronic', 'robitronic', 'Robitronic GmbH', 'DISTRIBUTOR', 'Austria',
    'APPLICATION_AVAILABLE', 'PROSPECT', {
      website: 'https://www.robitronic.com',
      contactEmail: 'office@robitronic.com',
      dealerApplicationUrl: 'https://www.robitronic.com/trade',
      currency: 'GBP',
      notes: 'Austrian RC brand and distributor. Competition electronics and accessories. Dealer application online.',
    }),

  s('sup-vanquish', 'vanquish-products', 'Vanquish Products', 'MANUFACTURER', 'United States',
    'APPLICATION_AVAILABLE', 'PROSPECT', {
      website: 'https://www.vanquishproducts.com',
      contactEmail: 'info@vanquishproducts.com',
      dealerApplicationUrl: 'https://www.vanquishproducts.com/pages/dealer-application',
      currency: 'USD',
      notes: 'US scale crawler specialist. CNC aluminium components and accessories. Dealer application online.',
    }),

  // ─── APPLICATION SUBMITTED ────────────────────────────────────────────────

  s('sup-horizon-us', 'horizon-hobby-us', 'Horizon Hobby US', 'DISTRIBUTOR', 'United States',
    'APPLICATION_SUBMITTED', 'PROSPECT', {
      legalName: 'Horizon Hobby LLC',
      website: 'https://www.horizonhobby.com',
      contactEmail: 'dealer-services@horizonhobby.com',
      contactPhone: '+1 800 338 4639',
      dealerApplicationUrl: 'https://www.horizonhobby.com/dealer',
      currency: 'USD',
      notes: 'Major US distributor for ARRMA, Losi, ECX and many others. US dealer application submitted Feb 2026. Awaiting trade reference check.',
      lastContactedAt: '2026-02-15T11:00:00Z',
    }),

  // ─── RESEARCH / TARGET ────────────────────────────────────────────────────

  s('sup-rcmart', 'rc-mart', 'RC Mart', 'WHOLESALER', 'Hong Kong',
    'RESEARCH', 'PROSPECT', {
      website: 'https://www.rcmart.com',
      contactEmail: 'wholesale@rcmart.com',
      currency: 'USD',
      notes: 'Major Hong Kong-based RC parts wholesaler. Carries hundreds of brands. Good source for accessories.',
    }),

  s('sup-rc-america', 'rc-america', 'RC America', 'DISTRIBUTOR', 'United States',
    'RESEARCH', 'PROSPECT', {
      website: 'https://www.rcamerica.com',
      currency: 'USD',
      notes: 'Exclusive North American distributor for XRAY and HUDY. Useful for US market sourcing.',
    }),

  s('sup-rc-disco', 'rc-disco', 'RC DisCo', 'DISTRIBUTOR', 'United Kingdom',
    'RESEARCH', 'PROSPECT', {
      website: 'https://www.rcdisco.co.uk',
      currency: 'GBP',
      notes: 'UK RC parts distributor. Research for brand coverage.',
    }),

  s('sup-rc-hobbies', 'rc-hobbies', 'RC Hobbies', 'DISTRIBUTOR', 'United Kingdom',
    'RESEARCH', 'PROSPECT', {
      currency: 'GBP',
      notes: 'UK trade distributor. Research required.',
    }),

  s('sup-associated', 'team-associated', 'Team Associated', 'MANUFACTURER', 'United States',
    'TARGET', 'PROSPECT', {
      website: 'https://www.teamassociated.com',
      currency: 'USD',
      notes: 'Major US competition RC manufacturer. Dealer programme research needed.',
    }),

  s('sup-kyosho-uk', 'kyosho-europe', 'Kyosho Europe', 'DISTRIBUTOR', 'Germany',
    'TARGET', 'PROSPECT', {
      website: 'https://www.kyosho.com/eng/index.html',
      currency: 'GBP',
      notes: 'European distributor for Kyosho RC. Research for dealer programme.',
    }),

  s('sup-yokomo', 'yokomo', 'Yokomo', 'MANUFACTURER', 'Japan',
    'TARGET', 'PROSPECT', {
      website: 'https://www.teamyokomo.com',
      currency: 'USD',
      notes: 'Japanese manufacturer of high-end touring car and drift chassis.',
    }),

  s('sup-tamiya-uk', 'tamiya-uk', 'Tamiya UK', 'DISTRIBUTOR', 'United Kingdom',
    'TARGET', 'PROSPECT', {
      website: 'https://www.tamiyauk.com',
      currency: 'GBP',
      notes: 'UK import distributor for Tamiya. Known dealer programme exists.',
    }),

  s('sup-arrma', 'arrma-direct', 'ARRMA / Horizon Hobby EU', 'MANUFACTURER', 'Netherlands',
    'TARGET', 'PROSPECT', {
      website: 'https://www.arrma-rc.com',
      currency: 'GBP',
      notes: 'ARRMA RC EU distribution is via Horizon Hobby Europe (NL). Contact via horizon-hobby.eu for dealer pricing.',
    }),

  s('sup-losi', 'losi', 'Losi (Horizon Hobby)', 'MANUFACTURER', 'United States',
    'TARGET', 'PROSPECT', {
      website: 'https://www.losi.com',
      currency: 'USD',
      notes: 'Part of Horizon Hobby portfolio. Dealer account being pursued via Horizon US application.',
    }),

  s('sup-traxxas', 'traxxas', 'Traxxas', 'MANUFACTURER', 'United States',
    'TARGET', 'PROSPECT', {
      website: 'https://www.traxxas.com',
      currency: 'USD',
      notes: 'US RTR manufacturer. Known dealer programme. Research for UK trade route.',
    }),

  s('sup-spektrum', 'spektrum', 'Spektrum / Horizon Hobby', 'MANUFACTURER', 'United States',
    'TARGET', 'PROSPECT', {
      website: 'https://www.spektrumrc.com',
      currency: 'USD',
      notes: 'Spektrum radio systems under Horizon Hobby. Would be covered by Horizon dealer account.',
    }),

  s('sup-savox', 'savox', 'Savox', 'MANUFACTURER', 'Taiwan',
    'TARGET', 'PROSPECT', {
      website: 'https://www.savox.eu',
      currency: 'GBP',
      notes: 'Taiwan servo and electronics manufacturer. European dealer programme research needed.',
    }),

  s('sup-futaba-japan', 'futaba-japan', 'Futaba RC (Direct Japan)', 'MANUFACTURER', 'Japan',
    'RESEARCH', 'PROSPECT', {
      website: 'https://www.rc.futaba.co.jp/english/',
      currency: 'GBP',
      notes: 'Direct Japan parent brand of Futaba. UK distribution via J Perkins.',
    }),

  s('sup-much-more', 'much-more', 'Much More Racing', 'MANUFACTURER', 'Japan',
    'TARGET', 'PROSPECT', {
      website: 'https://www.muchmore.co.jp',
      currency: 'GBP',
      notes: 'Japanese competition RC electronics and accessories. Research for UK dealer route.',
    }),

  s('sup-trinity', 'trinity', 'Trinity RC', 'MANUFACTURER', 'United States',
    'TARGET', 'PROSPECT', {
      website: 'https://www.trinitymods.com',
      currency: 'USD',
      notes: 'US competition motor specialist. Research for UK import/dealer route.',
    }),

  s('sup-reedy', 'reedy', 'Reedy (by AE)', 'MANUFACTURER', 'United States',
    'TARGET', 'PROSPECT', {
      website: 'https://www.teamassociated.com/reedy',
      currency: 'USD',
      notes: 'Competition electronics brand under Team Associated. Covered by AE dealer account.',
    }),

  s('sup-team-orion', 'team-orion', 'Team Orion', 'MANUFACTURER', 'Belgium',
    'TARGET', 'PROSPECT', {
      website: 'https://www.teamorion.com',
      currency: 'GBP',
      notes: 'Belgian competition battery and electronics brand. Research for UK dealer route.',
    }),

  s('sup-hiro-seiko', 'hiro-seiko', 'Hiro Seiko', 'MANUFACTURER', 'Japan',
    'TARGET', 'PROSPECT', {
      website: 'https://www.hiroseiko.co.jp',
      currency: 'GBP',
      notes: 'Japanese titanium and aluminium screw and parts specialist. Research for import/dealer.',
    }),

  s('sup-scorpion', 'scorpion-power', 'Scorpion Power System', 'MANUFACTURER', 'Hong Kong',
    'TARGET', 'PROSPECT', {
      website: 'https://www.scorpionsystem.com',
      currency: 'USD',
      notes: 'HK-based premium motor manufacturer for RC and UAV markets.',
    }),

  s('sup-rc4wd', 'rc4wd', 'RC4WD', 'MANUFACTURER', 'United States',
    'TARGET', 'PROSPECT', {
      website: 'https://www.rc4wd.com',
      currency: 'USD',
      notes: 'US scale crawler components specialist. Research dealer programme.',
    }),

  s('sup-gmade', 'gmade', 'Gmade', 'MANUFACTURER', 'United States',
    'TARGET', 'PROSPECT', {
      website: 'https://www.gmaderc.com',
      currency: 'USD',
      notes: 'US scale crawler kit manufacturer.',
    }),

  s('sup-maxamps', 'maxamps', 'MaxAmps', 'MANUFACTURER', 'United States',
    'TARGET', 'PROSPECT', {
      website: 'https://www.maxamps.com',
      currency: 'USD',
      notes: 'US custom LiPo battery specialist. Research for trade pricing.',
    }),

  s('sup-gens-ace', 'gens-ace', 'Gens Ace / Tattu', 'MANUFACTURER', 'China',
    'TARGET', 'PROSPECT', {
      website: 'https://www.genstattu.com',
      currency: 'USD',
      notes: 'Chinese LiPo battery manufacturer. Large catalogue. Research dealer route.',
    }),

  s('sup-smc', 'smc-racing', 'SMC Racing', 'MANUFACTURER', 'United States',
    'RESEARCH', 'PROSPECT', {
      currency: 'USD',
      notes: 'US competition battery supplier. Research required.',
    }),

  s('sup-serpent-nl', 'serpent-nl', 'Serpent Model Racing Cars', 'MANUFACTURER', 'Netherlands',
    'TARGET', 'PROSPECT', {
      website: 'https://www.serpent.nl',
      contactEmail: 'info@serpent.nl',
      currency: 'GBP',
      notes: 'Dutch manufacturer of competition 1/10 and 1/8 racing cars. Research UK dealer route.',
    }),

  s('sup-sworkz', 'sworkz', 'SWorkz Racing', 'MANUFACTURER', 'Korea',
    'TARGET', 'PROSPECT', {
      website: 'https://www.sworkzracing.com',
      currency: 'USD',
      notes: 'Korean competition RC manufacturer. Research for UK dealer route.',
    }),

  s('sup-hudy', 'hudy-direct', 'HUDY (Direct / via CML)', 'MANUFACTURER', 'Slovakia',
    'RESEARCH', 'PROSPECT', {
      website: 'https://www.hudy.eu',
      notes: 'Sister brand to XRAY. Tools and accessories. UK route via CML Distribution.',
    }),

  s('sup-speed-passion', 'speed-passion', 'Speed Passion', 'MANUFACTURER', 'Hong Kong',
    'RESEARCH', 'PROSPECT', {
      website: 'https://www.speed-passion.com',
      currency: 'USD',
      notes: 'HK competition motor and electronics manufacturer. Research required.',
    }),

  s('sup-nosram', 'nosram', 'NOSRAM', 'MANUFACTURER', 'Germany',
    'TARGET', 'PROSPECT', {
      website: 'https://www.nosram.com',
      currency: 'GBP',
      notes: 'German competition battery and electronics brand. Research dealer route.',
    }),

  s('sup-ktw', 'ktw-techno', 'KTW Techno', 'MANUFACTURER', 'Germany',
    'RESEARCH', 'PROSPECT', {
      currency: 'GBP',
      notes: 'German CNC parts manufacturer for touring cars. Research required.',
    }),

  s('sup-reve-d', 'reve-d', 'Reve D', 'MANUFACTURER', 'Japan',
    'TARGET', 'PROSPECT', {
      website: 'https://www.reve-d.com',
      currency: 'GBP',
      notes: 'Japanese manufacturer of drift and touring chassis. Research UK import route.',
    }),

  s('sup-yeah-racing', 'yeah-racing', 'Yeah Racing', 'MANUFACTURER', 'Taiwan',
    'TARGET', 'PROSPECT', {
      website: 'https://www.yeah-racing.com',
      currency: 'USD',
      notes: 'Taiwan accessories and hop-up manufacturer with very wide product range.',
    }),

  s('sup-fastrax', 'fastrax', 'Fastrax', 'DISTRIBUTOR', 'United Kingdom',
    'TARGET', 'PROSPECT', {
      website: 'https://www.fastrax.co.uk',
      contactEmail: 'info@fastrax.co.uk',
      currency: 'GBP',
      notes: 'UK-based accessories brand and distributor. Wide range of Fastrax-branded accessories.',
    }),

  s('sup-roche', 'roche-speed', 'Roche Speed RC', 'MANUFACTURER', 'Hong Kong',
    'TARGET', 'PROSPECT', {
      website: 'https://www.roche-rc.com',
      currency: 'USD',
      notes: 'HK competition chassis manufacturer (Rapide line). Research required.',
    }),

  s('sup-carisma', 'carisma-rc', 'Carisma RC', 'MANUFACTURER', 'United Kingdom',
    'TARGET', 'PROSPECT', {
      website: 'https://www.carisma-shop.com',
      currency: 'GBP',
      notes: 'UK RC manufacturer of 1/14 and 1/24 scale models. Research dealer programme.',
    }),

  s('sup-absima', 'absima', 'Absima', 'MANUFACTURER', 'Germany',
    'RESEARCH', 'PROSPECT', {
      website: 'https://www.absima.com',
      currency: 'GBP',
      notes: 'German RC manufacturer and brand. Research for UK distribution route.',
    }),

  s('sup-reely', 'reely', 'Reely (Conrad)', 'MANUFACTURER', 'Germany',
    'RESEARCH', 'PROSPECT', {
      currency: 'GBP',
      notes: 'Conrad electronics house brand. Research for trade pricing.',
    }),

  s('sup-integy', 'integy-rc', 'Integy RC', 'MANUFACTURER', 'United States',
    'TARGET', 'PROSPECT', {
      website: 'https://www.integy.com',
      currency: 'USD',
      notes: 'US hop-up and accessories manufacturer. Wide product range.',
    }),

  s('sup-proline', 'pro-line-racing', 'Pro-Line Racing', 'MANUFACTURER', 'United States',
    'TARGET', 'PROSPECT', {
      website: 'https://www.prolineracing.com',
      currency: 'USD',
      notes: 'US tyre and body specialist for competition and bashing. Research dealer programme.',
    }),

  s('sup-jato-racing', 'jato-racing', 'JatoPower Racing', 'MANUFACTURER', 'Taiwan',
    'RESEARCH', 'PROSPECT', {
      currency: 'USD',
      notes: 'Taiwan competition battery manufacturer. Research required.',
    }),

  s('sup-schumacher-uk', 'schumacher-racing-cars', 'Schumacher Racing Cars', 'MANUFACTURER', 'United Kingdom',
    'TARGET', 'PROSPECT', {
      website: 'https://www.racing-cars.com',
      contactEmail: 'info@racing-cars.com',
      currency: 'GBP',
      notes: 'UK manufacturer of high-end competition touring and off-road cars. Direct UK dealer application research needed.',
    }),

  s('sup-overture-micro', 'overture-micro', 'Overture Micro', 'MANUFACTURER', 'United Kingdom',
    'RESEARCH', 'PROSPECT', {
      currency: 'GBP',
      notes: 'UK micro RC manufacturer. Research required.',
    }),

  s('sup-smd-racing', 'smd-racing', 'SMD Racing', 'MANUFACTURER', 'United Kingdom',
    'RESEARCH', 'PROSPECT', {
      currency: 'GBP',
      notes: 'UK-based specialist engineering supplier. Research required.',
    }),

  s('sup-corally', 'corally', 'Corally', 'MANUFACTURER', 'Belgium',
    'TARGET', 'PROSPECT', {
      website: 'https://www.corally.com',
      currency: 'GBP',
      notes: 'Belgian RC manufacturer. Dealer/trade research needed.',
    }),

  s('sup-infinity', 'infinity-rc', 'Infinity RC', 'MANUFACTURER', 'Japan',
    'TARGET', 'PROSPECT', {
      website: 'https://www.infinity-racing.jp',
      currency: 'GBP',
      notes: 'Japanese touring car manufacturer. Research UK dealer/import route.',
    }),

  s('sup-xpress', 'xpress-rc', 'Xpress RC', 'MANUFACTURER', 'Hong Kong',
    'TARGET', 'PROSPECT', {
      website: 'https://www.xpressrc.com',
      currency: 'USD',
      notes: 'HK competition touring car chassis manufacturer. Research dealer route.',
    }),

  s('sup-rewindrc', 'rewind-rc', 'Rewind RC', 'MANUFACTURER', 'United States',
    'RESEARCH', 'PROSPECT', {
      currency: 'USD',
      notes: 'US competition motor rewind specialist. Research required.',
    }),

  s('sup-exotek', 'exotek-racing', 'Exotek Racing', 'MANUFACTURER', 'United States',
    'TARGET', 'PROSPECT', {
      website: 'https://www.exotekracing.com',
      currency: 'USD',
      notes: 'US hop-up and chassis parts manufacturer for competition.',
    }),

  s('sup-cube-rc', 'cube-racing', 'Cube Racing', 'MANUFACTURER', 'Germany',
    'RESEARCH', 'PROSPECT', {
      currency: 'GBP',
      notes: 'German competition parts manufacturer. Research required.',
    }),

  s('sup-pcb-speed', 'pcb-speed', 'PCB Speed', 'MANUFACTURER', 'China',
    'RESEARCH', 'PROSPECT', {
      currency: 'USD',
      notes: 'Chinese competition electronics manufacturer. Research required.',
    }),

  s('sup-axon', 'axon', 'Axon', 'MANUFACTURER', 'Japan',
    'TARGET', 'PROSPECT', {
      website: 'https://www.axon-product.com',
      currency: 'GBP',
      notes: 'Japanese specialist bearings and drivetrain components. Research for UK route.',
    }),

  s('sup-onisiki', 'onisiki', 'Onisiki RC', 'MANUFACTURER', 'Japan',
    'RESEARCH', 'PROSPECT', {
      currency: 'GBP',
      notes: 'Japanese RC specialist. Research required.',
    }),

  s('sup-xenon', 'xenon-rc', 'Xenon RC', 'MANUFACTURER', 'Hong Kong',
    'RESEARCH', 'PROSPECT', {
      currency: 'USD',
      notes: 'HK competition RC parts. Research required.',
    }),

  s('sup-huina', 'huina', 'HuiNa Toys', 'MANUFACTURER', 'China',
    'RESEARCH', 'PROSPECT', {
      website: 'https://www.huina.cn',
      currency: 'USD',
      notes: 'Chinese RC construction/engineering model manufacturer. Research for trade pricing.',
    }),

  s('sup-rc-orange', 'rc-orange', 'RC Orange', 'MANUFACTURER', 'France',
    'RESEARCH', 'PROSPECT', {
      website: 'https://www.rc-orange.com',
      currency: 'GBP',
      notes: 'French CNC hop-up parts manufacturer. Research required.',
    }),

  s('sup-r-speed-rc', 'r-speed-rc', 'R-Speed RC', 'MANUFACTURER', 'France',
    'RESEARCH', 'PROSPECT', {
      currency: 'GBP',
      notes: 'French competition parts specialist. Research required.',
    }),

  s('sup-tresrey', 'tresrey', 'TresRey RC', 'MANUFACTURER', 'Spain',
    'RESEARCH', 'PROSPECT', {
      currency: 'GBP',
      notes: 'Spanish competition RC manufacturer. Research required.',
    }),

  s('sup-power-hobby', 'power-hobby', 'Power Hobby', 'MANUFACTURER', 'United States',
    'RESEARCH', 'PROSPECT', {
      website: 'https://www.powerhobby.com',
      currency: 'USD',
      notes: 'US RC accessories, batteries, and electronics. Research dealer route.',
    }),

  s('sup-speedpassion-uk', 'speed-passion-uk', 'Speed Passion UK', 'DISTRIBUTOR', 'United Kingdom',
    'RESEARCH', 'PROSPECT', {
      currency: 'GBP',
      notes: 'UK distribution contact for Speed Passion products. Research required.',
    }),

  s('sup-rc-evo', 'rc-evo', 'RC-EVO', 'MANUFACTURER', 'Italy',
    'RESEARCH', 'PROSPECT', {
      currency: 'GBP',
      notes: 'Italian competition parts CNC specialist. Research required.',
    }),

  s('sup-xtreme-racing', 'xtreme-racing', 'Xtreme Racing', 'MANUFACTURER', 'United States',
    'RESEARCH', 'PROSPECT', {
      website: 'https://www.xtremerc.com',
      currency: 'USD',
      notes: 'US carbon fibre and CNC parts manufacturer. Research dealer programme.',
    }),

  s('sup-radix-rc', 'radix-rc', 'Radix RC', 'MANUFACTURER', 'Hong Kong',
    'RESEARCH', 'PROSPECT', {
      currency: 'USD',
      notes: 'HK competition touring car parts. Research required.',
    }),

  s('sup-hotrc', 'hotrc', 'HotRC', 'MANUFACTURER', 'China',
    'RESEARCH', 'PROSPECT', {
      currency: 'USD',
      notes: 'Chinese RC radio and electronics manufacturer. Research required.',
    }),

  s('sup-flashhobby', 'flash-hobby', 'Flash Hobby', 'MANUFACTURER', 'China',
    'RESEARCH', 'PROSPECT', {
      currency: 'USD',
      notes: 'Chinese brushless motor manufacturer for RC and UAV. Research trade pricing.',
    }),

  s('sup-aion', 'aion-rc', 'Aion RC', 'MANUFACTURER', 'China',
    'RESEARCH', 'PROSPECT', {
      currency: 'USD',
      notes: 'Chinese RC electronics manufacturer. Research required.',
    }),

  s('sup-holmes-hobbies', 'holmes-hobbies', 'Holmes Hobbies', 'MANUFACTURER', 'United States',
    'TARGET', 'PROSPECT', {
      website: 'https://www.holmeshobbies.com',
      currency: 'USD',
      notes: 'US specialist in brushed and brushless motors for crawlers and trucks. Research dealer programme.',
    }),

  s('sup-ipower', 'ipower-batteries', 'iPower Batteries', 'MANUFACTURER', 'China',
    'RESEARCH', 'PROSPECT', {
      currency: 'USD',
      notes: 'Chinese LiPo battery manufacturer. Research required.',
    }),

  s('sup-cnhl', 'cnhl', 'CNHL (China Hobby Line)', 'MANUFACTURER', 'China',
    'RESEARCH', 'PROSPECT', {
      website: 'https://www.chinahobbyline.com',
      currency: 'USD',
      notes: 'Chinese LiPo battery brand. Known for good value competition packs. Research trade pricing.',
    }),

  s('sup-motiv-rc', 'motiv-rc', 'Motiv RC', 'MANUFACTURER', 'United States',
    'TARGET', 'PROSPECT', {
      website: 'https://www.motivrc.com',
      currency: 'USD',
      notes: 'US competition motor and electronics specialist. Research dealer route.',
    }),

  s('sup-tq-racing', 'tq-racing', 'TQ Racing', 'MANUFACTURER', 'United States',
    'TARGET', 'PROSPECT', {
      currency: 'USD',
      notes: 'US competition motor manufacturer. Research required.',
    }),

  s('sup-orca', 'orca-rc', 'Orca RC', 'MANUFACTURER', 'Taiwan',
    'TARGET', 'PROSPECT', {
      website: 'https://www.orca-rc.com',
      currency: 'USD',
      notes: 'Taiwanese competition motor and ESC manufacturer. Research UK dealer route.',
    }),

  // ─── RESEARCH / VERIFY — uncertain supplier status ────────────────────────
  // These require further research — do NOT treat as confirmed suppliers

  s('sup-engine-kitor', 'engine-kitor', 'EngineKitor', 'MANUFACTURER', 'China',
    'RESEARCH', 'PROSPECT', {
      currency: 'USD',
      notes: 'RESEARCH / VERIFY — Supplier relationship uncertain. Sells small scale gas engines. Trade route unknown.',
    }),

  s('sup-enginesdiy', 'engines-diy', 'EnginesDIY', 'MANUFACTURER', 'China',
    'RESEARCH', 'PROSPECT', {
      currency: 'USD',
      notes: 'RESEARCH / VERIFY — Small scale engine manufacturer/retailer. Supplier relationship uncertain. Verify before treating as trading partner.',
    }),

  s('sup-jensen-steam', 'jensen-steam-engines', 'Jensen Steam Engines', 'MANUFACTURER', 'United States',
    'RESEARCH', 'PROSPECT', {
      currency: 'USD',
      notes: 'RESEARCH / VERIFY — US maker of model steam engines. Very niche. Verify supplier relationship and trade route before pursuit.',
    }),
]

export function getAvorriaProcurementMaster(): SeedSupplier[] {
  return AVORRIA_PROCUREMENT_MASTER
}
