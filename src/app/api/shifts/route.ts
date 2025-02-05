// app/api/shifts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '@/libs/firebase/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, Timestamp, updateDoc } from 'firebase/firestore';
import { ShiftType } from '@/types/shiftTypes';
import { timeSpentToDate } from '@/utils/dateUtils';

interface ShiftPayload {
  name: string;
  start_time: string; // Format HH:mm
  end_time: string;   // Format HH:mm
}

// ✅ **GET ALL SHIFTS**
export async function GET() {
  try {
    const shiftsSnapshot = await getDocs(collection(firestore, 'shifts'));
    const data = shiftsSnapshot.docs.map((docSnap) => {
      const { created_at, updated_at, ...rest } = docSnap.data();
      return {
        id: docSnap.id,
        ...rest,
        createdAt: timeSpentToDate(created_at),
        updatedAt: timeSpentToDate(updated_at),
      };
    });
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    console.error('❌ Error fetching shifts:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch shifts', error: error.message },
      { status: 500 }
    );
  }
}

// ✅ **CREATE A NEW SHIFT**
export async function POST(req: NextRequest) {
  try {
    const payload: ShiftPayload = await req.json();

    // Validasi input
    if (!payload.name || typeof payload.name !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Invalid data: name must be a string' },
        { status: 400 }
      );
    }
    if (!payload.start_time || !payload.end_time) {
      return NextResponse.json(
        { success: false, message: 'Invalid data: start_time and end_time are required' },
        { status: 400 }
      );
    }

    console.log(`📝 Creating new shift: ${payload.name}`);
    const shiftRef = await addDoc(collection(firestore, 'shifts'), {
      name: payload.name,
      start_time: payload.start_time,
      end_time: payload.end_time,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    });

    console.log(`✅ Shift ${payload.name} created successfully with ID: ${shiftRef.id}`);
    return NextResponse.json(
      { success: true, message: 'Shift added successfully', id: shiftRef.id, name: payload.name },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('❌ Error adding shift:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to add shift', error: error.message },
      { status: 500 }
    );
  }
}