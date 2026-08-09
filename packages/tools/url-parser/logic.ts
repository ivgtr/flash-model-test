export type UrlParam = { key: string; value: string }

export type UrlParts = {
  protocol: string
  host: string
  hostname: string
  port: string
  pathname: string
  search: string
  hash: string
  username: string
  password: string
  origin: string
  params: UrlParam[]
}

export type UrlParseResult = { ok: true; parts: UrlParts } | { ok: false; error: string }

export function parseUrl(input: string): UrlParseResult {
  const trimmed = input.trim()
  if (trimmed === '') {
    return { ok: false, error: 'Input is empty.' }
  }
  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    return {
      ok: false,
      error: 'Invalid URL: expected an absolute URL with a scheme (e.g. https://example.com/path).',
    }
  }
  const params: UrlParam[] = []
  for (const [key, value] of url.searchParams) {
    params.push({ key, value })
  }
  return {
    ok: true,
    parts: {
      protocol: url.protocol,
      host: url.host,
      hostname: url.hostname,
      port: url.port,
      pathname: url.pathname,
      search: url.search,
      hash: url.hash,
      username: url.username,
      password: url.password,
      origin: url.origin,
      params,
    },
  }
}

export function formatUrlParts(parts: UrlParts): string {
  return JSON.stringify(parts, null, 2)
}
