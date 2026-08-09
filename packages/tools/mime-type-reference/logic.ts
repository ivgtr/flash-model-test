export const MIME_CATEGORIES = ['text', 'image', 'audio', 'video', 'application', 'font'] as const

export type MimeCategory = (typeof MIME_CATEGORIES)[number]

export interface MimeTypeEntry {
  type: string
  extensions: readonly string[]
  description: string
  category: MimeCategory
}

export const MIME_TYPES: readonly MimeTypeEntry[] = [
  // text/*
  { type: 'text/plain', extensions: ['txt'], description: 'Plain text', category: 'text' },
  {
    type: 'text/html',
    extensions: ['html', 'htm'],
    description: 'HyperText Markup Language',
    category: 'text',
  },
  {
    type: 'text/css',
    extensions: ['css'],
    description: 'Cascading Style Sheets',
    category: 'text',
  },
  {
    type: 'text/csv',
    extensions: ['csv'],
    description: 'Comma-separated values',
    category: 'text',
  },
  {
    type: 'text/tab-separated-values',
    extensions: ['tsv'],
    description: 'Tab-separated values',
    category: 'text',
  },
  {
    type: 'text/markdown',
    extensions: ['md', 'markdown'],
    description: 'Markdown document',
    category: 'text',
  },
  {
    type: 'text/xml',
    extensions: ['xml'],
    description: 'Extensible Markup Language',
    category: 'text',
  },
  {
    type: 'text/javascript',
    extensions: ['js'],
    description: 'JavaScript source',
    category: 'text',
  },
  {
    type: 'text/calendar',
    extensions: ['ics'],
    description: 'iCalendar event data',
    category: 'text',
  },
  { type: 'text/vcard', extensions: ['vcf'], description: 'vCard contact data', category: 'text' },
  {
    type: 'text/yaml',
    extensions: ['yaml', 'yml'],
    description: 'YAML document',
    category: 'text',
  },
  { type: 'text/richtext', extensions: ['rtx'], description: 'Rich text', category: 'text' },
  {
    type: 'text/sgml',
    extensions: ['sgml', 'sgm'],
    description: 'Standard Generalized Markup Language',
    category: 'text',
  },

  // image/*
  {
    type: 'image/png',
    extensions: ['png'],
    description: 'Portable Network Graphics',
    category: 'image',
  },
  { type: 'image/jpeg', extensions: ['jpg', 'jpeg'], description: 'JPEG image', category: 'image' },
  {
    type: 'image/gif',
    extensions: ['gif'],
    description: 'Graphics Interchange Format',
    category: 'image',
  },
  { type: 'image/webp', extensions: ['webp'], description: 'WebP image', category: 'image' },
  {
    type: 'image/avif',
    extensions: ['avif'],
    description: 'AV1 image file format',
    category: 'image',
  },
  { type: 'image/bmp', extensions: ['bmp'], description: 'Windows bitmap', category: 'image' },
  {
    type: 'image/svg+xml',
    extensions: ['svg', 'svgz'],
    description: 'Scalable Vector Graphics',
    category: 'image',
  },
  {
    type: 'image/tiff',
    extensions: ['tif', 'tiff'],
    description: 'Tagged Image File Format',
    category: 'image',
  },
  { type: 'image/x-icon', extensions: ['ico'], description: 'Windows icon', category: 'image' },
  {
    type: 'image/heic',
    extensions: ['heic'],
    description: 'High Efficiency Image Container',
    category: 'image',
  },
  {
    type: 'image/heif',
    extensions: ['heif'],
    description: 'High Efficiency Image Format',
    category: 'image',
  },
  {
    type: 'image/apng',
    extensions: ['apng'],
    description: 'Animated Portable Network Graphics',
    category: 'image',
  },
  { type: 'image/jp2', extensions: ['jp2'], description: 'JPEG 2000 image', category: 'image' },
  {
    type: 'image/x-portable-bitmap',
    extensions: ['pbm'],
    description: 'Portable bitmap',
    category: 'image',
  },
  {
    type: 'image/x-portable-graymap',
    extensions: ['pgm'],
    description: 'Portable graymap',
    category: 'image',
  },
  {
    type: 'image/x-portable-pixmap',
    extensions: ['ppm'],
    description: 'Portable pixmap',
    category: 'image',
  },
  {
    type: 'image/x-portable-anymap',
    extensions: ['pnm'],
    description: 'Portable anymap',
    category: 'image',
  },
  { type: 'image/vnd.dwg', extensions: ['dwg'], description: 'AutoCAD drawing', category: 'image' },
  {
    type: 'image/vnd.dxf',
    extensions: ['dxf'],
    description: 'AutoCAD drawing interchange',
    category: 'image',
  },

  // audio/*
  { type: 'audio/mpeg', extensions: ['mp3'], description: 'MPEG audio', category: 'audio' },
  { type: 'audio/mp4', extensions: ['m4a'], description: 'MPEG-4 audio', category: 'audio' },
  { type: 'audio/ogg', extensions: ['oga', 'ogg'], description: 'Ogg audio', category: 'audio' },
  { type: 'audio/wav', extensions: ['wav'], description: 'Waveform audio', category: 'audio' },
  {
    type: 'audio/x-wav',
    extensions: ['wav'],
    description: 'Waveform audio (legacy)',
    category: 'audio',
  },
  {
    type: 'audio/aac',
    extensions: ['aac'],
    description: 'Advanced Audio Coding',
    category: 'audio',
  },
  {
    type: 'audio/flac',
    extensions: ['flac'],
    description: 'Free Lossless Audio Codec',
    category: 'audio',
  },
  { type: 'audio/webm', extensions: ['weba'], description: 'WebM audio', category: 'audio' },
  { type: 'audio/opus', extensions: ['opus'], description: 'Opus audio', category: 'audio' },
  { type: 'audio/midi', extensions: ['mid', 'midi'], description: 'MIDI audio', category: 'audio' },
  { type: 'audio/3gpp', extensions: ['3ga'], description: '3GPP audio', category: 'audio' },
  {
    type: 'audio/amr',
    extensions: ['amr'],
    description: 'Adaptive Multi-Rate audio',
    category: 'audio',
  },
  {
    type: 'audio/x-aiff',
    extensions: ['aif', 'aiff', 'aifc'],
    description: 'Audio Interchange File Format',
    category: 'audio',
  },
  {
    type: 'audio/x-ms-wma',
    extensions: ['wma'],
    description: 'Windows Media Audio',
    category: 'audio',
  },
  {
    type: 'audio/basic',
    extensions: ['au', 'snd'],
    description: 'Basic audio (mu-law)',
    category: 'audio',
  },

  // video/*
  { type: 'video/mp4', extensions: ['mp4', 'm4v'], description: 'MPEG-4 video', category: 'video' },
  {
    type: 'video/x-m4v',
    extensions: ['m4v'],
    description: 'MPEG-4 video (legacy)',
    category: 'video',
  },
  { type: 'video/mpeg', extensions: ['mpg', 'mpeg'], description: 'MPEG video', category: 'video' },
  {
    type: 'video/quicktime',
    extensions: ['mov', 'qt'],
    description: 'QuickTime video',
    category: 'video',
  },
  { type: 'video/webm', extensions: ['webm'], description: 'WebM video', category: 'video' },
  { type: 'video/ogg', extensions: ['ogv'], description: 'Ogg video', category: 'video' },
  {
    type: 'video/avi',
    extensions: ['avi'],
    description: 'Audio Video Interleave',
    category: 'video',
  },
  {
    type: 'video/x-msvideo',
    extensions: ['avi'],
    description: 'AVI video (legacy)',
    category: 'video',
  },
  {
    type: 'video/x-ms-wmv',
    extensions: ['wmv'],
    description: 'Windows Media Video',
    category: 'video',
  },
  { type: 'video/x-flv', extensions: ['flv'], description: 'Flash Video', category: 'video' },
  { type: 'video/3gpp', extensions: ['3gp', '3g2'], description: '3GPP video', category: 'video' },
  {
    type: 'video/x-matroska',
    extensions: ['mkv'],
    description: 'Matroska video',
    category: 'video',
  },
  {
    type: 'video/x-ms-asf',
    extensions: ['asf'],
    description: 'Advanced Systems Format',
    category: 'video',
  },
  {
    type: 'video/mp2t',
    extensions: ['ts'],
    description: 'MPEG transport stream',
    category: 'video',
  },

  // font/*
  { type: 'font/ttf', extensions: ['ttf'], description: 'TrueType font', category: 'font' },
  { type: 'font/otf', extensions: ['otf'], description: 'OpenType font', category: 'font' },
  {
    type: 'font/woff',
    extensions: ['woff'],
    description: 'Web Open Font Format',
    category: 'font',
  },
  {
    type: 'font/woff2',
    extensions: ['woff2'],
    description: 'Web Open Font Format 2',
    category: 'font',
  },
  {
    type: 'font/collection',
    extensions: ['ttc'],
    description: 'TrueType font collection',
    category: 'font',
  },

  // application/*
  {
    type: 'application/json',
    extensions: ['json'],
    description: 'JSON data',
    category: 'application',
  },
  {
    type: 'application/xml',
    extensions: ['xml'],
    description: 'XML data',
    category: 'application',
  },
  {
    type: 'application/javascript',
    extensions: ['js'],
    description: 'JavaScript source',
    category: 'application',
  },
  {
    type: 'application/ecmascript',
    extensions: ['es'],
    description: 'ECMAScript source',
    category: 'application',
  },
  {
    type: 'application/pdf',
    extensions: ['pdf'],
    description: 'Portable Document Format',
    category: 'application',
  },
  {
    type: 'application/zip',
    extensions: ['zip'],
    description: 'ZIP archive',
    category: 'application',
  },
  {
    type: 'application/gzip',
    extensions: ['gz'],
    description: 'GZIP archive',
    category: 'application',
  },
  {
    type: 'application/x-tar',
    extensions: ['tar'],
    description: 'Tar archive',
    category: 'application',
  },
  {
    type: 'application/x-7z-compressed',
    extensions: ['7z'],
    description: '7-Zip archive',
    category: 'application',
  },
  {
    type: 'application/x-rar-compressed',
    extensions: ['rar'],
    description: 'RAR archive',
    category: 'application',
  },
  {
    type: 'application/x-bzip2',
    extensions: ['bz2'],
    description: 'BZip2 archive',
    category: 'application',
  },
  {
    type: 'application/x-xz',
    extensions: ['xz'],
    description: 'XZ archive',
    category: 'application',
  },
  {
    type: 'application/x-lzip',
    extensions: ['lz'],
    description: 'Lzip archive',
    category: 'application',
  },
  {
    type: 'application/x-compress',
    extensions: ['Z'],
    description: 'Compress archive',
    category: 'application',
  },
  {
    type: 'application/x-msdownload',
    extensions: ['exe', 'dll'],
    description: 'Windows executable',
    category: 'application',
  },
  {
    type: 'application/x-ms-shortcut',
    extensions: ['lnk'],
    description: 'Windows shortcut',
    category: 'application',
  },
  {
    type: 'application/octet-stream',
    extensions: ['bin'],
    description: 'Generic binary data',
    category: 'application',
  },
  {
    type: 'application/msword',
    extensions: ['doc'],
    description: 'Microsoft Word document',
    category: 'application',
  },
  {
    type: 'application/vnd.ms-excel',
    extensions: ['xls'],
    description: 'Microsoft Excel spreadsheet',
    category: 'application',
  },
  {
    type: 'application/vnd.ms-powerpoint',
    extensions: ['ppt'],
    description: 'Microsoft PowerPoint presentation',
    category: 'application',
  },
  {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    extensions: ['docx'],
    description: 'Office Open XML document',
    category: 'application',
  },
  {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    extensions: ['xlsx'],
    description: 'Office Open XML spreadsheet',
    category: 'application',
  },
  {
    type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    extensions: ['pptx'],
    description: 'Office Open XML presentation',
    category: 'application',
  },
  {
    type: 'application/rtf',
    extensions: ['rtf'],
    description: 'Rich Text Format',
    category: 'application',
  },
  {
    type: 'application/vnd.oasis.opendocument.text',
    extensions: ['odt'],
    description: 'OpenDocument text',
    category: 'application',
  },
  {
    type: 'application/vnd.oasis.opendocument.spreadsheet',
    extensions: ['ods'],
    description: 'OpenDocument spreadsheet',
    category: 'application',
  },
  {
    type: 'application/vnd.oasis.opendocument.presentation',
    extensions: ['odp'],
    description: 'OpenDocument presentation',
    category: 'application',
  },
  {
    type: 'application/vnd.oasis.opendocument.graphics',
    extensions: ['odg'],
    description: 'OpenDocument graphics',
    category: 'application',
  },
  {
    type: 'application/epub+zip',
    extensions: ['epub'],
    description: 'EPUB ebook',
    category: 'application',
  },
  {
    type: 'application/x-httpd-php',
    extensions: ['php'],
    description: 'PHP script',
    category: 'application',
  },
  {
    type: 'application/x-sh',
    extensions: ['sh'],
    description: 'Shell script',
    category: 'application',
  },
  {
    type: 'application/x-csh',
    extensions: ['csh'],
    description: 'C Shell script',
    category: 'application',
  },
  {
    type: 'application/xhtml+xml',
    extensions: ['xhtml', 'xht'],
    description: 'XHTML document',
    category: 'application',
  },
  {
    type: 'application/xml-dtd',
    extensions: ['dtd'],
    description: 'XML document type definition',
    category: 'application',
  },
  {
    type: 'application/xslt+xml',
    extensions: ['xslt'],
    description: 'XSL Transformations stylesheet',
    category: 'application',
  },
  {
    type: 'application/x-shockwave-flash',
    extensions: ['swf'],
    description: 'Adobe Flash',
    category: 'application',
  },
  {
    type: 'application/x-msaccess',
    extensions: ['mdb'],
    description: 'Microsoft Access database',
    category: 'application',
  },
  {
    type: 'application/vnd.android.package-archive',
    extensions: ['apk'],
    description: 'Android package',
    category: 'application',
  },
  {
    type: 'application/vnd.debian.binary-package',
    extensions: ['deb'],
    description: 'Debian package',
    category: 'application',
  },
  {
    type: 'application/vnd.visio',
    extensions: ['vsd', 'vss'],
    description: 'Microsoft Visio drawing',
    category: 'application',
  },
  {
    type: 'application/x-mpegurl',
    extensions: ['m3u8'],
    description: 'HLS playlist',
    category: 'application',
  },
  {
    type: 'application/vnd.ms-fontobject',
    extensions: ['eot'],
    description: 'Embedded OpenType font',
    category: 'application',
  },
  {
    type: 'application/wasm',
    extensions: ['wasm'],
    description: 'WebAssembly binary',
    category: 'application',
  },
  {
    type: 'application/x-bittorrent',
    extensions: ['torrent'],
    description: 'BitTorrent metainfo',
    category: 'application',
  },
  {
    type: 'application/x-iso9660-image',
    extensions: ['iso'],
    description: 'ISO disc image',
    category: 'application',
  },
  {
    type: 'application/x-chess-pgn',
    extensions: ['pgn'],
    description: 'Chess game notation',
    category: 'application',
  },
  {
    type: 'application/x-subrip',
    extensions: ['srt'],
    description: 'SubRip subtitles',
    category: 'application',
  },
  {
    type: 'application/pgp-signature',
    extensions: ['sig', 'asc'],
    description: 'PGP signature',
    category: 'application',
  },
  {
    type: 'application/pgp-encrypted',
    extensions: ['pgp'],
    description: 'PGP encrypted message',
    category: 'application',
  },
  {
    type: 'application/x-pem-file',
    extensions: ['pem'],
    description: 'Privacy Enhanced Mail certificate',
    category: 'application',
  },
  {
    type: 'application/x-x509-ca-cert',
    extensions: ['crt', 'der'],
    description: 'X.509 certificate',
    category: 'application',
  },
  {
    type: 'application/postscript',
    extensions: ['ps', 'eps'],
    description: 'PostScript',
    category: 'application',
  },
  {
    type: 'application/x-dvi',
    extensions: ['dvi'],
    description: 'Device independent file',
    category: 'application',
  },
  {
    type: 'application/vnd.google-earth.kml+xml',
    extensions: ['kml'],
    description: 'Keyhole Markup Language',
    category: 'application',
  },
  {
    type: 'application/vnd.google-earth.kmz',
    extensions: ['kmz'],
    description: 'Keyhole Markup Language archive',
    category: 'application',
  },
  {
    type: 'application/atom+xml',
    extensions: ['atom'],
    description: 'Atom feed',
    category: 'application',
  },
  {
    type: 'application/rss+xml',
    extensions: ['rss'],
    description: 'RSS feed',
    category: 'application',
  },
  {
    type: 'application/ld+json',
    extensions: ['jsonld'],
    description: 'JSON-LD data',
    category: 'application',
  },
  {
    type: 'application/graphql',
    extensions: ['graphql'],
    description: 'GraphQL schema',
    category: 'application',
  },
  {
    type: 'application/manifest+json',
    extensions: ['webmanifest'],
    description: 'Web app manifest',
    category: 'application',
  },
  {
    type: 'application/x-mobipocket-ebook',
    extensions: ['mobi', 'prc'],
    description: 'Mobipocket ebook',
    category: 'application',
  },
  {
    type: 'application/x-apple-diskimage',
    extensions: ['dmg'],
    description: 'Apple disk image',
    category: 'application',
  },
  {
    type: 'application/ogg',
    extensions: ['ogx'],
    description: 'Ogg container',
    category: 'application',
  },
  {
    type: 'application/vnd.adobe.photoshop',
    extensions: ['psd'],
    description: 'Adobe Photoshop document',
    category: 'application',
  },
  {
    type: 'application/illustrator',
    extensions: ['ai'],
    description: 'Adobe Illustrator document',
    category: 'application',
  },
  {
    type: 'application/java-archive',
    extensions: ['jar'],
    description: 'Java archive',
    category: 'application',
  },
  {
    type: 'application/x-abiword',
    extensions: ['abw'],
    description: 'AbiWord document',
    category: 'application',
  },
  {
    type: 'application/vnd.tcpdump.pcap',
    extensions: ['pcap'],
    description: 'Packet capture',
    category: 'application',
  },
  {
    type: 'application/vnd.corel-draw',
    extensions: ['cdr'],
    description: 'CorelDRAW image',
    category: 'application',
  },
  {
    type: 'application/x-rpm',
    extensions: ['rpm'],
    description: 'RPM package',
    category: 'application',
  },
  {
    type: 'application/x-cpio',
    extensions: ['cpio'],
    description: 'Cpio archive',
    category: 'application',
  },
] as const satisfies readonly MimeTypeEntry[]

const TYPE_PATTERN = /^[a-z0-9._+-]+\/[a-z0-9._+-]+$/
const EXTENSION_PATTERN = /^[a-z0-9]+$/i

export function searchMimeTypes(
  query: string,
  category: MimeCategory | null = null,
): MimeTypeEntry[] {
  const normalized = query.trim().toLowerCase()
  const extensionQuery = normalized.startsWith('.') ? normalized.slice(1) : normalized
  return MIME_TYPES.filter((entry) => {
    if (category !== null && entry.category !== category) {
      return false
    }
    if (normalized === '') {
      return true
    }
    if (entry.type === normalized) {
      return true
    }
    if (entry.type.slice(entry.type.indexOf('/') + 1) === normalized) {
      return true
    }
    return entry.extensions.some((extension) => extension.toLowerCase() === extensionQuery)
  })
}

export function isValidMimeType(type: string): boolean {
  return TYPE_PATTERN.test(type)
}

export function isValidExtension(extension: string): boolean {
  return EXTENSION_PATTERN.test(extension)
}
