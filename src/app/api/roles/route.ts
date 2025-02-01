import { NextResponse } from 'next/server';
import { firestore } from '@/libs/firebase/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

interface Permission {
  id: string;
  actions: string;
}

// Helper to handle errors
const handleError = (error: any, status = 500) => {
  console.error(error.message);
  return NextResponse.json(
    { success: false, message: error.message || 'Internal Server Error' },
    { status }
  );
};

// Get all roles with dummy fallback
export async function GET() {
  try {
    const rolesSnapshot = await getDocs(collection(firestore, 'roles'));
    const roles = rolesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ success: true, data: roles });
  } catch (error) {
    return handleError(error);
  }
}

// Create a new role
export async function POST(req: Request) {
  try {
    const payload = await req.json();

    console.log("Payload received:", payload); // Debugging log

    // Pastikan payload memiliki data yang diperlukan
    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'id, name, and permissions are required' },
        { status: 400 }
      );
    }

    const permissionsToSave = payload.permissions.map((permission: Permission) => {
      if (!permission.id || !permission.actions) {
        throw new Error('Each permission must have an id and a name');
      }
      return { id: permission.id, actions: permission.actions };
    });

    await addDoc(collection(firestore, 'roles'), { name: payload.name, permissions: permissionsToSave });
    return NextResponse.json({ success: true, message: 'Role created successfully' }, { status: 201 });

  } catch (error) {
    return handleError(error);
  }
}

// Delete a role
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
