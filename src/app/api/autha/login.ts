import type { NextApiRequest, NextApiResponse } from 'next';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, firestore } from '@/libs/firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';

const SECRET_KEY = process.env.JWT_SECRET_KEY || 'your-secret-key';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email, password } = req.body;

  try {
    // Autentikasi dengan Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
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

    res.status(200).json({ data, message: 'Login successful' });
  } catch (error) {
    console.error('Login error:', error); // Logging lebih rinci untuk debugging
    res.status(400).json({ error: (error as Error).message });
  }
}
