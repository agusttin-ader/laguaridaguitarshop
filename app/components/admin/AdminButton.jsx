"use client"

import React from 'react'

export default function AdminButton({ children, className = '', variant = 'primary', ...props }){
  const base = 'admin-btn inline-flex items-center justify-center'
  const variants = {
    primary: 'bg-[#D4AF37] text-[#081017] hover:opacity-95',
    ghost: 'bg-transparent border border-white/10 text-[#EDEDED]',
    danger: 'bg-[#ff4d4f] text-white'
  }
  return (
    <button className={`${base} ${variants[variant] || variants.primary} ${className}`} {...props} />
  )
}
