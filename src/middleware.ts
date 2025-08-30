import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  
  // Get NextAuth token
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || 'kodratpamungkas'
  })
  
  console.log('🔍 Middleware - pathname:', pathname, 'token exists:', !!token)
  
  // Handle root path redirect
  if (pathname === '/') {
    if (token) {
      // User is authenticated, redirect to home
      console.log('✅ Authenticated user accessing root - redirecting to /home')
      return NextResponse.redirect(new URL('/home', req.url))
    } else {
      // User not authenticated, redirect to login
      console.log('❌ Unauthenticated user accessing root - redirecting to /login')
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }
  
  // Handle login page when already authenticated
  if (pathname === '/login') {
    if (token) {
      // User is already authenticated, redirect to home
      console.log('✅ Authenticated user accessing login - redirecting to /home')
      return NextResponse.redirect(new URL('/home', req.url))
    }
    // User not authenticated, allow access to login page
    console.log('➡️ Allowing access to login page')
    return NextResponse.next()
  }
  
  // Handle protected routes (dashboard pages)
  if (pathname.startsWith('/home') || 
      pathname.startsWith('/attendance') || 
      pathname.startsWith('/users') ||
      pathname.startsWith('/areas') ||
      pathname.startsWith('/locations') ||
      pathname.startsWith('/shifts') ||
      pathname.startsWith('/roles') ||
      pathname.startsWith('/permissions') ||
      pathname.startsWith('/report') ||
      pathname.startsWith('/overtime') ||
      pathname.startsWith('/requests') ||
      pathname.startsWith('/changelog') ||
      pathname.startsWith('/settings')) {
    
    if (!token) {
      // User not authenticated, redirect to login with return URL
      console.log('❌ Unauthenticated user accessing protected route - redirecting to login')
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
    
    // User is authenticated, allow access
    console.log('✅ Authenticated user accessing protected route - allowing access')
    return NextResponse.next()
  }
  
  // For all other routes, continue normally
  console.log('➡️ Continuing with other routes')
  return NextResponse.next()
}

// Configure which paths should run the middleware
export const config = {
  matcher: [
    // Match all paths except static files and API routes
    '/((?!api|_next/static|_next/image|favicon.ico|images|icons).*)',
  ],
}
