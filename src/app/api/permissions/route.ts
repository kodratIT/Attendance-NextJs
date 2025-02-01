  import { NextRequest, NextResponse } from 'next/server';
  import { firestore } from '@/libs/firebase/firebase';
  import { collection, getDocs, getDoc,addDoc,Timestamp } from 'firebase/firestore';
  import  {timeSpentToDate}  from '@/utils/dateUtils';

  export async function GET() {
    try {
      const permissionsSnapshot = await getDocs(collection(firestore, 'permissions'));
      const data = permissionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: timeSpentToDate(doc.data().created_at),
        updatedAt: timeSpentToDate(doc.data().updated_at),
      }));

      return NextResponse.json(data, { status: 200 });
    } catch (error) {
      console.error('Error fetching permissions:', error);
      return NextResponse.json({ message: 'Failed to fetch permissions' }, { status: 500 });
    }
  }

  export async function POST(req: NextRequest) {
    try {
      // Parsing body dari request
      const { name } = await req.json();

      // Validasi input
      if (!name) {
        return NextResponse.json(
          { message: 'Invalid data: name and actions must be valid' },
          { status: 400 }
        );
      }

      // Action default
      const defaultActions = ['write', 'edit', 'delete', 'create'];

      // Gabungkan action default dengan yang diberikan oleh pengguna, tanpa duplikat

      // Simpan permission baru ke Firestore
      const permissionsCollection = collection(firestore, 'permissions');

      await addDoc(permissionsCollection, {
        name,
        actions: defaultActions || [],
        assignedTo: [],
        created_at: Timestamp.now(),
        updated_at: Timestamp.now(),
      });

      return NextResponse.json(
        { message: 'Permission added successfully', permission_name: name },
        { status: 201 }
      );
    } catch (error) {
      console.error('Error adding permission:', error);
      return NextResponse.json(
        { message: 'Failed to add permission' },
        { status: 500 }
      );
    }
  }

  // DELETE: Delete a permission

