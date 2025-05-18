import CredentialsProvider from 'next-auth/providers/credentials'
import type { NextAuthOptions } from 'next-auth'
import type { Session, User } from 'next-auth'
import type { JWT } from 'next-auth/jwt'
import axios from 'axios'

// Firestore Modular
import {
  getDoc,
  doc,
  getFirestore,
  DocumentReference,
  DocumentData
} from 'firebase/firestore'
import { firestore } from '@/libs/firebase/firebase'

// 🔒 Type Augmentation
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name: string
      email: string
      areas?: string[]
      role: {
        name: string
        permissions: {
          name: string
          actions: string[]
        }[]
      }
    }
  }

  interface User {
    id: string
    name: string
    email: string
    areas?: string[]
    role: {
      name: string
      permissions: {
        name: string
        actions: string[]
      }[]
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    name: string
    email: string
    areas?: string[]
    role: {
      name: string
      permissions: {
        name: string
        actions: string[]
      }[]
    }
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {},
      async authorize(credentials) {
        const { email, password } = credentials as { email: string; password: string }

        try {
          // 🔐 Login ke API lokal
          const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
          const res = await axios.post(`${API_URL}/api/login`, { email, password })

          if (res.status !== 200 || !res.data) return null
          const user = res.data.data

          // 🔍 Ambil data user dari Firestore
          const userRef = doc(firestore, 'users', user.id)
          const userSnap = await getDoc(userRef)
          if (!userSnap.exists()) return null
          const userData = userSnap.data()

          // 🔁 Ambil role
          const roleRef = userData.role as DocumentReference<DocumentData>
          const roleSnap = await getDoc(roleRef)
          if (!roleSnap.exists()) return null
          const roleData = roleSnap.data()

          // 🔐 Ambil semua permission berdasarkan referensi di role
          const permissions: { name: string; actions: string[] }[] = []
          const permissionRefs = (roleData?.permissions || []).map((perm: any) =>
            doc(firestore, 'permissions', perm.id)
          )

          for (const permRef of permissionRefs) {
            const permSnap = await getDoc(permRef)
            if (permSnap.exists()) {
              const permData = permSnap.data() as { name: string; actions: string[] }
              permissions.push({
                name: permData.name,
                actions: permData.actions
              })
            }
          }

          // 🌍 Ambil semua area ID
          const areaRefs = Array.isArray(userData.areas) ? userData.areas : []
          const areas: string[] = []

          for (const areaRef of areaRefs) {
            if (areaRef?.id) {
              areas.push(areaRef.id)
            }
          }

          // ✅ Return user lengkap
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: {
              name: roleData.name,
              permissions
            },
            areas // <-- hanya ID string[]
          }
        } catch (error) {
          console.error('❌ authorize error:', error)
          return null
        }
      }
    })
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60 // 30 hari
  },

  pages: {
    signIn: '/login'
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.name = user.name
        token.email = user.email
        token.role = user.role
        token.areas = user.areas // ✅ Tambahkan areaId array ke JWT token
      }
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.name = token.name as string
        session.user.email = token.email as string
        session.user.role = token.role
        session.user.areas = token.areas as string[] // ✅ Tambahkan ke session
      }
      return session
    }
  }
}
