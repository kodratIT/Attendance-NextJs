import { NextRequest, NextResponse } from 'next/server';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, firestore } from '@/libs/firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface loginPayload {
  email: string;
  password: string;
}
export async function POST(req: NextRequest) {
  const payload: loginPayload = await req.json()
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

    const data = {
      id: firebaseUser.uid,
      email: firebaseUser.email,
      role: userData.role
    };

    return NextResponse.json({
      success: true,
      message: 'Login successfully',
      data: data,
    }, { status: 200 });

  } catch (error:any ) {
    console.error('Login error:', error); // Logging lebih rinci
    return NextResponse.json({ success: false, message: 'Failed login', error: error.message }, { status: 500 });
  }
}
