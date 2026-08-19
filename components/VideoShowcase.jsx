'use client';

import { useEffect, useRef, useState } from 'react';

const videos = [
  { src: '/videos/nova-honor-400-lite.mp4', title: 'Nova presenta Honor 400 Lite', label: 'NOVA · DESTACADO' },
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
      <video ref={(element) => { videoRefs.current[index] = element; }} src={item.src} muted={muted} playsInline preload={index < 2 ? 'metadata' : 'none'} autoPlay={index === 0} onEnded={() => go(1)} aria-label={item.title}/>
      <div className="videoShade"/><span className="videoLabel">{item.label}</span><div className="videoMeta"><strong>{item.title}</strong><span>{index === active ? 'Reproduciendo ahora' : 'Toca para reproducir'}</span></div>
      {index === active && <button className="soundToggle" type="button" onClick={(event) => { event.stopPropagation(); setMuted((value) => !value); }} aria-label={muted ? 'Activar sonido' : 'Silenciar video'}>{muted ? '🔇 Activar sonido' : '🔊 Silenciar'}</button>}
    </article>)}</div>
    <div className="videoDots" aria-label="Selector de videos">{videos.map((item, index) => <button key={item.src} className={index === active ? 'active' : ''} onClick={() => setActive(index)} aria-label={`Ver ${item.title}`}/>)}</div>
  </section>;
}
