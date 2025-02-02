import { NextResponse, NextRequest } from 'next/server';
import { firestore } from '@/libs/firebase/firebase';
import { collection, getDocs, addDoc, query, where, updateDoc, deleteDoc, doc, getDoc, arrayUnion, arrayRemove, writeBatch } from 'firebase/firestore';

interface Permission {
  id: string;
  actions: string[];
}

interface RolePayload {
  name: string;
  permissions: Permission[];
}

// Helper untuk menangani error
const handleError = (error: any, status = 500) => {
  console.error(error.message);
  return NextResponse.json(
    { success: false, message: error.message || 'Internal Server Error' },
    { status }
  );
};

// ✅ **GET SINGLE ROLE by ID (Cepat & Efisien)**
export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.pathname.split('/').pop();
    if (!id) return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 });

    const roleSnap = await getDoc(doc(firestore, 'roles', id));
    if (!roleSnap.exists()) return NextResponse.json({ success: false, message: 'Role not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: { id: roleSnap.id, ...roleSnap.data() } });

  } catch (error) {
    return handleError(error);
  }
}

// ✅ **UPDATE ROLE (Lebih Cepat dengan Batch Writes)**
export async function PUT(req: NextRequest) {
  try {
    const id = req.nextUrl.pathname.split('/').pop();
    if (!id) return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 });

    const payload: RolePayload = await req.json();
    if (!payload?.name || !Array.isArray(payload.permissions)) {
      return NextResponse.json({ success: false, message: 'Valid id, name (string), and permissions (array) are required' }, { status: 400 });
    }

    const roleRef = doc(firestore, 'roles', id);
    const roleSnap = await getDoc(roleRef);
    if (!roleSnap.exists()) return NextResponse.json({ success: false, message: 'Role not found' }, { status: 404 });

    const batch = writeBatch(firestore);
    
    // 🔥 Filter permissions: Hanya yang memiliki actions
    const validPermissions = payload.permissions.filter(p => p.actions.length > 0);
    const emptyPermissions = payload.permissions.filter(p => p.actions.length === 0);

    // 🔄 Ambil semua permissions terkait dalam satu query
    const permissionIds = payload.permissions.map(p => p.id);
    if (permissionIds.length > 0) {
      const permissionsQuery = query(collection(firestore, 'permissions'), where('__name__', 'in', permissionIds));
      const permissionsSnap = await getDocs(permissionsQuery);

      const permissionDataMap = new Map<string, any>();
      permissionsSnap.forEach(docSnap => permissionDataMap.set(docSnap.id, docSnap.data()));

      // 🔄 Update assignedTo untuk validPermissions
      validPermissions.forEach(permission => {
        const permissionRef = doc(firestore, 'permissions', permission.id);
        const assignedToArray = permissionDataMap.get(permission.id)?.assignedTo || [];
        const updatedAssignedTo = assignedToArray.filter((item: any) => item.id !== id);
        updatedAssignedTo.push({ id, name: payload.name });

        batch.update(permissionRef, { assignedTo: updatedAssignedTo });
      });

      // ❌ Hapus assignedTo jika actions kosong
      emptyPermissions.forEach(permission => {
        const permissionRef = doc(firestore, 'permissions', permission.id);
        const assignedToArray = permissionDataMap.get(permission.id)?.assignedTo || [];
        const updatedAssignedTo = assignedToArray.filter((item: any) => item.id !== id);

        if (updatedAssignedTo.length > 0) {
          batch.update(permissionRef, { assignedTo: updatedAssignedTo });
        } else {
          batch.delete(permissionRef);
        }
      });
    }

    // 🔹 Update role di Firestore
    batch.update(roleRef, { name: payload.name, permissions: validPermissions });

    // 🔥 Commit batch update
    await batch.commit();

    return NextResponse.json({ success: true, message: 'Role updated successfully' });

  } catch (error: any) {
    return handleError(error);
  }
}

// ✅ **DELETE ROLE (Optimasi dengan Batch Writes)**
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.pathname.split('/').pop();
    if (!id) return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 });

    const roleRef = doc(firestore, 'roles', id);
    const roleSnap = await getDoc(roleRef);
    if (!roleSnap.exists()) return NextResponse.json({ success: false, message: 'Role not found' }, { status: 404 });

    const batch = writeBatch(firestore);
    const roleData = roleSnap.data();

    if (!roleData?.permissions || !Array.isArray(roleData.permissions)) {
      return NextResponse.json({ success: false, message: 'No permissions found in role' }, { status: 400 });
    }

    // 🔍 Loop melalui setiap permission yang ada di dalam role
    for (const permission of roleData.permissions) {
      const permissionRef = doc(firestore, 'permissions', permission.id);
      const permissionSnap = await getDoc(permissionRef);

      if (permissionSnap.exists()) {
        const permissionData = permissionSnap.data();

        if (permissionData?.assignedTo && Array.isArray(permissionData.assignedTo)) {
          // 🔥 Cari objek di assignedTo yang memiliki id role yang sedang dihapus
          const assignedToEntry = permissionData.assignedTo.find((entry: any) => entry.id === id);

          if (assignedToEntry) {
            // 🗑️ Hapus hanya objek yang cocok dari assignedTo menggunakan arrayRemove
            batch.update(permissionRef, { assignedTo: arrayRemove(assignedToEntry) });
          }
        }
      }
    }

    // 🔥 Hapus role dari Firestore
    batch.delete(roleRef);

    await batch.commit();

    return NextResponse.json({ success: true, message: 'Role deleted successfully' });

  } catch (error: any) {
    return handleError(error);
  }
}