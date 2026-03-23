import Link from 'next/link';

export function SiteHeader() {
  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '28px 0',
      }}
    >
      <Link href="/" style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '0.08em' }}>
        DNPXIA
      </Link>
      <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Link href="/login" style={{ color: 'var(--muted)' }}>
          Ingresar
        </Link>
        <Link className="button" href="/dashboard">
          Dashboard
        </Link>
      </nav>
    </header>
  );
}
