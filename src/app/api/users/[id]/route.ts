import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '@/libs/firebase/firebase';
import { collection, getDocs, getDoc, addDoc, deleteDoc, doc, Timestamp, updateDoc } from 'firebase/firestore';
import { timeSpentToDate } from '@/utils/dateUtils';
import { createCORSHeaders } from '@/utils/cors';
import { AreaType } from '@/types/areaTypes';
import { RoleType } from '@/types/roleType';
import { ShiftType } from '@/types/shiftTypes';
import {auth } from '@/libs/firebase/firebaseAdmin'


interface UserPayload {
  name: string;
  email: string;
  roleId: string; // ID dari dokumen role
  areaIds: string[]; // Array of IDs dari dokumen areas
  shiftIds: string[]; // Array of IDs dari dokumen shifts
}

// ✅ **OPTIONS Handler untuk Preflight Request**
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: createCORSHeaders(),
  });
}

// ✅ **GET ALL USERS**
export async function GET() {
  try {
    const usersSnapshot = await getDocs(collection(firestore, 'users'));
    const data = await Promise.all(
      usersSnapshot.docs.map(async (docSnap) => {
        const { created_at, updated_at, role, areas, shifts, ...rest } = docSnap.data();
        let roleName = 'Unknown Role';
        let areaNames: string[] = [];
        let shiftNames: string[] = [];

        // Ambil nama role jika ada reference
        if (role && typeof role === 'object' && 'path' in role) {
          const roleDoc = await getDoc(role) ; 
          if (roleDoc.exists()) {
            const typeRole = roleDoc.data() as RoleType;
            roleName = typeRole.name;
          }
        }
        // Ambil nama areas jika ada references
        if (Array.isArray(areas)) {
          areaNames = await Promise.all(
            areas.map(async (areaRef: any) => {
              const areaDoc = await getDoc(areaRef);
              console.log(areaDoc.data())
              const typeArea = areaDoc.data() as AreaType;
              return areaDoc.exists() ? typeArea.name : 'Unknown Area';
            })
          );
        }

        // Ambil nama shifts jika ada references
        if (Array.isArray(shifts)) {
          shiftNames = await Promise.all(
            shifts.map(async (shiftRef: any) => {
              const shiftDoc = await getDoc(shiftRef);
              const typeShift = shiftDoc.data() as ShiftType;
              return shiftDoc.exists() ? typeShift.name : 'Unknown Shift';
            })
          );
        }

        return {
          id: docSnap.id,
          ...rest,
          role: roleName,
          areas: areaNames,
          shifts: shiftNames,
          createdAt: timeSpentToDate(created_at),
          updatedAt: timeSpentToDate(updated_at),
        };
      })
    );

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: createCORSHeaders(),
    });
  } catch (error: any) {
    console.error('❌ Error fetching users:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Failed to fetch users', error: error.message }),
      {
        status: 500,
        headers: createCORSHeaders(),
      }
    );
  }
}

// ✅ **CREATE NEW USER**
export async function POST(req: NextRequest) {
  try {
    const payload: UserPayload = await req.json();

    // Validasi input
    if (!payload.name || !payload.email || !payload.roleId || !Array.isArray(payload.areaIds) || !Array.isArray(payload.shiftIds)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Invalid data: name, email, roleId, areaIds, and shiftIds are required',
        }),
        {
          status: 400,
          headers: createCORSHeaders(),
        }
      );
    }

    // Referensi ke dokumen role, areas, dan shifts
    const roleRef = doc(firestore, 'roles', payload.roleId);
    const areaRefs = payload.areaIds.map((areaId) => doc(firestore, 'areas', areaId));
    const shiftRefs = payload.shiftIds.map((shiftId) => doc(firestore, 'shifts', shiftId));

    console.log(`📝 Creating new user: ${payload.name}`);
    const userRef = await addDoc(collection(firestore, 'users'), {
      name: payload.name,
      email: payload.email,
      role: roleRef, // Reference ke role
      areas: areaRefs, // References ke areas
      shifts: shiftRefs, // References ke shifts
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    });

    console.log(`✅ User ${payload.name} created successfully with ID: ${userRef.id}`);
    return new Response(
      JSON.stringify({
        success: true,
        message: 'User added successfully',
        id: userRef.id,
        name: payload.name,
      }),
      {
        status: 201,
        headers: createCORSHeaders(),
      }
    );
  } catch (error: any) {
    console.error('❌ Error adding user:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Failed to add user', error: error.message }),
      {
        status: 500,
        headers: createCORSHeaders(),
      }
    );
  }
}

