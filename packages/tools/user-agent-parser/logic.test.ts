import { describe, expect, it } from 'vitest'
import { formatUserAgentResult, parseUserAgent, UNKNOWN } from './logic'

const CHROME_WINDOWS =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
const CHROME_MACOS =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
const CHROME_LINUX =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
const CHROME_ANDROID =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/UD1A.230803.041; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/119.0.0.0 Mobile Safari/537.36'
const CHROME_IOS =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/123.0.6312.52 Mobile/15E148 Safari/604.1'
const CHROME_OS =
  'Mozilla/5.0 (X11; CrOS x86_64 15633.20.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
const FIREFOX_WINDOWS =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0'
const FIREFOX_MACOS =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:133.0) Gecko/20100101 Firefox/133.0'
const FIREFOX_ANDROID = 'Mozilla/5.0 (Android 14; Mobile; rv:125.0) Gecko/125.0 Firefox/125.0'
const FIREFOX_ANDROID_TABLET =
  'Mozilla/5.0 (Android 13; Tablet; rv:125.0) Gecko/125.0 Firefox/125.0'
const SAFARI_MACOS =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15'
const SAFARI_IOS =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
const SAFARI_IPAD =
  'Mozilla/5.0 (iPad; CPU OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1'
const EDGE_WINDOWS =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.2903.99'
const EDGE_ANDROID =
  'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Mobile Safari/537.36 EdgA/91.0.864.59'
const OPERA_WINDOWS =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 OPR/116.0.0.0'
const SAMSUNG_ANDROID =
  'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0.0.0 Mobile Safari/537.36'
const SAMSUNG_ANDROID_TABLET =
  'Mozilla/5.0 (Linux; Android 12; SM-T970) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/21.0 Chrome/110.0.5481.154 Mobile Safari/537.36'
const GOOGLEBOT = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'

describe('parseUserAgent: browsers', () => {
  it('detects Chrome with its major version', () => {
    expect(parseUserAgent(CHROME_WINDOWS).browser).toEqual({ name: 'Chrome', version: '131' })
  })

  it('detects Firefox with its major version', () => {
    expect(parseUserAgent(FIREFOX_MACOS).browser).toEqual({ name: 'Firefox', version: '133' })
    expect(parseUserAgent(FIREFOX_WINDOWS).browser).toEqual({ name: 'Firefox', version: '133' })
  })

  it('detects Safari on macOS', () => {
    expect(parseUserAgent(SAFARI_MACOS).browser).toEqual({ name: 'Safari', version: '17' })
  })

  it('detects Safari on iOS even with the Mobile notation', () => {
    const result = parseUserAgent(SAFARI_IOS)
    expect(result.browser).toEqual({ name: 'Safari', version: '17' })
    expect(result.os).toEqual({ name: 'iOS', version: '17.5' })
    expect(result.device).toBe('mobile')
  })

  it('detects Chrome on iOS via the CriOS token', () => {
    expect(parseUserAgent(CHROME_IOS).browser).toEqual({ name: 'Chrome', version: '123' })
  })

  it('detects Edge before Chrome (Chromium-based)', () => {
    expect(parseUserAgent(EDGE_WINDOWS).browser).toEqual({ name: 'Edge', version: '131' })
  })

  it('detects Edge on Android via the EdgA token', () => {
    const result = parseUserAgent(EDGE_ANDROID)
    expect(result.browser).toEqual({ name: 'Edge', version: '91' })
    expect(result.os.name).toBe('Android')
  })

  it('detects Opera before Chrome (Chromium-based)', () => {
    expect(parseUserAgent(OPERA_WINDOWS).browser).toEqual({ name: 'Opera', version: '116' })
  })

  it('detects Samsung Internet before Chrome', () => {
    expect(parseUserAgent(SAMSUNG_ANDROID).browser).toEqual({
      name: 'Samsung Internet',
      version: '26',
    })
  })

  it('reports the browser name only when no version is available', () => {
    const result = parseUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/ Safari/537.36',
    )
    expect(result.browser).toEqual({ name: 'Chrome' })
  })

  it('picks a single browser deterministically when several names appear', () => {
    const result = parseUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Firefox/120.0',
    )
    expect(result.browser.name).toBe('Chrome')
  })
})

