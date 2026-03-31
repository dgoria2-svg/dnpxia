'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SiteHeader } from '../../components/site-header';
import { clearActiveLabId, getActiveLabId, setActiveLabId } from '../../lib/active-lab';

type Membership = {
  laboratoryId: string;
  laboratoryName: string;
  role: string;
};

type StoredUser = {
  id: string;
  email: string;
  fullName: string;
  memberships?: Membership[];
};

export default function SelectLabPage() {
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const memberships = useMemo(() => user?.memberships ?? [], [user]);

  useEffect(() => {
    const token = localStorage.getItem('dnpxia.accessToken');
    const rawUser = localStorage.getItem('dnpxia.user');

    if (!token || !rawUser) {
      router.replace('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(rawUser) as StoredUser;
      const labs = parsedUser.memberships ?? [];
      setUser(parsedUser);

      if (labs.length === 0) {
        router.replace('/dashboard');
        return;
      }

      if (labs.length === 1) {
        setActiveLabId(labs[0].laboratoryId);
        router.replace('/dashboard');
        return;
      }

      const current = getActiveLabId();
      if (current && labs.some((lab) => lab.laboratoryId === current)) {
        return;
      }

      clearActiveLabId();
    } catch {
      setMessage('No se pudo leer la sesión actual.');
    }
  }, [router]);

  function handleChooseLab(labId: string) {
    setActiveLabId(labId);
    router.push('/dashboard');
  }

  function handleLogout() {
    localStorage.removeItem('dnpxia.accessToken');
    localStorage.removeItem('dnpxia.user');
    clearActiveLabId();
    router.push('/login');
  }

  return (
    <main style={{ paddingBottom: '48px' }}>
      <SiteHeader />

      <section className="card" style={{ maxWidth: '960px', margin: '32px auto 0', padding: '32px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'grid', gap: '12px' }}>
            <span style={{ color: '#bcd6ff' }}>Selector de laboratorio</span>
            <h1 style={{ margin: 0 }}>Elegí el contexto de trabajo</h1>
            <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.6 }}>
              Tu usuario pertenece a más de un laboratorio. Elegí con cuál querés entrar al dashboard.
            </p>
          </div>

          <button type="button" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>

        {message ? (
          <div className="card" style={{ padding: '20px', background: 'rgba(255, 120, 120, 0.08)', color: '#ffb3b3' }}>
            {message}
          </div>
        ) : null}

        {!message && user ? (
          <div style={{ display: 'grid', gap: '16px' }}>
            <article className="card" style={{ padding: '20px', background: 'var(--panel-muted)' }}>
              <strong style={{ display: 'block', marginBottom: '8px' }}>Usuario</strong>
              <div>{user.fullName}</div>
              <div style={{ color: 'var(--muted)', marginTop: '4px' }}>{user.email}</div>
            </article>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '16px',
              }}
            >
              {memberships.map((membership) => (
                <article key={membership.laboratoryId} className="card" style={{ padding: '24px' }}>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    <div>
                      <strong style={{ display: 'block', marginBottom: '8px' }}>{membership.laboratoryName}</strong>
                      <div style={{ color: 'var(--muted)' }}>Rol: {membership.role}</div>
                    </div>

                    <button type="button" onClick={() => handleChooseLab(membership.laboratoryId)}>
                      Entrar con este laboratorio
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
