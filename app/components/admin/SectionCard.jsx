"use client"

import React from 'react'

export default function SectionCard({ title, description, children, className = '', badge = null, style = {} }){
  return (
    <section className={`section-card rounded-xl p-5 bg-[#0b0b0b] border border-neutral-800 shadow-lg ${className}`} style={style}>
      <div className="section-card-header" style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
        <div>
          <h2 className="section-card-title" style={{margin:0,fontSize:20,fontWeight:700}}>{title}</h2>
          {description ? <div className="muted section-card-desc" style={{marginTop:6,fontSize:13,color:'#bfbfbf'}}>{description}</div> : null}
        </div>
        {badge ? <div className="section-card-badge">{badge}</div> : null}
      </div>
      <div className="section-card-body" style={{marginTop:12}}>
        {children}
      </div>
    </section>
  )
}
