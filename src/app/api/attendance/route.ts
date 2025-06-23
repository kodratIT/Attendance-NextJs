import { NextRequest, NextResponse } from 'next/server';
import { firestore,database } from '@/libs/firebase/firebase';
import { collection, getDocs, getDoc,addDoc,setDoc, deleteDoc, doc, updateDoc, Timestamp,DocumentReference } from 'firebase/firestore';
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

// ✅ **CREATE NEW ATTENDANCE RECORD**

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const fromDateParam = url.searchParams.get("fromDate"); // Format: YYYY-MM-DD
    const toDateParam = url.searchParams.get("toDate"); // Format: YYYY-MM-DD
    const rangeParam = url.searchParams.get("range"); // Bisa "7d" atau "1m"

    const today = new Date();
    let fromDate: Date;
    let toDate: Date = toDateParam ? new Date(toDateParam) : today;

    // 🔹 Tentukan rentang tanggal berdasarkan parameter yang diberikan
    if (fromDateParam) {
      fromDate = new Date(fromDateParam);
    } else if (rangeParam === "7d") {
      fromDate = new Date(today);
      fromDate.setDate(today.getDate() - 6);
    } else if (rangeParam === "1m") {
      fromDate = new Date(today);
      fromDate.setMonth(today.getMonth() - 1);
    } else {
      // Default: Ambil data **hari ini saja**
      fromDate = new Date(today);
    }

    console.log(`✅ Fetching attendance records from ${fromDate.toISOString().split('T')[0]} to ${toDate.toISOString().split('T')[0]}`);

    const userCollection = collection(firestore, 'users');

    // 1️⃣ Ambil semua userId dari koleksi "users"
    const usersSnapshot = await getDocs(userCollection);
    const userIds = usersSnapshot.docs.map(doc => doc.id);

    console.log(`🔍 Found ${userIds.length} users.`);

    if (userIds.length === 0) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: createCORSHeaders(),
      });
    }

    // 🔹 Loop untuk mendapatkan daftar tanggal dalam rentang
    const dateRange: string[] = [];
    for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
      dateRange.push(d.toISOString().split('T')[0]); // Format: YYYY-MM-DD
    }
// 
    // console.log(`📅 Date Range:`, dateRange);


    // 2️⃣ Ambil semua dokumen attendance/{userId}/day/{date} untuk setiap tanggal dalam rentang
    const attendancePromises = userIds.flatMap(userId =>
      dateRange.map(date => getDoc(doc(firestore, `attendance/${userId}/day/${date}`)))
    );

    const attendanceSnapshots = await Promise.all(attendancePromises);

    // 3️⃣ Filter hanya data yang memiliki attendance
    const validRecords = attendanceSnapshots
      .map((snap, index) => (snap.exists() ? { userId: userIds[Math.floor(index / dateRange.length)], date: dateRange[index % dateRange.length], snap } : null))
      .filter(record => record !== null) as { userId: string; date: string; snap: any }[];
