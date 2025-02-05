// app/api/locations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '@/libs/firebase/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { timeSpentToDate } from '@/utils/dateUtils';
import { LocationRowType } from '@/types/locationTypes';

// ✅ **UPDATE A LOCATION**
export async function PUT(req: NextRequest) {
  try {

    const { ...payload }: LocationRowType = await req.json();

    const id = req.nextUrl.pathname.split('/').pop();

    if (!id) {
      return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 });
    }
    
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

    console.log(`📝 Updating location ID: ${id}`);

    // Update lokasi di Firestore
    const locationRef = doc(firestore, 'locations', id);
    await updateDoc(locationRef, {
      name: payload.name,
      latitude: payload.latitude,
      longitude: payload.longitude,
      radius: payload.radius,
      updated_at: Timestamp.now(),
    });

    console.log(`✅ Location ${id} updated successfully`);
    return NextResponse.json({ success: true, message: 'Location updated successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('❌ Error updating location:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update location', error: error.message },
      { status: 500 }
    );
  }
}

// ✅ **DELETE A LOCATION**
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.pathname.split('/').pop();
    if (!id) {
      return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 });
    }

    console.log(`🗑 Deleting Location ID: ${id}`);

    // Hapus lokasi dari Firestore
    await deleteDoc(doc(firestore, 'locations', id));

    console.log(`✅ Location ${id} deleted successfully`);
    return NextResponse.json({ success: true, message: 'Location deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error(`❌ Error deleting location ${req.nextUrl.pathname}:`, error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete location', error: error.message },
      { status: 500 }
    );
  }
}