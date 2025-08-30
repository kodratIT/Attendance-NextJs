import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/libs/auth'

export default async function RootPage() {
  const session = await getServerSession(authOptions)
  
  if (session) {
    // User is authenticated, redirect to dashboard
    redirect('/dashboard')
  } else {
    // User is not authenticated, redirect to login
    redirect('/login')
  }
}