// 
    // console.log(`✅ Found ${validRecords.length} valid attendance records.`);

    if (validRecords.length === 0) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: createCORSHeaders(),
      });
    }

    // 4️⃣ Ambil semua dokumen user secara paralel
    console.log("📡 Fetching user details...");
    const userPromises = validRecords.map(record => getDoc(doc(firestore, `users/${record.userId}`)));
    const userSnapshots = await Promise.all(userPromises);

    // 5️⃣ Proses data attendance + users menjadi `AttendanceRowType[]`
    const attendanceData: AttendanceRowType[] = await Promise.all(
      validRecords.map(async (record, index) => {
        const { userId, date, snap: dayDocSnap } = record;
        const userDocSnap = userSnapshots[index];

        if (!dayDocSnap.exists() || !userDocSnap.exists()) {
          console.warn(`⚠️ Missing data for user ${userId} on ${date}`);
          return null;
        }

        const userData = userDocSnap.data();

        // console.log(`👤 Processing user: ${userId} for date ${date}`);
        // console.log("📄 User Data:", userData);

        const userName = userData?.name ?? 'Unknown';
        const avatar = userData?.avatar || 'https://randomuser.me/api/portraits/men/1.jpg';
        // const {  ...rest } = userData ?? {};

        // let shiftName: string = 'Unknown'; // Harus string, bukan string array
        // if (Array.isArray(shifts) && shifts.every(shift => shift instanceof DocumentReference)) {
        //   try {
        //     const shiftDocs = await Promise.all(shifts.map(shift => getDoc(shift)));

        //     shiftDocs.forEach((shiftSnap, index) => {
        //       console.log(`Shift ${index} snapshot:`, shiftSnap.data());
        //     });

        //     const shiftNames = shiftDocs
        //       .filter(shiftSnap => shiftSnap.exists()) // Pastikan dokumen ada
        //       .map(shiftSnap => {
        //         const data = shiftSnap.data();
        //         console.log("Shift data:", data); // Debugging log
        //         return data && typeof data === 'object' && 'name' in data ? data.name : 'Unknown';
        //       });

        //     // Gabungkan hasil menjadi string
        //     shiftName = shiftNames.length ? shiftNames.join(', ') : 'Unknown';

        //     console.log("Final shift names:", shiftName);
        //   } catch (error) {
        //     console.error("Error fetching shifts:", error);
        //   }
        // }


      let areaName = 'Unknown'
      let areaId = dayDocSnap.data().areaId
        if (areaId) {
          const areaDocRef = doc(firestore, 'areas', areaId)
          const areaSnap = await getDoc(areaDocRef)

          // if (areaSnap.exists()) {
          //   const data = areaSnap.data()
          //   areaName = data.name ?? 'Unknown'
          // }
          if (dayDocSnap.exists()) {
            const data = dayDocSnap.data();
            let locationName = data?.checkIn?.location?.name;

            switch (locationName?.toLowerCase()) {
              case 'buluran':
                areaName = 'Praktek Buluran';
                break;
              case 'eka jaya':
                areaName = 'Klinik Dokter Yanti Ekajaya';
                break;
              case 'patimura':
                areaName = 'Praktek Patimura';
                break;
              case 'olak kemang':
                areaName = 'Praktek Olak Kemang';
                break;
              default:
                areaName = locationName; // fallback ke nama asli jika tidak cocok
            }
          }
        }


        const attendanceRaw = dayDocSnap.data();

        return {
          attendanceId: dayDocSnap.id,
          userId,
          name: userName,
          date: date,
          areas: areaName,
          areaId: areaId, 
          shifts: attendanceRaw.shiftName,
          avatar: avatar,
          checkIn: attendanceRaw?.checkIn || {
            time: '-',
            faceVerified: false,
            location: { latitude: 0, longitude: 0, name: 'Unknown' }
          },
          checkOut: attendanceRaw?.checkOut || {
            time: '-',
            faceVerified: false,
            location: { latitude: 0, longitude: 0, name: 'Unknown' }
          },
          createdAt: timeSpentToDate(attendanceRaw?.createdAt) ?? '',
          updatedAt: timeSpentToDate(attendanceRaw?.updatedAt) ?? '',
          earlyLeaveBy: attendanceRaw?.earlyLeaveBy ?? 0,
          lateBy: attendanceRaw?.lateBy ?? 0,
          status: attendanceRaw?.status ?? 'Unknown',
          workingHours: attendanceRaw?.workingHours ?? 0
        } as AttendanceRowType;
      })
    ).then(records => records.filter((item): item is AttendanceRowType => item !== null));
    console.log(`✅ Attendance Data for` , attendanceData);

    // / 🔥 **Kirim event WebSocket setelah semua relasi selesai**
    // if (io) {
    //   io.emit("attendanceUpdate", { message: "New data available" });
    //   console.log("📢 WebSocket event sent: attendanceUpdate");
    // }
     // 🔥 Update trigger di Realtime Database
    //  set(ref(database, "triggers/attendanceUpdate"), true);

    console.log("✅ Data fetch completed!");

    return new Response(JSON.stringify(attendanceData), {
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

function formatTime(date: Date): string {
  // Format waktu menjadi HH:mm:ss
  return date.toTimeString().split(' ')[0];
}

function convertTimeDotToColon(time: string): string {
  // Ubah format waktu '07.54.00' menjadi '07:54:00'
  const parts = time.split('.');
  if (parts.length !== 3) return time; // fallback kalau format tidak sesuai
  return parts.join(':');
}

// export async function POST(req: NextRequest) {
//   try {
//     const { userId, keterangan } = await req.json();

//     if (!userId || typeof userId !== 'string') {
//       return NextResponse.json({ success: false, message: 'Invalid userId' }, { status: 400 });
//     }

//     console.log(`📝 Recording attendance for user: ${userId}`);

//     // 🔍 Ambil data user
//     const userRef = doc(firestore, 'users', userId);
//     const userSnap = await getDoc(userRef);
//     if (!userSnap.exists()) {
//       return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
//     }
//     const userData = userSnap.data();

//     // 🧭 Ambil area
//     if (!Array.isArray(userData.areas) || userData.areas.length === 0) {
//       return NextResponse.json({ success: false, message: 'Area data is missing or invalid' }, { status: 400 });
//     }
//     const areaSnaps = await Promise.all(userData.areas.map((areaRef: any) => getDoc(areaRef)));
//     const validArea = areaSnaps.filter(areaSnap => areaSnap.exists()).map(areaSnap => areaSnap.data() as AreaType);
//     if (validArea.length === 0) {
//       return NextResponse.json({ success: false, message: 'No valid area found' }, { status: 404 });
//     }
//     const selectedArea = validArea[0];

//     // 🕓 Ambil shift
//     if (!Array.isArray(userData.shifts) || userData.shifts.length === 0) {
//       return NextResponse.json({ success: false, message: 'Shift data is missing or invalid' }, { status: 400 });
//     }
//     const shiftSnaps = await Promise.all(userData.shifts.map((shiftRef: any) => getDoc(shiftRef)));
//     const validShifts = shiftSnaps.filter(shiftSnap => shiftSnap.exists()).map(shiftSnap => shiftSnap.data() as ShiftType);
//     if (validShifts.length === 0) {
//       return NextResponse.json({ success: false, message: 'No valid shifts found' }, { status: 404 });
//     }

//     // 🕰 Waktu sekarang (GMT+7)
//     const now = new Date();
//     const localOffset = now.getTimezoneOffset() * 60000;
//     const gmt7Offset = 7 * 60 * 60 * 1000;
//     const nowInGMT7 = new Date(now.getTime() + localOffset + gmt7Offset);
//     const today = nowInGMT7.toISOString().split('T')[0];

//     // 🔍 Temukan shift aktif berdasarkan waktu sekarang
//     const selectedShift = validShifts.find(shift => {
//       const formattedEndTime = convertTimeDotToColon(shift.end_time);
//       const shiftEndTimeStr = `${today}T${formattedEndTime}+07:00`;
//       const shiftEndTime = new Date(shiftEndTimeStr);

//       if (shift.end_time < shift.start_time) {
//         shiftEndTime.setDate(shiftEndTime.getDate() + 1);
//       }

//       return nowInGMT7 < shiftEndTime;
//     }) || validShifts[0];

//     // ⏱ Hitung keterlambatan
//     const formattedStartTime = convertTimeDotToColon(selectedShift.start_time);
//     const shiftStartTimeStr = `${today}T${formattedStartTime}+07:00`;
//     const shiftStartTime = new Date(shiftStartTimeStr);
//     const lateBy = Math.max(0, (nowInGMT7.getTime() - shiftStartTime.getTime()) / 1000);
//     const status = lateBy > 0 ? 'Late' : 'On Time';

//     // 📅 Tanggal & waktu
//     const timestamp = Timestamp.now();
//     const dateGMT7 = timestamp.toDate();
//     const localDate = new Date(dateGMT7.getTime() + gmt7Offset);
//     const date = today;

//     // 🔥 Simpan data ke Firestore
//     const attendanceRef = doc(collection(firestore, `attendance/${userId}/day`), date);
//     const attendanceData = {
//       attendanceId: date,
//       userId,
//       name: userData.name,
//       date,
//       areas: selectedArea.name,
//       shifts: selectedShift.name,
//       avatar: userData.avatar || '',
//       checkIn: {
//         time: formatTime(nowInGMT7),
//         faceVerified: false,
//         location: { latitude: 0, longitude: 0, name: 'Unknown' }
//       },
//       checkOut: {
//         time: '-',
//         faceVerified: false,
//         location: { latitude: 0, longitude: 0, name: 'Unknown' }
//       },
//       createdAt: localDate,
//       updatedAt: localDate,
//       earlyLeaveBy: 0,
//       lateBy,
//       status,
//       workingHours: 0,
//       keterangan
//     };

//     await setDoc(attendanceRef, attendanceData);
//     console.log(`✅ Attendance recorded successfully for user ${userId}`);

//     return NextResponse.json({ success: true, message: 'Attendance recorded successfully', data: attendanceData }, { status: 201 });

//   } catch (error: any) {
//     console.error('❌ Error recording attendance:', error);
//     return NextResponse.json({ success: false, message: 'Failed to record attendance', error: error.message }, { status: 500 });
//   }
// }

function getShiftInfo(date: Date): { name: string; startTime: Date } | null {
  const hour = date.getHours();
  const minute = date.getMinutes();
  const shiftBase = new Date(date); // Clone untuk shift start time

  if ((hour === 7) || (hour === 8)) {
    shiftBase.setHours(8, 0, 0, 0);
    return { name: 'Pagi', startTime: shiftBase };
  } else if ((hour === 13) || (hour === 14 && minute < 50)) {
    shiftBase.setHours(14, 0, 0, 0);
    return { name: 'Siang', startTime: shiftBase };
  } else if ((hour === 15) || (hour === 16) || (hour === 17)) {
    shiftBase.setHours(15, 45, 0, 0);
    return { name: 'Malam', startTime: shiftBase };
  } else {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, keterangan } = await req.json();

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ success: false, message: 'Invalid userId' }, { status: 400 });
    }

    console.log(`📝 Recording attendance for user: ${userId}`);

    // 🔍 Ambil data user
    const userRef = doc(firestore, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }
    const userData = userSnap.data();

    // 🧭 Ambil area
    if (!Array.isArray(userData.areas) || userData.areas.length === 0) {
      return NextResponse.json({ success: false, message: 'Area data is missing or invalid' }, { status: 400 });
    }

    const areaSnaps = await Promise.all(userData.areas.map((areaRef: any) => getDoc(areaRef)));
    const validArea = areaSnaps.filter(areaSnap => areaSnap.exists()).map(areaSnap => areaSnap.data() as AreaType);
    if (validArea.length === 0) {
      return NextResponse.json({ success: false, message: 'No valid area found' }, { status: 404 });
    }
    const selectedArea = validArea[0];

    // 🕰 Waktu sekarang (GMT+7)
    const now = new Date();
    const localOffset = now.getTimezoneOffset() * 60000;
    const gmt7Offset = 7 * 60 * 60 * 1000;
    const nowInGMT7 = new Date(now.getTime() + localOffset + gmt7Offset);
    const today = nowInGMT7.toISOString().split('T')[0];

    // 🕐 Tentukan shift berdasarkan waktu absen
    const shiftInfo = getShiftInfo(nowInGMT7);
    if (!shiftInfo) {
      return NextResponse.json({
        success: false,
        message: 'Kamu hanya bisa absen di jam shift yang ditentukan (07:00–08:59, 13:00–14:49, 15:00–17:00)'
      }, { status: 403 });
    }

    const { name: selectedShiftName, startTime: shiftStartTime } = shiftInfo;

    // ⏱ Hitung keterlambatan
    const lateBy = Math.max(0, (nowInGMT7.getTime() - shiftStartTime.getTime()) / 1000); // detik
    const status = lateBy > 0 ? 'Late' : 'Present';

    // 📅 Tanggal & waktu
    const timestamp = Timestamp.now();
    const dateGMT7 = timestamp.toDate();
    const localDate = new Date(dateGMT7.getTime() + gmt7Offset);
    const date = today;

    // 🔥 Simpan data ke Firestore
    const attendanceRef = doc(collection(firestore, `attendance/${userId}/day`), date);
    const attendanceData = {
      attendanceId: date,
      userId,
      name: userData.name,
      date,
      areas: selectedArea.name,
      shifts: selectedShiftName,
      avatar: userData.avatar || '',
      checkIn: {
        time: formatTime(nowInGMT7),
        faceVerified: false,
        location: { latitude: 0, longitude: 0, name: 'Unknown' }
      },
      checkOut: {
        time: '-',
        faceVerified: false,
        location: { latitude: 0, longitude: 0, name: 'Unknown' }
      },
      createdAt: localDate,
      updatedAt: localDate,
      earlyLeaveBy: 0,
      lateBy,
      status,
      workingHours: 0,
      keterangan
    };

    await setDoc(attendanceRef, attendanceData);
    console.log(`✅ Attendance recorded successfully for user ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Attendance recorded successfully',
      data: attendanceData
    }, { status: 201 });

  } catch (error: any) {
    console.error('❌ Error recording attendance:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to record attendance',
      error: error.message
    }, { status: 500 });
  }
}


export async function PUT(req: NextRequest) {
  try {
    const { data } = await req.json();
    console.log(`🔄 Updating attendance for user: ${JSON.stringify(data)}`);

    const userId = data.userId;
    const date = data.attendanceId;

    if (!userId || !date) {
      return NextResponse.json({ success: false, message: 'Missing userId or attendanceId' }, { status: 400 });
    }

    // 🔍 Ambil data kehadiran
    const attendanceRef = doc(collection(firestore, `attendance/${userId}/day`), date);
    const attendanceSnap = await getDoc(attendanceRef);
    if (!attendanceSnap.exists()) {
      return NextResponse.json({ success: false, message: 'Attendance record not found' }, { status: 404 });
    }
    const attendanceData = attendanceSnap.data();

    // 🔍 Ambil data user
    const userRef = doc(firestore, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // 🕒 Waktu sekarang dalam GMT+7
    const now = new Date();
    const localOffset = now.getTimezoneOffset() * 60000;
    const gmt7Offset = 7 * 60 * 60 * 1000;
    const nowInGMT7 = new Date(now.getTime() + localOffset + gmt7Offset);
    const today = nowInGMT7.toISOString().split('T')[0];

    // 🔍 Tentukan jam pulang berdasarkan shift (dari data absensi saat check-in)
    const shiftName = attendanceData.shifts;
    const shiftEndTime = new Date(nowInGMT7);

    if (shiftName === 'Pagi') {
      shiftEndTime.setHours(14, 0, 0, 0); // 14:00
    } else if (shiftName === 'Siang' || shiftName === 'Malam') {
      shiftEndTime.setHours(21, 0, 0, 0); // 21:00
    } else {
      // fallback default
      shiftEndTime.setHours(17, 0, 0, 0);
    }

    // Hitung earlyLeaveBy (detik)
    const earlyLeaveBy = Math.max(0, (shiftEndTime.getTime() - nowInGMT7.getTime()) / 1000);

    // Hitung working hours
    const fullCheckInStr = `${date}T${attendanceData.checkIn.time}+07:00`;
    const fullCheckOutStr = `${date}T${formatTime(nowInGMT7)}+07:00`;

    let checkInDate = new Date(fullCheckInStr);
    let checkOutDate = new Date(fullCheckOutStr);

    // Antisipasi check-out lewat tengah malam
    if (checkOutDate < checkInDate) {
      checkOutDate.setDate(checkOutDate.getDate() + 1);
    }

    const workingSeconds = Math.max(0, (checkOutDate.getTime() - checkInDate.getTime()) / 1000);

    const timestamp = Timestamp.now();
    const dateGMT7 = timestamp.toDate();
    const localDate = new Date(dateGMT7.getTime() + gmt7Offset);

    // 🔄 Update data kehadiran
    const updatedAttendanceData = {
      ...attendanceData,
      checkOut: {
        time: formatTime(nowInGMT7),
        faceVerified: false,
        location: { latitude: 0, longitude: 0, name: 'Unknown' }
      },
      earlyLeaveBy,
      workingHours: workingSeconds,
      verifyOwner: true,
      updatedAt: localDate
    };

    await setDoc(attendanceRef, updatedAttendanceData);
    console.log(`✅ Attendance updated successfully for user ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Attendance updated successfully',
      data: updatedAttendanceData
    }, { status: 200 });

  } catch (error: any) {
    console.error('❌ Error updating attendance:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update attendance',
      error: error.message
    }, { status: 500 });
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