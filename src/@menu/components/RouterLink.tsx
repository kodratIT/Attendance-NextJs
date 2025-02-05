import { forwardRef } from 'react'
import Link from 'next/link'
import type { LinkProps } from 'next/link'

type RouterLinkProps = LinkProps & {
  className?: string
  children: React.ReactNode
}

// ✅ Gunakan `forwardRef` agar ref bisa diteruskan
export const RouterLink = forwardRef<HTMLAnchorElement, RouterLinkProps>(({ href, className, children, ...other }, ref) => {
  return (
    <Link href={href} passHref legacyBehavior>
      <a ref={ref} className={className} {...other}>
        {children}
      </a>
    </Link>
  )
})

RouterLink.displayName = 'RouterLink'
