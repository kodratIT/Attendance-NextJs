// app/api/shifts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '@/libs/firebase/firebase';
import { collection, getDoc, addDoc, deleteDoc, doc, Timestamp, updateDoc } from 'firebase/firestore';
import { ShiftType } from '@/types/shiftTypes';
import { timeSpentToDate } from '@/utils/dateUtils';

interface ShiftPayload {
  name: string;
  start_time: string; // Format HH:mm
  end_time: string;   // Format HH:mm
}

// ✅ **GET A SHIFT BY ID**
export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.pathname.split('/').pop();
    if (!id) {
      return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 });
    }

    console.log(`📝 Fetching shift ID: ${id}`);
    const shiftDoc = await getDoc(doc(firestore, 'shifts', id));
    if (!shiftDoc.exists()) {
      return NextResponse.json({ success: false, message: 'Shift not found' }, { status: 404 });
    }

    const data = shiftDoc.data();
    const formattedData = {
      name: data.name,
      start_time: data.start_time,
      end_time: data.end_time,
      createdAt: timeSpentToDate(data.created_at),
      updatedAt: timeSpentToDate(data.updated_at),
    };

    console.log(`✅ Fetched shift ${id} successfully`);
    return NextResponse.json({ success: true, data: formattedData }, { status: 200 });
  } catch (error: any) {
    console.error(`❌ Error fetching shift ${req.nextUrl.pathname}:`, error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch shift', error: error.message },
      { status: 500 }
    );
  }
}

// ✅ **UPDATE A SHIFT**
export async function PUT(req: NextRequest) {
  try {
    const id = req.nextUrl.pathname.split('/').pop();
    if (!id) {
      return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 });
    }

    const payload: ShiftPayload = await req.json();
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

    console.log(`📝 Updating shift ID: ${id}`);
    const shiftRef = doc(firestore, 'shifts', id);
    await updateDoc(shiftRef, {
      name: payload.name,
      start_time: payload.start_time,
      end_time: payload.end_time,
      updated_at: Timestamp.now(),
    });

    console.log(`✅ Shift ${id} updated successfully`);
    return NextResponse.json({ success: true, message: 'Shift updated successfully' }, { status: 200 });
  } catch (error: any) {
    console.error(`❌ Error updating shift ${req.nextUrl.pathname}:`, error);
    return NextResponse.json(
      { success: false, message: 'Failed to update shift', error: error.message },
      { status: 500 }
    );
  }
}

// ✅ **DELETE A SHIFT**
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.pathname.split('/').pop();
    if (!id) {
      return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 });
    }

    console.log(`🗑 Deleting shift ID: ${id}`);
    const shiftRef = doc(firestore, 'shifts', id);
    const shiftDoc = await getDoc(shiftRef);
    if (!shiftDoc.exists()) {
      return NextResponse.json({ success: false, message: 'Shift not found' }, { status: 404 });
    }

    await deleteDoc(shiftRef);
    console.log(`✅ Shift ${id} deleted successfully`);
    return NextResponse.json({ success: true, message: 'Shift deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error(`❌ Error deleting shift ${req.nextUrl.pathname}:`, error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete shift', error: error.message },
      { status: 500 }
    );
  }
}