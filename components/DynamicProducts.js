'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '../lib/supabase'

export default function DynamicProducts() {
  const [products,setProducts]=useState([])
  useEffect(()=>{ const supabase=createClient(); supabase.from('admin_products').select('*').eq('stock',true).order('created_at',{ascending:false}).then(({data})=>setProducts(data||[])) },[])
  if(!products.length) return null
  return <section className="dynamic-products" style={{maxWidth:1180,margin:'28px auto',padding:'0 18px'}}><h2>Recién publicados</h2><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:16}}>{products.map(p=><article key={p.id} style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:16,padding:16}}><img src={p.image} alt={p.name} style={{width:'100%',height:190,objectFit:'contain'}}/><small>{p.badge}</small><h3>{p.name}</h3>{p.old_price&&<del style={{color:'#777'}}>S/ {Number(p.old_price).toFixed(2)}</del>}<div style={{fontSize:22,fontWeight:800,margin:'6px 0'}}>S/ {Number(p.price).toFixed(2)}</div><p>{(p.specs||[]).slice(0,2).join(' · ')}</p><a href={`https://wa.me/51953587927?text=${encodeURIComponent('Hola, quiero información sobre '+p.name)}`} target="_blank" rel="noreferrer" style={{display:'block',textAlign:'center',padding:11,borderRadius:10,background:'#16a34a',color:'#fff',fontWeight:800,textDecoration:'none'}}>Consultar por WhatsApp</a></article>)}</div></section>
}
