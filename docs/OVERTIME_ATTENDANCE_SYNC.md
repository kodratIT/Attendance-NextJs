# 🕰️ Overtime-Attendance Sync Feature

## 📋 Overview

Fitur ini secara otomatis mengupdate collection `attendance` ketika pengajuan lembur disetujui atau ditolak. Hal ini memastikan bahwa data kehadiran karyawan mencerminkan aktivitas lembur yang telah disetujui.

## 🔄 Workflow

### 1. **Approval Process**
Ketika pengajuan lembur disetujui melalui dashboard:
```
Overtime Request (submitted) → Approve → Update Overtime Status → Sync to Attendance
```

### 2. **Attendance Update**
Sistem akan mengupdate dokumen attendance di path:
```
attendance/{userId}/day/{date}
```

Dengan menambahkan field:
- `statusLembur: true`
- `lemburDetail: { ... }` (object dengan detail lembur)

### 3. **Rejection/Cancellation**
Jika lembur ditolak atau dibatalkan, sistem akan:
- Set `statusLembur: false` 
- Remove `lemburDetail` dari attendance record

## 📊 Data Structure

### Attendance Document dengan Overtime
```typescript
{
  // ... existing attendance fields
  statusLembur: true,
  lemburDetail: {
    overtimeId: string,        // ID dokumen overtime
    startAt: number,           // Timestamp mulai lembur
    endAt: number,             // Timestamp selesai lembur
    durationMinutes: number,   // Durasi dalam menit
    reason: string,            // Alasan lembur
    approvedAt: number,        // Timestamp approval
    approvedBy: string,        // ID approver
    approverName: string,      // Nama approver
    crossMidnight?: boolean    // Flag lintas hari
  }
}
```

## 🛠️ Implementation Files

### 1. **Type Definitions**
- `src/types/attendanceTypes.ts` - Updated dengan field overtime

### 2. **Sync Utilities**
- `src/utils/attendanceOvertimeSync.ts` - Helper functions untuk sync
  - `updateAttendanceWithOvertime()` - Update attendance saat approval
  - `removeOvertimeFromAttendance()` - Cleanup saat rejection

### 3. **API Integration**
- `src/app/api/overtime/[id]/route.ts` - PATCH endpoint dengan attendance sync

### 4. **Testing**
- `src/utils/testOvertimeAttendanceSync.ts` - Test utilities
- `src/app/api/test/overtime-attendance-sync/route.ts` - Test endpoint

## 🧪 Testing

### Manual Testing via API

1. **Test All Approved Overtime:**
```bash
curl http://localhost:3000/api/test/overtime-attendance-sync
```

2. **Test Specific User/Date:**
```bash
curl \"http://localhost:3000/api/test/overtime-attendance-sync?userId=USER_ID&date=2024-01-15\"
```

3. **Test via POST:**
```bash
curl -X POST http://localhost:3000/api/test/overtime-attendance-sync \\
  -H \"Content-Type: application/json\" \\
  -d '{\"userId\":\"USER_ID\",\"date\":\"2024-01-15\"}'
```

### Frontend Testing
1. Buka halaman Overtime Management
2. Approve salah satu pengajuan lembur
3. Cek apakah attendance record terupdate dengan benar

## 🔍 Monitoring & Debugging

### Console Logs
Sistem akan menampilkan log detail untuk:
- ✅ Successful attendance updates
- ⚠️ Sync failures (tidak akan menggagalkan approval)
- 📋 Detail data yang ditambahkan

### Error Handling
- Sync failure tidak akan menggagalkan approval overtime
- Error di-log untuk debugging
- Fallback mechanism untuk missing attendance records

## 🎯 Key Features

### 1. **Automatic Sync**
- Setiap approval otomatis trigger attendance update
- Rejection/cancellation otomatis cleanup attendance

### 2. **Robust Error Handling**
- Sync failure tidak mempengaruhi approval process
- Detailed logging untuk debugging
- Graceful fallback untuk edge cases

### 3. **Data Consistency**
- Attendance record selalu mencerminkan status overtime terkini
- Cross-reference antara overtime dan attendance
- Audit trail lengkap dengan approver info

### 4. **Flexible Document Creation**
- Jika attendance record belum ada, akan dibuat otomatis
- Jika sudah ada, akan diupdate saja
- Preserve existing attendance data

## 📝 Collection Paths

### Overtime Collection
```
overtime/{overtimeId}
```

### Attendance Collection  
```
attendance/{userId}/day/{date}
```

## 🚀 Benefits

1. **Data Integrity**: Attendance record selalu sinkron dengan overtime yang disetujui
2. **Reporting Accuracy**: Report attendance akan include data lembur
3. **Audit Trail**: Track siapa yang approve dan kapan
4. **Mobile Compatibility**: Struktur data kompatibel dengan mobile app
5. **Dashboard Integration**: Data bisa digunakan untuk analytics dan dashboard

## 🔧 Configuration

Tidak ada konfigurasi khusus yang diperlukan. Fitur ini akan aktif otomatis ketika:
- Firebase Firestore tersedia
- Collection `overtime` dan `attendance` accessible
- Helper functions di-import dengan benar

## ⚡ Performance Notes

- Sync operation adalah **non-blocking** - approval akan tetap berhasil walaupun sync gagal
- Minimal additional latency karena operasi dilakukan setelah update overtime
- Efficient document operations (update existing atau create new)
- Bounded error handling untuk mencegah infinite loops

## 🔮 Future Enhancements

1. **Bulk Sync**: Ability untuk sync multiple overtime approvals sekaligus
2. **Sync Verification**: Background job untuk verify data consistency
3. **Rollback Mechanism**: Advanced rollback untuk complex scenarios
4. **Notification**: Alert ketika sync gagal perlu manual intervention
5. **Analytics Integration**: Connect dengan reporting dan dashboard analytics
