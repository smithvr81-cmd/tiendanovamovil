'use client';

import { useEffect, useRef, useState } from 'react';

const videos = [
    { youtube: 'Eqpx_5WzMnw', src: 'https://www.youtube-nocookie.com/embed/Eqpx_5WzMnw', title: 'iPhone 18 Pro Max · Unboxing', label: 'NOVA · VIDEO IA' },
  {"src":"https://resource2.heygen.ai/videos/e2b4a27999ae47949c6f0caf067d4168/e2b4a27999ae47949c6f0caf067d4168/01a14104-7028-7dcc-8197-d91b9ae13992.mp4","title":"Redmi Note 15 4G · Delivery y garantía","label":"NOVA · DELIVERY"},
  {"src":"https://resource2.heygen.ai/videos/e2b4a27999ae47949c6f0caf067d4168/e2b4a27999ae47949c6f0caf067d4168/01a14101-f6f7-7dc8-9bc9-15c024eddd76.mp4","title":"Redmi Note 15 Pro 5G · Delivery y garantía","label":"NOVA · DELIVERY"},
  {"src":"https://resource2.heygen.ai/videos/e2b4a27999ae47949c6f0caf067d4168/e2b4a27999ae47949c6f0caf067d4168/01a14102-152b-7639-9cc9-60d799d2831d.mp4","title":"Redmi Note 14 4G · Delivery y garantía","label":"NOVA · DELIVERY"},
  {"src":"https://resource2.heygen.ai/videos/e2b4a27999ae47949c6f0caf067d4168/e2b4a27999ae47949c6f0caf067d4168/01a14102-2d18-7d16-8168-77c1a80167c6.mp4","title":"Redmi Note 14 Pro 5G · Delivery y garantía","label":"NOVA · DELIVERY"},
  {"src":"https://resource2.heygen.ai/videos/e2b4a27999ae47949c6f0caf067d4168/e2b4a27999ae47949c6f0caf067d4168/01a14102-4c83-7a18-aa25-4be02725520d.mp4","title":"Samsung Galaxy A17 · Delivery y garantía","label":"NOVA · DELIVERY"},
  {"src":"https://resource2.heygen.ai/videos/e2b4a27999ae47949c6f0caf067d4168/e2b4a27999ae47949c6f0caf067d4168/01a14104-8bc6-70b4-8c98-478603ac0656.mp4","title":"Samsung Galaxy A26 5G · Delivery y garantía","label":"NOVA · DELIVERY"},
  {"src":"https://resource2.heygen.ai/videos/e2b4a27999ae47949c6f0caf067d4168/e2b4a27999ae47949c6f0caf067d4168/01a14102-7368-7d6e-b9cd-57d202ffe616.mp4","title":"Samsung Galaxy A57 5G · Delivery y garantía","label":"NOVA · DELIVERY"},
  {"src":"https://resource2.heygen.ai/videos/e2b4a27999ae47949c6f0caf067d4168/e2b4a27999ae47949c6f0caf067d4168/01a14104-a5fa-7a68-94d5-6af8cfaad3b8.mp4","title":"HONOR 400 Lite 5G · Delivery y garantía","label":"NOVA · DELIVERY"},
  {"src":"https://resource2.heygen.ai/videos/e2b4a27999ae47949c6f0caf067d4168/e2b4a27999ae47949c6f0caf067d4168/01a14104-bd58-7da9-ba7c-0d27cfe512b5.mp4","title":"HONOR X8c · Delivery y garantía","label":"NOVA · DELIVERY"},
  {"src":"https://resource2.heygen.ai/videos/e2b4a27999ae47949c6f0caf067d4168/e2b4a27999ae47949c6f0caf067d4168/01a14102-d90f-7c79-a6c5-8438b0d0ded0.mp4","title":"Motorola Moto G77 5G · Delivery y garantía","label":"NOVA · DELIVERY"},
  { youtube: 'cJbb1VciAKg', src: 'https://www.youtube-nocookie.com/embed/cJbb1VciAKg', title: 'HONOR 400 Lite · S/ 1,350', label: 'CAMPAÑA · PROVINCIAS' },
  { src: '/videos/redmi-note-14-pro-nova.mp4', title: 'Redmi Note 14 Pro+ 5G · Tienda Móvil', label: 'NOVA · REDMI' },
  { src: '/videos/vivo-x300-fe.mp4', title: 'Vivo X300 FE 5G · Olive Green', label: 'VIVO · NUEVO' },
  { src: '/videos/iphone-duo-concept.mp4', title: 'iPhone Duo · concepto plegable', label: 'CONCEPTO' },
  { src: '/videos/vivo-v50e-5g.mp4', title: 'Vivo V50e 5G', label: 'VIVO' },
  { src: '/videos/redmi-note-17-pro-max.mp4', title: 'Redmi Note 17 Pro Max 5G', label: 'REDMI' },
  { src: '/videos/xiaomi-15t-pro.mp4', title: 'Xiaomi 15T Pro', label: 'XIAOMI' },
  { src: '/videos/hyperos-setup.mp4', title: 'Configuración HyperOS', label: 'TIPS' },
  { src: '/videos/samsung-a57-5g.mp4', title: 'Samsung A57 5G', label: 'SAMSUNG' },
];

