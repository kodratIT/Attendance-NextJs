// app/api/locations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '@/libs/firebase/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { timeSpentToDate } from '@/utils/dateUtils';
import { LocationRowType } from '@/types/locationTypes';

// ✅ **GET ALL LOCATIONS**
export async function GET() {
  try {
    const locationsSnapshot = await getDocs(collection(firestore, 'locations'));
    const data = locationsSnapshot.docs.map((docSnap) => {
      const { created_at, updated_at, ...rest } = docSnap.data();
      return {
        id: docSnap.id,
        ...rest,
        createdAt: timeSpentToDate(created_at),
        updatedAt: timeSpentToDate(updated_at),
      };
    });
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error('❌ Error fetching locations:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch locations', error: error.message },
      { status: 500 }
    );
  }
}

// ✅ **CREATE NEW LOCATION**
export async function POST(req: NextRequest) {
  try {
    const payload: LocationRowType = await req.json();

    // Validasi input
    if (!payload.name || typeof payload.name !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Invalid data: name must be a string' },
        { status: 400 }
      );
    }
    if (!payload.latitude || !payload.longitude || !payload.radius) {
      return NextResponse.json(
        { success: false, message: 'Invalid data: latitude, longitude, and radius are required' },
        { status: 400 }
      );
    }

    console.log(`📝 Creating new location: ${payload.name}`);

    // Tambahkan lokasi baru ke Firestore
    const locationRef = await addDoc(collection(firestore, 'locations'), {
      name: payload.name,
      latitude: payload.latitude,
      longitude: payload.longitude,
      radius: payload.radius,
      assignedTo: payload.assignedTo || [], // Default empty array
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    });

    console.log(`✅ Location ${payload.name} created successfully with ID: ${locationRef.id}`);
    return NextResponse.json(
      {
        success: true,
        message: 'Location added successfully',
        id: locationRef.id,
        name: payload.name,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('❌ Error adding location:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to add location', error: error.message },
      { status: 500 }
    );
  }
}