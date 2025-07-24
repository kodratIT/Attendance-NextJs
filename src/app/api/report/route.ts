import { NextRequest, NextResponse } from 'next/server';
import { firestore, database } from '@/libs/firebase/firebase';
import { collection, getDocs, getDoc, addDoc, setDoc, deleteDoc, doc, updateDoc, Timestamp, DocumentReference } from 'firebase/firestore';
import { timeSpentToDate } from '@/utils/dateUtils';
import { createCORSHeaders } from '@/utils/cors';
import { AreaType } from '@/types/areaTypes';
import { ShiftType } from '@/types/shiftTypes';
import { UserRowType } from '@/types/userTypes';
import { ref, set } from "firebase/database";

import dayjs from 'dayjs';

// import { Server } from "socket.io";

// // **Pastikan WebSocket Server Hanya Dibuat Sekali**
// let io: Server | null = null;

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

// Import tipe data
import type { AttendanceRowType } from '@/types/attendanceTypes';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const fromDateParam = url.searchParams.get("fromDate");
    const toDateParam = url.searchParams.get("toDate");
    const rangeParam = url.searchParams.get("range");

    const today = new Date();
    let fromDate: Date;
    let toDate: Date = toDateParam ? new Date(toDateParam) : today;

    today.setHours(today.getHours() + 7); // UTC+7

    // Pakai salinan hari untuk logika bulan
    const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    if (fromDateParam) {
      fromDate = new Date(fromDateParam);
    } else if (rangeParam === "7d") {
      fromDate = new Date(todayLocal);
      fromDate.setDate(todayLocal.getDate() - 6);
    } else if (rangeParam === "14d") {
      fromDate = new Date(todayLocal);
      fromDate.setDate(todayLocal.getDate() - 13);
    } else if (rangeParam === "1m") {
      fromDate = new Date(todayLocal);
      fromDate.setMonth(todayLocal.getMonth() - 1);
    } else if (rangeParam === "last1m") {
      fromDate = new Date(todayLocal.getFullYear(), todayLocal.getMonth() - 1, 1); // Awal bulan lalu
      toDate = new Date(todayLocal.getFullYear(), todayLocal.getMonth(), 0);       // Akhir bulan lalu
    } else {
      fromDate = new Date(todayLocal);
    }

    const userCollection = collection(firestore, 'users');
    const usersSnapshot = await getDocs(userCollection);

    const userMap: Record<string, any> = {};

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      let roleName = "Unknown";
      let areaName = "Unknown";

      // Ambil nama role jika role adalah DocumentReference
      if (userData.role instanceof DocumentReference) {
        const roleSnap = await getDoc(userData.role);
        if (roleSnap.exists()) {
          roleName = roleSnap.data().name || "Unknown";
        }
      }

      // Ambil nama area dari array of DocumentReference: areas[0]
      if (Array.isArray(userData.areas) && userData.areas[0] instanceof DocumentReference) {
        const areaSnap = await getDoc(userData.areas[0]);
        if (areaSnap.exists()) {
          areaName = areaSnap.data().name || "Unknown";
        }
      }

      userMap[userDoc.id] = {
        name: userData.name || "Unknown",
        avatar: userData.avatar || "https://randomuser.me/api/portraits/men/1.jpg",
        role: roleName,
        area: areaName,
        daily_rate: userData.daily_rate,
      };
    }

    if (Object.keys(userMap).length === 0) {
      return new Response(JSON.stringify({}), { status: 200, headers: createCORSHeaders() });
    }

    const dateRange: string[] = [];
    for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
      dateRange.push(d.toISOString().split('T')[0]);
    }

    const attendancePromises = Object.keys(userMap).flatMap(userId =>
      dateRange.map(date => getDoc(doc(firestore, `attendance/${userId}/day/${date}`)))
    );

    const attendanceSnapshots = await Promise.all(attendancePromises);
    const attendanceData: Record<string, any[]> = {};

    for (let i = 0; i < attendanceSnapshots.length; i++) {
      const snap = attendanceSnapshots[i];
      if (!snap.exists()) continue;

      const userId = Object.keys(userMap)[Math.floor(i / dateRange.length)];
      const date = dateRange[i % dateRange.length];
      const data = snap.data();

      if (!attendanceData[userId]) {
        attendanceData[userId] = [];
      }

      const shiftName = data.shiftName || "";
      const originalGap = data.arivalGap ?? 0;

      // Kurangi 30 menit (1800 detik) jika shift adalah "Shift Siang"
      const adjustedGap =
        shiftName === "Shift Siang"
          ? Math.max(originalGap - 1800, 0)
          : originalGap;

    
      attendanceData[userId].push({
        attendanceId: `${date}`,
        userId: userId,
        name: userMap[userId].name,
        role: userMap[userId].role,
        date: date,
        areas: userMap[userId].area,
        shifts: shiftName,
        avatar: userMap[userId].avatar,
        checkIn: data.checkIn ?? { time: '-', faceVerified: false, location: {} },
        checkOut: data.checkOut ?? { time: '-', faceVerified: false, location: {} },
        createdAt: date,
        updatedAt: date,
        daily_rate: userMap[userId].daily_rate,
        earlyLeaveBy: data.earlyLeaveBy ?? 0,
        lateBy: adjustedGap,
        status: data.status ?? "Unknown",
        workingHours: data.workingHours ?? 0
      });
    }

    // console.log(attendanceData)  
    return new Response(JSON.stringify(attendanceData), { status: 200, headers: createCORSHeaders() });
  } catch (error: any) {
    console.error('❌ Error fetching attendance records:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Failed to fetch attendance records', error: error.message }),
      { status: 500, headers: createCORSHeaders() }
    );
  }
}


