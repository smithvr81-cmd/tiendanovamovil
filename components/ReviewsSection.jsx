'use client';

import { useEffect, useMemo, useState } from 'react';

const initialForm = { name: '', email: '', socialNetwork: 'Instagram', socialHandle: '', rating: 5, comment: '', consent: false };

export default function ReviewsSection() {
  const [reviews, setReviews] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/reviews', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => setReviews(data.reviews || []))
      .catch(() => setReviews([]));
  }, []);

  const average = useMemo(() => {
    if (!reviews.length) return '0.0';
    return (reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length).toFixed(1);
  }, [reviews]);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setStatus('');
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo guardar la reseña.');
      setStatus(data.message || 'Reseña enviada correctamente.');
      setForm(initialForm);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="opiniones" className="reviewsSection">
      <div className="reviewsHeading">
        <div>
          <span className="eyebrow">OPINIONES DE CLIENTES</span>
          <h2>Experiencias que ayudan a decidir</h2>
          <p>Las reseñas son revisadas antes de publicarse. El correo electrónico nunca se muestra públicamente.</p>
        </div>
        <div className="ratingSummary">
          <strong>{average}</strong>
          <span>★★★★★</span>
          <small>{reviews.length} opiniones publicadas</small>
        </div>
      </div>

      <div className="reviewsGrid">
        <form className="reviewForm" onSubmit={submit}>
          <h3>Comparte tu experiencia</h3>
          <div className="reviewFormGrid">
            <label>Nombre<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
            <label>Correo<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label>
            <label>Red social<select value={form.socialNetwork} onChange={(e) => setForm({ ...form, socialNetwork: e.target.value })}><option>Instagram</option><option>Facebook</option><option>TikTok</option><option>X</option><option>Otra</option></select></label>
            <label>Usuario en red social<input value={form.socialHandle} onChange={(e) => setForm({ ...form, socialHandle: e.target.value })} placeholder="@usuario (opcional)" /></label>
          </div>

          <div className="ratingPicker" aria-label="Calificación">
            {[1,2,3,4,5].map((star) => (
              <button key={star} type="button" className={star <= form.rating ? 'selected' : ''} onClick={() => setForm({ ...form, rating: star })} aria-label={`${star} estrellas`}>★</button>
            ))}
          </div>

          <label>Comentario<textarea rows="5" maxLength="800" value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} placeholder="Cuéntanos cómo fue la atención, el producto o la entrega" required /></label>
          <label className="consentCheck"><input type="checkbox" checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} required /> Autorizo la publicación de mi nombre, red social, calificación y comentario.</label>
          <button className="reviewSubmit" type="submit" disabled={loading}>{loading ? 'Enviando...' : 'Enviar opinión'}</button>
          {status && <p className="reviewStatus">{status}</p>}
        </form>

        <div className="reviewList">
          {reviews.length ? reviews.slice(0, 6).map((review) => (
            <article key={review.id} className="reviewCard">
              <div className="reviewTop"><div><strong>{review.name}</strong><small>{review.social_network && review.social_handle ? `${review.social_network}: ${review.social_handle}` : 'Cliente'}</small></div><span>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span></div>
              <p>{review.comment}</p>
              <time>{new Date(review.created_at).toLocaleDateString('es-PE')}</time>
            </article>
          )) : <div className="reviewEmpty"><strong>Aún no hay reseñas publicadas</strong><p>Sé de los primeros en compartir tu experiencia.</p></div>}
        </div>
      </div>
    </section>
  );
}
