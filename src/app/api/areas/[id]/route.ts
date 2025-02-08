// app/api/areas/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '@/libs/firebase/firebase';
import { doc, getDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { AreaType } from '@/types/areaTypes';
import { timeSpentToDate } from '@/utils/dateUtils';

interface AreaPayload {
  name: string;
  locations: { id: number; name: string }[];
}
// ✅ **GET AN AREA BY ID**
export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.pathname.split('/').pop();
    if (!id) {
      return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 });
    }

    console.log(`📝 Fetching area ID: ${id}`);
    const areaDoc = await getDoc(doc(firestore, 'areas', id));

    if (!areaDoc.exists()) {
      return NextResponse.json({ success: false, message: 'Area not found' }, { status: 404 });
    }

    // Extract and format data
    const data = areaDoc.data();
    const formattedData= {
      name: data.name,
      locations: data.locations || [],
      createdAt: timeSpentToDate(data.created_at),
      updatedAt: timeSpentToDate(data.updated_at),
    };

    console.log(`✅ Fetched area ${id} successfully`);
    return NextResponse.json({ success: true, data: formattedData }, { status: 200 });
  } catch (error: any) {
    console.error(`❌ Error fetching area ${req.nextUrl.pathname}:`, error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch area', error: error.message },
      { status: 500 }
    );
  }
}

// ✅ **UPDATE AN AREA**
export async function PUT(req: NextRequest) {
  try {
    const id = req.nextUrl.pathname.split('/').pop();
    if (!id) {
      return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 });
    }

    const payload: AreaPayload = await req.json();

    // Validate input data
    if (!payload.name || typeof payload.name !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Invalid data: name must be a string' },
        { status: 400 }
      );
    }
    if (!Array.isArray(payload.locations)) {
      return NextResponse.json(
        { success: false, message: 'Invalid data: locations must be an array' },
        { status: 400 }
      );
    }

    console.log(`📝 Updating area ID: ${id}`);
    const areaRef = doc(firestore, 'areas', id);

    // Update the document in Firestore
    await updateDoc(areaRef, {
      name: payload.name,
      locations: payload.locations,
      updated_at: Timestamp.now(),
    });

    // / ** Perbarui setiap lokasi untuk menambahkan assignedTo **
    const assignedToData = { id, name: payload.name };

    const locationUpdates = payload.locations.map(async (location) => {
      const locationId = typeof location === 'string' ? location : location.id.toString();
      if (locationId) {
        const locationRef = doc(firestore, 'locations', locationId);
        return updateDoc(locationRef, { assignedTo: assignedToData });
      } else {
        console.warn(`⚠️ Skipping invalid location:`, location);
        return Promise.resolve();
      }
    });

    // ** Jalankan semua update secara paralel **
    await Promise.all(locationUpdates);
    console.log(`✅ Area ${id} updated successfully`);
    return NextResponse.json({ success: true, message: 'Area updated successfully' }, { status: 200 });
  } catch (error: any) {
    console.error(`❌ Error updating area ${req.nextUrl.pathname}:`, error);
    return NextResponse.json(
      { success: false, message: 'Failed to update area', error: error.message },
      { status: 500 }
    );
  }
}

// ✅ **DELETE AN AREA**
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.pathname.split('/').pop();
    if (!id) {
      return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 });
    }

    console.log(`🗑 Deleting area ID: ${id}`);
    const areaRef = doc(firestore, 'areas', id);

    // Check if the document exists before deleting
    const areaDoc = await getDoc(areaRef);
    if (!areaDoc.exists()) {
      return NextResponse.json({ success: false, message: 'Area not found' }, { status: 404 });
    }

    // Delete the document
    await deleteDoc(areaRef);

    console.log(`✅ Area ${id} deleted successfully`);
    return NextResponse.json({ success: true, message: 'Area deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error(`❌ Error deleting area ${req.nextUrl.pathname}:`, error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete area', error: error.message },
      { status: 500 }
    );
  }
}