// ✅ **UPDATE A USER**
export async function PUT(req: NextRequest) {
  try {
    const id = req.nextUrl.pathname.split('/').pop();
    if (!id) {
      return new Response(JSON.stringify({ success: false, message: 'ID is required' }), {
        status: 400,
        headers: createCORSHeaders(),
      });
    }

    const payload: UserPayload = await req.json();

    // Validasi input
    if (!payload.name || !payload.email || !payload.roleId || !Array.isArray(payload.areaIds) || !Array.isArray(payload.shiftIds)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Invalid data: name, email, roleId, areaIds, and shiftIds are required',
        }),
        {
          status: 400,
          headers: createCORSHeaders(),
        }
      );
    }

    console.log(`📝 Updating user ID: ${id}`);
    const userRef = doc(firestore, 'users', id);

    // Referensi ke dokumen role, areas, dan shifts
    const roleRef = doc(firestore, 'roles', payload.roleId);
    const areaRefs = payload.areaIds.map((areaId) => doc(firestore, 'areas', areaId));
    const shiftRefs = payload.shiftIds.map((shiftId) => doc(firestore, 'shifts', shiftId));

    await updateDoc(userRef, {
      name: payload.name,
      email: payload.email,
      role: roleRef, // Update reference ke role
      areas: areaRefs, // Update references ke areas
      shifts: shiftRefs, // Update references ke shifts
      updated_at: Timestamp.now(),
    });

    console.log(`✅ User ${id} updated successfully`);
    return new Response(JSON.stringify({ success: true, message: 'User updated successfully' }), {
      status: 200,
      headers: createCORSHeaders(),
    });
  } catch (error: any) {
    console.error(`❌ Error updating user ${req.nextUrl.pathname}:`, error);
    return new Response(
      JSON.stringify({ success: false, message: 'Failed to update user', error: error.message }),
      {
        status: 500,
        headers: createCORSHeaders(),
      }
    );
  }
}

// ✅ **DELETE A USER**
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.pathname.split('/').pop();
    if (!id) {
      return new Response(JSON.stringify({ success: false, message: 'ID is required' }), {
        status: 400,
        headers: createCORSHeaders(),
      });
    }

    try {
        const userRecord = await auth.getUser(id); // Dapatkan user record berdasarkan UID
        await auth.deleteUser(userRecord.uid); // Hapus pengguna dari Firebase Auth
        console.log(`✅ User ${id} deleted from Firebase Auth`);
      } catch (authError: any) {
        console.error(`❌ Error deleting user from Firebase Auth:`, authError);
        if (authError.code !== 'auth/user-not-found') {
          throw authError; // Lanjutkan error jika gagal menghapus dari Auth
        }
      }
  

    console.log(`🗑 Deleting User ID: ${id}`);
    await deleteDoc(doc(firestore, 'users', id));
    console.log(`✅ User ${id} deleted successfully`);
    return new Response(JSON.stringify({ success: true, message: 'User deleted successfully' }), {
      status: 200,
      headers: createCORSHeaders(),
    });
  } catch (error: any) {
    console.error(`❌ Error deleting user ${req.nextUrl.pathname}:`, error);
    return new Response(
      JSON.stringify({ success: false, message: 'Failed to delete user', error: error.message }),
      {
        status: 500,
        headers: createCORSHeaders(),
      }
    );
  }
}