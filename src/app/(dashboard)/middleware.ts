// pages/_middleware.js
import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  console.log("Middleware is running");
  
  // Menampilkan informasi request untuk pengujian
  console.log("Request Headers:", req.headers.get('user-agent')); // Menampilkan user-agent dari headers
  console.log("Request Path:", req.nextUrl.pathname); // Menampilkan path dari URL request

  // Mengirim response sederhana ke client untuk pengujian jika route tertentu diakses
  if (req.nextUrl.pathname.startsWith('/test-middleware')) {
    const response = new Response("Middleware Test Response", { status: 200 });
    return response;
  }

  // Lanjutkan ke response berikutnya jika tidak dijalankan pada path '/test-middleware'
  return NextResponse.next();
}
