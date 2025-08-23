import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SECURITY_HEADERS, logSecurityEvent } from '@/lib/security'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Add security headers to all responses
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // Log suspicious requests
  const userAgent = request.headers.get('user-agent') || ''
  const suspiciousPatterns = [
    /\b(sqlmap|nmap|nikto|dirbuster|hydra|metasploit)\b/i,
    /\b(union select|script|javascript|vbscript|onload|onerror)\b/i,
    /\.\.\//, // Directory traversal
  ]

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(request.url) || pattern.test(userAgent)) {
      logSecurityEvent({
        type: 'suspicious_activity',
        ip: request.ip || 'unknown',
        userAgent,
        details: {
          url: request.url,
          method: request.method,
          suspiciousPattern: pattern.toString()
        }
      })
      break
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
}
