import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '@/libs/firebase/firebase';
import { collection, getDocs, getDoc, setDoc, deleteDoc, doc, Timestamp, updateDoc } from 'firebase/firestore';
import { timeSpentToDate } from '@/utils/dateUtils';
import { createCORSHeaders } from '@/utils/cors';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

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
        let roleName: { id: string; name: string } = { id: '', name: 'Unknown Role' };
        let areaNames: { id: string; name: string }[] = [];
        let shiftNames: { id: string; name: string }[] = [];

        // Ambil nama role jika ada reference
        if (role && typeof role === 'object' && 'path' in role) {
            const roleDoc = await getDoc(role);
            if (roleDoc.exists()) {
              const typeRole = roleDoc.data() as { id: string; name: string };
              roleName = { id: roleDoc.id, name: typeRole.name };
            }
          }
  
          // Ambil nama areas jika ada references
          if (Array.isArray(areas)) {
            areaNames = await Promise.all(
              areas.map(async (areaRef: any) => {
                const areaDoc = await getDoc(areaRef);
                return areaDoc.exists()
                  ? { id: areaDoc.id, name: (areaDoc.data() as { name: string }).name }
                  : { id: '', name: 'Unknown Area' };
              })
            );
          }
  
          // Ambil nama shifts jika ada references
          if (Array.isArray(shifts)) {
            shiftNames = await Promise.all(
              shifts.map(async (shiftRef: any) => {
                const shiftDoc = await getDoc(shiftRef);
                return shiftDoc.exists()
                  ? { id: shiftDoc.id, name: (shiftDoc.data() as { name: string }).name }
                  : { id: '', name: 'Unknown Shift' };
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
      if (
        !payload.name ||
        !payload.email ||
        !payload.roleId ||
        !Array.isArray(payload.areaIds) ||
        !Array.isArray(payload.shiftIds)
      ) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Invalid data: name, email, password, roleId, areaIds, and shiftIds are required',
          }),
          {
            status: 400,
            headers: createCORSHeaders(),
          }
        );
      }
  
      console.log(`📝 Creating new user: ${payload.name}`);
  
      // Inisialisasi Firebase Auth
      const auth = getAuth();
  
      // Daftarkan pengguna ke Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, payload.email, "password123");
      const firebaseUserId = userCredential.user.uid; // Ambil UID dari Firebase Auth
  
      // Referensi ke dokumen role, areas, dan shifts
      const roleRef = doc(firestore, 'roles', payload.roleId);
      const areaRefs = payload.areaIds.map((areaId) => doc(firestore, 'areas', areaId));
      const shiftRefs = payload.shiftIds.map((shiftId) => doc(firestore, 'shifts', shiftId));
  
      // Simpan data pengguna ke Firestore menggunakan UID dari Firebase Auth
      await setDoc(doc(firestore, 'users', firebaseUserId), {
        name: payload.name,
        email: payload.email,
        role: roleRef, // Reference ke role
        areas: areaRefs, // References ke areas
        shifts: shiftRefs, // References ke shifts
        mustChangePassword :true,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now(),
      });
  
      console.log(`✅ User ${payload.name} created successfully with ID: ${firebaseUserId}`);
  
      return new Response(
        JSON.stringify({
          success: true,
          message: 'User added successfully',
          id: firebaseUserId,
          name: payload.name,
        }),
        {
          status: 201,
          headers: createCORSHeaders(),
        }
      );
    } catch (error: any) {
      console.error('❌ Error adding user:', error);
  
      // Tangani error spesifik dari Firebase Auth
      let errorMessage = 'Failed to add user';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email is already in use';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak';
      }
  
      return new Response(
        JSON.stringify({ success: false, message: errorMessage, error: error.message }),
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