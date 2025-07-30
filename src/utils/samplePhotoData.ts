/**
 * Sample Photo Data Utility
 * Untuk testing dan demo fitur foto absensi
 */

export const samplePhotoUrls = {
  checkIn: [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1494790108755-2616b612a4bb?w=300&h=300&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&h=300&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&h=300&fit=crop&crop=face'
  ],
  checkOut: [
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=300&h=300&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1566492031773-4f4e44671d66?w=300&h=300&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=300&fit=crop&crop=face'
  ]
};

/**
 * Menambahkan sample foto URL ke data attendance untuk testing
 * Menggunakan avatar yang sudah ada untuk menghindari copyright
 * @param attendanceData Array data attendance
 * @returns Array data attendance dengan foto sample
 */
export const addSamplePhotos = (attendanceData: any[]) => {
  return attendanceData.map((item, index) => {
    // Randomly decide if this attendance record should have photos
    const hasCheckInPhoto = Math.random() > 0.3; // 70% chance
    const hasCheckOutPhoto = Math.random() > 0.4; // 60% chance

    return {
      ...item,
      checkIn: {
        ...item.checkIn,
        imageUrl: hasCheckInPhoto && item.avatar
          ? item.avatar // Gunakan avatar yang sudah ada
          : undefined
      },
      checkOut: {
        ...item.checkOut,
        imageUrl: hasCheckOutPhoto && item.checkOut.time !== '-' && item.avatar
          ? item.avatar // Gunakan avatar yang sudah ada
          : undefined
      }
    };
  });
};

/**
 * Generate Firebase Storage style URL untuk foto absensi
 * @param userId ID user
 * @param type 'checkin' atau 'checkout'
 * @param timestamp timestamp foto
 * @returns URL foto dengan format Firebase Storage
 */
export const generateFirebasePhotoUrl = (
  userId: string, 
  type: 'checkin' | 'checkout', 
  timestamp: string
): string => {
  const baseUrl = 'https://firebasestorage.googleapis.com/v0/b/attendance-app/o';
  const fileName = `attendance%2F${userId}%2F${type}%2F${timestamp}.jpg`;
  const token = 'sample-token-123'; // In real app, this would be actual token
  
  return `${baseUrl}/${fileName}?alt=media&token=${token}`;
};

/**
 * Validasi URL foto
 * @param url URL foto
 * @returns boolean apakah URL valid
 */
export const isValidPhotoUrl = (url?: string): boolean => {
  if (!url) return false;
  
  try {
    new URL(url);
    return url.includes('firebasestorage.googleapis.com') || 
           url.includes('unsplash.com') ||
           url.startsWith('/') || // relative path
           url.startsWith('data:'); // base64 image
  } catch {
    return false;
  }
};

/**
 * Format nama file foto untuk storage
 * @param userId ID user
 * @param type 'checkin' atau 'checkout'
 * @param date tanggal absensi
 * @returns nama file
 */
export const formatPhotoFileName = (
  userId: string,
  type: 'checkin' | 'checkout',
  date: string
): string => {
  const dateStr = new Date(date).toISOString().slice(0, 10);
  const timestamp = Date.now();
  return `${userId}_${type}_${dateStr}_${timestamp}.jpg`;
};
