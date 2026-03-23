import Link from 'next/link';
import { SiteHeader } from '../components/site-header';

const highlights = [
  'Backend central como fuente de verdad para licencias, usuarios y laboratorios.',
  'Base multi-tenant preparada para laboratorios, trials, suscripciones y dispositivos.',
  'Web pública + dashboard inicial listos para iterar sobre onboarding y operación.',
];

export default function HomePage() {
  return (
    <main style={{ paddingBottom: '48px' }}>
      <SiteHeader />
      <section
        className="card"
        style={{
          padding: '48px',
          display: 'grid',
          gap: '32px',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'grid', gap: '18px', maxWidth: '760px' }}>
          <span
            style={{
              display: 'inline-flex',
              width: 'fit-content',
              padding: '0.45rem 0.85rem',
              borderRadius: '999px',
              background: 'var(--accent-soft)',
              color: '#bcd6ff',
              fontSize: '0.9rem',
            }}
          >
            Plataforma SaaS multi-tenant para óptica y salud visual
          </span>
          <h1 style={{ fontSize: 'clamp(2.4rem, 5vw, 4.5rem)', margin: 0, lineHeight: 1.03 }}>
            Infraestructura inicial seria para operar laboratorios, usuarios, licencias y dispositivos.
          </h1>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '1.1rem', lineHeight: 1.7 }}>
            Esta base deja armado el terreno para construir la web pública, el panel autogestionado,
            el backend central y el consumo de licencias desde Android sin arrancar desde un tutorial.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link className="button" href="/login">
            Probar login base
          </Link>
          <Link
            href="/dashboard"
            style={{
              borderRadius: '999px',
              border: '1px solid var(--line)',
              padding: '0.9rem 1.2rem',
              color: 'var(--text)',
            }}
          >
            Ver dashboard
          </Link>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {highlights.map((highlight) => (
          <article key={highlight} className="card" style={{ padding: '24px', color: 'var(--muted)' }}>
            <strong style={{ display: 'block', marginBottom: '12px', color: 'var(--text)' }}>
              Base lista para crecer
            </strong>
            {highlight}
          </article>
        ))}
      </section>
    </main>
  );
}
