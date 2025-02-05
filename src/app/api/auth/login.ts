// import type { NextApiRequest, NextApiResponse } from 'next';
// import { signInWithEmailAndPassword } from 'firebase/auth';
// import { auth, firestore } from '../../lib/firebase';
// import { doc, getDoc } from 'firebase/firestore';
// import jwt from 'jsonwebtoken';
// import { serialize } from 'cookie';

// const SECRET_KEY = process.env.JWT_SECRET_KEY || 'your-secret-key';

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   if (req.method !== 'POST') {
//     return res.status(405).json({ error: 'Method Not Allowed' });
//   }

//   const { email, password } = req.body;

//   try {
//     // Autentikasi dengan Firebase Auth
//     const userCredential = await signInWithEmailAndPassword(auth, email, password);
//     const firebaseUser = userCredential.user;

//     // Ambil data pengguna dari Firestore
//     const userDoc = await getDoc(doc(firestore, 'users', firebaseUser.uid));
//     const userData = userDoc.data();

//     // Cek apakah userData ada
//     if (!userData) {
//       throw new Error('User data not found in Firestore');
//     }

//     // Generate token JWT
//     const token = jwt.sign(
//       {
//         uid: firebaseUser.uid,
//         email: firebaseUser.email,
//         mustChangePassword: userData?.mustChangePassword || false, // Pastikan flag ada di Firestore
//       },
//       SECRET_KEY,
//       { expiresIn: '1h' }
//     );

//     // Set token JWT di cookie
//     res.setHeader('Set-Cookie', serialize('token', token, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === 'production',
//       sameSite: 'strict',
//       path: '/',
//       maxAge: 60 * 60, // 1 hour
//     }));

//     // Logging untuk melihat apakah token berhasil di-generate

//     res.status(200).json({ token, message: 'Login successful' });
//   } catch (error) {
//     console.error('Login error:', error); // Logging lebih rinci untuk debugging
//     res.status(400).json({ error: (error as Error).message });
//   }
// }
