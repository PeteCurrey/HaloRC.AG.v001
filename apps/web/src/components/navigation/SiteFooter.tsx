import Link from 'next/link'
import s from './SiteFooter.module.css'
import { AvorriaMark } from '@/components/brand/AvorriaMark'

export function SiteFooter() {
  return (
    <footer className={s.footer}>
      <div className={s.inner}>
        {/* Brand identity column */}
        <div className={s.brandColumn}>
          <Link href="/" className={s.logoRow} aria-label="Avorria RC — Home">
            <AvorriaMark variant="light" className={s.footerWordmark} />
          </Link>
          <p className={s.brandDesc}>
            Remote Control. Without Compromise. Premium competition hardware and specialist racing department.
          </p>
        </div>

        {/* Commercial Worlds */}
        <div>
          <p className={s.columnHeading}>
            Commercial Worlds
          </p>
          <ul className={s.linksList}>
            <li>
              <Link href="/machines" className={s.footerLink}>
                The Machines
              </Link>
            </li>
            <li>
              <Link href="/parts" className={s.footerLink}>
                Parts &amp; Upgrades
              </Link>
            </li>
            <li>
              <Link href="/race" className={s.footerLink}>
                The Race Department
              </Link>
            </li>
            <li>
              <Link href="/brands" className={s.footerLink}>
                Brand Universe
              </Link>
            </li>
            <li>
              <Link href="/garage" className={s.footerLink}>
                The Garage
              </Link>
            </li>
          </ul>
        </div>

        {/* Tools & Consultation */}
        <div>
          <p className={s.columnHeading}>
            Tools &amp; Consultation
          </p>
          <ul className={s.linksList}>
            <li>
              <Link href="/build" className={s.footerLink}>
                Build My Rig Configurator
              </Link>
            </li>
            <li>
              <Link href="/find" className={s.footerLink}>
                Find My Machine Advisor
              </Link>
            </li>
            <li>
              <Link href="/search" className={s.footerLink}>
                Hardware &amp; Compatibility Search
              </Link>
            </li>
            <li>
              <Link href="/race/compare" className={s.footerLink}>
                Chassis Comparison Matrix
              </Link>
            </li>
          </ul>
        </div>

        {/* Market & Jurisdiction */}
        <div>
          <p className={s.columnHeading}>
            Market &amp; Jurisdiction
          </p>
          <p className={s.jurisdictionText}>
            UK operations: GBP / VAT compliant.<br />
            USA operations: USD / State tax calculated.
          </p>
          <span className={s.jurisdictionBadge}>
            UK &amp; USA Dual-Market Architecture
          </span>
        </div>
      </div>

      <div className={s.bottomBar}>
        <p>© {new Date().getFullYear()} Avorria RC Ltd. All rights reserved.</p>
        <p className={s.bottomArchitecture}>
          VERIFIED RC DATA ARCHITECTURE
        </p>
      </div>
    </footer>
  )
}
