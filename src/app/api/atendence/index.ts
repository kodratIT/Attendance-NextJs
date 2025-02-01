// pages/api/attendance/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { firestore } from '../../lib/firebase';
import { collection, addDoc, getDocs, updateDoc, doc } from 'firebase/firestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const snapshot = await getDocs(collection(firestore, 'attendances'));
      const attendances = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      res.status(200).json(attendances);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch attendance records' });
    }
  } else if (req.method === 'POST') {
    const { workerId, shiftId, status, checkIn } = req.body;

    try {
      const newAttendance = {
        workerId,
        shiftId,
        status,
        checkIn,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await addDoc(collection(firestore, 'attendances'), newAttendance);
      res.status(201).json({ message: 'Attendance added successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to add attendance record' });
    }
  } else if (req.method === 'PUT') {
    const { id, checkOut } = req.body;

    try {
      const attendanceRef = doc(firestore, 'attendances', id);
      await updateDoc(attendanceRef, {
        checkOut,
        updatedAt: new Date().toISOString(),
      });
      res.status(200).json({ message: 'Attendance updated successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update attendance record' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
