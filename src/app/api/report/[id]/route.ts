import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '@/libs/firebase/firebase';
import { collection, getDocs, getDoc,addDoc,setDoc, deleteDoc, doc, updateDoc, Timestamp,DocumentReference } from 'firebase/firestore';
import { timeSpentToDate } from '@/utils/dateUtils';
import { createCORSHeaders } from '@/utils/cors';
import { AreaType } from '@/types/areaTypes';
import { ShiftType } from '@/types/shiftTypes';
import { UserRowType } from '@/types/userTypes';
import dayjs from 'dayjs';
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

// export async function GET() {
//   try {
//     const today = "2025-01-22"; // Bisa diganti dengan new Date().toISOString().split('T')[0]
//     const userCollection = collection(firestore, 'users');

//     console.log("✅ Fetching users...");

//     // 1️⃣ Ambil semua userId dari koleksi "users"
//     const usersSnapshot = await getDocs(userCollection);
//     const userIds = usersSnapshot.docs.map(doc => doc.id);

//     console.log(`🔍 Found ${userIds.length} users.`);

//     if (userIds.length === 0) {
//       return new Response(JSON.stringify([]), {
//         status: 200,
//         headers: createCORSHeaders(),
//       });
//     }

//     // 2️⃣ Ambil semua dokumen attendance/{userId}/day/{today} secara paralel
//     console.log(`📡 Fetching attendance records for ${today}...`);
//     const attendancePromises = userIds.map(userId => 
//       getDoc(doc(firestore, `attendance/${userId}/day/${today}`))
//     );

//     const attendanceSnapshots = await Promise.all(attendancePromises);

//     // 3️⃣ Filter hanya data yang memiliki attendance
//     const validUsers = userIds.filter((userId, index) => attendanceSnapshots[index]?.exists());

//     console.log(`✅ Found ${validUsers.length} valid attendance records.`);

//     if (validUsers.length === 0) {
//       return new Response(JSON.stringify([]), {
//         status: 200,
//         headers: createCORSHeaders(),
//       });
//     }

//     // 4️⃣ Ambil semua dokumen user secara paralel
//     console.log("📡 Fetching user details...");
//     const userPromises = validUsers.map(userId => getDoc(doc(firestore, `users/${userId}`)));
//     const userSnapshots = await Promise.all(userPromises);

//     const attendanceData: AttendanceRowType[] = (await Promise.all(
//       validUsers.map(async (userId, index) => {
//         const dayDocSnap = attendanceSnapshots[userIds.indexOf(userId)];
    
//         if (!dayDocSnap || !dayDocSnap.exists()) {
//           console.warn(`⚠️ No attendance found for user ${userId}`);
//           return null; // Kembalikan null jika tidak ada data
//         }
    
//         const userDocSnap = userSnapshots[index];
    
//         const userData = userDocSnap.exists() ? userDocSnap.data() : null;
    
//         console.log(`👤 Processing user: ${userId}`);
//         console.log("📄 User Data:", userData);
    
//         const userName = userData ? userData.name : 'Unknown';
//         const avatar = userData?.avatar || 'https://randomuser.me/api/portraits/men/1.jpg';
//         const { shifts, areas, ...rest } = userData || {};
    
//         let shiftName = 'Unknown';
//         if (Array.isArray(shifts) && shifts.every(shift => shift instanceof DocumentReference)) {
//           const shiftDocs = await Promise.all(shifts.map(shift => getDoc(shift)));
//           const shiftNames = shiftDocs
//             .filter(shiftSnap => shiftSnap.exists())
//             .map(shiftSnap => shiftSnap.data()?.name ?? 'Unknown');
//           shiftName = shiftNames.length ? shiftNames.join(', ') : 'Unknown';
//         }
    
//         let areaName = 'Unknown';
//         if (Array.isArray(areas) && areas.every(area => area instanceof DocumentReference)) {
//           const areaDocs = await Promise.all(areas.map(area => getDoc(area)));
//           const areaNames = areaDocs
//             .filter(areaSnap => areaSnap.exists())
//             .map(areaSnap => areaSnap.data()?.name ?? 'Unknown');
//           areaName = areaNames.length ? areaNames.join(', ') : 'Unknown';
//         }
    
//         const attendanceRaw = dayDocSnap.data();
//         console.log(`✅ Attendance Data for ${userId}:`, attendanceRaw);
    
//         return {
//           attendanceId: dayDocSnap.id,
//           userId,
//           name: userName,
//           date: today,
//           areas: areaName,
//           shifts: shiftName,
//           avatar: avatar,
//           checkIn: attendanceRaw?.checkIn || {
//             time: '00:00 AM',
//             faceVerified: false,
//             location: { latitude: 0, longitude: 0, name: 'Unknown' }
//           },
//           checkOut: attendanceRaw?.checkOut || {
//             time: '00:00 PM',
//             faceVerified: false,
//             location: { latitude: 0, longitude: 0, name: 'Unknown' }
//           },
//           createdAt: timeSpentToDate(attendanceRaw?.createdAt) ?? '',
//           updatedAt: timeSpentToDate(attendanceRaw?.updatedAt) ?? '',
//           earlyLeaveBy: attendanceRaw?.earlyLeaveBy ?? 0,
//           lateBy: attendanceRaw?.lateBy ?? 0,
//           status: attendanceRaw?.status ?? 'Unknown',
//           workingHours: attendanceRaw?.workingHours ?? 0
//         } as AttendanceRowType; // 🔥 Type Assertion untuk memastikan TypeScript benar-benar memahami ini
//       })
//     ))
//       .filter((item): item is AttendanceRowType => item !== null); // 🔥 Type Predicate untuk memastikan hasil bukan `null`
    
//     console.log("✅ Data fetch completed!");

//     return new Response(JSON.stringify(attendanceData.filter(item => item !== null)), { // Filter null values
//       status: 200,
//       headers: createCORSHeaders(),
//     });

//   } catch (error: any) {
//     console.error('❌ Error fetching attendance records:', error);
//     return new Response(
//       JSON.stringify({ success: false, message: 'Failed to fetch attendance records', error: error.message }),
//       {
//         status: 500,
//         headers: createCORSHeaders(),
//       }
//     );
//   }
// }

// ✅ **UPDATE ATTENDANCE RECORD**
export async function PUT(req: NextRequest) {
  try {
    // Parse JSON body dari request
    const payload: Partial<AttendanceRowType> = await req.json();

    console.log(payload)
    // // Validasi input
    // if (!payload.date && !payload.checkInTime && !payload.checkOutTime && !payload.workingHours && !payload.status) {
    //   return NextResponse.json({ success: false, message: 'At least one field is required for update' }, { status: 400 });
    // }

    // console.log(`🔄 Updating Attendance Record: ${id} with Payload:`, payload);

    // const attendanceRef = doc(firestore, 'attendance', id);

    // // Update langsung tanpa cek dokumen jika yakin dokumen ada
    // await updateDoc(attendanceRef, {
    //   ...payload,
    //   updated_at: Timestamp.now(),
    // });

    // console.log(`✅ Attendance Record ${id} updated successfully`);
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