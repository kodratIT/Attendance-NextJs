import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Ambil origin dari request
  const origin = req.headers.get('origin') || '';

  // Atur CORS headers
  res.headers.set('Access-Control-Allow-Origin', origin); // Mengizinkan domain asal
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.headers.set('Access-Control-Allow-Credentials', 'true'); // Wajib untuk mengizinkan cookie

  // Handle preflight request (OPTIONS)
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: res.headers });
  }

  return res;
}

// Terapkan middleware hanya untuk API Routes
export const config = {
  matcher: '/api/:path*',
};
