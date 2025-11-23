"use client"

import { useState, useRef } from 'react'
import supabase from '../../lib/supabaseClient'
import { toast } from 'react-hot-toast'
import { FiTrash2, FiStar } from 'react-icons/fi'
import ConfirmDialog from './ConfirmDialog'

export default function NewProductForm({ onCreated }){
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [color, setColor] = useState('')
  const [year, setYear] = useState('')
  const [marca, setMarca] = useState('')
  const [modelo, setModelo] = useState('')
  const [microfonos, setMicrofonos] = useState('')
  const [puente, setPuente] = useState('')
  const [files, setFiles] = useState([])
  const [selectedMainIndex, setSelectedMainIndex] = useState(0)
  const [status, setStatus] = useState('')
  const [createdProduct, setCreatedProduct] = useState(null)
  const [confirmState, setConfirmState] = useState({ open: false, title: '', message: '', onConfirm: null })

  const fileInputRef = useRef(null)
  function openFilePicker() { if (fileInputRef.current) fileInputRef.current.click() }
  function handleFiles(e){ setFiles(Array.from(e.target.files || [])) }

  // Resize image client-side using canvas and createImageBitmap
  async function resizeImage(file, maxWidth = 2048, quality = 0.8) {
    try {
      const imgBitmap = await createImageBitmap(file)
      const ratio = Math.min(1, maxWidth / imgBitmap.width)
      const width = Math.round(imgBitmap.width * ratio)
      const height = Math.round(imgBitmap.height * ratio)
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(imgBitmap, 0, 0, width, height)
      return await new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (!blob) return resolve(file)
          resolve(new File([blob], file.name, { type: blob.type }))
        }, 'image/webp', quality)
      })
    } catch (err) {
      return file
    }
  }

  async function handleSubmit(e){
    e.preventDefault()
    setStatus('Preparando subida...')

    const { data: sessionData } = await supabase.auth.getSession()
    let accessToken = sessionData.session?.access_token
    if (!accessToken) {
      setStatus('No autenticado. Inicia sesión como administrador.')
      return
    }

    const uploadedImages = []

    // Upload each file via server endpoint which generates optimized variants
    for (let i = 0; i < files.length; i++){
      const file = files[i]
      setStatus(`Subiendo ${i + 1} de ${files.length}: ${file.name}`)
      try {
        let toUpload = file
        const MAX_CLIENT_SIZE = 2 * 1024 * 1024 // 2MB
        if (file.size > MAX_CLIENT_SIZE) {
          toUpload = await resizeImage(file, 2048, 0.8)
        }

        // refresh token/session in case it expired during multiple uploads
        const { data: sd } = await supabase.auth.getSession()
        accessToken = sd.session?.access_token
        if (!accessToken) {
          setStatus('No autenticado. Inicia sesión como administrador.')
          return
        }

        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-')
        const filename = `${Date.now()}_${safeName}`
        const form = new FormData()
        form.append('file', toUpload, filename)
        form.append('bucket', 'product-images')

        const res = await fetch('/api/admin/upload', { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` }, body: form })
        if (!res.ok) {
          const txt = await res.text().catch(()=>null)
          console.error('Upload failed', txt)
          setStatus('Upload failed for ' + file.name)
          return
        }
        const json = await res.json().catch(()=>null)
        const publicUrl = json?.publicUrl ? encodeURI(json.publicUrl) : null
        const variants = json?.variants || {}
        uploadedImages.push({ url: publicUrl, variants, name: filename, originalName: file.name })
      } catch (err) {
        console.error('Unexpected upload error', err)
        setStatus('Error durante la subida: ' + (err?.message || String(err)))
        return
      }
    }
    // All files uploaded (or there were none)
    setStatus('Saving product...')

    const parsedSpecs = {}
    if (color && color.trim() !== '') parsedSpecs.color = color.trim()
    if (year && year !== '') {
      const y = parseInt(year, 10)
      if (!Number.isNaN(y)) parsedSpecs.year = y
    }
    if (marca && marca.trim() !== '') parsedSpecs.marca = marca.trim()
    if (modelo && modelo.trim() !== '') parsedSpecs.modelo = modelo.trim()
    if (microfonos && microfonos.trim() !== '') parsedSpecs.microfonos = microfonos.trim()
    if (puente && puente.trim() !== '') parsedSpecs.puente = puente.trim()

    let finalImages = uploadedImages.slice()
    if (selectedMainIndex != null && selectedMainIndex >= 0 && selectedMainIndex < finalImages.length) {
      const main = finalImages.splice(selectedMainIndex,1)[0]
      finalImages.unshift(main)
    }
    const body = { title, description, price: parseFloat(price || 0), specs: parsedSpecs, images: finalImages }

    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'Authorization': `Bearer ${accessToken}` },
        body: JSON.stringify(body)
      })
      if (res.ok) {
        const created = await res.json().catch(()=>null)
        console.log('Created product:', created)
        setCreatedProduct(created)
        setStatus('Product created successfully')
        setTitle(''); setDescription(''); setPrice(''); setColor(''); setYear(''); setMarca(''); setModelo(''); setMicrofonos(''); setPuente(''); setFiles([])
        try { if (typeof window !== 'undefined' && 'BroadcastChannel' in window) { const bc = new BroadcastChannel('la-guarida-products'); bc.postMessage({ type: 'product-created', product: created }); bc.close() } } catch(_){}
        if (onCreated) onCreated(created)
      } else {
        const err = await res.text()
        setStatus('Error creating product: ' + err)
      }
    } catch (err) { console.error(err); setStatus('Error creating product') }
  }

  return (
    <div>
      <h2 className="create-title">Crear Producto</h2>
      <p className="create-subtext">Rellena los datos del producto. Las imágenes se suben inmediatamente y se guardan en Storage.</p>

      <form onSubmit={handleSubmit} className="new-product-form">
        <div className="form-row">
          <label>Título</label>
          <input className="form-input" value={title} onChange={(e)=>setTitle(e.target.value)} required />
        </div>

        <div className="row-inline">
          <div className="form-row" style={{width:100}}>
            <label>Precio</label>
            <input className="form-input" value={price} onChange={(e)=>setPrice(e.target.value)} type="number" step="0.01" />
          </div>
          <div className="form-row" style={{width:120}}>
            <label>Año</label>
            <input className="form-input" placeholder='2020' value={year} onChange={(e)=>setYear(e.target.value)} type='number' />
          </div>
          <div className="form-row flex-1">
            <label>Marca</label>
            <input className="form-input" value={marca} onChange={(e)=>setMarca(e.target.value)} placeholder="Fender" />
          </div>
        </div>

        <div className="row-inline" style={{marginTop:8}}>
          <div className="form-row flex-1">
            <label>Modelo</label>
            <input className="form-input" value={modelo} onChange={(e)=>setModelo(e.target.value)} placeholder="Stratocaster" />
          </div>
          <div className="form-row" style={{width:220}}>
            <label>Microfonos</label>
            <input className="form-input" value={microfonos} onChange={(e)=>setMicrofonos(e.target.value)} placeholder="SSS / HH" />
          </div>
          <div className="form-row" style={{width:220}}>
            <label>Puente</label>
            <input className="form-input" value={puente} onChange={(e)=>setPuente(e.target.value)} placeholder="Tremolo" />
          </div>
        </div>

        <div className="form-row">
          <label>Descripción</label>
          <textarea className="form-input" value={description} onChange={(e)=>setDescription(e.target.value)} />
        </div>

        <div className="row-inline">
          <div className="form-row flex-1">
            <label>Color</label>
            <input className="form-input" placeholder='sunburst' value={color} onChange={(e)=>setColor(e.target.value)} />
          </div>
          <div className="form-row w-300">
            <label>Imágenes (múltiples)</label>
            <div className="file-input-wrap">
              <div className="file-drop"><small>Selecciona archivos o arrástralos aquí</small></div>
              <input ref={fileInputRef} className="file-input-hidden" type="file" multiple onChange={handleFiles} accept="image/*" />
              <button type="button" className="btn-file" onClick={openFilePicker}>Subir archivo</button>
            </div>
            {files.length > 0 && <div className="file-names" style={{marginTop:8}}>{files.map(f=>f.name).join(', ')}</div>}
          </div>
        </div>

        <div style={{marginTop:12}}>
          <button className="btn btn-file" type="submit">Crear producto</button>
          <span className="status">{status}</span>
        </div>
      </form>

      {files.length > 0 && (
        <div className="previews">
          <h3>Previews</h3>
          <div className="thumbs" style={{display:'flex',gap:8}}>
            {files.map((f, i)=> (
              <div key={i} className="thumb" style={{position:'relative',border: i===selectedMainIndex ? '2px solid #D4AF37' : '1px solid #333', borderRadius:8, overflow:'hidden'}}>
                <img src={URL.createObjectURL(f)} alt={f.name} style={{width:140,height:92,objectFit:'cover',display:'block'}} />
                <button aria-pressed={i===selectedMainIndex} title={i===selectedMainIndex ? 'Principal' : 'Marcar como principal'} className="thumb-principal" type="button" onClick={() => setSelectedMainIndex(i)}>
                  <FiStar size={14} />
                </button>
                <button aria-label="Eliminar imagen" title="Eliminar" className="thumb-delete" onClick={() =>{
                  setFiles(prev => { const next = prev.slice(); next.splice(i,1); return next })
                  setSelectedMainIndex(prev => { if (i === prev) return 0; if (i < prev) return Math.max(0, prev - 1); return prev })
                  toast.success('Imagen removida')
                }}>
                  <FiTrash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {createdProduct && (
        <div className="created-card">
          <h3>Producto creado</h3>
          <p><strong>Título:</strong> {createdProduct.title}</p>
          <p><strong>Precio:</strong> {createdProduct.price}</p>
          <div style={{marginTop:8}}>
            <strong>Especificaciones:</strong>
            <ul style={{marginTop:6, marginLeft:16}}>
              {createdProduct.specs?.marca && <li><strong>Marca:</strong> {createdProduct.specs.marca}</li>}
              {createdProduct.specs?.modelo && <li><strong>Modelo:</strong> {createdProduct.specs.modelo}</li>}
              {createdProduct.specs?.microfonos && <li><strong>Microfonos:</strong> {createdProduct.specs.microfonos}</li>}
              {createdProduct.specs?.puente && <li><strong>Puente:</strong> {createdProduct.specs.puente}</li>}
              {createdProduct.specs?.color && <li><strong>Color:</strong> {createdProduct.specs.color}</li>}
              {createdProduct.specs?.year && <li><strong>Año:</strong> {createdProduct.specs.year}</li>}
            </ul>
          </div>
          {createdProduct.images && createdProduct.images.length > 0 ? (
            <div className="thumbs" style={{display:'flex',gap:8}}>
              {createdProduct.images.map((img, i)=> (
                <div key={i} className="thumb" style={{position:'relative',border: i===0 ? '2px solid #D4AF37' : '1px solid #333', borderRadius:8, overflow:'hidden'}}>
                  {img.url ? <img src={img.url} alt={img.originalName || img.name} style={{width:140,height:92,objectFit:'cover',display:'block'}} /> : <div className="muted">No preview</div>}
                  {i === 0 ? (
                    <div className="thumb-principal" title="Imagen principal" style={{pointerEvents:'none'}}>
                      <FiStar size={14} />
                    </div>
                  ) : null}
                  <button aria-label="Eliminar imagen" title="Eliminar" className="thumb-delete" onClick={async ()=>{
                    setConfirmState({
                      open: true,
                      title: 'Eliminar imagen',
                      message: '¿Eliminar esta imagen del storage? Esta acción no se puede deshacer.',
                      onConfirm: async () => {
                        try {
                          const { data: sessionData } = await supabase.auth.getSession()
                          const accessToken = sessionData.session?.access_token
                          if (!accessToken) { toast.error('No autenticado'); setConfirmState(s => ({ ...s, open: false })); return }
                          const publicUrl = img.url || img.publicUrl || img.path || null
                          const res = await fetch('/api/admin/storage/delete', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ publicUrl, bucket: 'product-images' }) })
                          if (!res.ok) throw await res.text()
                          setCreatedProduct(prev => ({ ...prev, images: (prev.images || []).filter((_,idx)=> idx !== i) }))
                          toast.success('Imagen eliminada')
                        } catch (err) { console.error(err); toast.error('Error eliminando imagen') }
                        setConfirmState(s => ({ ...s, open: false }))
                      }
                    })
                  }}>
                    <FiTrash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">No hay imágenes asociadas.</p>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel={'Eliminar'}
        cancelLabel={'Cancelar'}
        onConfirm={() => { if (confirmState.onConfirm) confirmState.onConfirm() }}
        onCancel={() => setConfirmState(s=> ({ ...s, open: false }))}
      />
    </div>
  )
}
