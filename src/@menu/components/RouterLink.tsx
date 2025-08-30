import { forwardRef } from 'react'
import Link from 'next/link'
import type { LinkProps } from 'next/link'

type RouterLinkProps = LinkProps & {
  className?: string
  children: React.ReactNode
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void
}

// ✅ Gunakan `forwardRef` agar ref bisa diteruskan dengan implementasi modern Next.js
export const RouterLink = forwardRef<HTMLAnchorElement, RouterLinkProps>(({ href, className, children, onClick, ...other }, ref) => {
  return (
    <Link 
      href={href} 
      className={className} 
      ref={ref}
      onClick={onClick}
      {...other}
    >
      {children}
    </Link>
  )
})

RouterLink.displayName = 'RouterLink'
