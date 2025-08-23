import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Rate limiting configuration
export const RATE_LIMITS = {
  API: { windowMs: 15 * 60 * 1000, maxRequests: 100 }, // 100 requests per 15 minutes
  AUTH: { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 auth attempts per 15 minutes
  OCR: { windowMs: 60 * 60 * 1000, maxRequests: 50 }, // 50 OCR requests per hour
  TWITTER: { windowMs: 60 * 60 * 1000, maxRequests: 10 }, // 10 Twitter posts per hour
}

// Security headers
export const SECURITY_HEADERS = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://twitter.com https://cdn.jsdelivr.net blob:;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' data: blob: https:;
    connect-src 'self' data: https://api.stripe.com https://api.twitter.com https://*.supabase.co https://api.openai.com;
    frame-src 'self' https://js.stripe.com https://twitter.com;
    worker-src 'self' blob:;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
  `.replace(/\s+/g, ' ').trim(),
}

// Input validation and sanitization
export const validateInput = {
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email) && email.length <= 254
  },

  password: (password: string): boolean => {
    return password.length >= 8 &&
           password.length <= 128 &&
           /[A-Z]/.test(password) &&
           /[a-z]/.test(password) &&
           /[0-9]/.test(password)
  },

  text: (text: string, maxLength: number = 10000): string => {
    // Remove null bytes and other control characters
    let sanitized = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')

    // Trim whitespace
    sanitized = sanitized.trim()

    // Limit length
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength)
    }

    return sanitized
  },

  filename: (filename: string): string => {
    // Remove path separators and dangerous characters
    return filename.replace(/[/\\:*?"<>|]/g, '_').substring(0, 255)
  },

  url: (url: string): boolean => {
    try {
      new URL(url)
      return url.startsWith('http://') || url.startsWith('https://')
    } catch {
      return false
    }
  }
}

// File upload validation
export const validateFileUpload = (file: File): { valid: boolean; error?: string } => {
  // Check file size (10MB limit)
  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 10MB' }
  }

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Only image files (JPEG, PNG, GIF, WebP) are allowed' }
  }

  // Check filename for malicious patterns
  const filename = validateInput.filename(file.name)
  const maliciousPatterns = [
    /\.\./, // Directory traversal
    /[<>'"]/ // HTML/script injection
  ]

  for (const pattern of maliciousPatterns) {
    if (pattern.test(filename)) {
      return { valid: false, error: 'Invalid filename' }
    }
  }

  return { valid: true }
}

// Rate limiting middleware
export const rateLimit = (identifier: string, limit: typeof RATE_LIMITS.API) => {
  return (req: NextRequest): NextResponse | null => {
    const now = Date.now()

    // Get client IP from headers
    const forwarded = req.headers.get('x-forwarded-for')
    const clientIP = forwarded ? forwarded.split(',')[0] : req.headers.get('x-real-ip') || 'unknown'
    const key = `${identifier}:${clientIP}`

    const current = rateLimitStore.get(key)

    if (!current || now > current.resetTime) {
      // First request or window expired
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + limit.windowMs
      })
      return null
    }

    if (current.count >= limit.maxRequests) {
      // Rate limit exceeded
      const resetTime = new Date(current.resetTime)
      return NextResponse.json(
        {
          error: 'Too many requests',
          retryAfter: resetTime.toISOString()
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((current.resetTime - now) / 1000).toString(),
            'X-RateLimit-Reset': resetTime.toISOString()
          }
        }
      )
    }

    // Increment counter
    current.count++
    rateLimitStore.set(key, current)

    return null
  }
}

// Clean up expired rate limit entries (run this periodically)
export const cleanupRateLimitStore = () => {
  const now = Date.now()
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}

// Start cleanup interval
if (typeof globalThis !== 'undefined') {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000) // Clean up every 5 minutes
}

// SQL injection prevention (basic)
export const sanitizeSqlInput = (input: string): string => {
  // Remove common SQL injection patterns
  return input
    .replace(/'/g, "''") // Escape single quotes
    .replace(/;/g, '') // Remove semicolons
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove block comment starts
    .replace(/\*\//g, '') // Remove block comment ends
}

// XSS prevention
export const escapeHtml = (text: string): string => {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  }

  return text.replace(/[&<>"'/]/g, (match) => htmlEscapes[match])
}

// CSRF protection (basic)
export const generateCSRFToken = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// Request logging for security monitoring
export const logSecurityEvent = (event: {
  type: 'rate_limit' | 'auth_failure' | 'file_upload' | 'suspicious_activity'
  userId?: string
  ip?: string
  userAgent?: string
  details: Record<string, any>
}) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    ...event
  }

  console.warn('SECURITY EVENT:', logEntry)

  // In production, you would send this to a security monitoring service
  // like DataDog, Sentry, or your own logging service
}

// API key validation
export const validateApiKey = (apiKey: string): boolean => {
  // Check if it's a valid OpenAI API key format
  return apiKey.startsWith('sk-') && apiKey.length > 20 && !apiKey.includes(' ')
}

// Environment variable validation
export const validateEnvironment = () => {
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET'
  ]

  const warnings: string[] = []

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      warnings.push(`Missing required environment variable: ${envVar}`)
    }
  }

  if (warnings.length > 0) {
    console.warn('SECURITY WARNINGS:', warnings)
  }

  return warnings
}

// Security middleware for API routes
export const withSecurity = (handler: Function) => {
  return async (req: NextRequest, ...args: any[]) => {
    // Add security headers
    const response = await handler(req, ...args)

    if (response instanceof NextResponse) {
      Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
        response.headers.set(key, value)
      })
    }

    return response
  }
}

// Initialize security validation
if (typeof globalThis !== 'undefined') {
  validateEnvironment()
}
