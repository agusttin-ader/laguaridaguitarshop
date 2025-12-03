"use client"

import React from 'react'

export default function AdminButton({ children, className = '', variant = 'primary', ...props }){
  // Use explicit CSS classes. Styles live in `app/globals.css` so they're
  // deterministic and included in builds regardless of Tailwind arbitrary
  // class generation.
  const classes = `admin-btn admin-btn--${variant} ${className}`.trim()
  return (
    <button className={classes} {...props}>{children}</button>
  )
}
