'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../lib/supabase'
import './admin.css'

const empty = { name:'', category:'Celulares', brand:'', price:'', old_price:'', badge:'Nuevo', image:'', specs:'', source_url:'', youtube_url:'', stock:true }

export default function AdminPage() {
  const supabase = createClient()
  const [session, setSession] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [form, setForm] = useState(empty)
  const [products, setProducts] = useState([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function refresh() {
    const { data } = await supabase.from('admin_products').select('*').order('created_at', { ascending:false })
    setProducts(data || [])
  }

  useEffect(() => {
    supabase.auth.getSession().then(({data}) => { setSession(data.session); if(data.session) refresh() })
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => { setSession(s); if(s) refresh() })
    return () => listener.subscription.unsubscribe()
  }, [])

  async function login(e) {
    e.preventDefault(); setLoading(true); setMessage('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setMessage(error ? error.message : 'Acceso correcto')
    setLoading(false)
  }

  async function save(e) {
    e.preventDefault(); setLoading(true); setMessage('')
    const payload = {
      name: form.name.trim(), category: form.category, brand: form.brand.trim() || 'Tecnología', condition:'Nuevo',
      price: Number(form.price), old_price: form.old_price ? Number(form.old_price) : null, badge: form.badge || 'Nuevo',
      image: form.image.trim(), specs: form.specs.split('\n').map(x=>x.trim()).filter(Boolean), stock: form.stock,
      source_url: form.source_url.trim(), youtube_url: form.youtube_url.trim(), created_by: session.user.id
    }
    const { error } = await supabase.from('admin_products').insert(payload)
    if(error) setMessage(error.message)
    else { setMessage('Producto publicado correctamente.'); setForm(empty); await refresh() }
    setLoading(false)
  }

  async function remove(id) {
    if(!confirm('¿Eliminar este producto?')) return
    const { error } = await supabase.from('admin_products').delete().eq('id', id)
    setMessage(error ? error.message : 'Producto eliminado.'); if(!error) refresh()
  }

  if(!session) return <main className="admin-shell"><section className="admin-card login-card"><div className="admin-logo">TIENDA<span>MÓVIL</span></div><h1>Panel de administración</h1><p>Ingresa con tu cuenta autorizada para publicar productos desde iPad, celular o computadora.</p><form onSubmit={login}><label>Correo<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email" /></label><label>Contraseña<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="current-password" /></label><button disabled={loading}>{loading?'Ingresando…':'Ingresar'}</button></form>{message&&<div className="admin-message">{message}</div>}</section></main>

  return <main className="admin-shell"><header className="admin-top"><div><div className="admin-logo">TIENDA<span>MÓVIL</span></div><small>Administrador de catálogo</small></div><button className="secondary" onClick={()=>supabase.auth.signOut()}>Cerrar sesión</button></header><div className="admin-grid"><section className="admin-card"><h1>Nuevo producto</h1><p>Completa los datos y pulsa Publicar. Los campos con * son obligatorios.</p><form onSubmit={save} className="product-form"><label>Nombre *<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required placeholder="Ej. Samsung Galaxy A57 5G" /></label><div className="two"><label>Categoría<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}><option>Celulares</option><option>Laptops</option><option>Accesorios</option></select></label><label>Marca *<input value={form.brand} onChange={e=>setForm({...form,brand:e.target.value})} required placeholder="Samsung" /></label></div><div className="two"><label>Precio S/ *<input type="number" min="0" step="0.01" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} required inputMode="decimal" /></label><label>Precio anterior S/<input type="number" min="0" step="0.01" value={form.old_price} onChange={e=>setForm({...form,old_price:e.target.value})} inputMode="decimal" /></label></div><label>Etiqueta<input value={form.badge} onChange={e=>setForm({...form,badge:e.target.value})} placeholder="Oferta / Recomendado" /></label><label>URL de imagen *<input type="url" value={form.image} onChange={e=>setForm({...form,image:e.target.value})} required placeholder="https://..." /></label>{form.image&&<img className="preview" src={form.image} alt="Vista previa" />}<label>Características (una por línea)<textarea rows="5" value={form.specs} onChange={e=>setForm({...form,specs:e.target.value})} placeholder={'Pantalla AMOLED 120Hz\n256GB almacenamiento\nCámara 50MP'} /></label><label>Enlace de fuente<input type="url" value={form.source_url} onChange={e=>setForm({...form,source_url:e.target.value})} placeholder="https://..." /></label><label>Video YouTube<input type="url" value={form.youtube_url} onChange={e=>setForm({...form,youtube_url:e.target.value})} placeholder="https://youtube.com/shorts/..." /></label><label className="check"><input type="checkbox" checked={form.stock} onChange={e=>setForm({...form,stock:e.target.checked})} /> Disponible en stock</label><button disabled={loading}>{loading?'Publicando…':'Publicar producto'}</button></form>{message&&<div className="admin-message">{message}</div>}</section><section className="admin-card"><div className="list-head"><div><h2>Productos del panel</h2><p>{products.length} publicados</p></div><button className="secondary" onClick={refresh}>Actualizar</button></div><div className="product-list">{products.map(p=><article key={p.id} className="admin-product"><img src={p.image} alt="" /><div><strong>{p.name}</strong><span>{p.brand} · {p.category}</span><b>S/ {Number(p.price).toFixed(2)}</b></div><button className="danger" onClick={()=>remove(p.id)}>Eliminar</button></article>)}{!products.length&&<p>Aún no hay productos publicados desde este panel.</p>}</div></section></div></main>
}
