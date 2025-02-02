import { NextResponse, NextRequest } from 'next/server';
import { firestore } from '@/libs/firebase/firebase';
import { collection, getDocs, getDoc, arrayUnion, addDoc, updateDoc, doc, writeBatch } from 'firebase/firestore';

interface Permission {
  id: string;
  actions: string[];
}

// Helper to handle errors
const handleError = (error: any, status = 500) => {
  console.error(error.message);
  return NextResponse.json(
    { success: false, message: error.message || 'Internal Server Error' },
    { status }
  );
};

// ✅ **GET ALL ROLES (Cepat & Efisien)**
export async function GET() {
  try {
    const rolesSnapshot = await getDocs(collection(firestore, 'roles'));
    const roles = rolesSnapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));

    return NextResponse.json({ success: true, data: roles });
  } catch (error) {
    return handleError(error);
  }
}

// ✅ **CREATE A NEW ROLE (Optimasi dengan Batch Writes)**
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    console.log("Payload received:", payload); // Debugging log

    // Pastikan payload memiliki data yang diperlukan
    if (!payload || typeof payload.name !== 'string' || !Array.isArray(payload.permissions)) {
      return NextResponse.json(
        { success: false, message: 'Valid name (string) and permissions (array) are required' },
        { status: 400 }
      );
    }

    // 🔍 Filter permissions: Hanya menyertakan yang memiliki actions
    const permissionsToSave = payload.permissions
      .filter((permission: Permission) => permission.id && Array.isArray(permission.actions) && permission.actions.length > 0)
      .map((permission: Permission) => ({
        id: permission.id,
        actions: permission.actions
      }));

    // 🔹 Tambahkan role ke Firestore terlebih dahulu
    const roleRef = await addDoc(collection(firestore, 'roles'), {
      name: payload.name,
      permissions: permissionsToSave
    });

    const roleId = roleRef.id; // ID role yang baru dibuat
    console.log("Role created with ID:", roleId);

    // 🔄 Setelah role dibuat, update assignedTo di setiap permission menggunakan batch write
    const batch = writeBatch(firestore);

    for (const permission of permissionsToSave) {
      const permissionRef = doc(firestore, 'permissions', permission.id);
      const permissionSnap = await getDoc(permissionRef);

      if (permissionSnap.exists()) {
        // Tambahkan role ke assignedTo tanpa duplikasi
        batch.update(permissionRef, {
          assignedTo: arrayUnion({ id: roleId, name: payload.name })
        });
      } else {
        console.warn(`Permission with ID ${permission.id} not found, skipping.`);
      }
    }

    // 🔥 Commit semua perubahan dengan satu batch write
    await batch.commit();

    return NextResponse.json({
      success: true,
      message: 'Role created and permissions updated successfully',
      roleId
    }, { status: 201 });

  } catch (error: any) {
    console.error("Error creating role:", error);
    return handleError(error);
  }
}
