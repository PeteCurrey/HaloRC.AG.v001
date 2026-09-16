import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('Auth Split-Screen Presentation & Routes Architecture', () => {
  const rootDir = path.resolve(__dirname, '../apps/web/src')

  it('defines the required authentication route entrypoints', () => {
    const signInPath = path.join(rootDir, 'app/(storefront)/auth/sign-in/page.tsx')
    const signUpPath = path.join(rootDir, 'app/(storefront)/auth/sign-up/page.tsx')
    const forgotPasswordPath = path.join(rootDir, 'app/(storefront)/auth/forgot-password/page.tsx')
    const resetPasswordPath = path.join(rootDir, 'app/(storefront)/auth/reset-password/page.tsx')

    expect(fs.existsSync(signInPath)).toBe(true)
    expect(fs.existsSync(signUpPath)).toBe(true)
    expect(fs.existsSync(forgotPasswordPath)).toBe(true)
    expect(fs.existsSync(resetPasswordPath)).toBe(true)

    // Verify all route files import the shared AuthSplitLayout
    expect(fs.readFileSync(signInPath, 'utf8')).toContain('AuthSplitLayout')
    expect(fs.readFileSync(signUpPath, 'utf8')).toContain('AuthSplitLayout')
    expect(fs.readFileSync(forgotPasswordPath, 'utf8')).toContain('AuthSplitLayout')
    expect(fs.readFileSync(resetPasswordPath, 'utf8')).toContain('AuthSplitLayout')
  })

  it('exports all required server action handlers from auth.ts', async () => {
    const authActions = await import('../apps/web/src/actions/auth')

    expect(typeof authActions.signInAction).toBe('function')
    expect(typeof authActions.signUpAction).toBe('function')
    expect(typeof authActions.signOutAction).toBe('function')
    expect(typeof authActions.forgotPasswordAction).toBe('function')
    expect(typeof authActions.updatePasswordAction).toBe('function')
  })

  it('defines the reusable AuthSplitLayout and AuthEditorialPanel components and styles', () => {
    const splitLayoutPath = path.join(rootDir, 'components/auth/AuthSplitLayout.tsx')
    const splitLayoutCss = path.join(rootDir, 'components/auth/AuthSplitLayout.module.css')
    const editorialPanelPath = path.join(rootDir, 'components/auth/AuthEditorialPanel.tsx')
    const editorialPanelCss = path.join(rootDir, 'components/auth/AuthEditorialPanel.module.css')

    expect(fs.existsSync(splitLayoutPath)).toBe(true)
    expect(fs.existsSync(splitLayoutCss)).toBe(true)
    expect(fs.existsSync(editorialPanelPath)).toBe(true)
    expect(fs.existsSync(editorialPanelCss)).toBe(true)

    const splitContent = fs.readFileSync(splitLayoutPath, 'utf8')
    expect(splitContent).toContain('AuthEditorialPanel')
    expect(splitContent).toContain('Back to Avorria RC')
  })
})
