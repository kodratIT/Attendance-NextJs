// import type { NextApiRequest, NextApiResponse } from 'next';
// import { firestore } from '../../lib/firebase';  // Pastikan inisialisasi firebase sudah ada
// import { collection, setDoc, getDocs, doc } from 'firebase/firestore';

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   if (req.method === 'POST') {
//     const { name, email, role, areaIds, shiftIds, auth_uid } = req.body;

//     if (!auth_uid) {
//       console.error('auth_uid is missing in the request body');
//       return res.status(400).json({ error: 'auth_uid is required' });
//     }

//     try {
//       // Menggunakan UID dari Firebase Authentication sebagai ID dokumen di Firestore
//       await setDoc(doc(firestore, 'users', auth_uid), {
//         name,
//         email,
//         role,
//         areaIds,
//         // shiftIds,
//         mustChangePassword: true,
//         created_at: new Date(),
//         updated_at: new Date(),
//       });

//       console.log(`User with auth_uid ${auth_uid} has been successfully created`);
//       res.status(201).json({ id: auth_uid, message: 'User created with auth UID as ID' });
//     } catch (error) {
//       console.error('Error creating user:', error);
//       res.status(500).json({ error: 'Failed to create user'});
//     }
//   } else if (req.method === 'GET') {
//     try {
//       const querySnapshot = await getDocs(collection(firestore, 'users'));
//       const workers = querySnapshot.docs.map(doc => ({
//         id: doc.id,
//         ...doc.data(),
//       }));

//       console.log('Fetched workers successfully:', workers);
//       res.status(200).json(workers);
//     } catch (error) {
//       console.error('Error fetching workers:',  error);
//       res.status(500).json({ error: 'Failed to fetch workers' });
//     }
//   } else {
//     console.error(`Unsupported HTTP method: ${req.method}`);
//     res.status(405).json({ error: 'Method not allowed' });
//   }
// }
