const items = [
  'Laboratorios y membresías multi-tenant',
  'Planes, trial y suscripciones',
  'Dispositivos activos por usuario',
  'Licencias consumidas por Android',
];

export default function DashboardPage() {
  return (
    <main style={{ padding: '40px 0 48px' }}>
      <section className="card" style={{ padding: '32px', display: 'grid', gap: '24px' }}>
        <div style={{ display: 'grid', gap: '10px' }}>
          <span style={{ color: '#bcd6ff' }}>Dashboard placeholder</span>
          <h1 style={{ margin: 0 }}>Panel base listo para iterar</h1>
          <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.6 }}>
            Este espacio ya contempla los módulos principales del producto y sirve como punto de partida
            real para construir el panel autogestionado.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          {items.map((item) => (
            <article key={item} className="card" style={{ padding: '20px', background: 'var(--panel-muted)' }}>
              <strong style={{ display: 'block', marginBottom: '8px' }}>{item}</strong>
              <span style={{ color: 'var(--muted)' }}>Contrato y estructura inicial preparados.</span>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
