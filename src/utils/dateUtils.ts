export function timeSpentToDate(timestamp: any) {
    if (!timestamp || !timestamp.toDate) return null;
    const date = timestamp.toDate();
    const year = date.getFullYear().toString();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  export const formatSecondsToTime = (seconds: number): string => {
    if (seconds < 0) return "00.00 Jam"; // Handle jika input negatif
  
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
  
    // Format angka agar selalu dua digit (01, 02, dst.)
    const formattedHours = String(hours).padStart(2, "0");
    const formattedMinutes = String(minutes).padStart(2, "0");
  
    return `${formattedHours}.${formattedMinutes} Jam`;
  };
  

  export const formatTime = (date: Date): string => {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // Jam '0' harus '12'
    minutes = minutes < 10 ? 0 + minutes : minutes; // Menambahkan '0' di depan jika kurang dari 10
    return hours + ':' + minutes + ' ' + ampm;
  }
  