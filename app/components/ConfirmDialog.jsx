"use client"

import React from 'react'

export default function ConfirmDialog({ open, title, message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', onConfirm, onCancel }){
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60" onClick={onCancel} />
      <div className="bg-[#0d0d0d] border border-gray-800 rounded-lg p-6 z-60 max-w-lg w-full" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <h3 id="confirm-title" style={{margin:0, marginBottom:8, color:'#fff'}}>{title}</h3>
        <p style={{color:'#d3d3d3', marginBottom:18}}>{message}</p>
        <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
          <button className="btn btn-ghost" onClick={onCancel}>{cancelLabel}</button>
          <button className="btn btn-danger" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
