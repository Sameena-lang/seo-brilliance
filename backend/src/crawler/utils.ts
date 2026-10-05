import { URL } from 'url';
import dns from 'dns';

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
    // Exact match mode: must match hostname exactly, and path must be under rootUrl path
    if (url.hostname !== rootUrl.hostname) return false;
    const normUrlPath = url.pathname.replace(/\/$/, '') || '/';
    const normRootPath = rootUrl.pathname.replace(/\/$/, '') || '/';
    
    // If root is '/', all paths are allowed on that hostname
    if (normRootPath === '/') return true;
    
    // Otherwise, ensure the new path is a sub-path of the root path
    return normUrlPath === normRootPath || normUrlPath.startsWith(normRootPath + '/');
  } catch (error) {
    return false;
  }
};

export const isSafeUrl = async (urlStr: string): Promise<boolean> => {
  try {
    const url = new URL(urlStr);
    if (!['http:', 'https:'].includes(url.protocol)) return false;

    const hostname = url.hostname.toLowerCase();
    
    // Basic textual SSRF protection
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.local')
    ) {
      return false;
    }

    // Resolve IP to prevent DNS rebinding or obfuscated IPs
    const lookupResult = await dns.promises.lookup(hostname).catch(() => null);
    if (!lookupResult) return false;

    const ip = lookupResult.address;
    
    if (
      ip === '127.0.0.1' ||
      ip === '::1' ||
      ip.startsWith('10.') ||
      ip.startsWith('192.168.') ||
      ip.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./) ||
      ip.startsWith('169.254.') || // Link-local
      ip.startsWith('fc00:') || ip.startsWith('fd00:') || // IPv6 unique local address
      ip.startsWith('fe80:') // IPv6 link-local
    ) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
};
