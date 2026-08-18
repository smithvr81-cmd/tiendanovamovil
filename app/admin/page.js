'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '../../lib/supabase'
import './admin.css'
import './auth.css'

const ADMIN_EMAIL = 'smithvr81@gmail.com'
const empty = { name:'', category:'Celulares', brand:'', price:'', old_price:'', badge:'Nuevo', image:'', specs:'', source_url:'', youtube_url:'', stock:true }

export default function AdminPage() {
  const supabase = useMemo(() => createClient(), [])
  const [session, setSession] = useState(null)
  const [mode, setMode] = useState('login')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [recovering, setRecovering] = useState(false)
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [form, setForm] = useState(empty)
  const [products, setProducts] = useState([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function acceptSession(nextSession) {
    if (nextSession?.user?.email?.toLowerCase() !== ADMIN_EMAIL) {
      if (nextSession) await supabase.auth.signOut()
      setSession(null)
      if (nextSession) setMessage('Esta cuenta no está autorizada para administrar la tienda.')
      return
    }
    setSession(nextSession)
    if (nextSession) refresh()
  }

  async function refresh() {
    const { data } = await supabase.from('admin_products').select('*').order('created_at', { ascending:false })
    setProducts(data || [])
  }

  useEffect(() => {
    supabase.auth.getSession().then(({data}) => acceptSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'PASSWORD_RECOVERY') setRecovering(true)
      acceptSession(nextSession)
    })
    return () => listener.subscription.unsubscribe()
  }, [supabase])

  async function login(e) {
    e.preventDefault(); setLoading(true); setMessage('')
    const { error } = await supabase.auth.signInWithPassword({ email: ADMIN_EMAIL, password })
    setMessage(error ? 'Correo o contraseña incorrectos.' : 'Acceso correcto.')
    setLoading(false)
  }

  async function signup(e) {
    e.preventDefault(); setLoading(true); setMessage('')
    if (password.length < 8) { setMessage('La contraseña debe tener al menos 8 caracteres.'); setLoading(false); return }
    const { data, error } = await supabase.auth.signUp({
      email: ADMIN_EMAIL,
      password,
      options: { emailRedirectTo: `${window.location.origin}/admin` }
    })
    if (error) setMessage(error.message)
    else if (data.session) setMessage('Cuenta creada correctamente.')
    else setMessage('Revisa tu correo y pulsa el enlace de confirmación para activar la cuenta.')
    setLoading(false)
  }

  async function requestReset(e) {
    e.preventDefault(); setLoading(true); setMessage('')
    const { error } = await supabase.auth.resetPasswordForEmail(ADMIN_EMAIL, { redirectTo: `${window.location.origin}/admin` })
    setMessage(error ? error.message : 'Te enviamos un enlace para cambiar la contraseña. Revisa también Spam.')
    setLoading(false)
  }

  async function updatePassword(e) {
    e.preventDefault(); setLoading(true); setMessage('')
    if (newPassword.length < 8) { setMessage('La nueva contraseña debe tener al menos 8 caracteres.'); setLoading(false); return }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) setMessage(error.message)
    else { setMessage('Contraseña actualizada correctamente.'); setNewPassword(''); setRecovering(false); setShowPasswordChange(false) }
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

  if (recovering && session) return <main className="admin-shell"><section className="admin-card login-card"><div className="admin-logo">TIENDA<span>MÓVIL</span></div><h1>Nueva contraseña</h1><p>Escribe una contraseña nueva de al menos 8 caracteres.</p><form onSubmit={updatePassword}><label>Nueva contraseña<input type="password" minLength="8" value={newPassword} onChange={e=>setNewPassword(e.target.value)} required autoComplete="new-password" /></label><button disabled={loading}>{loading?'Guardando…':'Guardar contraseña'}</button></form>{message&&<div className="admin-message">{message}</div>}</section></main>

  if(!session) return <main className="admin-shell"><section className="admin-card login-card"><div className="admin-logo">TIENDA<span>MÓVIL</span></div><h1>{mode==='signup'?'Crear cuenta administrativa':mode==='reset'?'Recuperar contraseña':'Panel de administración'}</h1><p>{mode==='signup'?'Crea la cuenta inicial y confirma el enlace que recibirás por correo.':mode==='reset'?'Recibirás un enlace seguro para establecer una nueva contraseña.':'Ingresa con tu cuenta autorizada para publicar productos.'}</p><form onSubmit={mode==='signup'?signup:mode==='reset'?requestReset:login}><label>Correo<input type="email" value={ADMIN_EMAIL} readOnly autoComplete="email" /></label>{mode!=='reset'&&<label>Contraseña<input type="password" minLength="8" value={password} onChange={e=>setPassword(e.target.value)} required autoComplete={mode==='signup'?'new-password':'current-password'} /></label>}<button disabled={loading}>{loading?'Procesando…':mode==='signup'?'Crear cuenta':mode==='reset'?'Enviar enlace':'Ingresar'}</button></form><div className="login-actions">{mode!=='login'&&<button className="secondary" onClick={()=>{setMode('login');setMessage('')}}>Volver a ingresar</button>}{mode==='login'&&<><button className="secondary" onClick={()=>{setMode('signup');setMessage('')}}>Crear cuenta inicial</button><button className="secondary" onClick={()=>{setMode('reset');setMessage('')}}>Olvidé mi contraseña</button></>}</div>{message&&<div className="admin-message">{message}</div>}</section></main>

  return <main className="admin-shell"><header className="admin-top"><div><div className="admin-logo">TIENDA<span>MÓVIL</span></div><small>Administrador de catálogo · {ADMIN_EMAIL}</small></div><div className="admin-top-actions"><button className="secondary" onClick={()=>setShowPasswordChange(v=>!v)}>Cambiar contraseña</button><button className="secondary" onClick={()=>supabase.auth.signOut()}>Cerrar sesión</button></div></header>{showPasswordChange&&<section className="admin-card password-card"><h2>Cambiar contraseña</h2><form onSubmit={updatePassword}><label>Nueva contraseña<input type="password" minLength="8" value={newPassword} onChange={e=>setNewPassword(e.target.value)} required autoComplete="new-password" /></label><button disabled={loading}>Guardar contraseña</button></form></section>}<div className="admin-grid"><section className="admin-card"><h1>Nuevo producto</h1><p>Completa los datos y pulsa Publicar. Los campos con * son obligatorios.</p><form onSubmit={save} className="product-form"><label>Nombre *<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required placeholder="Ej. Samsung Galaxy A57 5G" /></label><div className="two"><label>Categoría<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}><option>Celulares</option><option>Laptops</option><option>Accesorios</option></select></label><label>Marca *<input value={form.brand} onChange={e=>setForm({...form,brand:e.target.value})} required placeholder="Samsung" /></label></div><div className="two"><label>Precio S/ *<input type="number" min="0" step="0.01" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} required inputMode="decimal" /></label><label>Precio anterior S/<input type="number" min="0" step="0.01" value={form.old_price} onChange={e=>setForm({...form,old_price:e.target.value})} inputMode="decimal" /></label></div><label>Etiqueta<input value={form.badge} onChange={e=>setForm({...form,badge:e.target.value})} placeholder="Oferta / Recomendado" /></label><label>URL de imagen *<input type="url" value={form.image} onChange={e=>setForm({...form,image:e.target.value})} required placeholder="https://..." /></label>{form.image&&<img className="preview" src={form.image} alt="Vista previa" />}<label>Características (una por línea)<textarea rows="5" value={form.specs} onChange={e=>setForm({...form,specs:e.target.value})} placeholder={'Pantalla AMOLED 120Hz\n256GB almacenamiento\nCámara 50MP'} /></label><label>Enlace de fuente<input type="url" value={form.source_url} onChange={e=>setForm({...form,source_url:e.target.value})} placeholder="https://..." /></label><label>Video YouTube<input type="url" value={form.youtube_url} onChange={e=>setForm({...form,youtube_url:e.target.value})} placeholder="https://youtube.com/shorts/..." /></label><label className="check"><input type="checkbox" checked={form.stock} onChange={e=>setForm({...form,stock:e.target.checked})} /> Disponible en stock</label><button disabled={loading}>{loading?'Publicando…':'Publicar producto'}</button></form>{message&&<div className="admin-message">{message}</div>}</section><section className="admin-card"><div className="list-head"><div><h2>Productos del panel</h2><p>{products.length} publicados</p></div><button className="secondary" onClick={refresh}>Actualizar</button></div><div className="product-list">{products.map(p=><article key={p.id} className="admin-product"><img src={p.image} alt="" /><div><strong>{p.name}</strong><span>{p.brand} · {p.category}</span><b>S/ {Number(p.price).toFixed(2)}</b></div><button className="danger" onClick={()=>remove(p.id)}>Eliminar</button></article>)}{!products.length&&<p>Aún no hay productos publicados desde este panel.</p>}</div></section></div></main>
}
