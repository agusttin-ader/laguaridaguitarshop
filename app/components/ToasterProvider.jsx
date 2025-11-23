"use client"

import { Toaster } from 'react-hot-toast'

export default function ToasterProvider(){
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          borderRadius: 8,
          background: '#0b0b0b',
          color: '#fff',
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
        }
      }}
    />
  )
}
