export type StatusCategory = '1xx' | '2xx' | '3xx' | '4xx' | '5xx'

export const STATUS_CODE_CATEGORIES: readonly StatusCategory[] = ['1xx', '2xx', '3xx', '4xx', '5xx']

export const STATUS_CODE_CATEGORY_LABELS: Record<StatusCategory, string> = {
  '1xx': '1xx Informational',
  '2xx': '2xx Success',
  '3xx': '3xx Redirection',
  '4xx': '4xx Client Error',
  '5xx': '5xx Server Error',
}

export interface StatusCodeEntry {
  code: number
  name: string
  category: StatusCategory
  description: string
}

export const STATUS_CODES: readonly StatusCodeEntry[] = [
  {
    code: 100,
    name: 'Continue',
    category: '1xx',
    description: 'The initial part of a request has been received and the client should continue.',
  },
  {
    code: 101,
    name: 'Switching Protocols',
    category: '1xx',
    description: 'The server agrees to switch protocols as requested by the client.',
  },
  {
    code: 102,
    name: 'Processing',
    category: '1xx',
    description:
      'The server has received and is processing the request, but no response is available yet. (WebDAV)',
  },
  {
    code: 103,
    name: 'Early Hints',
    category: '1xx',
    description: 'The server sends some response headers before the final HTTP message.',
  },

  { code: 200, name: 'OK', category: '2xx', description: 'The request succeeded.' },
  {
    code: 201,
    name: 'Created',
    category: '2xx',
    description: 'The request succeeded and a new resource was created.',
  },
  {
    code: 202,
    name: 'Accepted',
    category: '2xx',
    description: 'The request has been accepted for processing, but processing is not complete.',
  },
  {
    code: 203,
    name: 'Non-Authoritative Information',
    category: '2xx',
    description: 'The response was modified by a transforming proxy.',
  },
  {
    code: 204,
    name: 'No Content',
    category: '2xx',
    description: 'The request succeeded, but there is no content to send in the response.',
  },
  {
    code: 205,
    name: 'Reset Content',
    category: '2xx',
    description: 'The request succeeded and the user agent should reset the document view.',
  },
  {
    code: 206,
    name: 'Partial Content',
    category: '2xx',
    description: 'The server delivered only part of the resource due to a range header.',
  },
  {
    code: 207,
    name: 'Multi-Status',
    category: '2xx',
    description:
      'A multi-status response with status for multiple independent operations. (WebDAV)',
  },
  {
    code: 208,
    name: 'Already Reported',
    category: '2xx',
    description:
      'The members of a DAV binding have already been enumerated in a previous part of the response. (WebDAV)',
  },
  {
    code: 226,
    name: 'IM Used',
    category: '2xx',
    description:
      'The server fulfilled the request using an instance manipulation (delta encoding).',
  },

  {
    code: 300,
    name: 'Multiple Choices',
    category: '3xx',
    description:
      'The request has more than one possible response and the client should choose one.',
  },
  {
    code: 301,
    name: 'Moved Permanently',
    category: '3xx',
    description: 'The URI of the requested resource has been changed permanently.',
  },
  {
    code: 302,
    name: 'Found',
    category: '3xx',
    description: 'The URI of the requested resource has been changed temporarily.',
  },
  {
    code: 303,
    name: 'See Other',
    category: '3xx',
    description: 'The response to the request can be found at another URI using GET.',
  },
  {
    code: 304,
    name: 'Not Modified',
    category: '3xx',
    description: 'The resource has not been modified since the last request.',
  },
  {
    code: 305,
    name: 'Use Proxy',
    category: '3xx',
    description:
      'The requested resource must be accessed through the proxy given by the Location field.',
  },
  {
    code: 307,
    name: 'Temporary Redirect',
    category: '3xx',
    description: 'The response to the request is located at another URI using the same method.',
  },
  {
    code: 308,
    name: 'Permanent Redirect',
    category: '3xx',
    description:
      'The URI of the requested resource has been changed permanently, keeping the method.',
  },

  {
    code: 400,
    name: 'Bad Request',
    category: '4xx',
    description: 'The server cannot process the request due to a client error.',
  },
  {
    code: 401,
    name: 'Unauthorized',
    category: '4xx',
    description: 'Authentication is required and has failed or has not been provided.',
  },
  {
    code: 402,
    name: 'Payment Required',
    category: '4xx',
    description:
      'The payment required for the resource has not been provided (reserved for future use).',
  },
  {
    code: 403,
    name: 'Forbidden',
    category: '4xx',
    description: 'The client does not have access rights to the content.',
  },
  {
    code: 404,
    name: 'Not Found',
    category: '4xx',
    description: 'The server cannot find the requested resource.',
  },
  {
    code: 405,
    name: 'Method Not Allowed',
    category: '4xx',
    description: 'The request method is known by the server but is not supported for the resource.',
  },
  {
    code: 406,
    name: 'Not Acceptable',
    category: '4xx',
    description: 'The server cannot produce a response matching the accept headers.',
  },
  {
    code: 407,
    name: 'Proxy Authentication Required',
    category: '4xx',
    description: 'Authentication is required with a proxy server.',
  },
  {
    code: 408,
    name: 'Request Timeout',
    category: '4xx',
    description: 'The server timed out waiting for the request from the client.',
  },
  {
    code: 409,
    name: 'Conflict',
    category: '4xx',
    description: 'The request conflicts with the current state of the server.',
  },
  {
    code: 410,
    name: 'Gone',
    category: '4xx',
    description: 'The requested resource is no longer available and will not be available again.',
  },
  {
    code: 411,
    name: 'Length Required',
    category: '4xx',
    description: 'The request did not specify the length of its content, which is required.',
  },
  {
    code: 412,
    name: 'Precondition Failed',
    category: '4xx',
    description: 'One or more conditions given in the request header fields were not met.',
  },
  {
    code: 413,
    name: 'Payload Too Large',
    category: '4xx',
    description: 'The request entity is larger than the server is willing or able to process.',
  },
  {
    code: 414,
    name: 'URI Too Long',
    category: '4xx',
    description:
      'The URI requested by the client is longer than the server is willing to interpret.',
  },
  {
    code: 415,
    name: 'Unsupported Media Type',
    category: '4xx',
    description: 'The media format of the requested data is not supported by the server.',
  },
  {
    code: 416,
    name: 'Range Not Satisfiable',
    category: '4xx',
    description: 'The range specified in the request header cannot be satisfied.',
  },
  {
    code: 417,
    name: 'Expectation Failed',
    category: '4xx',
    description: 'The expectation given in the Expect request header could not be met.',
  },
  {
    code: 418,
    name: "I'm a Teapot",
    category: '4xx',
    description:
      'The server refuses to brew coffee because it is, permanently, a teapot. (RFC 9110)',
  },
  {
    code: 421,
    name: 'Misdirected Request',
    category: '4xx',
    description: 'The request was directed at a server that cannot produce a response.',
  },
  {
    code: 422,
    name: 'Unprocessable Content',
    category: '4xx',
    description:
      'The request was well-formed but could not be followed due to semantic errors. (WebDAV)',
  },
  {
    code: 423,
    name: 'Locked',
    category: '4xx',
    description: 'The resource that is being accessed is locked. (WebDAV)',
  },
  {
    code: 424,
    name: 'Failed Dependency',
    category: '4xx',
    description: 'The request failed because a previous request it depends on failed. (WebDAV)',
  },
  {
    code: 425,
    name: 'Too Early',
    category: '4xx',
    description: 'The server is unwilling to risk processing a request that might be replayed.',
  },
  {
    code: 426,
    name: 'Upgrade Required',
    category: '4xx',
    description: 'The client should switch to a different protocol listed in the Upgrade header.',
  },
  {
    code: 428,
    name: 'Precondition Required',
    category: '4xx',
    description: 'The server requires the request to be conditional.',
  },
  {
    code: 429,
    name: 'Too Many Requests',
    category: '4xx',
    description: 'The user has sent too many requests in a given amount of time.',
  },
  {
    code: 431,
    name: 'Request Header Fields Too Large',
    category: '4xx',
    description:
      'The server refuses to process the request because the header fields are too large.',
  },
  {
    code: 451,
    name: 'Unavailable For Legal Reasons',
    category: '4xx',
    description: 'The server refuses to serve the resource for legal reasons.',
  },

  {
    code: 500,
    name: 'Internal Server Error',
    category: '5xx',
    description:
      'The server encountered an unexpected condition that prevented it from fulfilling the request.',
  },
  {
    code: 501,
    name: 'Not Implemented',
    category: '5xx',
    description: 'The server does not support the functionality required to fulfill the request.',
  },
  {
    code: 502,
    name: 'Bad Gateway',
    category: '5xx',
    description:
      'The server, while acting as a gateway, received an invalid response from an upstream server.',
  },
  {
    code: 503,
    name: 'Service Unavailable',
    category: '5xx',
    description: 'The server is not ready to handle the request.',
  },
  {
    code: 504,
    name: 'Gateway Timeout',
    category: '5xx',
    description:
      'The server, while acting as a gateway, did not get a response in time from an upstream server.',
  },
  {
    code: 505,
    name: 'HTTP Version Not Supported',
    category: '5xx',
    description: 'The HTTP version used in the request is not supported by the server.',
  },
  {
    code: 506,
    name: 'Variant Also Negotiates',
    category: '5xx',
    description: 'Transparent content negotiation led to a circular reference.',
  },
  {
    code: 507,
    name: 'Insufficient Storage',
    category: '5xx',
    description:
      'The server is unable to store the representation needed to complete the request. (WebDAV)',
  },
  {
    code: 508,
    name: 'Loop Detected',
    category: '5xx',
    description: 'The server detected an infinite loop while processing the request. (WebDAV)',
  },
  {
    code: 510,
    name: 'Not Extended',
    category: '5xx',
    description: 'Further extensions to the request are required for the server to fulfill it.',
  },
  {
    code: 511,
    name: 'Network Authentication Required',
    category: '5xx',
    description: 'The client needs to authenticate to gain network access.',
  },
]

export function searchStatusCodes(
  query: string,
  category: StatusCategory | null,
): StatusCodeEntry[] {
  const tokens = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((token) => token !== '')
  return STATUS_CODES.filter((entry) => {
    if (category !== null && entry.category !== category) {
      return false
    }
    if (tokens.length === 0) {
      return true
    }
    const haystack = `${entry.code} ${entry.name}`.toLowerCase()
    return tokens.every((token) => haystack.includes(token))
  })
}
