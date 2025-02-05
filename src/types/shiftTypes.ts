// Interface untuk area
export type ShiftType = {
    id: string;
    name: string; // Nama area
    start_time: string; // Format HH:mm
    end_time: string;  
    createdAt: string; // Tanggal pembuatan (format ISO string)
    updatedAt: string; // Tanggal pembaruan terakhir (format ISO string)
  };
  