import { NextResponse,NextRequest } from 'next/server';
import { firestore } from '@/libs/firebase/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc } from 'firebase/firestore';

interface Permission {
  id: string;
  actions: any[];
}

// Helper to handle errors
const handleError = (error: any, status = 500) => {
  console.error(error.message);
  return NextResponse.json(
    { success: false, message: error.message || 'Internal Server Error' },
    { status }
  );
};

// ✅ **GET SINGLE ROLE by ID**
export async function GET(req: NextRequest) {
  try {
    const urlParts = req.nextUrl.pathname.split('/') // Ambil path URL
    const id = urlParts[urlParts.length - 1] // ID ada di bagian akhir URL
    console.log('Received PUT request for ID:', id)
  
    if (!id) {
      return NextResponse.json({ success: false, message: 'id is required' }, { status: 400 });
    }

    const roleRef = doc(firestore, 'roles', id);
    const roleSnap = await getDoc(roleRef);

    if (!roleSnap.exists()) {
      return NextResponse.json({ success: false, message: 'Role not found' }, { status: 404 });
    }

    const roleData = roleSnap.data();
    return NextResponse.json({ success: true, data: { id: roleSnap.id, ...roleData } });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const urlParts = req.nextUrl.pathname.split('/') // Ambil path URL
    const id = urlParts[urlParts.length - 1] // ID ada di bagian akhir URL
    console.log('Received PUT request for ID:', id)
  
    if (!id) {
      return NextResponse.json({ success: false, message: 'id is required' }, { status: 400 });
    }

    const payload = await req.json();

    console.log("Payload received:", payload); // Debugging log

    // Pastikan payload memiliki data yang diperlukan
    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'id, name, and permissions are required' },
        { status: 400 }
      );
    }

    // Cek apakah role dengan ID tersebut ada di Firestore
    const roleRef = doc(firestore, 'roles', id);
    const roleSnap = await getDoc(roleRef);

    if (!roleSnap.exists()) {
      return NextResponse.json(
        { success: false, message: 'Role not found' },
        { status: 404 }
      );
    }

    // Pastikan permissions adalah array
    if (!Array.isArray(payload.permissions)) {
      return NextResponse.json(
        { success: false, message: 'permissions must be an array' },
        { status: 400 }
      );
    }

    

  // 🔥 Filter permissions: Hanya menyertakan yang memiliki actions
    const filteredPermissions = payload.permissions.filter(
      (permission: Permission) => Array.isArray(permission.actions) && permission.actions.length > 0
    );

    console.log("Filtered Permissions:", filteredPermissions); // Debugging log

    // Update data role di Firestore
    await updateDoc(roleRef, { 
      name: payload.name, 
      permissions: filteredPermissions // Hanya yang memiliki actions
    });

    return NextResponse.json({ success: true, message: 'Role updated successfully' });

  } catch (error: any) {
    console.error("Error updating role:", error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}


// ✅ **DELETE ROLE (DELETE)**
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ success: false, message: 'id is required' }, { status: 400 });
    }

    const roleRef = doc(firestore, 'roles', id);
    await deleteDoc(roleRef);

    return NextResponse.json({ success: true, message: 'Role deleted successfully' });
  } catch (error) {
    return handleError(error);
  }
}