export default function VideoShowcase() {
  const [active, setActive] = useState(0);
  const [muted, setMuted] = useState(true);
  const trackRef = useRef(null);
  const videoRefs = useRef([]);

  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (!video) return;
      if (index === active) {
        video.currentTime = 0;
        video.play().catch(() => undefined);
      } else video.pause();
    });
    trackRef.current?.children[active]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [active]);

  const go = (direction) => setActive((current) => (current + direction + videos.length) % videos.length);

  return <section className="videoShowcase" aria-labelledby="video-showcase-title">
    <div className="videoShowcaseHeader"><div><span className="videoKicker">TIENDANOVAMOVIL EN VIDEO</span><h2 id="video-showcase-title">Descubre lo último en tecnología</h2></div><div className="videoControls"><button type="button" onClick={() => go(-1)} aria-label="Video anterior">‹</button><button type="button" onClick={() => go(1)} aria-label="Video siguiente">›</button></div></div>
    <div className="videoTrack" ref={trackRef}>{videos.map((item, index) => <article className={`videoCard ${index === active ? 'isActive' : ''}`} key={item.src} onClick={() => setActive(index)}>
      {item.youtube ? <iframe src={item.src} title={item.title} loading="lazy" allow="encrypted-media; picture-in-picture" allowFullScreen style={{width:'100%',height:'100%',border:0,position:'absolute',inset:0}}/> : <video ref={(element) => { videoRefs.current[index] = element; }} src={item.src} muted={muted} playsInline preload={index < 2 ? 'metadata' : 'none'} autoPlay={index === 0} onEnded={() => go(1)} aria-label={item.title}/>}
      {!item.youtube && <div className="videoShade"/>}<span className="videoLabel">{item.label}</span><div className="videoMeta"><strong>{item.title}</strong><span>{index === active ? 'Reproduciendo ahora' : 'Toca para reproducir'}</span></div>
      {index === active && !item.youtube && <button className="soundToggle" type="button" onClick={(event) => { event.stopPropagation(); setMuted((value) => !value); }} aria-label={muted ? 'Activar sonido' : 'Silenciar video'}>{muted ? '🔇 Activar sonido' : '🔊 Silenciar'}</button>}
    </article>)}</div>
    <div className="videoDots" aria-label="Selector de videos">{videos.map((item, index) => <button key={item.src} className={index === active ? 'active' : ''} onClick={() => setActive(index)} aria-label={`Ver ${item.title}`}/>)}</div>
  </section>;
}
