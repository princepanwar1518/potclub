import { describe, expect, it } from 'vitest'
import indexHtml from '../index.html?raw'
import manifestRaw from '../public/manifest.webmanifest?raw'
import { brand, pageTitle } from './config/brand'

describe('brand name is consistent everywhere', () => {
  it('uses PotClub in config, installed-app manifest and index.html', () => {
    expect(brand.name).toBe('PotClub')
    const m = JSON.parse(manifestRaw) as { name: string; short_name: string }
    expect(m.name).toBe(brand.name)
    expect(m.short_name).toBe(brand.name)
    expect(indexHtml).toContain(`<meta name="apple-mobile-web-app-title" content="${brand.name}" />`)
    expect(indexHtml).toContain(`<title>Pick a number, enjoy the moment · ${brand.name}</title>`)
  })

  it('appends the brand to page titles', () => {
    expect(pageTitle('Dashboard')).toBe('Dashboard · PotClub')
  })

  it('leaves no trace of the old placeholder name in what users see', () => {
    expect(indexHtml + manifestRaw).not.toMatch(/group draws/i)
  })
})
