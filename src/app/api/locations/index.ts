import { NextApiRequest, NextApiResponse } from 'next';
import { firestore } from '../../lib/firebase'; // Firebase Admin SDK
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';

// Fungsi untuk mendapatkan semua lokasi
const getLocations = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const locationsSnapshot = await getDocs(collection(firestore, 'locations'));
    const locations = locationsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.status(200).json(locations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
};

// Fungsi untuk menambah lokasi baru
const addLocation = async (req: NextApiRequest, res: NextApiResponse) => {
  const { name, latitude, longitude, radius } = req.body;
  try {
    await addDoc(collection(firestore, 'locations'), { name, latitude, longitude, radius });
    res.status(201).json({ message: 'Location added successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add location' });
  }
};

// Fungsi untuk mengupdate lokasi
const updateLocation = async (req: NextApiRequest, res: NextApiResponse) => {
  const { id, name, latitude, longitude, radius } = req.body;
  try {
    const locationRef = doc(firestore, 'locations', id);
    await updateDoc(locationRef, { name, latitude, longitude, radius });
    res.status(200).json({ message: 'Location updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update location' });
  }
};

// Fungsi untuk menghapus lokasi
const deleteLocation = async (req: NextApiRequest, res: NextApiResponse) => {
  const { id } = req.body;
  try {
    const locationRef = doc(firestore, 'locations', id);
    await deleteDoc(locationRef);
    res.status(200).json({ message: 'Location deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete location' });
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return getLocations(req, res);
  } else if (req.method === 'POST') {
    return addLocation(req, res);
  } else if (req.method === 'PUT') {
    return updateLocation(req, res);
  } else if (req.method === 'DELETE') {
    return deleteLocation(req, res);
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}
