import { assertEquals, assert } from "@std/assert";
import {
  checkRateLimit,
  getClientIP,
  getSecurityHeaders,
  cleanupRateLimits
} from "../backend/utils/security.ts";

Deno.test("Get client IP", () => {
  const request1 = new Request("http://example.com", {
    headers: {
      "X-Forwarded-For": "192.168.1.1, 10.0.0.1"
    }
  });
  assertEquals(getClientIP(request1), "192.168.1.1");
  
  const request2 = new Request("http://example.com", {
    headers: {
      "X-Real-IP": "203.0.113.1"
    }
  });
  assertEquals(getClientIP(request2), "203.0.113.1");
  
  const request3 = new Request("http://example.com");
  assertEquals(getClientIP(request3), "unknown");
});

Deno.test("Rate limiting", () => {
  const ip = "192.168.1.100";
  
  // Should allow requests within limit
  for (let i = 0; i < 5; i++) {
    const result = checkRateLimit(ip, "auth");
    assertEquals(result.allowed, true);
    assert(result.resetAt !== undefined);
  }
  
  // Should block after limit
  const blockedResult = checkRateLimit(ip, "auth");
  assertEquals(blockedResult.allowed, false);
  assert(blockedResult.resetAt !== undefined);
  
  // API limit is higher
  const ip2 = "192.168.1.200";
  for (let i = 0; i < 100; i++) {
    const result = checkRateLimit(ip2, "api");
    assertEquals(result.allowed, true);
  }
  const blockedResult2 = checkRateLimit(ip2, "api");
  assertEquals(blockedResult2.allowed, false);
});

Deno.test("Security headers", () => {
  const headers = getSecurityHeaders();
  
  assert(headers["X-Content-Type-Options"] === "nosniff");
  assert(headers["X-Frame-Options"] === "DENY");
  assert(headers["X-XSS-Protection"] === "1; mode=block");
  assert(headers["Referrer-Policy"] === "strict-origin-when-cross-origin");
  assert(headers["Content-Security-Policy"].includes("default-src 'self'"));
});

Deno.test("Rate limit cleanup", () => {
  // This test verifies cleanup function exists and can be called
  // Actual cleanup testing would require time manipulation
  assert(typeof cleanupRateLimits === "function");
  cleanupRateLimits(); // Should not throw
});

