"use client"

import React from 'react'
import ProductCard from './ProductCard'

export default function SelectableProduct({ product, checked, onToggle, onChoosePhoto }){
  return (
    <ProductCard product={product} onChoosePhoto={onChoosePhoto}>
      <div style={{display:'flex',alignItems:'center',gap:8}}>
        <input
          type="checkbox"
          id={product?.id ? `select-product-${product.id}` : undefined}
          name="select-product"
          value={product?.id || ''}
          aria-label={`Seleccionar ${product?.title || 'producto'}`}
          checked={!!checked}
          onChange={(e)=> onToggle && onToggle(e.target.checked)}
        />
      </div>
    </ProductCard>
  )
}
