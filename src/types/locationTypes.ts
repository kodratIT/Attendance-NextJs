export type LocationRowType = {
    id: number; // ID unik untuk setiap lokasi
    name: string; // Nama lokasi
    radius: number;
    longitude: number; // Longitude dalam format angka desimal
    latitude: number; // Latitude dalam format angka desimal
    createdAt: string; // Tanggal pembuatan lokasi (format ISO string, contoh: "2023-10-01T12:34:56Z")
    assignedTo: { id: string; name: string }[]; // Array of objects untuk assigned entities
    action?: string[]; // Array of actions (opsional, karena ini hanya untuk UI)
  };