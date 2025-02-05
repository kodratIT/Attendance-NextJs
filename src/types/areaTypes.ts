// Interface untuk area
export type AreaType = {
    id: string;
    name: string; // Nama area
    locations: { id: number; name: string }[]; // Array of objects untuk lokasi
    createdAt: string; // Tanggal pembuatan (format ISO string)
    updatedAt: string; // Tanggal pembaruan terakhir (format ISO string)
  };
  