describe('parseUserAgent: OSes', () => {
  it.each([
    ['Windows', CHROME_WINDOWS],
    ['macOS', CHROME_MACOS],
    ['Linux', CHROME_LINUX],
    ['Android', CHROME_ANDROID],
    ['iOS', SAFARI_IOS],
    ['Chrome OS', CHROME_OS],
  ])('detects %s', (expected, ua) => {
    expect(parseUserAgent(ua).os.name).toBe(expected)
  })

  it('detects Windows with its NT version', () => {
    expect(parseUserAgent(EDGE_WINDOWS).os).toEqual({ name: 'Windows', version: '10.0' })
  })

  it('detects macOS with an underscore-separated version', () => {
    expect(parseUserAgent(SAFARI_MACOS).os).toEqual({ name: 'macOS', version: '10.15.7' })
  })

  it('detects Chrome OS', () => {
    expect(parseUserAgent(CHROME_OS).os.name).toBe('Chrome OS')
  })

  it('does not mistake the "like Mac OS X" fragment in iOS UAs for macOS', () => {
    expect(parseUserAgent(SAFARI_IOS).os.name).toBe('iOS')
  })

  it('does not mistake the Linux fragment in Android UAs for Linux', () => {
    expect(parseUserAgent(CHROME_ANDROID).os.name).toBe('Android')
  })
})

describe('parseUserAgent: device class', () => {
  it.each([
    ['desktop', CHROME_WINDOWS],
    ['desktop', SAFARI_MACOS],
    ['desktop', CHROME_OS],
    ['desktop', CHROME_LINUX],
  ])('classifies %s', (expected, ua) => {
    expect(parseUserAgent(ua).device).toBe(expected)
  })

  it.each([
    ['mobile', CHROME_ANDROID],
    ['mobile', SAFARI_IOS],
    ['mobile', FIREFOX_ANDROID],
    ['mobile', SAMSUNG_ANDROID],
    ['mobile', EDGE_ANDROID],
  ])('classifies %s from the Mobile notation', (expected, ua) => {
    expect(parseUserAgent(ua).device).toBe(expected)
  })

  it.each([
    ['tablet', SAFARI_IPAD],
    ['tablet', FIREFOX_ANDROID_TABLET],
    ['tablet', SAMSUNG_ANDROID_TABLET],
  ])('classifies %s from the Tablet / iPad notation', (expected, ua) => {
    expect(parseUserAgent(ua).device).toBe(expected)
  })

  it('classifies an Android tablet via its SM-T model token', () => {
    expect(parseUserAgent(SAMSUNG_ANDROID_TABLET).device).toBe('tablet')
  })
})

describe('parseUserAgent: unknown input and crawlers', () => {
  it('reports Unknown for an unrecognized UA instead of guessing', () => {
    const result = parseUserAgent('totally-unknown-thing/1.0 (Some Secret Agent)')
    expect(result.browser).toEqual({ name: UNKNOWN })
    expect(result.os).toEqual({ name: UNKNOWN })
    expect(result.isBot).toBe(false)
  })

  it('reports Unknown for an empty UA', () => {
    const result = parseUserAgent('')
    expect(result.browser).toEqual({ name: UNKNOWN })
    expect(result.os).toEqual({ name: UNKNOWN })
    expect(result.isBot).toBe(false)
  })

  it('reports Unknown for a whitespace-only UA', () => {
    const result = parseUserAgent('   ')
    expect(result.browser.name).toBe(UNKNOWN)
    expect(result.os.name).toBe(UNKNOWN)
  })

  it('detects crawler UAs as a robot with an Unknown browser', () => {
    const result = parseUserAgent(GOOGLEBOT)
    expect(result.browser).toEqual({ name: UNKNOWN })
    expect(result.isBot).toBe(true)
  })

  it('detects HeadlessChrome as a robot rather than Chrome', () => {
    const result = parseUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/131.0.0.0 Safari/537.36',
    )
    expect(result.browser).toEqual({ name: UNKNOWN })
    expect(result.isBot).toBe(true)
  })
})

describe('formatUserAgentResult', () => {
  it('formats a full result into readable lines', () => {
    const formatted = formatUserAgentResult(parseUserAgent(EDGE_WINDOWS))
    expect(formatted).toBe(
      ['Browser: Edge 131', 'OS: Windows 10.0', 'Device: desktop', 'Bot: no'].join('\n'),
    )
  })

  it('formats an unknown result without versions', () => {
    const formatted = formatUserAgentResult(parseUserAgent(''))
    expect(formatted).toBe(
      ['Browser: Unknown', 'OS: Unknown', 'Device: desktop', 'Bot: no'].join('\n'),
    )
  })

  it('flags robots in the formatted output', () => {
    const formatted = formatUserAgentResult(parseUserAgent(GOOGLEBOT))
    expect(formatted).toContain('Browser: Unknown')
    expect(formatted).toContain('Bot: yes')
  })
})
