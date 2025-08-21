export interface CheckInOutModel {
  time: string; // Waktu HH:mm:ss
  location: {
    name: string;
    latitude: number;
    longitude: number;
  };
  faceVerified: boolean;
  similarityFace?: string;
}
