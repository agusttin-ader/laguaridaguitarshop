"use client"

export default function Card({ children, className = '', ...props }){
  return (
    <article className={`rounded-xl bg-[var(--revamp-bg)] border border-white/6 shadow-sm p-0 overflow-hidden ${className}`} {...props}>
      {children}
    </article>
  )
}