export async function POST(req: NextRequest) {
  try {
    // const { userId, requestedBy, keterangan } = await req.json();
    const { userId, keterangan } = await req.json();
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ success: false, message: 'Invalid userId' }, { status: 400 });
    }

    console.log(`📝 Recording attendance for user: ${userId}`);

    // Ambil data user dari Firestore
    const userRef = doc(firestore, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }
    const userData = userSnap.data();

    // Ambil data shift dari referensi user
    if (!Array.isArray(userData.shifts) || userData.shifts.length === 0) {
      return NextResponse.json({ success: false, message: 'Shift data is missing or invalid' }, { status: 400 });
    }

    // Ambil semua shift data dari Firestore
    const shiftSnaps = await Promise.all(userData.shifts.map(shiftRef => getDoc(shiftRef)));
    const validShifts = shiftSnaps.filter(shiftSnap => shiftSnap.exists()).map(shiftSnap => shiftSnap.data() as ShiftType);

    if (validShifts.length === 0) {
      return NextResponse.json({ success: false, message: 'No valid shifts found' }, { status: 404 });
    }

    console.log("✅ Retrieved Shifts:", validShifts);

    // Pilih shift yang paling sesuai berdasarkan waktu
    const date = dayjs().format('YYYY-MM-DD');
    const now = dayjs();
    const selectedShift = validShifts.find(shift => now.isBefore(dayjs(`${date} ${shift.end_time}`))) || validShifts[0];

    // Hitung keterlambatan
    const shiftStartTime = dayjs(`${date} ${selectedShift.start_time}`);
    const lateBy = Math.max(0, now.diff(shiftStartTime, 'second'));
    const status = lateBy > 0 ? 'Late' : 'On Time';

    // Simpan data ke Firestore
    const attendanceRef = doc(collection(firestore, `attendance/${userId}/day`), date);
    const attendanceData = {
      attendanceId: date,
      userId,
      name: userData.name,
      date,
      // areas: userData.area,
      shifts: validShifts.map(shift => shift.name), // Simpan semua shift
      avatar: userData.avatar || '',
      checkIn: {
        time: now.format('HH:mm A'),
        faceVerified: false,
        location: { latitude: 0, longitude: 0, name: 'Unknown' }
      },
      checkOut: {
        time: '-',
        faceVerified: false,
        location: { latitude: 0, longitude: 0, name: 'Unknown' }
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      earlyLeaveBy: 0,
      lateBy,
      status,
      workingHours: 0,
      // requestedBy,
      keterangan
    };

    await setDoc(attendanceRef, attendanceData);
    console.log(`✅ Attendance recorded successfully for user ${userId}`);

    return NextResponse.json({ success: true, message: 'Attendance recorded successfully', data: attendanceData }, { status: 201 });
  } catch (error: any) {
    console.error('❌ Error recording attendance:', error);
    return NextResponse.json({ success: false, message: 'Failed to record attendance', error: error.message }, { status: 500 });
  }
}


export async function PUT(req: NextRequest) {
  try {
    const { data } = await req.json();
    console.log(`🔄 Updating attendance for user: ${data}`);
    const userId = data.userId;


    // Ambil data kehadiran pengguna berdasarkan tanggal
    const date = data.attendanceId;
    const attendanceRef = doc(collection(firestore, `attendance/${userId}/day`), date);
    const attendanceSnap = await getDoc(attendanceRef);
    if (!attendanceSnap.exists()) {
      return NextResponse.json({ success: false, message: 'Attendance record not found' }, { status: 404 });
    }
    const attendanceData = attendanceSnap.data();

    // Ambil data shift pengguna dari Firestore
    const userRef = doc(firestore, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }
    const userData = userSnap.data();

    if (!Array.isArray(userData.shifts) || userData.shifts.length === 0) {
      return NextResponse.json({ success: false, message: 'Shift data is missing or invalid' }, { status: 400 });
    }

    // Ambil semua shift data dari Firestore
    const shiftSnaps = await Promise.all(userData.shifts.map(shiftRef => getDoc(shiftRef)));
    const validShifts = shiftSnaps.filter(shiftSnap => shiftSnap.exists()).map(shiftSnap => shiftSnap.data() as ShiftType);

    if (validShifts.length === 0) {
      return NextResponse.json({ success: false, message: 'No valid shifts found' }, { status: 404 });
    }

    // Pilih shift yang sesuai berdasarkan waktu
    const now = dayjs();
    const selectedShift = validShifts.find(shift => now.isBefore(dayjs(`${date} ${shift.end_time}`))) || validShifts[0];

    const shiftEndTime = dayjs(`${date} ${selectedShift.end_time}`);
    const earlyLeaveBy = Math.max(0, shiftEndTime.diff(now, 'second'));

    // Update data checkout
    const updatedAttendanceData = {
      ...attendanceData,
      checkOut: {
        time: now.format('HH:mm A'),
        faceVerified: false,
        location: { latitude: 0, longitude: 0, name: 'Unknown' }
      },
      earlyLeaveBy,
      verifyOwner: false,
      updatedAt: Timestamp.now(),
    };

    await setDoc(attendanceRef, updatedAttendanceData);
    console.log(`✅ Attendance updated successfully for user ${userId}`);

    return NextResponse.json({ success: true, message: 'Attendance updated successfully', data: updatedAttendanceData }, { status: 200 });
  } catch (error: any) {
    console.error('❌ Error updating attendance:', error);
    return NextResponse.json({ success: false, message: 'Failed to update attendance', error: error.message }, { status: 500 });
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