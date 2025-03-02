// import type { NextApiRequest, NextApiResponse } from 'next';
// import { firestore, auth } from '../../lib/firebase';
// import { createUserWithEmailAndPassword } from 'firebase/auth';
// import { doc, setDoc } from 'firebase/firestore';

// // Fungsi untuk handle request API Register
// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   if (req.method !== 'POST') {
//     return res.status(405).json({ error: 'Method Not Allowed' });
//   }

//   const { email, password } = req.body;

//   try {
//     // Membuat pengguna baru menggunakan Firebase Auth
//     const userCredential = await createUserWithEmailAndPassword(auth, email, password);
//     const user = userCredential.user;

//     // Menyimpan data pengguna di Firestore
//     await setDoc(doc(firestore, 'users', user.uid), {
//       email: user.email,
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     });

//     // Mengirim respons sukses
//     res.status(201).json({ message: 'User registered', userId: user.uid });
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to register user' });
//   }
// }
