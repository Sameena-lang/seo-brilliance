import { URL } from 'url';

export const normalizeUrl = (rawUrl: string, baseUrl: string): string | null => {
  try {
    const url = new URL(rawUrl, baseUrl);
    
    // Remove hash
    url.hash = '';

    // Convert to lowercase domain
    return url.href;
  } catch (error) {
    return null;
  }
};

export const isAllowedDomain = (urlStr: string, rootUrlStr: string, includeSubdomains: boolean): boolean => {
  try {
    const url = new URL(urlStr);
    const rootUrl = new URL(rootUrlStr);

    if (includeSubdomains) {
      return url.hostname.endsWith(rootUrl.hostname);
    }
    return url.hostname === rootUrl.hostname;
  } catch (error) {
    return false;
  }
};

export const isSafeUrl = (urlStr: string): boolean => {
  try {
    const url = new URL(urlStr);
    if (!['http:', 'https:'].includes(url.protocol)) return false;

    const hostname = url.hostname.toLowerCase();
    
    // Basic SSRF protection
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./) ||
      hostname.endsWith('.local')
    ) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
};
