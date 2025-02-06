import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '@/libs/firebase/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { timeSpentToDate } from '@/utils/dateUtils';
import { createCORSHeaders } from '@/utils/cors';

interface PermissionPayload {
  name: string;
}

// ✅ **OPTIONS Handler untuk Preflight Request**
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: createCORSHeaders(),
  });
}

// ✅ **GET ALL PERMISSIONS (Lebih Cepat)**
export async function GET() {
  try {
    const permissionsSnapshot = await getDocs(collection(firestore, 'permissions'));

    const data = permissionsSnapshot.docs.map(docSnap => {
      const { created_at, updated_at, ...rest } = docSnap.data();
      return {
        id: docSnap.id,
        ...rest,
        createdAt: timeSpentToDate(created_at),
        updatedAt: timeSpentToDate(updated_at),
      };
    });

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: createCORSHeaders(),
    });

  } catch (error: any) {
    console.error('❌ Error fetching permissions:', error);
    return new Response(JSON.stringify({ success: false, message: 'Failed to fetch permissions', error: error.message }), {
      status: 500,
      headers: createCORSHeaders(),
    });
  }
}

// ✅ **CREATE NEW PERMISSION (POST - Lebih Cepat & Efisien)**
export async function POST(req: NextRequest) {
  try {
    const payload: PermissionPayload = await req.json();

    // Validasi input
    if (!payload.name || typeof payload.name !== 'string') {
      return new Response(JSON.stringify({ success: false, message: 'Invalid data: name must be a string' }), {
        status: 400,
        headers: createCORSHeaders(),
      });
    }

    console.log(`📝 Creating new permission: ${payload.name}`);

    // Default actions
    const defaultActions = ['read', 'edit', 'delete', 'create'];

    // Tambahkan permission baru ke Firestore
    const permissionRef = await addDoc(collection(firestore, 'permissions'), {
      name: payload.name,
      actions: defaultActions,
      assignedTo: [],
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    });

    console.log(`✅ Permission ${payload.name} created successfully with ID: ${permissionRef.id}`);

    return new Response(JSON.stringify({ success: true, message: 'Permission added successfully', id: permissionRef.id, name: payload.name }), {
      status: 201,
      headers: createCORSHeaders(),
    });

  } catch (error: any) {
    console.error('❌ Error adding permission:', error);
    return new Response(JSON.stringify({ success: false, message: 'Failed to add permission', error: error.message }), {
      status: 500,
      headers: createCORSHeaders(),
    });
  }
}

// ✅ **DELETE A PERMISSION (DELETE - Lebih Cepat)**
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.pathname.split('/').pop();
    if (!id) {
      return new Response(JSON.stringify({ success: false, message: 'ID is required' }), {
        status: 400,
        headers: createCORSHeaders(),
      });
    }

    console.log(`🗑 Deleting Permission ID: ${id}`);

    await deleteDoc(doc(firestore, 'permissions', id));

    console.log(`✅ Permission ${id} deleted successfully`);

    return new Response(JSON.stringify({ success: true, message: 'Permission deleted successfully' }), {
      status: 200,
      headers: createCORSHeaders(),
    });

  } catch (error: any) {
    console.error(`❌ Error deleting permission ${req.nextUrl.pathname}:`, error);
    return new Response(JSON.stringify({ success: false, message: 'Failed to delete permission', error: error.message }), {
      status: 500,
      headers: createCORSHeaders(),
    });
  }
}
