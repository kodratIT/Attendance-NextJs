import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '@/libs/firebase/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { timeSpentToDate } from '@/utils/dateUtils';
import { createCORSHeaders } from '@/utils/cors';

// Interface untuk payload Attendance
interface AttendancePayload {
  date: string;
  checkInTime: string;
  checkOutTime: string;
  workingHours: number;
  status: string;
}

// ✅ **OPTIONS Handler untuk Preflight Request**
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: createCORSHeaders(),
  });
}

// ✅ **GET ALL ATTENDANCE RECORDS**
export async function GET() {
  try {
    const attendanceSnapshot = await getDocs(collection(firestore, 'attendance'));
    const data = attendanceSnapshot.docs.map((docSnap) => {
      const { created_at, updated_at, ...rest } = docSnap.data();
      return {
        id: docSnap.id,
        ...rest,
        createdAt: timeSpentToDate(created_at),
        updatedAt: timeSpentToDate(updated_at),
      };
    });
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: createCORSHeaders(),
    });
  } catch (error: any) {
    console.error('❌ Error fetching attendance records:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Failed to fetch attendance records', error: error.message }),
      {
        status: 500,
        headers: createCORSHeaders(),
      }
    );
  }
}

// ✅ **CREATE NEW ATTENDANCE RECORD**
export async function POST(req: NextRequest) {
  try {
    const payload: AttendancePayload = await req.json();

    // Validasi input
    if (!payload.date || !payload.checkInTime || !payload.checkOutTime || !payload.workingHours || !payload.status) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Invalid data: date, checkInTime, checkOutTime, workingHours, and status are required',
        }),
        {
          status: 400,
          headers: createCORSHeaders(),
        }
      );
    }

    console.log(`📝 Creating new attendance record for date: ${payload.date}`);

    // Tambahkan record baru ke Firestore
    const attendanceRef = await addDoc(collection(firestore, 'attendance'), {
      date: payload.date,
      checkInTime: payload.checkInTime,
      checkOutTime: payload.checkOutTime,
      workingHours: payload.workingHours,
      status: payload.status,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    });

    console.log(`✅ Attendance record for date ${payload.date} created successfully with ID: ${attendanceRef.id}`);
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Attendance record added successfully',
        id: attendanceRef.id,
        ...payload,
      }),
      {
        status: 201,
        headers: createCORSHeaders(),
      }
    );
  } catch (error: any) {
    console.error('❌ Error adding attendance record:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Failed to add attendance record', error: error.message }),
      {
        status: 500,
        headers: createCORSHeaders(),
      }
    );
  }
}

// ✅ **UPDATE ATTENDANCE RECORD**
export async function PUT(req: NextRequest) {
  try {
    const id = req.nextUrl.pathname.split('/').pop();
    if (!id) {
      return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 });
    }

    // Parse JSON body dari request
    const payload: Partial<AttendancePayload> = await req.json();

    // Validasi input
    if (!payload.date && !payload.checkInTime && !payload.checkOutTime && !payload.workingHours && !payload.status) {
      return NextResponse.json({ success: false, message: 'At least one field is required for update' }, { status: 400 });
    }

    console.log(`🔄 Updating Attendance Record: ${id} with Payload:`, payload);

    const attendanceRef = doc(firestore, 'attendance', id);

    // Update langsung tanpa cek dokumen jika yakin dokumen ada
    await updateDoc(attendanceRef, {
      ...payload,
      updated_at: Timestamp.now(),
    });

    console.log(`✅ Attendance Record ${id} updated successfully`);
    return NextResponse.json({ success: true, message: 'Attendance record updated successfully' }, { status: 200 });
  } catch (error: any) {
    console.error(`❌ Error updating attendance record ${req.nextUrl.pathname}:`, error);
    return NextResponse.json(
      { success: false, message: 'Failed to update attendance record', error: error.message },
      { status: 500 }
    );
  }
}

// ✅ **DELETE ATTENDANCE RECORD**
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.pathname.split('/').pop();
    if (!id) {
      return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 });
    }

    console.log(`🗑 Deleting Attendance Record ID: ${id}`);

    // Langsung delete tanpa perlu cek keberadaan dokumen (Firestore tidak error jika dokumen tidak ada)
    await deleteDoc(doc(firestore, 'attendance', id));

    console.log(`✅ Attendance Record ${id} deleted successfully`);
    return NextResponse.json({ success: true, message: 'Attendance record deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error(`❌ Error deleting attendance record ${req.nextUrl.pathname}:`, error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete attendance record', error: error.message },
      { status: 500 }
    );
  }
}