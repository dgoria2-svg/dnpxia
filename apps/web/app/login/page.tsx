'use client';

import { FormEvent, useState } from 'react';
import type { AuthResponse } from '@dnpxia/shared';
import { SiteHeader } from '../../components/site-header';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export default function LoginPage() {
  const [email, setEmail] = useState('owner@dnpxia.local');
  const [password, setPassword] = useState('ChangeMe123!');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const payload = (await response.json()) as AuthResponse | { message?: string };

      if (!response.ok || !('accessToken' in payload)) {
        setMessage(payload.message ?? 'No fue posible iniciar sesión.');
        return;
      }

      localStorage.setItem('dnpxia.accessToken', payload.accessToken);
      localStorage.setItem('dnpxia.user', JSON.stringify(payload.user));
      setMessage(`Sesión iniciada para ${payload.user.fullName}. Token guardado localmente.`);
    } catch {
      setMessage('No se pudo conectar con la API. Verificá que `apps/api` esté corriendo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ paddingBottom: '48px' }}>
      <SiteHeader />
      <section className="card" style={{ maxWidth: '520px', margin: '32px auto 0', padding: '32px' }}>
        <div style={{ display: 'grid', gap: '12px', marginBottom: '24px' }}>
          <h1 style={{ margin: 0 }}>Login base</h1>
          <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.6 }}>
            Este flujo usa la API central y deja lista la base para proteger el dashboard en la siguiente fase.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
          <label>
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
          </label>
          <label>
            Contraseña
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              required
            />
          </label>
          <button type="submit" disabled={loading}>
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>

        <div
          style={{
            marginTop: '20px',
            padding: '16px',
            borderRadius: '16px',
            background: 'rgba(255,255,255,0.03)',
            color: 'var(--muted)',
          }}
        >
          Credenciales semilla: <strong>owner@dnpxia.local</strong> / <strong>ChangeMe123!</strong>
        </div>

        {message ? (
          <p style={{ marginTop: '16px', color: message.startsWith('Sesión') ? 'var(--success)' : '#ff9a9a' }}>
            {message}
          </p>
        ) : null}
      </section>
    </main>
  );
}
