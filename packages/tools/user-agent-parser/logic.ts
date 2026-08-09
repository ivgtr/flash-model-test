export type DeviceClass = 'desktop' | 'mobile' | 'tablet'

export interface UserAgentParseResult {
  browser: { name: string; version?: string }
  os: { name: string; version?: string }
  device: DeviceClass
  isBot: boolean
}

export const UNKNOWN = 'Unknown'

const BOT_PATTERN =
  /Googlebot|bingbot|DuckDuckBot|Yandex(?:Bot)?|Slurp|facebookexternalhit|Applebot|Mediapartners-Google|HeadlessChrome|headless|bot\b|crawler|spider/i

interface Detector {
  name: string
  pattern: RegExp
}

const BROWSER_DETECTORS: readonly Detector[] = [
  { name: 'Samsung Internet', pattern: /SamsungBrowser\/(\d+)?/ },
  { name: 'Edge', pattern: /(?:Edg|Edge|EdgA|EdgiOS|EdgW)\/(\d+)?/ },
  { name: 'Opera', pattern: /(?:OPR|Opera)\/(\d+)?/ },
  { name: 'Chrome', pattern: /(?:Chrome|CriOS)\/(\d+)?/ },
  { name: 'Firefox', pattern: /Firefox\/(\d+)?/ },
]

const SAFARI_TOKEN_PATTERN = /Safari\//
const SAFARI_VERSION_PATTERN = /Version\/(\d+)/

function detectBrowser(ua: string): { name: string; version?: string } {
  for (const detector of BROWSER_DETECTORS) {
    const match = detector.pattern.exec(ua)
    if (match !== null) {
      return { name: detector.name, version: match[1] }
    }
  }
  if (SAFARI_TOKEN_PATTERN.test(ua)) {
    const match = SAFARI_VERSION_PATTERN.exec(ua)
    return { name: 'Safari', version: match?.[1] }
  }
  return { name: UNKNOWN }
}

interface OsDetector extends Detector {
  version: RegExp | null
}

const OS_DETECTORS: readonly OsDetector[] = [
  { name: 'iOS', pattern: /iPhone|iPad|iPod/, version: /CPU (?:iPhone )?OS (\d+(?:_\d+)*)/ },
  { name: 'Android', pattern: /Android/, version: /Android (\d+(?:\.\d+)*)/ },
  { name: 'Windows', pattern: /Windows NT/, version: /Windows NT (\d+(?:\.\d+)*)/ },
  { name: 'macOS', pattern: /Mac OS X/, version: /Mac OS X (\d+(?:[._]\d+)*)/ },
  { name: 'Chrome OS', pattern: /CrOS/, version: /CrOS [^\s]+ (\d+(?:\.\d+)*)/ },
  { name: 'Linux', pattern: /\bLinux\b/, version: null },
]

function detectOs(ua: string): { name: string; version?: string } {
  for (const detector of OS_DETECTORS) {
    if (detector.pattern.test(ua)) {
      const match = detector.version?.exec(ua)
      if (match?.[1] !== undefined) {
        return { name: detector.name, version: match[1].replace(/_/g, '.') }
      }
      return { name: detector.name }
    }
  }
  return { name: UNKNOWN }
}

const TABLET_TOKEN_PATTERN = /iPad|PlayBook|Silk|Tablet/
const ANDROID_MODEL_PATTERN = /Android \d+(?:\.\d+)*(?:; wv)?; ([^;()]*)/
const ANDROID_TABLET_MODEL_PATTERN =
  /sm-[tpx]\d+|gt-p\d+|shv-e\d+|sch-i\d+|kf\w+|tb-\d|tab|pad|kindle|nexus (?:7|9|10)|pixel tablet/i

function detectDevice(ua: string): DeviceClass {
  if (TABLET_TOKEN_PATTERN.test(ua)) {
    return 'tablet'
  }
  const androidModel = ANDROID_MODEL_PATTERN.exec(ua)?.[1]
  if (androidModel !== undefined && ANDROID_TABLET_MODEL_PATTERN.test(androidModel)) {
    return 'tablet'
  }
  if (/Mobile|iPhone|iPod/.test(ua)) {
    return 'mobile'
  }
  return 'desktop'
}

export function parseUserAgent(userAgent: string): UserAgentParseResult {
  const isBot = BOT_PATTERN.test(userAgent)
  return {
    browser: isBot ? { name: UNKNOWN } : detectBrowser(userAgent),
    os: detectOs(userAgent),
    device: detectDevice(userAgent),
    isBot,
  }
}

export function formatUserAgentResult(result: UserAgentParseResult): string {
  const browser = `${result.browser.name}${
    result.browser.version !== undefined ? ` ${result.browser.version}` : ''
  }`
  const os = `${result.os.name}${result.os.version !== undefined ? ` ${result.os.version}` : ''}`
  return [
    `Browser: ${browser}`,
    `OS: ${os}`,
    `Device: ${result.device}`,
    `Bot: ${result.isBot ? 'yes' : 'no'}`,
  ].join('\n')
}
