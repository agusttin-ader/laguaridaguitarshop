"use client"

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import NewProductForm from './NewProductForm'

export default function NewProductModal({ open = false, onClose = ()=>{}, onCreated = null }){
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{zIndex:10000}}>
          <motion.div className="modal-content card" initial={{ opacity: 0, y: 8, scale: 0.994 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.994 }} transition={{ duration: 0.22, ease: 'easeOut' }} style={{maxWidth:860, margin: '40px auto', padding: 18, maxHeight: '85vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <h2 style={{margin:0}}>Crear Producto</h2>
              <button className="btn btn-ghost" onClick={() => onClose()}>✕</button>
            </div>
            <NewProductForm onCreated={(prod) => { if (typeof onCreated === 'function') onCreated(prod); onClose() }} onCancel={() => onClose()} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
