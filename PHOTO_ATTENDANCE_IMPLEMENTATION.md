# Implementasi Foto Absensi

Dokumentasi ini menjelaskan implementasi fitur foto absensi dalam sistem attendance.

## 🚀 Fitur yang Telah Diimplementasikan

### 1. Type Definitions
- Menambahkan field `imageUrl?` pada `checkIn` dan `checkOut` di `AttendanceRowType`
- Field bersifat opsional untuk kompatibilitas dengan data existing

### 2. UI Components

#### Dashboard Attendance List
- **Indikator Foto**: Ikon kamera muncul jika ada foto check-in/check-out
- **Visual Feedback**: Warna berbeda untuk indikator check-in (hijau) dan check-out (merah)
- **Tooltip**: Informasi "Foto tersedia" saat hover

#### Employee Detail Modal
- **Display Foto**: Menampilkan foto check-in dan check-out dalam ukuran 200px
- **Border Styling**: Border hijau untuk check-in, merah untuk check-out
- **Fallback**: Tidak menampilkan section foto jika tidak ada

### 3. Sample Data Utility
- **Testing Photos**: URL dari Unsplash untuk testing
- **Random Assignment**: 70% chance untuk check-in, 60% untuk check-out
- **Firebase URL Generator**: Template untuk URL Firebase Storage
- **Validation**: Fungsi validasi URL foto

## 📁 File Structure

```
src/
├── types/
│   └── attendanceRowTypes.ts          # Updated dengan imageUrl fields
├── components/
│   └── modals/
│       └── EmployeeDetailModal.tsx    # Display foto dalam modal
├── app/(dashboard)/(private)/home/
│   └── page.tsx                       # Dashboard dengan indikator foto
└── utils/
    └── samplePhotoData.ts            # Utility untuk testing foto
```

## 🔧 Implementasi Backend (Rencana)

### Firebase Storage Structure
```
attendance-app/
└── attendance/
    └── {userId}/
        ├── checkin/
        │   └── {date}_{timestamp}.jpg
        └── checkout/
            └── {date}_{timestamp}.jpg
```

### API Endpoint Modifications
```typescript
// POST /api/attendance/checkin
{
  userId: string,
  timestamp: string,
  location: {...},
  faceImage: File | Base64String  // Foto untuk verifikasi
}

// Response
{
  success: boolean,
  imageUrl: string,  // URL foto tersimpan
  faceVerified: boolean
}
```

### Database Schema (Firestore)
```javascript
// Collection: attendance
{
  userId: "user123",
  date: "2024-01-31",
  checkIn: {
    time: "08:30:00",
    faceVerified: true,
    imageUrl: "https://firebasestorage.googleapis.com/...", // BARU
    location: {...}
  },
  checkOut: {
    time: "17:30:00", 
    faceVerified: true,
    imageUrl: "https://firebasestorage.googleapis.com/...", // BARU
    location: {...}
  }
}
```

## 📱 Mobile App Integration

### Camera Capture
```typescript
const captureAttendancePhoto = async (type: 'checkin' | 'checkout') => {
  try {
    // 1. Capture foto dengan kamera
    const photo = await Camera.getPhoto({
      source: CameraSource.Camera,
      quality: 80,
      width: 800,
      height: 600
    });

    // 2. Upload ke Firebase Storage
    const imageUrl = await uploadToFirebaseStorage(photo, userId, type);

    // 3. Submit attendance dengan imageUrl
    await submitAttendance({
      userId,
      type,
      imageUrl,
      location: currentLocation
    });

  } catch (error) {
    console.error('Error capturing attendance photo:', error);
  }
};
```

### Face Verification (Opsional)
```typescript
const verifyFace = async (photoUrl: string, userProfilePhoto: string) => {
  // Integrasi dengan Face Recognition API
  // Misalnya AWS Rekognition, Google Vision, atau Face++
  
  const similarity = await faceRecognitionAPI.compare({
    source: photoUrl,
    target: userProfilePhoto
  });
  
  return similarity > 0.8; // 80% threshold
};
```

## 🎨 UI/UX Enhancements

### 1. Loading States
```typescript
const [uploadingPhoto, setUploadingPhoto] = useState(false);

// Tampilkan spinner saat upload foto
{uploadingPhoto && (
  <Box display="flex" alignItems="center" gap={1}>
    <CircularProgress size={16} />
    <Typography variant="caption">Mengupload foto...</Typography>
  </Box>
)}
```

### 2. Photo Preview
```typescript
// Preview foto before submit
const PhotoPreviewModal = ({ photo, onConfirm, onRetake }) => (
  <Dialog open={!!photo}>
    <DialogContent>
      <img src={photo} alt="Preview" style={{ width: '100%' }} />
    </DialogContent>
    <DialogActions>
      <Button onClick={onRetake}>Foto Ulang</Button>
      <Button onClick={onConfirm} variant="contained">Konfirmasi</Button>
    </DialogActions>
  </Dialog>
);
```

### 3. Error Handling
```typescript
const ErrorStates = {
  CAMERA_PERMISSION: 'Izin kamera diperlukan untuk absensi',
  UPLOAD_FAILED: 'Gagal mengupload foto, coba lagi',
  FACE_NOT_DETECTED: 'Wajah tidak terdeteksi, pastikan pencahayaan cukup',
  NETWORK_ERROR: 'Koneksi internet bermasalah'
};
```

## 🔒 Security & Privacy

### 1. Data Protection
- Foto disimpan dengan enkripsi di Firebase Storage
- URL menggunakan signed URLs dengan expiry time
- Akses foto dibatasi berdasarkan role user

### 2. GDPR Compliance
- Auto-delete foto setelah periode tertentu (misal: 1 tahun)
- User dapat request delete foto mereka
- Consent untuk penggunaan foto biometrik

### 3. Storage Optimization
- Kompresi foto sebelum upload
- Format WebP untuk ukuran file lebih kecil
- Thumbnail generation untuk preview

## 📊 Analytics & Reporting

### Photo Compliance Report
```typescript
const generatePhotoComplianceReport = (startDate: string, endDate: string) => {
  return {
    totalAttendance: number,
    attendanceWithPhoto: number,
    photoComplianceRate: percentage,
    byArea: AreaComplianceData[],
    byEmployee: EmployeeComplianceData[]
  };
};
```

### Dashboard Metrics
- Persentase absensi dengan foto
- Trend penggunaan foto per bulan
- Area dengan compliance tertinggi/terendah

## 🚀 Next Steps

1. **Backend Implementation**
   - Setup Firebase Storage
   - Create upload endpoints
   - Implement face verification

2. **Mobile App Updates**
   - Camera integration
   - Photo upload functionality
   - Offline support for photos

3. **Admin Features**
   - Photo management dashboard  
   - Bulk photo operations
   - Compliance reporting

4. **Performance Optimization**
   - Image compression
   - CDN integration
   - Lazy loading untuk foto

## 🧪 Testing

### Current Implementation
Saat ini menggunakan sample photos dari Unsplash untuk testing:
- 70% chance foto check-in tersedia
- 60% chance foto check-out tersedia
- Random assignment untuk demonstrasi

### Production Ready
Untuk production, remove fungsi `addSamplePhotos()` dan gunakan data real dari API.

```typescript
// Remove this line in production:
const attendanceDataWithPhotos = addSamplePhotos(attendanceData);

// Use actual data:
setData(attendanceData);
```
