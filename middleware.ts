import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Tambahkan Header CORS
  res.headers.set('Access-Control-Allow-Origin', '*'); // Ganti dengan domain spesifik jika perlu
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight request (OPTIONS)
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: res.headers });
  }

  return res;
}

// Terapkan middleware hanya untuk API Routes
export const config = {
  matcher: '/api/:path*', // Middleware hanya untuk API Routes
};
