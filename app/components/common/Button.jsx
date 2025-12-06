"use client"

import Link from 'next/link'

export default function Button({ children, href, className = '', onClick, ...props }){
  const base = `inline-flex items-center justify-center gap-2 rounded-md font-semibold px-4 py-2 transition duration-180 ${className}`
  if (href) {
    return (
      <Link href={href} className={base} {...props}>
        {children}
      </Link>
    )
  }
  return (
    <button type="button" onClick={onClick} className={base} {...props}>
      {children}
    </button>
  )
}
