import { NextRequest, NextResponse } from 'next/server'
import { doc, updateDoc, getDoc,deleteDoc,Timestamp  } from 'firebase/firestore'
import { firestore } from '@/libs/firebase/firebase' // Pastikan path ini sesuai dengan konfigurasi Firestore Anda

export async function PUT(req: NextRequest) {
  try {
    // Ambil ID dari URL
    const urlParts = req.nextUrl.pathname.split('/') // Ambil path URL
    const id = urlParts[urlParts.length - 1] // ID ada di bagian akhir URL
    console.log('Received PUT request for ID:', id)
     
    // Parse JSON body dari request
    const { name } = await req.json()
    console.log('Received Data:', { id, name })

    // Validasi input
    if (!id || !name) {
      console.error('Validation Failed: Missing ID or Name')
      return NextResponse.json(
        { message: 'ID and name are required' },
        { status: 400 }
      )
    }

    // Ambil referensi dokumen berdasarkan ID
    const permissionRef = doc(firestore, 'permissions', id)

    // Cek apakah dokumen dengan ID tersebut ada di Firestore
    const docSnap = await getDoc(permissionRef)
    if (!docSnap.exists()) {
      console.error('Permission Not Found:', id)
      return NextResponse.json(
        { message: 'Permission not found' },
        { status: 404 }
      )
    }

    // Lakukan update di Firestore
    console.log('Updating Permission:', id, 'with Name:', name)
    await updateDoc(permissionRef, { 
      name,
      updated_at: Timestamp.now(),
      
    })

    console.log('Permission Updated Successfully:', id)

    return NextResponse.json(
      { message: 'Permission updated successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error updating permission:', error)
    return NextResponse.json(
      { message: 'Failed to update permission', error: error },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Ambil ID dari URL
    const urlParts = req.nextUrl.pathname.split('/');
    const id = urlParts[urlParts.length - 1];

    if (!id) {
      return NextResponse.json({ message: 'ID is required' }, { status: 400 });
    }

    const permissionRef = doc(firestore, 'permissions', id);
    await deleteDoc(permissionRef);
    return NextResponse.json({ message: 'Permission deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting permission:', error);
    return NextResponse.json({ message: 'Failed to delete permission' }, { status: 500 });
  }
}

