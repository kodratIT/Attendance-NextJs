import { NextRequest, NextResponse } from 'next/server';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, firestore } from '@/libs/firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';

const SECRET_KEY = process.env.JWT_SECRET_KEY || 'your-secret-key';

interface LoginModel {
  email: string;
  password: string;
}

export async function POST(req: NextRequest) {
  const payload: LoginModel = await req.json();

  try {
    // Autentikasi dengan Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, payload.email, payload.password);
    const firebaseUser = userCredential.user;

    // Ambil data pengguna dari Firestore
    const userDoc = await getDoc(doc(firestore, 'users', firebaseUser.uid));
    const userData = userDoc.data();

    // Cek apakah userData ada
    if (!userData) {
      throw new Error('User data not found in Firestore');
    }

    // Generate token JWT
    const token = jwt.sign(
      {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        mustChangePassword: userData?.mustChangePassword || false,
      },
      SECRET_KEY,
      { expiresIn: '1h' }
    );

    // Membuat cookie
    const cookie = serialize('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 3600 // 1 jam
    });

    // Membuat response dan mengatur cookie
    const response = NextResponse.json({
      success: true,
      message: 'Login successfully',
      token: token
    });
    response.headers.set('Set-Cookie', cookie);
    return response;

  } catch (error) {
    console.error('❌ Error login users:', error);
    return NextResponse.json({ success: false, message: 'Failed login users', error: error }, { status: 500 });
  }
}
