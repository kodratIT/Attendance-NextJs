// app/api/areas/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '@/libs/firebase/firebase';
import { collection, getDocs,updateDoc, addDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';

import { AreaType } from '@/types/areaTypes';
import { timeSpentToDate } from '@/utils/dateUtils';
interface AreaPayload {
  name: string;
  locations: { id: number; name: string }[];
}

interface Location {
  id: string;
  name: string;
}

export async function GET() {
  try {
    const areaSnapsot = await getDocs(collection(firestore, 'areas'));

    const data = areaSnapsot.docs.map(docSnap => {
      const { created_at, updated_at, ...rest } = docSnap.data();
      return {
        id: docSnap.id,
        ...rest,
        createdAt: timeSpentToDate(created_at),
        updatedAt: timeSpentToDate(updated_at),
      };
    });

    return NextResponse.json({ success: true, data: data });
  } catch (error: any) {
    console.error('❌ Error fetching areass:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch areass', error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload: AreaPayload = await req.json();

    // Validasi input
    if (!payload.name || typeof payload.name !== 'string') {
      return NextResponse.json({ success: false, message: 'Invalid data: name must be a string' }, { status: 400 });
    }

    if (!Array.isArray(payload.locations)) {
      return NextResponse.json({ success: false, message: 'Invalid data: locations must be an array' }, { status: 400 });
    }

    console.log(`📝 Creating new area: ${payload.name}`);

    // Tambahkan area baru ke Firestore
    const areasRef = await addDoc(collection(firestore, 'areas'), {
      name: payload.name,
      locations: payload.locations,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    });

    console.log(`✅ Area ${payload.name} created successfully with ID: ${areasRef.id}`);

    // Perbarui setiap lokasi untuk menambahkan assignedTo
    const assignedToData = { id: areasRef.id, name: payload.name };

    const locationUpdates = payload.locations.map(async (location) => {
      const locationId = typeof location === 'string' ? location : location.id.toString();
      if (locationId) {
        const locationRef = doc(firestore, 'locations', locationId);
        return updateDoc(locationRef, { assignedTo: assignedToData });
      } else {
        console.warn(`⚠️ Skipping invalid location:`, location);
        return Promise.resolve();
      }
    });

    await Promise.all(locationUpdates);

    console.log(`✅ AssignedTo field updated for locations: ${payload.locations.map(l => (typeof l === 'object' ? l.id : l)).join(', ')}`);

    return NextResponse.json({
      success: true,
      message: 'Area added successfully and locations updated',
      id: areasRef.id,
      name: payload.name,
    }, { status: 201 });

  } catch (error: any) {
    console.error('❌ Error adding area or updating locations:', error);
    return NextResponse.json({ success: false, message: 'Failed to add area or update locations', error: error.message }, { status: 500 });
  }
}
