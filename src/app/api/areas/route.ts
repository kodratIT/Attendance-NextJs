// app/api/areas/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '@/libs/firebase/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';

import { AreaType } from '@/types/areaTypes';
import { timeSpentToDate } from '@/utils/dateUtils';
interface AreaPayload {
  name: string;
  locations: { id: number; name: string }[];
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

    console.log(`📝 Creating new areas: ${payload.name}`);


    // Tambahkan areas baru ke Firestore
    const areasRef = await addDoc(collection(firestore, 'areas'), {
      name: payload.name,
      locations : payload.locations,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    });

    console.log(`✅ areas ${payload.name} created successfully with ID: ${areasRef.id}`);

    return NextResponse.json({ success: true, message: 'areas added successfully', id: areasRef.id, name: payload.name }, { status: 201 });

  } catch (error: any) {
    console.error('❌ Error adding areas:', error);
    return NextResponse.json({ success: false, message: 'Failed to add areas', error: error.message }, { status: 500 });
  }
}
