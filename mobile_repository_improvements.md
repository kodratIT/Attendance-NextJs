# Mobile Repository Improvements for Dashboard Integration

## Current State
The mobile repository `setOvertimeOut` function already syncs to Firestore collection 'overtime' but is missing some user information needed for the dashboard.

## Improvements Needed

### 1. Update `setOvertimeOut` function to include user info:

```typescript
export async function setOvertimeOut(finalReason?: string, roundingStep: number = 30) {
  const userInfo = await getUserInfo();
  const uid = userInfo?.uid;
  if (!uid) throw new Error('Not authenticated');
  
  const today = new Date().toISOString().split('T')[0];
  const path = attendancePath(uid, today);
  const snap = await get(dbRef(dbRealtime, path));
  const current = snap.val() || {};
  const startAt: number | undefined = current?.lembur?.startAt;
  if (!startAt) throw new Error('Belum absen masuk lembur');
  
  const endAt = Date.now();
  // ... existing duration calculation logic ...
  
  const updated: LemburMap = {
    ...(current.lembur || {}),
    endAt,
    durationMinutes,
    crossMidnight,
    reason: finalReason || current?.lembur?.reason,
    requested: true,
    status: 'submitted',
  };

  await update(dbRef(dbRealtime, path), { lembur: updated, date: today });

  // Enhanced Firestore sync with user info
  await addDoc(collection(db, 'overtime'), {
    uid,
    userId: userInfo?.employeeId || uid, // Add employee ID
    userName: userInfo?.name || userInfo?.displayName || 'Unknown User', // Add user name
    userAvatar: userInfo?.photoURL || null, // Add avatar if available
    userDepartment: userInfo?.department || null, // Add department if available
    date: today,
    startAt,
    endAt,
    durationMinutes,
    status: 'submitted',
    reason: updated.reason || null,
    crossMidnight,
    type: determineOvertimeType(today), // Helper to determine if weekday/weekend/holiday
    compensationType: 'cash', // Default, can be made configurable
    attendanceId: today,
    areas: userInfo?.areas?.[0] || null, // Add area info for filtering
    shifts: userInfo?.shift || null, // Add shift info if available
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

// Helper function to determine overtime type
function determineOvertimeType(dateString: string): 'weekday' | 'weekend' | 'holiday' {
  const date = new Date(dateString);
  const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
  
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return 'weekend';
  }
  
  // You can add holiday checking logic here if you have a holiday calendar
  // For now, default to weekday
  return 'weekday';
}
```

### 2. Update `upsertLemburTodayRealtime` function similarly:

```typescript
export async function upsertLemburTodayRealtime(payload: Partial<LemburMap>) {
  const userInfo = await getUserInfo();
  const uid = userInfo?.uid;
  if (!uid) throw new Error('Not authenticated');
  const today = new Date().toISOString().split('T')[0];
  const path = attendancePath(uid, today);

  const lembur: LemburMap = {
    requested: true,
    status: 'submitted',
    payrollPosted: false,
    ...payload,
  };

  await update(dbRef(dbRealtime, path), { lembur, date: today });
  
  // Also sync to Firestore if status is submitted
  if (lembur.status === 'submitted' && lembur.startAt && lembur.endAt) {
    await addDoc(collection(db, 'overtime'), {
      uid,
      userId: userInfo?.employeeId || uid,
      userName: userInfo?.name || userInfo?.displayName || 'Unknown User',
      userAvatar: userInfo?.photoURL || null,
      userDepartment: userInfo?.department || null,
      date: today,
      startAt: lembur.startAt,
      endAt: lembur.endAt,
      durationMinutes: lembur.durationMinutes || 0,
      status: lembur.status,
      reason: lembur.reason || null,
      crossMidnight: lembur.crossMidnight || false,
      type: lembur.type || determineOvertimeType(today),
      compensationType: lembur.compensationType || 'cash',
      attendanceId: today,
      areas: userInfo?.areas?.[0] || null,
      shifts: userInfo?.shift || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}
```

## Current Dashboard Sync Status

✅ **Already Working:**
- Basic overtime data sync to Firestore collection 'overtime'
- Status updates from dashboard sync back to mobile via shared Firestore collection
- API endpoints can read from and write to Firestore collection

✅ **Dashboard Features Ready:**
- List overtime requests with filtering
- Approve/reject workflow with notes
- Statistics and reporting
- Real-time updates

⚠️ **Improvement Needed in Mobile:**
- Add more user information (name, department, avatar) to Firestore documents
- Add area/shift information for better filtering
- Add overtime type detection (weekday/weekend/holiday)

## Recommendations

1. **For immediate testing:** The current sync will work but with limited user info display in dashboard
2. **For production:** Update mobile repository with the improvements above
3. **User data source:** Ensure `getUserInfo()` function returns complete user profile data including name, department, areas, shift, etc.

The dashboard is ready and will work with current mobile sync. The improvements above will enhance the user experience with better user information display and filtering capabilities.
