// import type { NextApiRequest, NextApiResponse } from 'next';
// import { firestore } from '../../lib/firebase';
// import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   const { id } = req.query;

//   if (!id || typeof id !== 'string') {
//     return res.status(400).json({ error: 'Invalid or missing worker ID' });
//   }

//   switch (req.method) {
//     case 'GET':
//       return handleGetWorker(req, res, id);

//     case 'PUT':
//       return handleUpdateWorker(req, res, id);

//     case 'DELETE':
//       return handleDeleteWorker(req, res, id);

//     default:
//       return res.status(405).json({ error: 'Method not allowed' });
//   }
// }

// // Handler untuk GET (fetch worker)
// async function handleGetWorker(req: NextApiRequest, res: NextApiResponse, id: string) {
//   try {
//     const docRef = doc(firestore, 'users', id);
//     const docSnap = await getDoc(docRef);

//     if (!docSnap.exists()) {
//       return res.status(404).json({ error: 'Worker not found' });
//     }

//     res.status(200).json({ id: docSnap.id, ...docSnap.data() });
//   } catch (error) {
//     res.status(500).json({ error: `Failed to fetch worker: ${(error as Error).message}` });
//   }
// }

// // Handler untuk PUT (update worker)
// async function handleUpdateWorker(req: NextApiRequest, res: NextApiResponse, id: string) {
//   const { name, email, role, areaIds,shiftIds } = req.body;

//   if (!name || !email || !role || !Array.isArray(areaIds)) {
//     return res.status(400).json({
//       error: 'Missing required fields: name, email, role, or areaIds (must be an array)',
//     });
//   }

//   try {
//     const docRef = doc(firestore, 'users', id);
//     await updateDoc(docRef, {
//       name,
//       email,
//       role,
//       areaIds,
//       shiftIds,
//       created_at: new Date().toISOString(),
//       updated_at: new Date().toISOString(),
//     });
//     res.status(200).json({ message: 'Worker updated successfully' });
//   } catch (error) {
//     res.status(500).json({ error: `Failed to update worker: ${(error as Error).message}` });
//   }
// }

// // Handler untuk DELETE (delete worker)
// async function handleDeleteWorker(req: NextApiRequest, res: NextApiResponse, id: string) {
//   try {
//     const docRef = doc(firestore, 'users', id);
//     await deleteDoc(docRef);
//     res.status(200).json({ message: 'Worker deleted successfully' });
//   } catch (error) {
//     res.status(500).json({ error: `Failed to delete worker: ${(error as Error).message}` });
//   }
// }
