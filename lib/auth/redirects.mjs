const INTERNAL_ORIGIN = 'https://peakgg.invalid';

// Validate both the literal and decoded path: browsers normalize backslashes,
// and a downstream redirect can decode escaped separators a second time.
export function safeInternalPath(value, fallback = '/dashboard') {
  if (typeof value !== 'string' || value.length > 2048) return fallback;
  let candidate = value;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    if (!candidate.startsWith('/') || candidate.startsWith('//') || /[\\\u0000-\u0020\u007f]/.test(candidate)) return fallback;
    try {
      if (new URL(candidate, INTERNAL_ORIGIN).origin !== INTERNAL_ORIGIN) return fallback;
      const decoded = decodeURIComponent(candidate);
      if (decoded === candidate) return value;
      candidate = decoded;
    } catch {
      return fallback;
    }
  }
  return fallback;
}
