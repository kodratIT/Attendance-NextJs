'use client'; // Pastikan ini adalah Client Component
import React, { Fragment, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import type { LocationRowType } from '@/types/locationTypes';
import CustomTextField from '@core/components/mui/TextField';


// Ikon default Leaflet
const defaultIcon = new L.Icon({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface MapWithEventsProps {
  newLocation: LocationRowType;
  setNewLocation: React.Dispatch<React.SetStateAction<LocationRowType>>;
}

// Komponen untuk Marker dan Circle
const LocationMarker: React.FC<MapWithEventsProps> = ({ newLocation, setNewLocation }) => {
  // Event listener untuk mendeteksi klik pada peta
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setNewLocation((prev) => ({
        ...prev,
        latitude: lat,
        longitude: lng,
      }));
    },
  });

  return (
    <Fragment>
      <Marker position={[newLocation.latitude, newLocation.longitude]} icon={defaultIcon} />
      <Circle
        center={[newLocation.latitude, newLocation.longitude]}
        radius={newLocation.radius}
        pathOptions={{ color: 'red' }}
      />
    </Fragment>
  );
};

// Komponen Utama Peta
const MapWithEvents: React.FC<MapWithEventsProps> = ({ newLocation, setNewLocation }) => {
  const defaultCenter: [number, number] = [-1.6107, 103.6131];
  const mapCenter: [number, number] = [
    newLocation.latitude || defaultCenter[0],
    newLocation.longitude || defaultCenter[1],
  ];

  const [query, setQuery] = useState<string>(''); // State untuk input pencarian
  const [loading, setLoading] = useState<boolean>(false); // State untuk loading
  const mapRef = useRef<L.Map | null>(null); // Referensi ke instance peta

  // Fungsi untuk mencari lokasi berdasarkan alamat
  const handleSearch = async () => {
    if (!query.trim()) {
      alert('Please enter a valid address.');
      return;
    }

    setLoading(true); // Aktifkan loading
    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: query,
          format: 'json',
          limit: 1,
        },
      });

      if (response.data.length > 0) {
        const { lat, lon } = response.data[0];
        const newCoordinates: [number, number] = [parseFloat(lat), parseFloat(lon)];

        // Perbarui state lokasi
        setNewLocation((prev) => ({
          ...prev,
          latitude: newCoordinates[0],
          longitude: newCoordinates[1],
        }));

        // Animasikan pergerakan kamera ke lokasi baru
        if (mapRef.current) {
          mapRef.current.flyTo(newCoordinates, 13, { duration: 1.5 }); // Zoom level 13, durasi 1.5 detik
        }
      } else {
        alert('Location not found.');
      }
    } catch (error) {
      console.error(error);
      alert('Error searching location.');
    } finally {
      setLoading(false); // Nonaktifkan loading setelah selesai
    }
  };

  // Pastikan MapContainer hanya dirender di sisi klien
  if (typeof window === 'undefined') {
    return null; // Tidak merender apa pun di server
  }

  return (
    <div>
      {/* Search Bar */}
      <div className="flex gap-2 mbe-4">
        <CustomTextField
            fullWidth
            placeholder='Enter address...'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full" // 50% width
          />
        <button
          onClick={handleSearch}
          disabled={loading} // Nonaktifkan tombol saat loading
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 flex items-center gap-2"
        >
          {loading ? (
            <>
              <span className="animate-spin inline-block w-4 h-4 border-t-2 border-b-2 border-white rounded-full"></span>
              Searching...
            </>
          ) : (
            'Search'
          )}
        </button>
      </div>

      {/* Peta */}
      <MapContainer
        ref={(map) => {
          mapRef.current = map; // Simpan referensi ke instance peta
        }}
        center={mapCenter}
        zoom={13}
        style={{ height: '600px', width: '100%' }}
      >
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="&copy; <a href='https://www.esri.com/en-us/home'>Esri</a> contributors"
        />
        <LocationMarker newLocation={newLocation} setNewLocation={setNewLocation} />
      </MapContainer>
    </div>
  );
};

export default MapWithEvents;