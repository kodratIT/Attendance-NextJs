import { NextRequest, NextResponse } from 'next/server';
import { doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { firestore } from '@/libs/firebase/firebase';

interface PermissionPayload {
  name: string;
}

// ✅ **UPDATE PERMISSION (PUT - Lebih Cepat)**
export async function PUT(req: NextRequest) {
  try {
    const id = req.nextUrl.pathname.split('/').pop();
    if (!id) {
      return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 });
    }

    // Parse JSON body dari request
    const payload: PermissionPayload = await req.json();
    if (!payload.name || typeof payload.name !== 'string') {
      return NextResponse.json({ success: false, message: 'Valid name is required' }, { status: 400 });
    }

    console.log(`🔄 Updating Permission: ${id} with Name: ${payload.name}`);

    const permissionRef = doc(firestore, 'permissions', id);

    // ✅ **Update langsung tanpa cek dokumen jika yakin dokumen ada**
    await updateDoc(permissionRef, {
      name: payload.name,
      updated_at: Timestamp.now(),
    });

    console.log(`✅ Permission ${id} updated successfully`);

    return NextResponse.json({ success: true, message: 'Permission updated successfully' }, { status: 200 });

  } catch (error: any) {
    console.error(`❌ Error updating permission ${req.nextUrl.pathname}:`, error);
    return NextResponse.json({ success: false, message: 'Failed to update permission', error: error.message }, { status: 500 });
  }
}

// ✅ **DELETE PERMISSION (Lebih Cepat)**
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.pathname.split('/').pop();
    if (!id) {
      return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 });
    }

    console.log(`🗑 Deleting Permission ID: ${id}`);

    // ✅ **Langsung delete tanpa perlu cek keberadaan dokumen (Firestore tidak error jika dokumen tidak ada)**
    await deleteDoc(doc(firestore, 'permissions', id));

    console.log(`✅ Permission ${id} deleted successfully`);

    return NextResponse.json({ success: true, message: 'Permission deleted successfully' }, { status: 200 });

  } catch (error: any) {
    console.error(`❌ Error deleting permission ${req.nextUrl.pathname}:`, error);
    return NextResponse.json({ success: false, message: 'Failed to delete permission', error: error.message }, { status: 500 });
  }
}
