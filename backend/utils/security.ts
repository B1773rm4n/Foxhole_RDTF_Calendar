/**
 * Security utilities: rate limiting, headers, etc.
 */

// Simple in-memory rate limiter (in production, use Redis)
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Rate limiting configuration
 */
const RATE_LIMITS = {
  auth: { requests: 5, windowMs: 15 * 60 * 1000 }, // 5 requests per 15 minutes
  api: { requests: 100, windowMs: 60 * 1000 }, // 100 requests per minute
  shifts: { requests: 20, windowMs: 60 * 1000 }, // 20 requests per minute
};

/**
 * Rate limit check result
 */
export interface RateLimitResult {
  allowed: boolean;
  resetAt?: number; // Timestamp when the rate limit resets
}

/**
 * Check rate limit for an IP address
 */
export function checkRateLimit(ip: string, type: keyof typeof RATE_LIMITS): RateLimitResult {
  const limit = RATE_LIMITS[type];
  const now = Date.now();
  
  let entry = rateLimitStore.get(`${ip}:${type}`);
  
  // Reset if window expired
  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt: now + limit.windowMs };
    rateLimitStore.set(`${ip}:${type}`, entry);
  }
  
  // Increment count
  entry.count++;
  
  // Check if limit exceeded
  if (entry.count > limit.requests) {
    return { allowed: false, resetAt: entry.resetAt };
  }
  
  return { allowed: true, resetAt: entry.resetAt };
}

/**
 * Get client IP from request
 */
export function getClientIP(request: Request): string {
  // Check X-Forwarded-For header (for proxies)
  const forwarded = request.headers.get('X-Forwarded-For');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  // Check X-Real-IP header
  const realIP = request.headers.get('X-Real-IP');
  if (realIP) {
    return realIP;
  }
  
  // Fallback (in production, you'd get this from the connection)
  return 'unknown';
}

/**
 * Security headers
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
  };
}

/**
 * Clean up expired rate limit entries (call periodically)
 */
export function cleanupRateLimits(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}

// Clean up every 5 minutes
setInterval(cleanupRateLimits, 5 * 60 * 1000);

