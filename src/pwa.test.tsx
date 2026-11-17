import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import manifestRaw from '../public/manifest.webmanifest?raw'
import swTemplate from '../deploy/sw-template.js?raw'
import indexHtml from '../index.html?raw'
import { InstallPrompt } from './components/InstallPrompt'
import { isIosSafari } from './lib/pwa'

const IPHONE_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1'
const IPHONE_CHROME =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0 Mobile/15E148 Safari/604.1'
const ANDROID_CHROME = 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36'

describe('web app manifest', () => {
  const m = JSON.parse(manifestRaw) as Record<string, unknown> & { icons: { sizes: string; purpose: string }[] }

  it('meets install requirements (name, standalone, start_url, 192 + 512 icons, maskable)', () => {
    expect(m['name']).toBeTruthy()
    expect(m['short_name']).toBeTruthy()
    expect(m['display']).toBe('standalone')
    expect(String(m['start_url'])).toMatch(/^\//)
    expect(m.icons.map((i) => i.sizes)).toEqual(expect.arrayContaining(['192x192', '512x512']))
    expect(m.icons.some((i) => i.purpose === 'maskable')).toBe(true)
  })

  it('makes no real-money claims', () => {
    expect(manifestRaw).toMatch(/no cash value/i)
    expect(manifestRaw).not.toMatch(/₹|rupee|cash prize|win money/i)
  })

  it('index.html links the manifest and iOS home-screen tags', () => {
    expect(indexHtml).toContain('rel="manifest"')
    expect(indexHtml).toContain('rel="apple-touch-icon"')
    expect(indexHtml).toContain('apple-mobile-web-app-capable')
    expect(indexHtml).toContain('viewport-fit=cover')
  })
})

describe('service worker template', () => {
  it('never caches API traffic and ignores Vary for hashed assets (offline bug fix)', () => {
    expect(swTemplate).toContain("url.pathname.startsWith('/api/')")
    expect(swTemplate).toMatch(/caches\.match\(request, \{ ignoreVary: true \}\)/)
    expect(swTemplate).toContain('__PRECACHE__')
  })
})

describe('isIosSafari', () => {
  it('detects iPhone Safari only', () => {
    expect(isIosSafari(IPHONE_SAFARI)).toBe(true)
    expect(isIosSafari(IPHONE_CHROME)).toBe(false)
    expect(isIosSafari(ANDROID_CHROME)).toBe(false)
  })
})

describe('InstallPrompt', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    window.localStorage.clear()
  })

  it('shows Share → Add to Home Screen steps on iPhone Safari and can be dismissed for good', async () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(IPHONE_SAFARI)
    const user = userEvent.setup()
    const { unmount } = render(<InstallPrompt />)
    expect(screen.getByText(/add to home screen/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /dismiss install suggestion/i }))
    expect(screen.queryByText(/add to home screen/i)).not.toBeInTheDocument()
    unmount()
    render(<InstallPrompt />)
    expect(screen.queryByText(/add to home screen/i)).not.toBeInTheDocument()
  })

  it('offers an Install button when the browser fires beforeinstallprompt', async () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(ANDROID_CHROME)
    render(<InstallPrompt />)
    expect(screen.queryByRole('button', { name: /install app/i })).not.toBeInTheDocument()
    const prompt = vi.fn().mockResolvedValue(undefined)
    const event = Object.assign(new Event('beforeinstallprompt'), { prompt, userChoice: Promise.resolve({ outcome: 'accepted' }) })
    window.dispatchEvent(event)
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: /install app/i }))
    expect(prompt).toHaveBeenCalledOnce()
  })
})
