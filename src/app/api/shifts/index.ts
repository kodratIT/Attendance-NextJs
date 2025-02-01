// pages/api/shifts.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { firestore } from '../../lib/firebase'; // Import Firestore instance
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';

// Fungsi untuk mendapatkan semua shift
const getShifts = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const snapshot = await getDocs(collection(firestore, 'shifts'));
    const shifts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.status(200).json(shifts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch shifts' });
  }
};

// Fungsi untuk menambahkan shift baru
const addShift = async (req: NextApiRequest, res: NextApiResponse) => {
  const { name, startTime, endTime } = req.body;

  console.log(req.body)
  if (!name || !startTime || !endTime) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const docRef = await addDoc(collection(firestore, 'shifts'), {
      name,
      startTime,
      endTime,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    res.status(201).json({ id: docRef.id, message: 'Shift added successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add shift' });
  }
};

// Fungsi untuk memperbarui shift berdasarkan ID
const updateShift = async (req: NextApiRequest, res: NextApiResponse) => {
  const { id } = req.query;
  const { name, startTime, endTime } = req.body;

  if (!id || !name || !startTime || !endTime) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const docRef = doc(firestore, 'shifts', id as string);
    await updateDoc(docRef, {
      name,
      startTime,
      endTime,
      updatedAt: new Date().toISOString(),
    });
    res.status(200).json({ message: 'Shift updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update shift' });
  }
};

// Fungsi untuk menghapus shift berdasarkan ID
const deleteShift = async (req: NextApiRequest, res: NextApiResponse) => {
  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: 'Missing shift ID' });
  }

  try {
    const docRef = doc(firestore, 'shifts', id as string);
    await deleteDoc(docRef);
    res.status(200).json({ message: 'Shift deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete shift' });
  }
};

// Handler utama untuk menangani request API berdasarkan method
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      await getShifts(req, res);
      break;
    case 'POST':
      await addShift(req, res);
      break;
    case 'PUT':
      await updateShift(req, res);
      break;
    case 'DELETE':
      await deleteShift(req, res);
      break;
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
