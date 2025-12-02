"use client"

import React from 'react'

export default function ProductCard({ product, children, className = '', onChoosePhoto }){
  const title = product?.title || 'Sin título'
  const price = product?.price || ''
  const img = (product?.images && product.images[0]) ? product.images[0] : null
  return (
    <div className={`product-card flex items-center gap-3 rounded-lg p-3 bg-[#0b0b0b] border border-neutral-800 ${className}`}>
      <div className="product-card-img" style={{width:72,height:52,overflow:'hidden',borderRadius:8,background:'#111',flex:'0 0 auto'}}>
        {img ? <img src={img} alt={title} style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}} /> : <div className="muted" style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center'}}>No foto</div>}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontWeight:700,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}} title={title}>{title}</div>
        <div className="muted" style={{fontSize:13,marginTop:4}}>{price}</div>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:8,alignItems:'flex-end'}}>
        {children}
        {onChoosePhoto ? <button className="btn btn-ghost" onClick={() => onChoosePhoto && onChoosePhoto(product)}>Elegir foto</button> : null}
      </div>
    </div>
  )
}
