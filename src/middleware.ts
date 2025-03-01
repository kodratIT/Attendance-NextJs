import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// const SECRET_KEY = process.env.JWT_SECRET_KEY || 'your-secret-key';

export function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  // Jika token tidak  ada, redirect ke halaman login

  console.log("sjkdsfkjdsbkjs")
  // if (!token) {
  //   return NextResponse.redirect(new URL('/auth/login', req.url));
  // }
  
  // // Parse cookies
  // try {
  //   // Verifikasi token JWT
  //   // Cek apakah pengguna harus mengganti password
  //   const decodedToken = jwt.decode(token) as jwt.JwtPayload;
  //   if (decodedToken.mustChangePassword) {
  //     return NextResponse.redirect(new URL('/change-password', req.url));
  //   }
    
  //   // Lanjutkan ke halaman yang diminta jika token valid
  //   return NextResponse.next();
  // } catch (error) {
  //   // Jika token tidak valid, redirect ke halaman login
  //   return NextResponse.redirect(new URL('/auth/login', req.url));
  // }
}

// Tentukan path yang akan menggunakan middleware
export const config = {
  matcher: ['/dashboard/:path*'], // Proteksi semua halaman di /dashboard
};
