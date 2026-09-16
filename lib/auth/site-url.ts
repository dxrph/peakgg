export function getSiteUrl() {
  const value = process.env.NEXT_PUBLIC_SITE_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://peakgg.net');
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('INVALID_SITE_URL');
  return url.origin;
}
