import type { NextApiRequest, NextApiResponse } from 'next';
import { firestore } from '../../lib/firebase'; // Firestore Admin SDK
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

// Get all areas for a location
const getAreas = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    // Ambil semua dokumen dari koleksi 'areas'
    const areasSnapshot = await getDocs(collection(firestore, 'areas'));

    const areas = areasSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json(areas); // Kirim data sebagai respons
  } catch (error) {
    console.error('Error fetching areas:', error);
    res.status(500).json({ error: 'Failed to fetch areas' });
  }
};

// Create a new area
const createArea = async (req: NextApiRequest, res: NextApiResponse) => {
  const { name, description, location_ids } = req.body;
  try {
    await addDoc(collection(firestore, 'areas'), {
      name,
      description,
      location_ids,
      created_at: new Date().toISOString(),
    });
    res.status(201).json({ message: 'Area created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create area' });
  }
};

// Update an area
const updateArea = async (req: NextApiRequest, res: NextApiResponse) => {
  const { id, name, description } = req.body;
  const areaRef = doc(firestore, 'areas', id);
  try {
    await updateDoc(areaRef, { name, description });
    res.status(200).json({ message: 'Area updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update area' });
  }
};

// Delete an area
const deleteArea = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Area ID is required' });
    }

    const areaRef = doc(firestore, 'areas', id);
    await deleteDoc(areaRef);

    res.status(200).json({ message: 'Area deleted successfully' });
  } catch (error) {
    console.error('Error deleting area:', error);
    res.status(500).json({ error: 'Failed to delete area' });
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return getAreas(req, res);
  } else if (req.method === 'POST') {
    return createArea(req, res);
  } else if (req.method === 'PUT') {
    return updateArea(req, res);
  } else if (req.method === 'DELETE') {
    return deleteArea(req, res);
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}
