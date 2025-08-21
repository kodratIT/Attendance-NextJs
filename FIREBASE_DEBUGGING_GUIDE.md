# 🔧 Firebase Debugging Guide - Overtime Collection Issue

## ❌ **Masalah**: Query ke Firebase tidak mengambil data padahal data ada

## 🔍 **Langkah-langkah Debugging**

### 1. **Start Development Server**
```bash
npm run dev
```

### 2. **Test Debug Endpoint**
Buka browser dan navigasi ke:
```
http://localhost:3000/api/overtime-debug
```

Endpoint ini akan:
- ✅ Test koneksi Firebase
- ✅ Check collection 'overtime' existence  
- ✅ Try alternative collection names
- ✅ Show document structure jika ada data

### 3. **Check Console Logs**
Dalam terminal di mana server berjalan, perhatikan log:
```
🔍 Debug: Checking overtime collection...
✅ Collection reference created successfully
📊 Executing simple query with limit 5...
📄 Simple query result: X documents found
```

### 4. **Test Main API Endpoint**
```
http://localhost:3000/api/overtime?status=all
```

### 5. **Kemungkinan Penyebab & Solusi**

#### 🔴 **Penyebab 1: Collection Name Salah**
- **Check**: Mobile app mungkin menggunakan nama collection berbeda
- **Solusi**: Cek mobile repository, kemungkinan menggunakan `lembur`, `overtimes`, atau `overtime_requests`

#### 🔴 **Penyebab 2: Firebase Rules**
- **Check**: Firestore Security Rules mungkin memblokir akses
- **Solusi**: Update rules untuk collection overtime:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /overtime/{document} {
      allow read, write: if request.auth != null;
    }
  }
}
```

#### 🔴 **Penyebab 3: Data Structure Berbeda**
- **Check**: Field names di mobile vs dashboard berbeda
- **Solusi**: Cek struktur data di Firebase Console

#### 🔴 **Penyebab 4: Firebase Index Missing**
- **Check**: Console browser menunjukkan error index
- **Solusi**: Buat index untuk query yang digunakan

#### 🔴 **Penyebab 5: Environment Variables**
- **Check**: Firebase config environment variables
- **Solusi**: Verify `.env.local`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

### 6. **Manual Verification via Firebase Console**

1. Buka [Firebase Console](https://console.firebase.google.com)
2. Pilih project yang benar
3. Go to Firestore Database
4. Check apakah collection `overtime` ada
5. Verify struktur data sesuai dengan expectations

### 7. **Check Mobile App Data Structure**

Dari mobile repository, data structure yang di-sync:
```typescript
await addDoc(collection(db, 'overtime'), {
  id: uid,        // user id
  uid,           // user id
  date: today,   // YYYY-MM-DD
  startAt,       // timestamp
  endAt,         // timestamp  
  durationMinutes,
  status: 'submitted',
  reason: updated.reason || null,
  crossMidnight,
  attendanceId: today,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});
```

### 8. **Alternative Solutions**

#### **Solusi A: Gunakan Collection yang Benar**
Jika ternyata collection name berbeda, update API:
```typescript
// Change this line in API
collection(db, 'overtime') 
// To
collection(db, 'actual_collection_name')
```

#### **Solusi B: Temporary Workaround**
Jika perlu testing cepat, buat data sample manual:
```typescript
// Add this to API for testing
const sampleData = [
  {
    id: 'test-1',
    uid: 'user123',
    userName: 'Test User',
    date: '2024-08-21',
    startAt: Date.now() - 7200000, // 2 hours ago
    endAt: Date.now(),
    durationMinutes: 120,
    status: 'submitted',
    reason: 'Testing data'
  }
]
```

### 9. **Browser Console Testing**

Setelah server berjalan, buka browser console dan jalankan:
```javascript
// Test API directly
fetch('/api/overtime-debug')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)

// Test main API
fetch('/api/overtime?status=all')
  .then(r => r.json())  
  .then(console.log)
  .catch(console.error)
```

### 10. **Server Logs Monitoring**

Perhatikan server console untuk log:
- 🔍 API calls dengan parameters
- 📊 Firebase query execution
- 📄 Document count results
- ❌ Error messages

## 🎯 **Quick Fix Priority**

1. **First**: Verify collection name di Firebase Console
2. **Second**: Check Firebase rules 
3. **Third**: Verify environment variables
4. **Fourth**: Test dengan data sample manual

## 📞 **Need Help?**

Jika masih bermasalah, share:
1. Firebase Console screenshot (collection list)
2. Browser console errors
3. Server terminal logs
4. Environment variables (tanpa sensitive data)

## ✅ **Success Indicators**

Query berhasil ketika:
- ✅ Server logs menunjukkan "Found X documents"
- ✅ API response berisi array data
- ✅ Browser console tidak ada error
- ✅ Dashboard menampilkan data overtime
